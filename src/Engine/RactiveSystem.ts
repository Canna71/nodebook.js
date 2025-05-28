import anylogger from "anylogger";

const log = anylogger("ReactiveSystem");
/**
 * Interface for a reactive value
 */
interface IReactiveValue<T> {
  get(): T;
  setValue(newValue: T, shouldPropagate?: boolean): void;
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * Type for a computation function that returns a value
 */
type ComputeFn<T> = () => T;

/**
 * Reactive value implementation
 */
class ReactiveValue<T> implements IReactiveValue<T> {
  private value: T;
  private computeFn: ComputeFn<T> | null;
  private dependencies: Set<IReactiveValue<any>>;
  private subscribers: Set<(value: T) => void>;
  private isComputing: boolean = false;

  constructor(initialValue: T, computeFn: ComputeFn<T> | null = null, dependencies: IReactiveValue<any>[] = []) {
    this.value = initialValue;
    this.computeFn = computeFn;
    this.dependencies = new Set(dependencies);
    this.subscribers = new Set();
  }

  /**
   * Get current value, compute if needed
   */
  public get(): T {
    if (this.computeFn && !this.isComputing) {
      this.isComputing = true;
      try {
        const newValue = this.computeFn();
        this.setValue(newValue, false); // Don't trigger recompute during initial get
      } finally {
        this.isComputing = false;
      }
    }
    return this.value;
  }

  /**
   * Set value and notify subscribers
   */
  public setValue(newValue: T, shouldPropagate: boolean = true): void {
    if (this.value !== newValue) {
      this.value = newValue;
      if (shouldPropagate) {
        this.notifySubscribers();
      }
    }
  }

  /**
   * Subscribe to changes
   */
  public subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.value);
      } catch (error) {
        console.error('Error in reactive value subscriber:', error);
      }
    });
  }

  /**
   * Add dependency
   */
  public addDependency(reactiveValue: IReactiveValue<any>): void {
    this.dependencies.add(reactiveValue);
    reactiveValue.subscribe(() => {
      if (this.computeFn && !this.isComputing) {
        this.isComputing = true;
        try {
          const newValue = this.computeFn();
          this.setValue(newValue, true); // Enable propagation when dependency changes
        } finally {
          this.isComputing = false;
        }
      }
    });
  }

  /**
   * Clear all dependencies
   */
  public clearDependencies(): void {
    this.dependencies.clear();
  }

  /**
   * Update compute function
   */
  public setComputeFn(computeFn: ComputeFn<T> | null): void {
    this.computeFn = computeFn;
  }
}

/**
 * Options for the ReactiveStore
 */
interface ReactiveStoreOptions {
  batchUpdates?: boolean;
}

/**
 * Reactive store for managing reactive values
 */
export class ReactiveStore {
  private values: Map<string, IReactiveValue<any>>;
  private computationQueue: Set<IReactiveValue<any>>;
  private isUpdating: boolean = false;
  private options: ReactiveStoreOptions;

  constructor(options: ReactiveStoreOptions = {}) {
    this.values = new Map();
    this.computationQueue = new Set();
    this.options = {
      batchUpdates: true,
      ...options
    };
  }

  /**
   * Define or update a reactive value
   */
  public define<T>(
    name: string, 
    value: T | null, 
    computeFn: ComputeFn<T> | null = null, 
    dependencies: string[] = []
  ): IReactiveValue<T> {
    let reactiveValue: IReactiveValue<T>;
    
    if (this.values.has(name)) {
      reactiveValue = this.values.get(name) as IReactiveValue<T>;
      if (computeFn) {
        (reactiveValue as ReactiveValue<T>).setComputeFn(computeFn);
        this.setupDependencies(reactiveValue as ReactiveValue<T>, dependencies);
      } else if (value !== null) {
        reactiveValue.setValue(value);
      }
    } else {
      reactiveValue = new ReactiveValue<T>(value as T, computeFn);
      this.values.set(name, reactiveValue);
      this.setupDependencies(reactiveValue as ReactiveValue<T>, dependencies);
    }

    return reactiveValue;
  }

