import { initializeFileSystemHelpers } from '@/lib/fileSystemHelpers';
import anylogger from 'anylogger';
// import { ipcRenderer } from 'electron';
// const { app, remote } = require('electron');
const path = require('node:path');
import * as Plotly from 'plotly.js-dist-min';
// preloaded modules

// case 2)
// import * as danfojs from '/node_modules/danfojs/dist/danfojs-browser/src';

// #if !DEV
// @ts-ignore - danfojs module path resolution
import * as danfojs from '/node_modules/danfojs/dist/danfojs-browser/src';
// #endif

// case 5)
// const danfojs = require('danfojs'); // Assuming danfojs is installed in node_modules

// case 6)
// import danfojs from 'danfojs';

// case 7)
// import * as danfojs from 'danfojs'; 

// Import module manifest (generated at build time)
import moduleManifest from '../module-manifest.json'; 

const log = anylogger('ModuleRegistry');
// Ensure TextDecoder is available globally
/**
 * Registry for managing modules available to code cells in Electron environment
 */
export class ModuleRegistry {
  private modules: Map<string, any> = new Map();
  private nodeRequire: any = null;

  constructor() {
    this.initializeNodeRequire();
    this.preloadCommonModules();
  }

  /**
   * Initialize Node.js require function in Electron
   */
  private initializeNodeRequire(): void {
    try {
      // In Electron, we can access Node.js require
      if (typeof window !== 'undefined' && (window as any).require) {
        this.nodeRequire = (window as any).require;
        log.debug('Using Electron window.require');
      } else if (typeof require !== 'undefined') {
        this.nodeRequire = require;
        log.debug('Using global require');
      } else {
        log.warn('Node.js require not available');
      }
    } catch (error) {
      log.error('Failed to initialize Node.js require:', error);
    }
  }

  public async initialize(): Promise<boolean> {

    const fs = await initializeFileSystemHelpers();
    if (!fs) {
      log.error('Failed to initialize file system helpers');
      return false;
    }
    const userDataPath = fs.getUserDataPath();
    log.debug(`Adding custom module directory to require paths: ${userDataPath}`);

    // Use the user data path to create a custom module director+}

    // const moduleDir = path.join(app.getPath('userData'), 'modules');
    const moduleDir = path.join(userDataPath, 'node_modules'); // Use remote.app for compatibility with renderer process
    log.debug(`Adding custom module directory to require paths: ${moduleDir}`);
    // Set NODE_PATH to include your custom directory
    process.env.NODE_PATH = process.env.NODE_PATH ? 
    `${process.env.NODE_PATH}${path.delimiter}${moduleDir}` : 
    moduleDir;

    // Force Node to update its module paths
    require('module').Module._initPaths();

    return true;
  }


  /**
   * Pre-load common modules using Node.js require
   */
  private preloadCommonModules(): void {
    if (!this.nodeRequire) {
      log.warn('Cannot preload modules: Node.js require not available');
      return;
    }

    // Built-in Node.js modules suitable for local processing
    const builtinModules = [
      // Core utilities
      'os', 'path', 'fs', 'util', 'url', 'querystring',
      // Data processing
      'crypto', 'zlib', 'stream', 'buffer', 'events',
      // File and system
      'readline', 'worker_threads', 'child_process',
      // Text processing
      'string_decoder', 
      // Timers and async
      'timers', 'async_hooks',
      // Utilities
      'assert', 'constants'
    ];

    builtinModules.forEach(moduleName => {
      try {
        const moduleExports = this.nodeRequire(moduleName);
        this.modules.set(moduleName, moduleExports);
        log.debug(`Pre-loaded builtin module: ${moduleName}`);
      } catch (error) {
        log.warn(`Failed to pre-load builtin module ${moduleName}:`, error);
      }
    });

    // Ensure path.join is available globally

    // add process.resourcesPath to node module search path
    if (this.nodeRequire) {
      const path = this.nodeRequire('path');
      const resourcesPath = process.resourcesPath || __dirname;
      const nodeModulesPath = path.join(resourcesPath);
      // Add node_modules to require paths
      if (this.nodeRequire.paths) {
        this.nodeRequire.paths.unshift(nodeModulesPath);
      } else {
        // For older Node.js versions
        this.nodeRequire.paths = [nodeModulesPath];
      }
      log.debug(`Added node_modules path: ${nodeModulesPath}`);
    } else {
      log.warn('Node.js require not available, cannot add node_modules path');
    }

    // case 1)
    // const danfojs = this.nodeRequire('danfojs'); 
    // case 3)
    // const danfojs = require('danfojs'); 
    // case 4)
    // const danfojs:any = undefined;

// #if DEV
const danfojs:any = this.nodeRequire('danfojs');
// #endif

    // Register statically imported danfojs
    if (danfojs) {
      this.modules.set('danfojs', danfojs);
      // also register the exported tensorFlow module
      if (danfojs.tensorflow) {
        this.modules.set('@tensorflow/tfjs', danfojs.tensorflow);
      }

      if(danfojs)
      log.info('✓ Successfully loaded danfojs');
    } else {
      log.warn('⚠️ danfojs not available');
    }

    if( Plotly ) {
        this.modules.set('plotly.js-dist-min', Plotly); 
        log.info('✓ Successfully loaded Plotly');
    } else {
        log.warn('⚠️ Plotly not available');
    }

    // Optional npm modules that might be available
    const optionalModules: string[] = [
      'zx', // Shell scripting library
      // These will be loaded on-demand when requested
    ];

    optionalModules.forEach(moduleName => {
      try {
        const moduleExports = this.nodeRequire(moduleName);
        this.modules.set(moduleName, moduleExports);
        log.debug(`Pre-loaded optional module: ${moduleName}`);

        if (moduleName === '@tensorflow/tfjs-node') {
          this.modules.set('tensorflow', moduleExports);
        }
      } catch (error) {
        log.debug(`Optional module not available: ${moduleName}`);
      }
    });

    log.info('Available modules:', Array.from(this.modules.keys()));
  }

