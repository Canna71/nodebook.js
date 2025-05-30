import anylogger from 'anylogger';

// Static import for danfojs to ensure it's bundled
let danfojs: any = null;
try {
  // Use ES6 import() for better bundling support
  danfojs = require('danfojs');
} catch (error) {
  // Silently handle missing danfojs - will be logged later
}

// Alternative: Direct import (comment out the above and use this if available)
// import * as danfojs from 'danfojs';

const log = anylogger('ModuleRegistry');

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

  /**
   * Pre-load common modules using Node.js require
   */
  private preloadCommonModules(): void {
    if (!this.nodeRequire) {
      log.warn('Cannot preload modules: Node.js require not available');
      return;
    }

    // Built-in Node.js modules
    const builtinModules = [
      'os', 'path', 'fs', 'util', 'crypto', 'url', 'querystring',
      'events', 'stream', 'buffer', 'process'
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

    // Register statically imported danfojs if available
    if (danfojs) {
      this.modules.set('danfojs', danfojs);
      log.info('✓ Successfully loaded danfojs (bundled)');
    } else {
      log.warn('⚠️ danfojs not available - install it with: npm install danfojs');
    }

    // Optional npm modules
    const optionalModules = [
      '@tensorflow/tfjs', '@tensorflow/tfjs-node',
      'lodash', 'moment', 'axios'
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
    return Array.from(this.modules.keys());
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
