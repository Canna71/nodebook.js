import anylogger from "anylogger";

const log = anylogger("ModuleRegistry");

// Pre-import modules at build time
import * as tf from '@tensorflow/tfjs';
// Import tfvis as ES6 module at build time
import * as tfvis from '@tensorflow/tfjs-vis';
// Import other common modules
// import * as danfojs from 'danfojs';

/**
 * Module registry that pre-imports modules at build time
 * and makes them available to the runtime require/import system
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, any> = new Map();
  private aliases: Map<string, string> = new Map();

  private constructor() {
    this.registerBuiltinModules();
    this.registerScientificModules();
    this.registerAliases();
  }

  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Register built-in Node.js modules (these will be handled by the existing require)
   */
  private registerBuiltinModules(): void {
    // These are handled by the existing secure require, just document them
    const builtinModules = [
      'os', 'path', 'fs', 'crypto', 'util', 'events', 'stream',
      'buffer', 'url', 'querystring', 'http', 'https'
    ];
    
    log.debug('Built-in modules available:', builtinModules);
  }

  /**
   * Register scientific/ML modules that are pre-imported at build time
   */
  private registerScientificModules(): void {
    // TensorFlow.js
    this.modules.set('@tensorflow/tfjs', tf);
    this.modules.set('tensorflow', tf);
    
    // tfvis (ES6 module)
    this.modules.set('@tensorflow/tfjs-vis', tfvis);
    this.modules.set('tfvis', tfvis);
    
    // Danfo.js
    // this.modules.set('danfojs-node', danfojs);
    // this.modules.set('danfojs', danfojs);
    
    log.debug('Pre-imported scientific modules:', Array.from(this.modules.keys()));
  }

  /**
   * Register module aliases for convenience
   */
  private registerAliases(): void {
    this.aliases.set('tf', '@tensorflow/tfjs');
    this.aliases.set('tensorflow', '@tensorflow/tfjs');
    this.aliases.set('dfd', 'danfojs-node');
    this.aliases.set('danfo', 'danfojs-node');
    
    log.debug('Module aliases:', Array.from(this.aliases.entries()));
  }

  /**
   * Get a module by name (supports aliases)
   */
  public getModule(moduleName: string): any {
    // Check for alias first
    const actualName = this.aliases.get(moduleName) || moduleName;
    
    // Get the module
    const module = this.modules.get(actualName);
    
    if (module) {
      log.debug(`Module registry: Found ${moduleName} -> ${actualName}`);
      return module;
    }
    
    return null;
  }

  /**
   * Check if a module is available in the registry
   */
  public hasModule(moduleName: string): boolean {
    const actualName = this.aliases.get(moduleName) || moduleName;
    return this.modules.has(actualName);
  }

  /**
   * Register a custom module (for testing or user extensions)
   */
  public registerModule(name: string, module: any): void {
    this.modules.set(name, module);
    log.debug(`Registered custom module: ${name}`);
  }

  /**
   * Get all available module names
   */
  public getAvailableModules(): string[] {
    const modules = Array.from(this.modules.keys());
    const aliases = Array.from(this.aliases.keys());
    return [...modules, ...aliases].sort();
  }

  /**
   * Get module info for debugging
   */
  public getModuleInfo(): { [key: string]: any } {
    const info: { [key: string]: any } = {};
    
    this.modules.forEach((module, name) => {
      info[name] = {
        type: 'pre-imported',
        hasDefault: !!module.default,
        exports: Object.keys(module).slice(0, 10) // First 10 exports
      };
    });
    
    return info;
  }
}

// Create and export singleton instance
export const moduleRegistry = ModuleRegistry.getInstance();