  /**
   * Register a module with its exports
   */
  public registerModule(name: string, moduleExports: any): void {
    this.modules.set(name, moduleExports);
    log.debug(`Registered module: ${name}`);
  }

  /**
   * Get a module, loading it if necessary
   */
  public getModule(name: string): any {
    // Return cached module if available
    if (this.modules.has(name)) {
      return this.modules.get(name);
    }

    // Try to load using Node.js require
    if (this.nodeRequire) {
      try {
        const moduleExports = this.nodeRequire(name);
        this.modules.set(name, moduleExports);
        log.debug(`Loaded module via require: ${name}`);
        return moduleExports;
      } catch (error) {
        log.error(`Failed to load module ${name}:`, error);
        throw new Error(`Module '${name}' not found: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    throw new Error(`Module '${name}' not found and Node.js require not available. Available modules: ${this.getAvailableModules().join(', ')}`);
  }

  /**
   * Get list of available modules
   */
  public getAvailableModules(): string[] {
    const keys = Array.from(this.modules.keys());
    log.debug('Available module keys:', keys);
    return keys;
  }

  /**
   * Get list of available modules with version information
   */
  public getAvailableModulesWithVersions(): Array<{name: string, version?: string}> {
    const keys = Array.from(this.modules.keys());
    
    // Debug: Check if any keys are not strings
    keys.forEach((key, index) => {
      if (typeof key !== 'string') {
        log.error(`Module key at index ${index} is not a string:`, key, 'Type:', typeof key);
      }
    });
    
    log.debug('Getting versions for modules:', keys);
    
    return keys.map((moduleName, index) => {
      // Ensure moduleName is always a string
      let nameStr: string;
      try {
        if (typeof moduleName === 'string') {
          nameStr = moduleName;
        } else {
          log.warn(`Module name at index ${index} is not a string:`, moduleName);
          nameStr = `Module_${index}`;
        }
      } catch (error) {
        log.error(`Error processing module name at index ${index}:`, error);
        nameStr = `Unknown_Module_${index}`;
      }
      
      try {
        const version = this.getModuleVersion(nameStr);
        log.debug(`Version for ${nameStr}:`, version, '(source: runtime detection)');
        return {
          name: nameStr,
          version: version
        };
      } catch (error) {
        log.warn(`Error processing module ${nameStr}:`, error);
        return {
          name: nameStr,
          version: undefined
        };
      }
    }).filter(module => module.name && typeof module.name === 'string');
  }

  /**
   * Get version of a specific module
   */
  public getModuleVersion(moduleName: string): string | undefined {
    try {
      const moduleExports = this.modules.get(moduleName);
      if (!moduleExports) return undefined;

      // For built-in Node.js modules, prefer the manifest since it's more reliable
      const builtinModules = [
        'os', 'path', 'fs', 'util', 'url', 'querystring',
        'crypto', 'zlib', 'stream', 'buffer', 'events',
        'readline', 'worker_threads', 'child_process',
        'string_decoder', 'timers', 'async_hooks',
        'assert', 'constants'
      ];
      
      if (builtinModules.includes(moduleName)) {
        // Check manifest first for built-in modules
        if (moduleManifest && moduleManifest.modules) {
          const manifestModules = moduleManifest.modules as Record<string, { version: string; description: string; type: string }>;
          if (manifestModules[moduleName]) {
            return manifestModules[moduleName].version;
          }
        }
        // Fallback to Node.js version (but clean it up)
        let nodeVersion = process.version;
        // Ensure no double "v" prefix
        if (nodeVersion.startsWith('v')) {
          return nodeVersion; // Already has v prefix
        } else {
          return `v${nodeVersion}`;
        }
      }

      // Try different ways to get version information for non-built-in modules
      
      // 1. Check if module has a version property
      if (moduleExports.version) {
        // Ensure version is a string
        if (typeof moduleExports.version === 'string') {
          return moduleExports.version;
        } else if (typeof moduleExports.version === 'object') {
          // For complex version objects (like TensorFlow), try to extract a meaningful version
          if (moduleExports.version['tfjs-core']) {
            return String(moduleExports.version['tfjs-core']);
          } else if (moduleExports.version.core) {
            return String(moduleExports.version.core);
          } else if (moduleExports.version.version) {
            return String(moduleExports.version.version);
          }
          // Skip other complex object versions
          log.debug(`Module ${moduleName} has complex version object, skipping`);
        } else {
          return String(moduleExports.version);
        }
      }

      // 2. Check if module has __version__ property (Python style)
      if (moduleExports.__version__) {
        if (typeof moduleExports.__version__ === 'string') {
          return moduleExports.__version__;
        } else {
          return String(moduleExports.__version__);
        }
      }

      // 3. Try to load package.json for the module using Node.js require
      if (this.nodeRequire) {
        try {
          // For npm modules, try to load their package.json
          const packageJson = this.nodeRequire(`${moduleName}/package.json`);
          if (packageJson && packageJson.version) {
            if (typeof packageJson.version === 'string') {
              return packageJson.version;
            } else {
              return String(packageJson.version);
            }
          }
        } catch (error) {
          // package.json not found or not accessible
        }
      }

      // 4. Special cases for known modules
      if (moduleName === 'plotly.js-dist-min' && moduleExports.version) {
        if (typeof moduleExports.version === 'string') {
          return moduleExports.version;
        } else {
          return String(moduleExports.version);
        }
      }

      // 5. Check if it's a global/browser module with version info
      if (typeof window !== 'undefined') {
        const globalModule = (window as any)[moduleName];
        if (globalModule && globalModule.version) {
          if (typeof globalModule.version === 'string') {
            return globalModule.version;
          } else {
            return String(globalModule.version);
          }
        }
      }

      // 6. Final fallback to build-time manifest for any module
      if (moduleManifest && moduleManifest.modules) {
        const manifestModules = moduleManifest.modules as Record<string, { version: string; description: string; type: string }>;
        if (manifestModules[moduleName]) {
          return manifestModules[moduleName].version;
        }
      }

      return undefined;
    } catch (error) {
      log.debug(`Could not get version for module ${moduleName}:`, error);
      return undefined;
    }
  }

  /**
   * Synchronous require function
   */
  public requireSync(name: string): any {
    return this.getModule(name);
  }

  /**
   * Check if a module is available
   */
  public hasModule(name: string): boolean {
    if (this.modules.has(name)) {
      return true;
    }

    // Check if we can load it via require
    if (this.nodeRequire) {
      try {
        this.nodeRequire.resolve(name);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Pre-load multiple modules
   */
  public preloadModules(moduleNames: string[]): { loaded: string[], failed: string[] } {
    const results = { loaded: [] as string[], failed: [] as string[] };

    moduleNames.forEach((name) => {
      try {
        this.getModule(name);
        results.loaded.push(name);
        log.debug(`Pre-loaded module: ${name}`);
      } catch (error) {
        results.failed.push(name);
        log.warn(`Failed to pre-load module ${name}:`, error);
      }
    });

    return results;
  }

  /**
   * Clear module cache
   */
  public clearCache(): void {
    this.modules.clear();
    this.preloadCommonModules();
    log.debug('Module cache cleared and common modules reloaded');
  }

  /**
   * Get Node.js require function (for advanced usage)
   */
  public getNodeRequire(): any {
    return this.nodeRequire;
  }
}

// Global registry instance
export const moduleRegistry = new ModuleRegistry();