  /**
   * Set up dependency relationships
   */
  private setupDependencies(reactiveValue: ReactiveValue<any>, dependencyNames: string[]): void {
    // Clear existing dependencies
    reactiveValue.clearDependencies();
    
    // Add new dependencies
    dependencyNames.forEach(depName => {
      const depValue = this.get(depName);
      if (depValue) {
        reactiveValue.addDependency(depValue);
      }
    });
  }

  /**
   * Get reactive value by name
   */
  public get<T>(name: string): IReactiveValue<T> | undefined {
    return this.values.get(name) as IReactiveValue<T> | undefined;
  }

  /**
   * Get current value (computed if needed)
   */
  public getValue<T>(name: string): T | undefined {
    const reactiveValue = this.get<T>(name);
    return reactiveValue ? reactiveValue.get() : undefined;
  }

  /**
   * Subscribe to value changes
   */
  public subscribe<T>(name: string, callback: (value: T) => void): (() => void) | null {
    const reactiveValue = this.get<T>(name);
    return reactiveValue ? reactiveValue.subscribe(callback) : null;
  }

  /**
   * Batch multiple updates
   */
  public batch(updateFn: () => void): void {
    this.isUpdating = true;
    try {
      updateFn();
    } finally {
      this.isUpdating = false;
      this.flushUpdates();
    }
  }

  /**
   * Process all queued computations
   */
  private flushUpdates(): void {
    this.computationQueue.forEach(reactiveValue => reactiveValue.get());
    this.computationQueue.clear();
  }

  /**
   * Get all variable names
   */
  public getAllVariableNames(): string[] {
    return Array.from(this.values.keys());
  }

  /**
   * Create a proxy object for accessing reactive values
   */
  public createProxy(): { [key: string]: any } {
    const store = this;
    return new Proxy({}, {
      get(target, prop) {
        if (typeof prop === 'string') {
          return store.getValue(prop);
        }
        return undefined;
      },
      set(target, prop, value) {
        if (typeof prop === 'string') {
          const reactiveValue = store.get(prop);
          if (reactiveValue) {
            reactiveValue.setValue(value);
          } else {
            store.define(prop, value);
          }
          return true;
        }
        return false;
      }
    });
  }
}

/**
 * Error class for formula parsing/evaluation errors
 */
class FormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormulaError';
  }
}

/**
 * Formula information
 */
interface FormulaInfo {
  name: string;
  formula: string;
  dependencies: string[];
}

/**
 * Options for the ReactiveFormulaEngine
 */
interface ReactiveFormulaEngineOptions {
  safeMode?: boolean;
  allowedFunctions?: string[];
  customFunctions?: { [key: string]: Function };
}

/**
 * Reactive formula engine using JavaScript evaluation
 */
export class ReactiveFormulaEngine {
  private reactiveStore: ReactiveStore;
  private formulaMap: Map<string, string>;
  private options: ReactiveFormulaEngineOptions;
  private customFunctions: { [key: string]: Function };

