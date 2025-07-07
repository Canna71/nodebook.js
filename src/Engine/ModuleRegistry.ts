import { initializeFileSystemHelpers } from '@/lib/fileSystemHelpers';
import anylogger from 'anylogger';
// import { ipcRenderer } from 'electron';
// const { app, remote } = require('electron');
const path = require('node:path');
import * as Plotly from 'plotly.js-dist-min';
import * as math from 'mathjs';
// import * as zx from 'zx';
import * as lodash from 'lodash';
/// @ts-ignore
import * as papaparse from 'papaparse';
import * as xlsx from 'xlsx';

// const zx:any = this.nodeRequire('zx');
// const lodash:any = this.nodeRequire('lodash');
// const papaparse:any = this.nodeRequire('papaparse');
// const xlsx:any = this.nodeRequire('xlsx');

// preloaded modules

// case 2)
// import * as danfojs from '/node_modules/danfojs/dist/danfojs-browser/src';

// #if !DEV
// @ts-ignore - danfojs module path resolution
import * as danfojs from '/node_modules/danfojs/dist/danfojs-browser/src';
// import * as zx from 'zx';

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
  private currentNotebookModulePaths: Set<string> = new Set(); // Track active notebook module paths
  private originalModulePaths: string[] = []; // Backup of original module paths

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

      // Store original module paths for restoration
      if (this.nodeRequire && this.nodeRequire.paths) {
        this.originalModulePaths = [...this.nodeRequire.paths];
      }
    } catch (error) {
      log.error('Failed to initialize Node.js require:', error);
    }
  }

  /**
   * Add a notebook-specific node_modules directory to the require resolution path
   * This should be called when a notebook is loaded
   */
  public addNotebookModulePath(notebookPath: string): void {
    if (!this.nodeRequire || !notebookPath) {
      log.debug('Cannot add notebook module path: nodeRequire not available or invalid path');
      return;
    }

    try {
      const path = this.nodeRequire('path');
      const fs = this.nodeRequire('fs');
      
      // Get the directory containing the notebook file
      const notebookDir = path.dirname(notebookPath);
      const notebookModulesPath = path.join(notebookDir, 'node_modules');
      
      // Check if the notebook's node_modules directory exists
      if (fs.existsSync(notebookModulesPath)) {
        // Add to the beginning of require paths so it takes precedence
        if (this.nodeRequire.paths) {
          // Remove if already present to avoid duplicates
          const existingIndex = this.nodeRequire.paths.indexOf(notebookModulesPath);
          if (existingIndex !== -1) {
            this.nodeRequire.paths.splice(existingIndex, 1);
          }
          
          // Add to the beginning for highest priority
          this.nodeRequire.paths.unshift(notebookModulesPath);
          this.currentNotebookModulePaths.add(notebookModulesPath);
          
          log.info(`✓ Added notebook module path: ${notebookModulesPath}`);
          log.debug(`Current module paths: ${this.nodeRequire.paths.slice(0, 5).join(', ')}${this.nodeRequire.paths.length > 5 ? '...' : ''}`);
        }
        
        // Force comprehensive module resolution update
        const currentNodePath = process.env.NODE_PATH || '';
        
        if (!currentNodePath.includes(notebookModulesPath)) {
          log.debug('Forcing module resolution update after adding notebook path...');
          const updateSuccess = this.forceModuleResolutionUpdate();
          
          if (updateSuccess) {
            log.info(`✓ Updated module resolution with notebook path: ${notebookModulesPath}`);
          } else {
            log.warn('Failed to update module resolution after adding notebook path');
          }
        }
      } else {
        log.debug(`Notebook node_modules directory does not exist: ${notebookModulesPath}`);
      }
    } catch (error) {
      log.error(`Failed to add notebook module path for ${notebookPath}:`, error);
    }
  }

  /**
   * Remove a notebook-specific node_modules directory from the require resolution path
   * This should be called when a notebook is closed or a new one is loaded
   */
  public removeNotebookModulePath(notebookPath: string): void {
    if (!this.nodeRequire || !notebookPath) {
      log.debug('Cannot remove notebook module path: nodeRequire not available or invalid path');
      return;
    }

    try {
      const path = this.nodeRequire('path');
      const notebookDir = path.dirname(notebookPath);
      const notebookModulesPath = path.join(notebookDir, 'node_modules');
      
      if (this.currentNotebookModulePaths.has(notebookModulesPath)) {
        // Remove from require paths
        if (this.nodeRequire.paths) {
          const index = this.nodeRequire.paths.indexOf(notebookModulesPath);
          if (index !== -1) {
            this.nodeRequire.paths.splice(index, 1);
            log.info(`✓ Removed notebook module path: ${notebookModulesPath}`);
          }
        }
        
        // Remove from our tracking set
        this.currentNotebookModulePaths.delete(notebookModulesPath);
        
        // Update NODE_PATH environment variable using the working approach
        const currentNodePath = process.env.NODE_PATH || '';
        const pathSeparator = path.delimiter;
        
        if (currentNodePath.includes(notebookModulesPath)) {
          // Set NODE_PATH to the actual require.paths (your working solution)
          process.env.NODE_PATH = this.nodeRequire.paths.join(pathSeparator);
          log.debug(`Updated NODE_PATH from require.paths after removal: ${process.env.NODE_PATH}`);
          
          // Force Node to update its module paths
          try {
            const Module = this.nodeRequire('module');
            if (Module._pathCache) {
              Module._pathCache = Object.create(null);
            }
            Module._initPaths();
            log.debug('Successfully reinitialized module paths after removal');
          } catch (error) {
            log.warn('Failed to reinitialize module paths after removal:', error);
          }
        }
        
        log.debug(`Current module paths after removal: ${this.nodeRequire.paths?.slice(0, 5).join(', ')}${(this.nodeRequire.paths?.length || 0) > 5 ? '...' : ''}`);
      }
    } catch (error) {
      log.error(`Failed to remove notebook module path for ${notebookPath}:`, error);
    }
  }

  /**
   * Clear all notebook-specific module paths
   * This should be called when switching to a new notebook or closing all notebooks
   */
  public clearNotebookModulePaths(): void {
    if (!this.nodeRequire) {
      log.debug('Cannot clear notebook module paths: nodeRequire not available');
      return;
    }

    try {
      const path = this.nodeRequire('path');
      const pathSeparator = path.delimiter;
      
      // Remove all notebook paths from require.paths
      if (this.nodeRequire.paths && this.currentNotebookModulePaths.size > 0) {
        for (const modulePath of this.currentNotebookModulePaths) {
          const index = this.nodeRequire.paths.indexOf(modulePath);
          if (index !== -1) {
            this.nodeRequire.paths.splice(index, 1);
            log.debug(`Removed notebook module path: ${modulePath}`);
          }
        }
      }
      
      // Clear our tracking set
      this.currentNotebookModulePaths.clear();
      
      // Clean up NODE_PATH environment variable using the working approach
      if (process.env.NODE_PATH) {
        // Set NODE_PATH to the actual require.paths (your working solution)
        process.env.NODE_PATH = this.nodeRequire.paths.join(pathSeparator);
        log.debug(`Updated NODE_PATH from require.paths after clearing: ${process.env.NODE_PATH}`);
        
        // Force Node to update its module paths
        try {
          const Module = this.nodeRequire('module');
          if (Module._pathCache) {
            Module._pathCache = Object.create(null);
          }
          Module._initPaths();
          log.debug('Successfully reinitialized module paths after clearing');
        } catch (error) {
          log.warn('Failed to reinitialize module paths after clearing:', error);
        }
      }
      
      log.info('✓ Cleared all notebook-specific module paths');
    } catch (error) {
      log.error('Failed to clear notebook module paths:', error);
    }
  }

  /**
   * Get currently active notebook module paths
   */
  public getActiveNotebookModulePaths(): string[] {
    return Array.from(this.currentNotebookModulePaths);
  }

  /**
   * Debug utility: Get current module resolution paths
   */
  public getDebugInfo(): {
    nodeRequirePaths: string[];
    notebookModulePaths: string[];
    nodePathEnv: string;
    availableModules: string[];
    moduleGlobalPaths: string[];
    moduleNodeModulePaths: string[];
  } {
    const Module = this.nodeRequire ? this.nodeRequire('module') : null;
    
    return {
      nodeRequirePaths: this.nodeRequire?.paths || [],
      notebookModulePaths: this.getActiveNotebookModulePaths(),
      nodePathEnv: process.env.NODE_PATH || '',
      availableModules: this.getAvailableModules(),
      moduleGlobalPaths: Module?.globalPaths || [],
      moduleNodeModulePaths: Module ? Module._nodeModulePaths(process.cwd()) : []
    };
  }

  /**
   * Force module resolution paths update using multiple approaches
   */
  public forceModuleResolutionUpdate(): boolean {
    if (!this.nodeRequire) {
      log.error('Cannot force module resolution update: nodeRequire not available');
      return false;
    }

    try {
      const pathModule = this.nodeRequire('path');
      const Module = this.nodeRequire('module');
      
      log.debug('=== Forcing Module Resolution Update ===');
      log.debug(`Current require.paths: ${this.nodeRequire.paths?.join(', ') || 'none'}`);
      log.debug(`Current NODE_PATH: ${process.env.NODE_PATH || 'not set'}`);
      
      // Method 1: Set NODE_PATH to require.paths (your working solution)
      if (this.nodeRequire.paths && this.nodeRequire.paths.length > 0) {
        const oldNodePath = process.env.NODE_PATH;
        const newNodePath = this.nodeRequire.paths.join(pathModule.delimiter);
        
        // Try multiple approaches to set NODE_PATH
        process.env.NODE_PATH = newNodePath;
        
        // Also try setting it on the global process object directly
        if (typeof global !== 'undefined' && global.process && global.process.env) {
          global.process.env.NODE_PATH = newNodePath;
          log.debug('✓ Set NODE_PATH on global.process.env');
        }
        
        // And on the window.process if available (Electron)
        if (typeof window !== 'undefined' && (window as any).process && (window as any).process.env) {
          (window as any).process.env.NODE_PATH = newNodePath;
          log.debug('✓ Set NODE_PATH on window.process.env');
        }
        
        log.info(`✓ Set NODE_PATH from: ${oldNodePath || 'unset'} to: ${newNodePath}`);
        
        // Immediate verification
        const immediateVerification = process.env.NODE_PATH;
        log.debug(`NODE_PATH immediate verification: ${immediateVerification || 'NOT SET'}`);
        
        // Delayed verification
        setTimeout(() => {
          const currentNodePath = process.env.NODE_PATH;
          log.debug(`NODE_PATH verification after 100ms: ${currentNodePath || 'NOT SET'}`);
          
          // If NODE_PATH gets reset, try a more persistent approach
          if (!currentNodePath || currentNodePath !== newNodePath) {
            log.warn('NODE_PATH was reset! Trying persistent approach...');
            this.setupPersistentNodePath(newNodePath);
          }
        }, 100);
        
        // Even more delayed verification
        setTimeout(() => {
          const currentNodePath = process.env.NODE_PATH;
          log.debug(`NODE_PATH verification after 500ms: ${currentNodePath || 'NOT SET'}`);
        }, 500);
      }
      
      // Method 2: Clear module resolution caches
      if (Module._pathCache) {
        Module._pathCache = Object.create(null);
        log.debug('✓ Cleared Module._pathCache');
      }
      
      // Method 3: Force path reinitialization
      try {
        Module._initPaths();
        log.info('✓ Called Module._initPaths()');
      } catch (error) {
        log.warn('Module._initPaths() failed:', error);
      }
      
      // Method 4: Directly modify Module.globalPaths (more aggressive approach)
      if (Module.globalPaths && this.nodeRequire.paths) {
        const originalLength = Module.globalPaths.length;
        
        // Remove our paths first to avoid duplicates
        for (const customPath of this.nodeRequire.paths) {
          const index = Module.globalPaths.indexOf(customPath);
          if (index !== -1) {
            Module.globalPaths.splice(index, 1);
          }
        }
        
        // Add our paths to the beginning (highest priority)
        for (let i = this.nodeRequire.paths.length - 1; i >= 0; i--) {
          Module.globalPaths.unshift(this.nodeRequire.paths[i]);
        }
        
        log.debug(`✓ Updated Module.globalPaths from ${originalLength} to ${Module.globalPaths.length} entries`);
        log.debug(`New globalPaths (first 3): ${Module.globalPaths.slice(0, 3).join(', ')}`);
      }
      
      // Method 5: Hook into Module._resolveFilename if possible (most aggressive)
      try {
        const originalResolveFilename = Module._resolveFilename;
        const customPaths = [...(this.nodeRequire.paths || [])];
        
        // Only hook once
        if (!Module._customResolveHooked && customPaths.length > 0) {
          Module._resolveFilename = function(request: string, parent: any, isMain: boolean, options?: any) {
            try {
              // Try original resolution first
              return originalResolveFilename.call(this, request, parent, isMain, options);
            } catch (originalError) {
              // If that fails, try our custom paths
              for (const customPath of customPaths) {
                try {
                  const testPath = pathModule.join(customPath, request);
                  if (originalResolveFilename.call(this, testPath, parent, isMain, options)) {
                    log.debug(`✓ Resolved ${request} using custom path: ${customPath}`);
                    return originalResolveFilename.call(this, testPath, parent, isMain, options);
                  }
                } catch (customError) {
                  // Continue to next path
                }
              }
              // If all custom paths fail, throw the original error
              throw originalError;
            }
          };
          
          Module._customResolveHooked = true;
          log.debug('✓ Hooked Module._resolveFilename for custom path resolution');
        }
      } catch (error) {
        log.debug('Could not hook Module._resolveFilename:', error);
      }
      
      // Method 6: Test if resolution actually works now
      log.debug('Testing module resolution after update...');
      const testResults = this.testModuleResolution();
      log.debug(`Module resolution test results:`, testResults);
      
      return true;
    } catch (error) {
      log.error('Failed to force module resolution update:', error);
      return false;
    }
  }

  /**
   * Test if module resolution is working for common paths
   */
  private testModuleResolution(): { [path: string]: boolean } {
    const results: { [path: string]: boolean } = {};
    
    if (!this.nodeRequire || !this.nodeRequire.paths) {
      return results;
    }
    
    // Test if we can resolve a hypothetical module from each path
    for (const modulePath of this.nodeRequire.paths.slice(0, 3)) { // Test first 3 paths
      try {
        // Try to check if the path is being considered by Node.js
        const fs = this.nodeRequire('fs');
        const pathExists = fs.existsSync(modulePath);
        results[modulePath] = pathExists;
        
        if (pathExists) {
          // Try to see what packages are available
          try {
            const packages = fs.readdirSync(modulePath).filter((name: string) => !name.startsWith('.'));
            log.debug(`Path ${modulePath} contains ${packages.length} packages`);
          } catch (error) {
            log.debug(`Cannot read ${modulePath}:`, error);
          }
        }
      } catch (error) {
        results[modulePath] = false;
        log.debug(`Error testing path ${modulePath}:`, error);
      }
    }
    
    return results;
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
            let version = manifestModules[moduleName].version;
            // Remove "v" prefix if present
            if (version.startsWith('v')) {
              version = version.substring(1);
            }
            return version;
          }
        }
        // Fallback to Node.js version (remove "v" prefix)
        let nodeVersion = process.version;
        if (nodeVersion.startsWith('v')) {
          return nodeVersion.substring(1);
        } else {
          return nodeVersion;
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

    // add process.resourcesPath/node_modules to node module search path
    if (this.nodeRequire) {
      const path = this.nodeRequire('path');
      const resourcesPath = process.resourcesPath || __dirname;
      const resourcesNodeModulesPath = path.join(resourcesPath, 'node_modules');
      
      // Add to require.paths
      if (this.nodeRequire.paths) {
        this.nodeRequire.paths.unshift(resourcesNodeModulesPath);
      } else {
        // For older Node.js versions
        this.nodeRequire.paths = [resourcesNodeModulesPath];
      }
      log.debug(`Added resources node_modules path to require.paths: ${resourcesNodeModulesPath}`);
      
      // Update NODE_PATH using the working approach (set it to the actual require.paths)
      process.env.NODE_PATH = this.nodeRequire.paths.join(path.delimiter);
      log.debug(`Set NODE_PATH from require.paths: ${process.env.NODE_PATH}`);
    } else {
      log.warn('Node.js require not available, cannot add resources node_modules path');
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
const zx:any = this.nodeRequire('zx');



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

    if( math ) {
        this.modules.set('mathjs', math);
        log.info('✓ Successfully loaded mathjs');
    } else {
        log.warn('⚠️ mathjs not available');
    }

    if( zx ) {
        // if on windows, set Powershell as default shell
        if (process.platform === 'win32') {
            zx.usePowerShell();
            log.debug('Set zx shell to powershell for Windows');
        }

        this.modules.set('zx', zx);
        log.info('✓ Successfully loaded zx');
    } else {
        log.warn('⚠️ zx not available');
    }

    if( lodash ) {
        this.modules.set('lodash', lodash);
        log.info('✓ Successfully loaded lodash');
    } else {
        log.warn('⚠️ lodash not available');
    }

    if( papaparse ) {
        this.modules.set('papaparse', papaparse);
        log.info('✓ Successfully loaded papaparse');
    } else {
        log.warn('⚠️ papaparse not available');
    }

    if( xlsx ) {
        this.modules.set('xlsx', xlsx);
        log.info('✓ Successfully loaded xlsx');
    } else {
        log.warn('⚠️ xlsx not available');
    }

    // Optional npm modules that might be available
    const optionalModules: string[] = [
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
   * Initialize the module registry and file system helpers
   */
  public async initialize(): Promise<boolean> {
    if (!this.nodeRequire) {
      log.error('Cannot initialize: nodeRequire not available');
      return false;
    }

    const fs = await initializeFileSystemHelpers();
    if (!fs) {
      log.error('Failed to initialize file system helpers');
      return false;
    }
    
    try {
      const pathModule = this.nodeRequire('path');
      const userDataPath = fs.getUserDataPath();
      log.debug(`Setting up user data module directory: ${userDataPath}`);

      // Use the user data path to create a custom module directory
      const userDataModuleDir = pathModule.join(userDataPath, 'node_modules');
      log.debug(`User data node_modules path: ${userDataModuleDir}`);
      
      // Check if the directory exists
      const fsModule = this.nodeRequire('fs');
      const dirExists = fsModule.existsSync(userDataModuleDir);
      log.debug(`User data node_modules exists: ${dirExists}`);
      
      // Add to require.paths first
      if (this.nodeRequire.paths) {
        log.debug(`Current require.paths before adding user data: ${this.nodeRequire.paths.slice(0, 3).join(', ')}...`);
        
        // Remove if already present to avoid duplicates
        const existingIndex = this.nodeRequire.paths.indexOf(userDataModuleDir);
        if (existingIndex !== -1) {
          this.nodeRequire.paths.splice(existingIndex, 1);
          log.debug(`Removed existing user data path at index ${existingIndex}`);
        }
        // Add to paths
        this.nodeRequire.paths.unshift(userDataModuleDir);
        log.debug(`Added user data module path to require.paths: ${userDataModuleDir}`);
        log.debug(`New require.paths: ${this.nodeRequire.paths.slice(0, 3).join(', ')}...`);
      } else {
        // For older Node.js versions
        this.nodeRequire.paths = [userDataModuleDir];
        log.debug(`Initialized require.paths with user data module path: ${userDataModuleDir}`);
      }

      // Force comprehensive module resolution update
      log.debug('=== Starting comprehensive module resolution update ===');
      const updateSuccess = this.forceModuleResolutionUpdate();
      
      if (!updateSuccess) {
        log.error('Failed to update module resolution - this may affect module loading');
      }
      
      // Log final state
      log.debug('=== Final module resolution state ===');
      const debugInfo = this.getDebugInfo();
      log.debug(`Final NODE_PATH: ${debugInfo.nodePathEnv}`);
      log.debug(`Final require.paths: ${debugInfo.nodeRequirePaths.slice(0, 3).join(', ')}...`);
      log.debug(`Module globalPaths: ${debugInfo.moduleGlobalPaths.slice(0, 3).join(', ')}...`);

      return true;
    } catch (error) {
      log.error('Failed to initialize module registry:', error);
      return false;
    }
  }

  /**
   * Setup a more persistent NODE_PATH that resists being reset
   */
  private setupPersistentNodePath(nodePath: string): void {
    try {
      log.debug('Setting up persistent NODE_PATH approach...');
      
      // Try to override the env property with a getter/setter
      const originalDescriptor = Object.getOwnPropertyDescriptor(process.env, 'NODE_PATH');
      
      try {
        Object.defineProperty(process.env, 'NODE_PATH', {
          get: () => {
            log.debug('NODE_PATH getter called, returning:', nodePath);
            return nodePath;
          },
          set: (value) => {
            log.debug(`NODE_PATH setter called with: ${value}, ignoring and keeping: ${nodePath}`);
            // Ignore attempts to change it
          },
          enumerable: true,
          configurable: true
        });
        log.debug('✓ Set up persistent NODE_PATH with getter/setter');
      } catch (error) {
        // If that fails, restore original descriptor
        if (originalDescriptor) {
          Object.defineProperty(process.env, 'NODE_PATH', originalDescriptor);
        }
        log.debug('Could not set up persistent NODE_PATH:', error);
      }
      
      // Also try periodically resetting it
      const intervalId = setInterval(() => {
        if (process.env.NODE_PATH !== nodePath) {
          log.debug(`NODE_PATH was changed from ${nodePath} to ${process.env.NODE_PATH}, restoring...`);
          process.env.NODE_PATH = nodePath;
        }
      }, 1000);
      
      // Clear interval after 10 seconds to avoid memory leaks
      setTimeout(() => {
        clearInterval(intervalId);
        log.debug('Stopped NODE_PATH monitoring');
      }, 10000);
      
    } catch (error) {
      log.error('Failed to setup persistent NODE_PATH:', error);
    }
  }
}

// Global registry instance
export const moduleRegistry = new ModuleRegistry();
