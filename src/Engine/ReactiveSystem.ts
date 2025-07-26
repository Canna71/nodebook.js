import anylogger from "anylogger";
import { moduleRegistry } from './ModuleRegistry';
import { domHelpers, createBoundDomHelpers } from '@/lib/domHelpers';

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
    private hasBeenComputed: boolean = false;

    constructor(initialValue: T, computeFn: ComputeFn<T> | null = null, dependencies: IReactiveValue<any>[] = []) {
        this.value = initialValue;
        this.computeFn = computeFn;
        this.dependencies = new Set(dependencies);
        this.subscribers = new Set();
        this.hasBeenComputed = computeFn === null; // If no compute function, consider it computed
    }

    /**
     * Get current value, compute if needed
     */
    public get(): T {
        if (this.computeFn && (!this.hasBeenComputed || !this.isComputing)) {
            this.isComputing = true;
            try {
                const newValue = this.computeFn();
                this.setValue(newValue, !this.hasBeenComputed); // Propagate only after first computation
                this.hasBeenComputed = true;
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
        // Handle NaN comparison correctly
        const hasChanged = this.value !== newValue && !(
            // Both values are NaN
            (typeof this.value === 'number' && typeof newValue === 'number' && 
             isNaN(this.value) && isNaN(newValue))
        );

        if (hasChanged) {
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
                log.error('Error in reactive value subscriber:', error);
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
        this.hasBeenComputed = false; // Reset computation state when function changes
        if (computeFn) {
            // Trigger initial computation
            this.get();
        }
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
            } else {
                // Always update the value, even if it's null (important for clearing errors)
                reactiveValue.setValue(value as T);
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

        // Create compute function that handles missing dependencies
        const computeFn = this.createSafeComputeFunction<T>(formula, dependencies);

        // Define reactive value with initial computation
        const reactiveValue = this.reactiveStore.define<T>(
            name,
            null,
            computeFn,
            dependencies
        );

        // Only trigger initial computation if all dependencies exist
        if (this.allDependenciesExist(dependencies)) {
            reactiveValue.get();
        } else {
            log.debug(`Formula "${name}" dependencies not ready, deferring evaluation:`, dependencies);
        }

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
                log.error(`Error evaluating formula "${formula}":`, error);
                throw new FormulaError(`Error evaluating formula: ${error instanceof Error ? error.message : String(error)}`);
            }

        }        
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

    /**
     * Check if all dependencies exist in the reactive store
     */
    private allDependenciesExist(dependencies: string[]): boolean {
        return dependencies.every(dep => this.reactiveStore.get(dep) !== undefined);
    }

    /**
     * Create a safe compute function that handles missing dependencies gracefully
     */
    private createSafeComputeFunction<T>(formula: string, dependencies: string[]): ComputeFn<T> {
        return () => {
            // Check if all dependencies are available
            if (!this.allDependenciesExist(dependencies)) {
                log.debug(`Formula dependencies not yet available:`, dependencies.filter(dep => !this.reactiveStore.get(dep)));
                return null as T; // Return null when dependencies are missing
            }

            // All dependencies exist, proceed with normal evaluation
            return this.createComputeFunction<T>(formula)();
        };
    }
}

/**
 * Storage interface for explicit data persistence
 */
interface NotebookStorageAPI {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    has: (key: string) => boolean;
    delete: (key: string) => boolean;
    keys: () => string[];
    clear: () => void;
}

/**
 * Code cell execution context
 */
interface CodeExecutionContext {
    // Input: access to reactive values
    get: (name: string) => any;
    // Output: export reactive values
    exportValue: (name: string, value: any) => void;
    // Storage: explicit data persistence
    storage: NotebookStorageAPI;
    // Utility functions
    console: Console;
    Math: typeof Math;
    // Node.js modules
    require: (moduleName: string) => any;
    process: typeof process;
    Buffer: typeof Buffer;
    __dirname: string;
    __filename: string;
}

/**
 * Console output capture
 */
interface ConsoleOutput {
    type: 'log' | 'warn' | 'error' | 'info';
    message: string;
    timestamp: Date;
    data?: any; // Store original data for objects
    isObject?: boolean; // Flag to indicate if we should render as object
}

/**
 * Code cell execution engine
 */
export class CodeCellEngine {

    private reactiveStore: ReactiveStore;
    private executedCells: Map<string, {
        code: string;
        exports: string[];
        dependencies: string[];
        lastExportValues: Map<string, any>;
        lastOutput: ConsoleOutput[];
        outputValues: any[];
        executionCount: number;
        lastOutputContainer?: HTMLElement; // Add this to remember the container
        unsubscribeFunctions?: (() => void)[]; // Track unsubscribe functions for cleanup
        lastError?: Error | null; // Track last execution error
    }>;
    private executingCells: Set<string>;
    private moduleCache: Map<string, any>;
    private globalScope: { [key: string]: any };
    private notebookStorage: Map<string, any>; // Internal storage
    private storageChangeHandler?: () => void; // Handler for storage changes
    private currentNotebookPath?: string; // Path to the current notebook file

    /**
     * Initialize only preloaded/injected modules in global scope
     * These are modules that should be available without require()
     */
    private initializePreloadedModules(): void {
        const availableModules = moduleRegistry.getAvailableModules();
        
        // Only inject modules that should be truly global (preloaded)
        const preloadedModules: Record<string, string> = {
            // Scientific libraries that are preloaded
            'danfojs': 'dfd',
            '@tensorflow/tfjs': 'tf',
            'tensorflow': 'tf',
            "plotly.js-dist-min": 'Plotly',
            'mathjs': 'math',
            // Shell scripting - main export as '$'
            'zx': '$',
            // Utility libraries
            'lodash': '_',
            // Data processing libraries
            'papaparse': 'Papa',
            'xlsx': 'XLSX',
            // Node.js built-ins (always available)
            'fs': 'fs',
            'path': 'path',
            'os': 'os',
            'crypto': 'crypto',
            'util': 'util',
            'url': 'url',
            'querystring': 'querystring',
            'zlib': 'zlib',
            'stream': 'stream',
            'buffer': 'Buffer',
            'events': 'EventEmitter',
            'readline': 'readline', 
            'worker_threads': 'worker_threads',
            'child_process': 'child_process',
            'string_decoder': 'StringDecoder',
            'timers': 'timers',
            'async_hooks': 'async_hooks',
            'assert': 'assert',
            'constants': 'constants'
        };
        
        // Only inject truly preloaded modules into global scope
        for (const moduleName of availableModules) {
            if (preloadedModules[moduleName]) {
                try {
                    const moduleExports = moduleRegistry.getModule(moduleName);
                    const variableName = preloadedModules[moduleName];
                    
                    this.globalScope[variableName] = moduleExports;
                    
                    // Special handling for Buffer constructor
                    if (moduleName === 'buffer') {
                        this.globalScope['Buffer'] = moduleExports.Buffer;
                    }
                    
                    // Special handling for EventEmitter constructor
                    if (moduleName === 'events') {
                        this.globalScope['EventEmitter'] = moduleExports.EventEmitter;
                    }
                    
                    // Special handling for zx - inject all globals
                    if (moduleName === 'zx') {
                        // Inject ALL zx globals into the global scope
                        const zxGlobals = [
                            // Core shell execution
                            '$', 
                            // Directory and process control
                            'cd', 'within',
                            // Input/Output
                            'question', 'echo', 'stdin',
                            // Timing
                            'sleep',
                            // File system and utilities (avoid conflicts with Node.js built-ins)
                            'glob', 'which', 'minimist', 'argv',
                            // Styling and formatting
                            'chalk',
                            // Data formats
                            'YAML', 'fetch',
                            // Retry mechanism
                            'retry',
                            // CLI spinner
                            'spinner',
                            // Process management
                            'ps', 'kill', 'tmpdir', 'tmpfile',
                            // Environment
                            'dotenv',
                            // Quoting functions
                            'quote', 'quotePowerShell',
                            // Shell configuration  
                            'useBash', 'usePowerShell', 'usePwsh',
                            // Process synchronization
                            'syncProcessCwd'
                        ];
                        
                        zxGlobals.forEach(globalName => {
                            if (moduleExports[globalName] !== undefined) {
                                this.globalScope[globalName] = moduleExports[globalName];
                                log.debug(`Injected zx global: ${globalName}`);
                            } else {
                                log.warn(`zx global ${globalName} not found in module exports`);
                            }
                        });
                        
                        // Also inject the entire zx module itself
                        this.globalScope['zx'] = moduleExports;
                    }
                    
                    log.debug(`Injected preloaded module ${moduleName} as ${variableName}`);
                } catch (error) {
                    log.warn(`Failed to inject preloaded module ${moduleName}:`, error);
                }
            }
        }
    }

    constructor(reactiveStore: ReactiveStore) {
        this.reactiveStore = reactiveStore;
        this.executedCells = new Map();
        this.executingCells = new Set();
        this.moduleCache = new Map();
        this.notebookStorage = new Map(); // Initialize storage
        this.globalScope = {
            // Add basic DOM helpers to global scope (non-auto-outputting versions)
            ...domHelpers
        };
        
        // Initialize only preloaded modules in global scope
        this.initializePreloadedModules();
    }



    /**
     * Register a module for use in code cells
     * Only preloaded modules are injected into global scope automatically
     * 
     * NOTE: Currently unused infrastructure for future extensibility
     */
    // public registerModule(name: string, moduleExports: any): void {
    //     moduleRegistry.registerModule(name, moduleExports);
    //     this.moduleCache.set(name, moduleExports);
    //     
    //     // Only inject preloaded modules into global scope
    //     const preloadedModules = ['danfojs', '@tensorflow/tfjs', 'tensorflow', 'plotly.js-dist-min'];
    //     if (preloadedModules.includes(name)) {
    //         const globalName = name === 'danfojs' ? 'dfd' : name === '@tensorflow/tfjs' || name === 'tensorflow' ? 'tf' : name;
    //         this.globalScope[globalName] = moduleExports;
    //         log.debug(`Registered and injected preloaded module ${name} as ${globalName}`);
    //     } else {
    //         log.debug(`Registered module ${name} (require-only)`);
    //     }
    // }

    /**
     * Update the stored code for a cell (internal tracking only)
     * Note: This does not update the notebook model - use ApplicationProvider for that
     */
    updateCodeCell(id: string, newCode: string) {
        const cellInfo = this.executedCells.get(id);
        if (cellInfo) {
            log.debug(`Updating code cell ${id} internal code (${newCode.length} chars)`);
            cellInfo.code = newCode;
        } else {
            // Create new cell info if it doesn't exist
            log.debug(`Creating new code cell info for ${id} with code (${newCode.length} chars)`);
            this.executedCells.set(id, {
                code: newCode,
                exports: [],
                dependencies: [],
                lastExportValues: new Map(),
                lastOutput: [],
                outputValues: [],
                executionCount: 0,
                unsubscribeFunctions: [],
                lastError: null
            });
            
            // Initialize reactive values for the cell
            this.reactiveStore.define(`__cell_${id}_execution`, 0);
            this.reactiveStore.define(`__cell_${id}_error`, null);
            this.reactiveStore.define(`__cell_${id}_state`, 'idle');
        }
    }

    /**
     * Get the current code for a cell (as stored in the engine)
     */
    getCurrentCode(cellId: string): string | undefined {
        return this.executedCells.get(cellId)?.code;
    }

    /**
     * Clean up all subscriptions for a cell (useful when deleting cells)
     */
    public cleanupCell(cellId: string): void {
        const cellInfo = this.executedCells.get(cellId);
        if (cellInfo?.unsubscribeFunctions) {
            log.debug(`Cleaning up all subscriptions for deleted cell ${cellId}`);
            cellInfo.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
            this.executedCells.delete(cellId);
        }
    }
    /**
     * Create a secure require function for code cells with Electron support
     */
    private createSecureRequire(): (moduleName: string) => any {
        return (moduleName: string) => {
            // Check local cache first
            if (this.moduleCache.has(moduleName)) {
                log.debug(`Loading cached module: ${moduleName}`);
                return this.moduleCache.get(moduleName);
            }

            try {
                // Use module registry (which uses Node.js require in Electron)
                const moduleExports = moduleRegistry.requireSync(moduleName);
                this.moduleCache.set(moduleName, moduleExports);
                log.debug(`Loaded module from registry: ${moduleName}`);
                return moduleExports;
            } catch (error) {
                log.error(`Failed to load module '${moduleName}':`, error);
                throw new Error(`Module '${moduleName}' is not available. Available modules: ${moduleRegistry.getAvailableModules().join(', ')}`);
            }
        };
    }

    /**
     * Create a wrapped console that captures output
     */
    private createWrappedConsole(): { console: Console; getOutput: () => ConsoleOutput[] } {
        const output: ConsoleOutput[] = [];

        const captureOutput = (type: ConsoleOutput['type']) => (...args: any[]) => {
            // Call the real console for debugging in browser dev tools
            (console as any)[type](...args);
            
            // Trigger global console capture if available
            // This allows the global console viewer to capture output from code cells
            if ((window as any).__globalConsoleCapture) {
                (window as any).__globalConsoleCapture(type, args);
            }
            
            // No longer store console output at cell level - it goes to global ConsoleViewer
        };

        const wrappedConsole = {
            log: captureOutput('log'),
            warn: captureOutput('warn'),
            error: captureOutput('error'),
            info: captureOutput('info'),
            // Pass through other console methods
            debug: console.debug.bind(console),
            trace: console.trace.bind(console),
            table: console.table.bind(console),
            group: console.group.bind(console),
            groupEnd: console.groupEnd.bind(console),
            clear: console.clear.bind(console),
            time: console.time.bind(console),
            timeEnd: console.timeEnd.bind(console),
            count: console.count.bind(console),
            assert: console.assert.bind(console)
        } as Console;

        return {
            console: wrappedConsole,
            getOutput: () => [...output] // Return copy
        };
    }

    /**
     * Execute code cell and handle exports (async version)
     */
    public async executeCodeCell(cellId: string, code: string, outputContainer?: HTMLElement, isStatic: boolean = false): Promise<string[]> {
        // Prevent circular execution
        if (this.executingCells.has(cellId)) {
            log.debug(`Code cell ${cellId} is already executing, skipping to prevent circular reference`);
            return this.executedCells.get(cellId)?.exports || [];
        }

        // Set execution state to 'running'
        this.reactiveStore.define(`__cell_${cellId}_state`, 'running');
        this.executingCells.add(cellId);
        
        // Clear all previous outputs to ensure clean state
        const containerId = `${cellId}-outEl`;
        const domContainer = document.getElementById(containerId);
        if (domContainer) {
            domContainer.innerHTML = '';
            log.debug(`Cleared DOM output container ${containerId} for cell ${cellId}`);
        }
        
        // Clear any previous output values and console output from the cell
        const previousCellInfo = this.executedCells.get(cellId);
        if (previousCellInfo) {
            previousCellInfo.outputValues = [];
            previousCellInfo.lastOutput = [];
            log.debug(`Cleared previous output values and console output for cell ${cellId}`);
        }
     
        
        const dependencies = new Set<string>();
        const exportedVars = new Set<string>();

        // Create wrapped console for this execution
        const { console: wrappedConsole, getOutput } = this.createWrappedConsole();

        try {
            // Create exports object for reactive exports
            const exports: Record<string, any> = {};

            // Store for output values capture
            const outputValues: any[] = [];

            // Create a smart proxy that handles both reading and writing
            const createSmartProxy = () => {
                const localScope: { [key: string]: any } = {};

                return new Proxy(localScope, {
                    get: (target, prop) => {
                        if (typeof prop === 'string') {
                            // Special handling for built-in functions
                            if (prop === 'console') return wrappedConsole;
                            if (prop === 'Math') return Math;
                            if (prop === 'exports') return exports;
                            if (prop === 'storage') return this.createStorageAPI();

                            // Generic DOM output container (Scenario 2)
                            if (prop === 'outEl') {
                                // Use predictable ID instead of passed container to avoid timing issues
                                const containerId = `${cellId}-outEl`;
                                const container = document.getElementById(containerId);
                                if (container) {
                                    log.debug(`outEl accessed in cell ${cellId} - container found by ID: ${containerId}`);
                                    return container;
                                } else {
                                    log.warn(`outEl accessed in cell ${cellId} - container not found with ID: ${containerId}`);
                                    return null;
                                }
                            }

                            // Enhanced output function (Scenario 1)
                            if (prop === 'output') {
                                const outputFunction = (...values: any[]) => {
                                    values.forEach(value => {
                                        // Check if value is a DOM element
                                        if (value instanceof HTMLElement) {
                                            // Use predictable ID instead of passed container to avoid timing issues
                                            const containerId = `${cellId}-outEl`;
                                            const container = document.getElementById(containerId);
                                            if (container) {
                                                container.appendChild(value);
                                                log.debug(`DOM element output to container ${containerId} for cell ${cellId}`);
                                            } else {
                                                log.warn(`DOM element output attempted but container not found with ID: ${containerId} for cell ${cellId}`);
                                            }
                                        } else {
                                            // Handle as regular output value
                                            outputValues.push(value);
                                        }
                                    });
                                    return values.length === 1 ? values[0] : values;
                                };

                                // Add table method to output function
                                outputFunction.table = (data: any[]) => {
                                    // Mark the data with a special flag to force tabular rendering
                                    const tabularData = {
                                        __isTabularOutput: true,
                                        data: data
                                    };
                                    outputValues.push(tabularData);
                                    return tabularData;
                                };

                                return outputFunction;
                            }

                            // Node.js globals
                            if (prop === 'require') return this.createSecureRequire();
                            if (prop === 'process' && typeof process !== 'undefined') return process;
                            if (prop === 'Buffer' && typeof Buffer !== 'undefined') return Buffer;
                            if (prop === '__dirname') return this.getWorkingDirectory();
                            if (prop === '__filename') return `${cellId}.js`;

                            // Check for DOM helper functions that need output binding
                            if (prop === 'createContainer') {
                                // Create bound version with output function that finds container by ID
                                const outputFn = (...values: any[]) => {
                                    values.forEach(value => {
                                        if (value instanceof HTMLElement) {
                                            // Use predictable ID instead of passed container to avoid timing issues
                                            const containerId = `${cellId}-outEl`;
                                            const container = document.getElementById(containerId);
                                            if (container) {
                                                container.appendChild(value);
                                                log.debug(`DOM element auto-output to container ${containerId} for cell ${cellId}:`, value.tagName, value.id);
                                            } else {
                                                log.warn(`DOM element auto-output attempted but container not found with ID: ${containerId} for cell ${cellId}`);
                                            }
                                        } else {
                                            outputValues.push(value);
                                        }
                                    });
                                };
                                
                                const boundHelpers = createBoundDomHelpers(outputFn);
                                log.debug(`Creating bound DOM helper ${prop} for cell ${cellId}, will use container ID: ${cellId}-outEl`);
                                return boundHelpers[prop as keyof typeof boundHelpers];
                            }

                            // Check global scope first (for cached modules and globals)
                            if (prop in this.globalScope) {
                                log.debug(`Loading from global scope: ${prop}`);
                                return this.globalScope[prop];
                            }

                            // Check module cache directly (fallback for module names)
                            if (this.moduleCache.has(prop)) {
                                log.debug(`Loading cached module directly: ${prop}`);
                                const cachedModule = this.moduleCache.get(prop);
                                // Store in global scope for next time
                                this.globalScope[prop] = cachedModule;
                                return cachedModule;
                            }

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

                            // Also store in global scope for persistence across cells
                            this.globalScope[prop] = value;

                            return true;
                        }
                        return false;
                    },

                    has: (target, prop) => {
                        // Variable exists if it's in local scope, global scope, or reactive store
                        return typeof prop === 'string' && (
                            prop in target ||
                            prop in this.globalScope ||
                            this.reactiveStore.get(prop) !== undefined ||
                            ['console', 'Math', 'exports', 'storage', 'require', 'process', 'Buffer', '__dirname', '__filename', 'output', 'outEl'].includes(prop)
                        );
                    }
                });
            };

            // Create an async function that can handle await in user code
            const executeCode = new Function(
                'scope',
                `
        return (async function() {
            with (scope) {
                ${code}
            }
        })();
        `
            );

            // Execute the code with the smart proxy (now returns a Promise)
            const smartProxy = createSmartProxy();
            
            // Change the process working directory to the notebook directory if available
            let originalCwd: string | undefined;
            const workingDir = this.getWorkingDirectory();
            const currentCwd = process.cwd();
            const hasNotebookPath = this.currentNotebookPath || (typeof window !== 'undefined' && (window as any).__notebookCurrentPath);
            log.debug(`Working directory check: notebookPath=${this.currentNotebookPath}, workingDir=${workingDir}, currentCwd=${currentCwd}, globalPath=${typeof window !== 'undefined' ? (window as any).__notebookCurrentPath : 'N/A'}, hasNotebook=${!!hasNotebookPath}`);
            
            if (hasNotebookPath && workingDir !== currentCwd) {
                try {
                    originalCwd = currentCwd;
                    process.chdir(workingDir);
                    log.debug(`Changed working directory to: ${workingDir} (was: ${originalCwd})`);
                } catch (error) {
                    log.warn(`Failed to change working directory to ${workingDir}:`, error);
                    originalCwd = undefined; // Don't restore if we failed to change
                }
            } else {
                log.debug(`Skipping working directory change: hasNotebook=${!!hasNotebookPath}, same directory=${workingDir === currentCwd}`);
            }
            
            try {
                await executeCode(smartProxy);
            } finally {
                // Always restore the original working directory
                if (originalCwd) {
                    try {
                        process.chdir(originalCwd);
                        log.debug(`Restored working directory to: ${originalCwd}`);
                    } catch (error) {
                        log.warn(`Failed to restore working directory to ${originalCwd}:`, error);
                    }
                }
            }

            // Collect exports from the exports object
            const exportValues = new Map<string, any>();
            Object.keys(exports).forEach(varName => {
                exportValues.set(varName, exports[varName]);
                exportedVars.add(varName);
                log.debug(`Exported variable ${varName} with value:`, exports[varName]);
            });

            // Capture console output
            const lastOutput = getOutput();

            // Convert Set to Array for the return value and storage
            const exportsArray = Array.from(exportedVars);

            // Check if exports have actually changed
            const previousCellInfo = this.executedCells.get(cellId);
            const lastExportValues = previousCellInfo?.lastExportValues || new Map();
            let hasChanges = false;

            // Compare with previous export values - handle objects properly
            for (const [name, value] of exportValues) {
                if (!lastExportValues.has(name)) {
                    // New export
                    hasChanges = true;
                    break;
                } else {
                    const lastValue = lastExportValues.get(name);
                    // For objects, always consider them changed (since they often contain timestamps, random values, etc.)
                    // For primitives, do strict comparison
                    if (typeof value === 'object' && value !== null) {
                        // Objects are considered changed (common in async results)
                        hasChanges = true;
                        break;
                    } else if (lastValue !== value) {
                        // Primitive values - strict comparison
                        hasChanges = true;
                        break;
                    }
                }
            }

            // Update reactive values if there are actual changes (static cells can still export)
            if (hasChanges || !previousCellInfo) {
                exportValues.forEach((value, name) => {
                    this.reactiveStore.define(name, value);
                });
                log.debug(`Code cell ${cellId} exported changed values:`, Array.from(exportValues.entries()));
            } else {
                log.debug(`Code cell ${cellId} exports unchanged, skipping reactive value updates`);
            }

            // Store execution info including execution count and container
            const dependencyArray = Array.from(dependencies);
            const executionCount = (previousCellInfo?.executionCount || 0) + 1;

            this.executedCells.set(cellId, {
                code,
                exports: exportsArray,
                dependencies: dependencyArray,
                lastExportValues: new Map(exportValues),
                lastOutput,
                outputValues: [...outputValues],
                executionCount,
                lastOutputContainer: outputContainer, // Store the container for reactive execution
                unsubscribeFunctions: previousCellInfo?.unsubscribeFunctions || [], // Preserve existing subscriptions
                lastError: null // Clear any previous error on successful execution
            });

            // Create reactive values for this cell's execution state
            this.reactiveStore.define(`__cell_${cellId}_execution`, executionCount);
            this.reactiveStore.define(`__cell_${cellId}_error`, null); // Clear error on success
            this.reactiveStore.define(`__cell_${cellId}_state`, 'idle'); // Set state back to idle
            log.debug(`Code cell ${cellId} executed successfully - error cleared`);

            // Set up reactive execution for dependencies (only if not static and not already set up)
            if (!isStatic && (!previousCellInfo || JSON.stringify(previousCellInfo.dependencies) !== JSON.stringify(dependencyArray))) {
                this.setupReactiveExecution(cellId, code, dependencyArray);
            } else if (isStatic) {
                log.debug(`Code cell ${cellId} is static, skipping reactive execution setup`);
            }

            log.debug(`Code cell ${cellId} executed successfully, exported:`, exportsArray, 'dependencies:', dependencyArray, 'output lines:', lastOutput.length, 'output values:', outputValues);
            return exportsArray;

        } catch (error) {
            // Use wrapped console to capture error with full details (this will go to ConsoleViewer)
            const consoleErrorObj = error instanceof Error ? error : new Error(String(error));
            wrappedConsole.error(`Execution Error in cell ${cellId}:`, consoleErrorObj);
            
            // Capture any final console output after the error
            const lastOutput = getOutput();

            // Store error state
            const exportsArray = Array.from(exportedVars);
            const dependencyArray = Array.from(dependencies);
            const exportValues = new Map<string, any>();
            const previousCellInfo = this.executedCells.get(cellId);
            const executionCount = (previousCellInfo?.executionCount || 0) + 1;

            // Store error in cell info
            const errorObj = error instanceof Error ? error : new Error(String(error));
            
            this.executedCells.set(cellId, {
                code,
                exports: exportsArray,
                dependencies: dependencyArray,
                lastExportValues: exportValues,
                lastOutput,
                outputValues: [], // Empty output values on error
                executionCount,
                lastOutputContainer: outputContainer, // Store container even on error
                unsubscribeFunctions: previousCellInfo?.unsubscribeFunctions || [], // Preserve existing subscriptions
                lastError: errorObj // Store the error
            });

            // Create reactive values for this cell's execution and error state
            this.reactiveStore.define(`__cell_${cellId}_execution`, executionCount);
            this.reactiveStore.define(`__cell_${cellId}_error`, errorObj);
            this.reactiveStore.define(`__cell_${cellId}_state`, 'idle'); // Set state back to idle even on error
            log.debug(`Code cell ${cellId} error stored in reactive system:`, errorObj.message);

            log.error(`Error executing code cell ${cellId}:`, error);
            throw new Error(`Code execution error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.executingCells.delete(cellId);
        }
    }

    /**
     * Set up reactive execution for a code cell
     */
    private setupReactiveExecution(cellId: string, code: string, dependencies: string[]): void {
        // Clean up previous subscriptions if they exist
        const cellInfo = this.executedCells.get(cellId);
        if (cellInfo?.unsubscribeFunctions) {
            log.debug(`Cleaning up ${cellInfo.unsubscribeFunctions.length} old subscriptions for cell ${cellId}`);
            cellInfo.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
            cellInfo.unsubscribeFunctions = [];
        }

        // Set up new subscriptions and track unsubscribe functions
        const unsubscribeFunctions: (() => void)[] = [];
        
        // Subscribe to all dependencies
        dependencies.forEach(depName => {
            const unsubscribe = this.reactiveStore.subscribe(depName, async () => {
                log.debug(`Dependency ${depName} changed, re-executing code cell ${cellId}`);
                // Re-execute the code cell when dependency changes
                try {
                    // Get the current cell info
                    const cellInfo = this.executedCells.get(cellId);
                    if (!cellInfo) {
                        log.warn(`No cell info found for ${cellId}, skipping reactive execution`);
                        return;
                    }
                    
                    const lastContainer = cellInfo.lastOutputContainer;
                    // Use the committed/saved code only (not unsaved edits)
                    const savedCode = cellInfo.code;
                    
                    log.debug(`Re-executing code cell ${cellId} with saved code (${savedCode.length} chars)`);
                    
                    // Clear previous DOM output using predictable ID
                    const containerId = `${cellId}-outEl`;
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = '';
                    }
                    
                    // Re-execute with the saved code (reactive execution always uses isStatic=false)
                    await this.executeCodeCell(cellId, savedCode, container, false);
                } catch (error) {
                    log.error(`Error re-executing code cell ${cellId}:`, error);
                }
            });
            
            unsubscribeFunctions.push(unsubscribe);
        });

        // Store the unsubscribe functions in the cell info
        if (cellInfo) {
            cellInfo.unsubscribeFunctions = unsubscribeFunctions;
            log.debug(`Set up ${unsubscribeFunctions.length} new subscriptions for cell ${cellId} with dependencies:`, dependencies);
        }
    }

    /**
     * Re-execute a code cell
     */
    public async reExecuteCodeCell(cellId: string, isStatic: boolean = false): Promise<string[]> {
        const cellInfo = this.executedCells.get(cellId);
        if (!cellInfo) {
            throw new Error(`Code cell ${cellId} has not been executed before`);
        }
        
        // Get the last used container from cell info
        const lastContainer = cellInfo.lastOutputContainer;
        
        // Clear previous DOM output using predictable ID
        const containerId = `${cellId}-outEl`;
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
        
        // Re-execute with the same container found by ID
        return await this.executeCodeCell(cellId, cellInfo.code, container, isStatic);
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
     * Get execution count for a cell (for UI updates)
     */
    public getCellExecutionCount(cellId: string): number {
        return this.executedCells.get(cellId)?.executionCount || 0;
    }

    /**
     * Get output values from a code cell
     */
    public getCellOutputValues(cellId: string): any[] {
        return this.executedCells.get(cellId)?.outputValues || [];
    }

    /**
     * Get last error from a code cell
     */
    public getCellError(cellId: string): Error | null {
        return this.executedCells.get(cellId)?.lastError || null;
    }

    /**
     * Get return value from a code cell (for backward compatibility)
     */
    public getCellReturnValue(cellId: string): any {
        const outputValues = this.getCellOutputValues(cellId);
        return outputValues.length === 1 ? outputValues[0] : outputValues.length > 1 ? outputValues : undefined;
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

    /**
     * Get last console output from a code cell
     */
    public getCellOutput(cellId: string): ConsoleOutput[] {
        return this.executedCells.get(cellId)?.lastOutput || [];
    }

    /**
     * Get formatted output as string for display
     */
    public getCellOutputText(cellId: string): string {
        const output = this.getCellOutput(cellId);
        if (output.length === 0) return '';

        return output.map(line => {
            const timestamp = line.timestamp.toLocaleTimeString();
            const prefix = line.type === 'log' ? '' : `[${line.type.toUpperCase()}] `;
            return `${prefix}${line.message}`;
        }).join('\n');
    }

    /**
     * Clear module cache (useful for development/testing)
     */
    public clearModuleCache(): void {
        this.moduleCache.clear();
        moduleRegistry.clearCache();
        log.debug('Module cache cleared');
    }

    /**
     * Clear global scope (reset persistent variables)
     */
    public clearGlobalScope(): void {
        this.globalScope = {
            // Add basic DOM helpers to global scope (non-auto-outputting versions)
            ...domHelpers
        };
        
        // Re-initialize preloaded modules only
        this.initializePreloadedModules();
        log.debug('Global scope cleared and modules reinitialized');
    }

    /**
     * Get cached modules
     */
    public getCachedModules(): string[] {
        return Array.from(this.moduleCache.keys());
    }

    /**
     * Get global scope variables
     */
    public getGlobalVariables(): string[] {
        return Object.keys(this.globalScope);
    }

    /**
     * Pre-load modules synchronously
     */
    public preloadModules(moduleNames: string[]): { loaded: string[], failed: string[] } {
        const results = moduleRegistry.preloadModules(moduleNames);

        // Cache successfully loaded modules
        results.loaded.forEach(moduleName => {
            try {
                const moduleExports = moduleRegistry.requireSync(moduleName);
                this.moduleCache.set(moduleName, moduleExports);
                this.globalScope[moduleName] = moduleExports;
            } catch (error) {
                log.warn(`Failed to cache pre-loaded module ${moduleName}:`, error);
            }
        });

        return results;
    }

    /**
     * Evaluate code in a cell's context and return the result
     * Used for runtime introspection and completions
     * This method is designed to be safe for live evaluation while typing,
     * so errors are returned as part of the result instead of being thrown
     */
    public async evaluateInCellContext(cellId: string, code: string): Promise<{ success: boolean; result?: any; error?: string }> {
        try {
            // Prevent circular execution
            if (this.executingCells.has(cellId)) {
                return { success: false, error: `Cell ${cellId} is currently executing` };
            }

            // Create a temporary execution context similar to executeCodeCell
            const { console: wrappedConsole } = this.createWrappedConsole();
            
            // Create a smart proxy for variable access (similar to executeCodeCell)
            const localScope: { [key: string]: any } = {};
            const smartProxy = new Proxy(localScope, {
                get: (target, prop) => {
                    if (typeof prop === 'string') {
                        // Special handling for built-in functions
                        if (prop === 'console') return wrappedConsole;
                        if (prop === 'Math') return Math;

                        // Node.js globals
                        if (prop === 'require') return this.createSecureRequire();
                        if (prop === 'process' && typeof process !== 'undefined') return process;
                        if (prop === 'Buffer' && typeof Buffer !== 'undefined') return Buffer;
                        if (prop === '__dirname') return this.getWorkingDirectory();
                        if (prop === '__filename') return `${cellId}.js`;

                        // Check global scope first (for cached modules and globals)
                        if (prop in this.globalScope) {
                            return this.globalScope[prop];
                        }

                        // Check module cache directly
                        if (this.moduleCache.has(prop)) {
                            const cachedModule = this.moduleCache.get(prop);
                            this.globalScope[prop] = cachedModule;
                            return cachedModule;
                        }

                        // If variable exists in local scope, return it
                        if (prop in target) {
                            return target[prop];
                        }

                        // Get from reactive store (don't track dependencies for evaluation)
                        const value = this.reactiveStore.getValue(prop);
                        return value;
                    }
                    return undefined;
                },

                set: (target, prop, value) => {
                    if (typeof prop === 'string') {
                        target[prop] = value;
                        return true;
                    }
                    return false;
                },

                has: (target, prop) => {
                    return typeof prop === 'string' && (
                        prop in target ||
                        prop in this.globalScope ||
                        this.reactiveStore.get(prop) !== undefined ||
                        ['console', 'Math', 'require', 'process', 'Buffer', '__dirname', '__filename'].includes(prop)
                    );
                }
            });

            // Wrap the code in an async immediately-executed function that returns the result
            const wrappedCode = `(async function() { ${code} })()`;
            
            const executeCode = new Function('scope', `with (scope) { return ${wrappedCode}; }`);
            
            // Change working directory temporarily for evaluation too
            let originalCwd: string | undefined;
            const workingDir = this.getWorkingDirectory();
            const currentCwd = process.cwd();
            const hasNotebookPath = this.currentNotebookPath || (typeof window !== 'undefined' && (window as any).__notebookCurrentPath);
            
            if (hasNotebookPath && workingDir !== currentCwd) {
                try {
                    originalCwd = currentCwd;
                    process.chdir(workingDir);
                } catch (error) {
                    // Silently fail - this is just for convenience
                    originalCwd = undefined;
                }
            }
            
            try {
                // Execute and return the result (now awaits the async execution)
                const result = await executeCode(smartProxy);
                return { success: true, result };
            } finally {
                // Restore original working directory
                if (originalCwd) {
                    try {
                        process.chdir(originalCwd);
                    } catch (error) {
                        // Silently fail - this is just cleanup
                    }
                }
            }

        } catch (error) {
            // Don't log errors for live evaluation - they are expected while typing
            return { 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
            };
        }
    }

    /**
     * Get available modules
     */
    public getAvailableModules(): string[] {
        return moduleRegistry.getAvailableModules();
    }

    /**
     * Check if a module is available
     */
    public hasModule(name: string): boolean {
        return moduleRegistry.hasModule(name);
    }

    /**
     * Get the reactive store (for internal use by other engines)
     */
    public getReactiveStore(): ReactiveStore {
        return this.reactiveStore;
    }

    /**
     * Create storage API for code cells
     */
    private createStorageAPI(): NotebookStorageAPI {
        return {
            get: (key: string) => {
                return this.notebookStorage.get(key);
            },
            set: (key: string, value: any) => {
                this.notebookStorage.set(key, value);
                log.debug(`Storage set: ${key}`);
                // Call storage change handler if defined
                if (this.storageChangeHandler) {
                    this.storageChangeHandler();
                }
            },
            has: (key: string) => {
                return this.notebookStorage.has(key);
            },
            delete: (key: string) => {
                const result = this.notebookStorage.delete(key);
                if (result) log.debug(`Storage deleted: ${key}`);
                // Call storage change handler if defined
                if (this.storageChangeHandler) {
                    this.storageChangeHandler();
                }
                return result;
            },
            keys: () => {
                return Array.from(this.notebookStorage.keys());
            },
            clear: () => {
                this.notebookStorage.clear();
                log.debug('Storage cleared');
                // Call storage change handler if defined
                if (this.storageChangeHandler) {
                    this.storageChangeHandler();
                }
            }
        };
    }

    /**
     * Load storage data from notebook model
     */
    public loadStorageFromNotebook(storage: { [key: string]: any } = {}): void {
        this.notebookStorage.clear();
        Object.entries(storage).forEach(([key, value]) => {
            this.notebookStorage.set(key, value);
        });
        log.debug(`Loaded ${Object.keys(storage).length} storage entries from notebook`);
    }

    /**
     * Export storage data for notebook saving
     */
    public exportStorageToNotebook(): { [key: string]: any } {
        const storage: { [key: string]: any } = {};
        this.notebookStorage.forEach((value, key) => {
            storage[key] = value;
        });
        return storage;
    }

    // Public methods to access storage from components
    getStorageValue(key: string): any {
        return this.notebookStorage.get(key);
    }

    hasStorageKey(key: string): boolean {
        return this.notebookStorage.has(key);
    }

    getStorageKeys(): string[] {
        return Array.from(this.notebookStorage.keys());
    }

    /**
     * Set the storage change handler
     */
    public setStorageChangeHandler(handler: (() => void) | undefined): void {
        this.storageChangeHandler = handler;
        log.debug('Storage change handler set:', !!handler);
    }

    /**
     * Set the current notebook file path (used for working directory in code cells)
     */
    public setCurrentNotebookPath(notebookPath: string | null): void {
        this.currentNotebookPath = notebookPath || undefined;
        const workingDir = this.getWorkingDirectory();
        log.debug(`Current notebook path set to: ${this.currentNotebookPath}, working directory: ${workingDir}`);
    }

    /**
     * Get the working directory for code cells (notebook directory or cwd)
     * Try to get the current notebook path dynamically if not set
     */
    private getWorkingDirectory(): string {
        if (this.currentNotebookPath) {
            // Get the directory containing the notebook file
            const path = require('path');
            return path.dirname(this.currentNotebookPath);
        }
        
        // If notebook path is not set, try to get it from the global application state
        // This is a fallback for timing issues during initialization
        try {
            // Check if we're in a browser environment with access to global state
            if (typeof window !== 'undefined' && (window as any).__notebookCurrentPath) {
                const globalNotebookPath = (window as any).__notebookCurrentPath;
                if (globalNotebookPath) {
                    const path = require('path');
                    log.debug(`Using global notebook path from window: ${globalNotebookPath}`);
                    return path.dirname(globalNotebookPath);
                }
            }
        } catch (error) {
            log.debug('Failed to get notebook path from global state:', error);
        }
        
        // Fallback to current working directory
        return process?.cwd() || '/';
    }
}

/**
 * Enhanced Formula Engine that reuses CodeCellEngine for robust execution
 * This provides better dependency tracking and supports full JavaScript expressions
 */
export class FormulaEngine {
    private codeCellEngine: CodeCellEngine;
    private formulaMap: Map<string, string>;
    private formulaCellIds: Map<string, string>; // variableName -> cellId mapping

    constructor(codeCellEngine: CodeCellEngine) {
        this.codeCellEngine = codeCellEngine;
        this.formulaMap = new Map();
        this.formulaCellIds = new Map();
    }

    /**
     * Convert legacy $variable syntax to natural JavaScript syntax
     */
    private convertLegacySyntax(formula: string): string {
        // Replace $variableName with direct variable references
        return formula.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1');
    }





    /**
     * Create or update a formula that executes as a code cell
     */
    public async createFormula(variableName: string, formula: string): Promise<FormulaInfo> {
        // Store the original formula
        this.formulaMap.set(variableName, formula);

        // Generate a unique cell ID for this formula
        const cellId = `__formula_${variableName}`;
        this.formulaCellIds.set(variableName, cellId);

        // Convert legacy $variable syntax to natural JavaScript
        const convertedFormula = this.convertLegacySyntax(formula);

        // Wrap the formula in an IIFE that automatically exports the result
        // This allows natural JavaScript expressions without manual return statements
        const wrappedCode = `
// Formula: ${formula}
// Converted: ${convertedFormula}
const __result = (() => {
    try {
        return ${convertedFormula};
    } catch (error) {
        console.error('Formula execution error for "${variableName}":', error.message);
        return null; // Return null on error instead of throwing
    }
})();

// Export the result as the variable name
exports.${variableName} = __result;
`;

        // Execute using the code cell engine - it will handle dependency tracking automatically
        // Formulas are always reactive (isStatic=false)
        try {
            const exports = await this.codeCellEngine.executeCodeCell(cellId, wrappedCode, undefined, false);
            log.debug(`Formula "${variableName}" executed successfully:`, exports);
            
            // Get dependencies from the executed cell (tracked by the proxy)
            const dependencies = this.codeCellEngine.getCellDependencies(cellId);
            
            return {
                name: variableName,
                formula,
                dependencies
            };
        } catch (error) {
            log.warn(`Error executing formula "${variableName}":`, error);
            
            // Return info with empty dependencies on error
            return {
                name: variableName,
                formula,
                dependencies: []
            };
        }
    }



    /**
     * Update an existing formula
     */
    public async updateFormula(variableName: string, formula: string): Promise<FormulaInfo> {
        return await this.createFormula(variableName, formula);
    }

    /**
     * Get the original formula string
     */
    public getFormula(variableName: string): string | undefined {
        return this.formulaMap.get(variableName);
    }

    /**
     * Get all formulas
     */
    public getAllFormulas(): { [key: string]: string } {
        return Object.fromEntries(this.formulaMap);
    }

    /**
     * Get formula dependencies (automatically tracked by code cell engine)
     */
    public getFormulaDependencies(variableName: string): string[] {
        const cellId = this.formulaCellIds.get(variableName);
        return cellId ? this.codeCellEngine.getCellDependencies(cellId) : [];
    }

    /**
     * Get formula exports (should always be the variable name)
     */
    public getFormulaExports(variableName: string): string[] {
        const cellId = this.formulaCellIds.get(variableName);
        return cellId ? this.codeCellEngine.getCellExports(cellId) : [];
    }

    /**
     * Get formula execution count
     */
    public getFormulaExecutionCount(variableName: string): number {
        const cellId = this.formulaCellIds.get(variableName);
        return cellId ? this.codeCellEngine.getCellExecutionCount(cellId) : 0;
    }

    /**
     * Clear a formula
     */
    public clearFormula(variableName: string): void {
        const cellId = this.formulaCellIds.get(variableName);
        if (cellId) {
            this.codeCellEngine.clearCellExports(cellId);
        }
        this.formulaMap.delete(variableName);
        this.formulaCellIds.delete(variableName);
    }

    /**
     * Check if formula is valid (can be parsed and executed)
     */
    public validateFormula(formula: string): { valid: boolean; error?: string } {
        try {
            // Try to parse the formula by wrapping it in an IIFE
            new Function(`return (() => { ${formula} })`);
            return { valid: true };
        } catch (error) {
            return { 
                valid: false, 
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

// Example usage
export function createReactiveSystem(options: ReactiveFormulaEngineOptions = {}) {
    // Create reactive store
    const reactiveStore = new ReactiveStore();

    // Create legacy formula engine (for backwards compatibility)
    const legacyFormulaEngine = new ReactiveFormulaEngine(reactiveStore, options);

    // Create code cell engine with module support
    const codeCellEngine = new CodeCellEngine(reactiveStore);

    // Create new formula engine that uses code cell engine
    const formulaEngine = new FormulaEngine(codeCellEngine);

    return {
        reactiveStore,
        formulaEngine: legacyFormulaEngine, // Keep legacy for now
        enhancedFormulaEngine: formulaEngine, // New enhanced version
        codeCellEngine
    };
}
