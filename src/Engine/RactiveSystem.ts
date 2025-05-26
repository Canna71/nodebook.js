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
        this.setValue(newValue, false); // Don't trigger recompute
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
    reactiveValue.subscribe(() => this.get()); // Recompute when dependency changes
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

// Example usage
export function createReactiveSystem(options: ReactiveFormulaEngineOptions = {}) {
  // Create reactive store
  const reactiveStore = new ReactiveStore();
  
  // Create formula engine
  const formulaEngine = new ReactiveFormulaEngine(reactiveStore, options);
  
  return {
    reactiveStore,
    formulaEngine
  };
}