  constructor(reactiveStore: ReactiveStore, options: ReactiveFormulaEngineOptions = {}) {
    this.reactiveStore = reactiveStore;
    this.formulaMap = new Map();
    this.options = {
      safeMode: true,
      allowedFunctions: [
        'Math', 'Number', 'String', 'Boolean', 'Date', 
        'min', 'max', 'sum', 'avg', 'count', 'round', 'floor', 'ceil',
        'abs', 'pow', 'sqrt', 'log', 'log10', 'exp', 'sin', 'cos', 'tan',
        'asin', 'acos', 'atan', 'atan2', 'random', 'if', 'isNaN', 'isFinite',
        'parseFloat', 'parseInt'
      ],
      ...options
    };
    
    // Initialize custom functions
    this.customFunctions = {
      sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      avg: (...args: number[]) => args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0,
      count: (...args: any[]) => args.length,
      when: (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,
      ...options.customFunctions
    };
  }

  /**
   * Create a formula that references reactive variables
   */
  public createFormula<T>(name: string, formula: string): FormulaInfo {
    // Store the formula
    this.formulaMap.set(name, formula);
    
    // Parse dependencies
    const dependencies = this.extractDependencies(formula);
    
    // Create compute function
    const computeFn = this.createComputeFunction<T>(formula);
    
    // Define reactive value
    this.reactiveStore.define<T>(
      name,
      null,
      computeFn,
      dependencies
    );
    
    return {
      name,
      formula,
      dependencies
    };
  }

  /**
   * Extract dependencies from a formula
   */
  private extractDependencies(formula: string): string[] {
    const dependencies = new Set<string>();
    
    // Find all variable references
    const varRegex = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;
    
    while ((match = varRegex.exec(formula)) !== null) {
      dependencies.add(match[1]);
    }
    
    return Array.from(dependencies);
  }

  /**
   * Create a compute function for a formula
   */
  private createComputeFunction<T>(formula: string): ComputeFn<T> {
    // Replace $var with proxy.var
    const processedFormula = formula.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, 'proxy.$1');
    
    // Create function
    return () => {
      try {
        const proxy = this.reactiveStore.createProxy();
        
        // Create context with allowed functions
        const context: { [key: string]: any } = { proxy };
        
        // Add Math functions
        if (this.options.allowedFunctions?.includes('Math')) {
          Object.getOwnPropertyNames(Math).forEach(key => {
            if (typeof (Math as any)[key] === 'function') {
              context[key] = (Math as any)[key].bind(Math);
            }
          });
        }
        
        // Add custom functions
        Object.keys(this.customFunctions).forEach(key => {
          if (this.options.allowedFunctions?.includes(key)) {
            context[key] = this.customFunctions[key];
          }
        });
        
        // Create safe evaluation function
        const evaluateFormula = new Function(...Object.keys(context), `return ${processedFormula};`);
        
        // Evaluate the formula
        const val = evaluateFormula(...Object.values(context)) as T;
        log.debug(`Evaluating formula "${formula}" resulted in:`, val);
        return val;
      } catch (error) {
        console.error(`Error evaluating formula "${formula}":`, error);
        throw new FormulaError(`Error evaluating formula: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
  }

  /**
   * Update or create a formula
   */
  public updateFormula<T>(name: string, formula: string): FormulaInfo {
    return this.createFormula<T>(name, formula);
  }

  /**
   * Get formula string
   */
  public getFormula(name: string): string | undefined {
    return this.formulaMap.get(name);
  }

  /**
   * Get all formulas
   */
  public getAllFormulas(): { [key: string]: string } {
    const formulas: { [key: string]: string } = {};
    this.formulaMap.forEach((formula, name) => {
      formulas[name] = formula;
    });
    return formulas;
  }

  /**
   * Add a custom function
   */
  public addCustomFunction(name: string, fn: Function): void {
    this.customFunctions[name] = fn;
    
    // Add to allowed functions if in safe mode
    if (this.options.safeMode && this.options.allowedFunctions && !this.options.allowedFunctions.includes(name)) {
      this.options.allowedFunctions.push(name);
    }
  }

  /**
   * Remove a custom function
   */
  public removeCustomFunction(name: string): void {
    delete this.customFunctions[name];
    
    // Remove from allowed functions
    if (this.options.allowedFunctions) {
      const index = this.options.allowedFunctions.indexOf(name);
      if (index !== -1) {
        this.options.allowedFunctions.splice(index, 1);
      }
    }
  }

  /**
   * Evaluate a formula without creating a reactive value
   */
  public evaluate<T>(formula: string): T {
    const computeFn = this.createComputeFunction<T>(formula);
    return computeFn();
  }
}

/**
 * Code cell execution context
 */
interface CodeExecutionContext {
  // Input: access to reactive values
  get: (name: string) => any;
  // Output: export reactive values
  exportValue: (name: string, value: any) => void;
  // Utility functions
  console: Console;
  Math: typeof Math;
}

/**
 * Code cell execution engine
 */
export class CodeCellEngine {
  private reactiveStore: ReactiveStore;
  private executedCells: Map<string, { code: string; exports: string[]; dependencies: string[]; lastExportValues: Map<string, any> }>;
  private executingCells: Set<string>; // Track cells currently executing to prevent cycles

  constructor(reactiveStore: ReactiveStore) {
    this.reactiveStore = reactiveStore;
    this.executedCells = new Map();
    this.executingCells = new Set();
  }

  /**
   * Execute code cell and handle exports
   */
  public executeCodeCell(cellId: string, code: string): string[] {
    // Prevent circular execution
    if (this.executingCells.has(cellId)) {
      log.debug(`Code cell ${cellId} is already executing, skipping to prevent circular reference`);
      return this.executedCells.get(cellId)?.exports || [];
    }

    this.executingCells.add(cellId);
    const dependencies = new Set<string>();
    const exportValues = new Map<string, any>();
    const exportedVars = new Set<string>(); // Single source of truth for exported variables
    
    try {
      // Transform export statements to regular assignments
      const transformedCode = this.transformExportsToAssignments(code);

      // Create a smart proxy that handles both reading and writing
      const createSmartProxy = () => {
        const localScope: { [key: string]: any } = {};
        
        return new Proxy(localScope, {
          get: (target, prop) => {
            if (typeof prop === 'string') {
              // Special handling for built-in functions
              if (prop === 'console') return console;
              if (prop === 'Math') return Math;
              if (prop === '__exportValue') return this.createExportFunction(exportValues, exportedVars);
              
              // If variable exists in local scope, return it
              if (prop in target) {
                return target[prop];
              }
              
              // Otherwise, track dependency and get from reactive store
              dependencies.add(prop);
              const value = this.reactiveStore.getValue(prop);
              log.debug(`Reading variable ${prop} with value:`, value);
              return value;
            }
            return undefined;
          },
          
          set: (target, prop, value) => {
            if (typeof prop === 'string') {
              // Store in local scope
              target[prop] = value;
              
              // If this variable was exported, update the reactive store too
              if (exportedVars.has(prop)) {
                log.debug(`Updating exported variable ${prop} with new value:`, value);
                exportValues.set(prop, value);
                this.reactiveStore.define(prop, value); // Update reactive store immediately
              }
              
              return true;
            }
            return false;
          },
          
          has: (target, prop) => {
            // Variable exists if it's in local scope or reactive store
            return typeof prop === 'string' && (
              prop in target || 
              this.reactiveStore.get(prop) !== undefined ||
              ['console', 'Math', '__exportValue'].includes(prop)
            );
          }
        });
      };

      // Create execution function
      const executeCode = new Function(
        'scope',
        `
        with (scope) {
          ${transformedCode}
        }
        `
      );

      // Execute the code with the smart proxy
      const smartProxy = createSmartProxy();
      executeCode(smartProxy);

      // Convert Set to Array for the return value and storage
      const exportsArray = Array.from(exportedVars);

      // Check if exports have actually changed
      const cellInfo = this.executedCells.get(cellId);
      const lastExportValues = cellInfo?.lastExportValues || new Map();
      let hasChanges = false;

      // Compare with previous export values
      for (const [name, value] of exportValues) {
        if (!lastExportValues.has(name) || lastExportValues.get(name) !== value) {
          hasChanges = true;
          break;
        }
      }

      // Only update reactive values if there are actual changes
      if (hasChanges || !cellInfo) {
        exportValues.forEach((value, name) => {
          this.reactiveStore.define(name, value);
        });
        log.debug(`Code cell ${cellId} exported changed values:`, Array.from(exportValues.entries()));
      } else {
        log.debug(`Code cell ${cellId} exports unchanged, skipping reactive value updates`);
      }

      // Store execution info
      const dependencyArray = Array.from(dependencies);
      this.executedCells.set(cellId, { 
        code, 
        exports: exportsArray, 
        dependencies: dependencyArray, 
        lastExportValues: new Map(exportValues)
      });

      // Set up reactive execution for dependencies (only if not already set up)
      if (!cellInfo || JSON.stringify(cellInfo.dependencies) !== JSON.stringify(dependencyArray)) {
        this.setupReactiveExecution(cellId, code, dependencyArray);
      }

      log.debug(`Code cell ${cellId} executed successfully, exported:`, exportsArray, 'dependencies:', dependencyArray);
      return exportsArray;

    } catch (error) {
      console.error(`Error executing code cell ${cellId}:`, error);
      throw new Error(`Code execution error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.executingCells.delete(cellId);
    }
  }

  /**
   * Transform export statements to regular assignments with export calls
   */
  private transformExportsToAssignments(code: string): string {
    let transformedCode = code
      // Handle: export const name = value;
      .replace(/export\s+const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;\n]+);?/g, 
        (match, name, value) => {
          return `const ${name} = ${value};\n__exportValue('${name}', ${name});`;
        })
      // Handle: export let name = value;
      .replace(/export\s+let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;\n]+);?/g, 
        (match, name, value) => {
          return `let ${name} = ${value};\n__exportValue('${name}', ${name});`;
        })
      // Handle: export var name = value;
      .replace(/export\s+var\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;\n]+);?/g, 
        (match, name, value) => {
          return `var ${name} = ${value};\n__exportValue('${name}', ${name});`;
        })
      // Handle: export { name1, name2 };
      .replace(/export\s*\{\s*([^}]+)\s*\};?/g, (match, names) => {
        const nameList = names.split(',').map((n: string) => n.trim());
        return nameList.map((name: string) => `__exportValue('${name}', ${name});`).join('\n');
      });

    log.debug('Original code:', code);
    log.debug('Transformed code:', transformedCode);

    return transformedCode;
  }

  /**
   * Create export function for the execution context
   */
  private createExportFunction(exportValues: Map<string, any>, exportedVars: Set<string>) {
    return (name: string, value: any) => {
      exportedVars.add(name); // Track that this variable is exported
      exportValues.set(name, value);
      log.debug(`Exporting variable ${name} with value:`, value);
    };
  }

  /**
   * Set up reactive execution for a code cell
   */
  private setupReactiveExecution(cellId: string, code: string, dependencies: string[]): void {
    // Clear existing subscriptions for this cell
    // Note: In a more complete implementation, we'd track and unsubscribe from previous subscriptions
    
    // Subscribe to all dependencies
    dependencies.forEach(depName => {
      this.reactiveStore.subscribe(depName, () => {
        log.debug(`Dependency ${depName} changed, re-executing code cell ${cellId}`);
        // Re-execute the code cell when dependency changes
        try {
          this.executeCodeCell(cellId, code);
        } catch (error) {
          console.error(`Error re-executing code cell ${cellId}:`, error);
        }
      });
    });
  }

  /**
   * Re-execute a code cell
   */
  public reExecuteCodeCell(cellId: string): string[] {
    const cellInfo = this.executedCells.get(cellId);
    if (!cellInfo) {
      throw new Error(`Code cell ${cellId} has not been executed before`);
    }
    return this.executeCodeCell(cellId, cellInfo.code);
  }

  /**
   * Get exports from a code cell
   */
  public getCellExports(cellId: string): string[] {
    return this.executedCells.get(cellId)?.exports || [];
  }

  /**
   * Get dependencies from a code cell
   */
  public getCellDependencies(cellId: string): string[] {
    return this.executedCells.get(cellId)?.dependencies || [];
  }

  /**
   * Clear a code cell's exports
   */
  public clearCellExports(cellId: string): void {
    const cellInfo = this.executedCells.get(cellId);
    if (cellInfo) {
      // Remove exported reactive values
      cellInfo.exports.forEach(exportName => {
        // Note: We might want to keep the values but mark them as orphaned
        // For now, we'll leave them in the store
      });
      this.executedCells.delete(cellId);
    }
  }
}

// Example usage
export function createReactiveSystem(options: ReactiveFormulaEngineOptions = {}) {
  // Create reactive store
  const reactiveStore = new ReactiveStore();
  
  // Create formula engine
  const formulaEngine = new ReactiveFormulaEngine(reactiveStore, options);
  
  // Create code cell engine
  const codeCellEngine = new CodeCellEngine(reactiveStore);
  
  return {
    reactiveStore,
    formulaEngine,
    codeCellEngine
  };
}
