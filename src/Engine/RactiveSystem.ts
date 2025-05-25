import { HyperFormula, SimpleCellAddress, CellValue, NoErrorCellValue, ErrorType } from 'hyperformula';
import { CellContent } from 'hyperformula/typings/CellContentParser';

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
}

/**
 * Options for the ReactiveFormulaEngine
 */
interface ReactiveFormulaEngineOptions {
  maxRows?: number;
  maxColumns?: number;
  licenseKey?: string;
}

/**
 * Formula information
 */
interface FormulaInfo {
  name: string;
  cellAddress: SimpleCellAddress;
  initialValue: CellValue;
  dependencies: string[];
}

/**
 * Reactive formula engine using HyperFormula
 */
class ReactiveFormulaEngine {
  private reactiveStore: ReactiveStore;
  private hyperFormula: HyperFormula;
  private mainSheetId: string;
  private reactiveVarToCellMap: Map<string, SimpleCellAddress>;
  private cellToReactiveVarMap: Map<string, string>;
  private nextReactiveVarRow: number = 0;

  constructor(reactiveStore: ReactiveStore, options: ReactiveFormulaEngineOptions = {}) {
    this.reactiveStore = reactiveStore;
    
    // Initialize HyperFormula
    this.hyperFormula = HyperFormula.buildEmpty({
      licenseKey: options.licenseKey || 'non-commercial-and-evaluation',
      maxColumns: options.maxColumns || 100,
      maxRows: options.maxRows || 1000
    });
    
    // Create a default sheet
    this.mainSheetId = this.hyperFormula.addSheet('main');
    ;
    // Initialize maps
    this.reactiveVarToCellMap = new Map();
    this.cellToReactiveVarMap = new Map();
  }

  /**
   * Register a reactive variable with the formula engine
   */
public registerReactiveVariable<T extends number | string | boolean>(
    varName: string, 
    initialValue: T
): SimpleCellAddress {
    // Assign a cell for this reactive variable
    const row = this.nextReactiveVarRow++;
    const col = 0;
    const cellAddress: SimpleCellAddress = { sheet: this.hyperFormula.getSheetId(this.mainSheetId), row, col };
    
    // Store the mapping
    this.reactiveVarToCellMap.set(varName, cellAddress);
    this.cellToReactiveVarMap.set(`${row},${col}`, varName);
    
    // Set the initial value in HyperFormula
    // Convert CellValue to RawCellContent
    // const rawContent = typeof initialValue === 'object' && initialValue !== null && 'message' in initialValue 
    //     ? new CellContent.Error(ErrorType.ERROR, '#ERROR!') 
    //     : initialValue;
    this.hyperFormula.setCellContents(cellAddress, [[initialValue]]);
    
    // Subscribe to changes
    this.reactiveStore.subscribe<T>(varName, (newValue) => {
        const cellAddress = this.reactiveVarToCellMap.get(varName);
        if (cellAddress) {
            // Convert CellValue to RawCellContent
            // const rawContent = (typeof newValue === 'object') && (newValue !== null) && ('message' in newValue) 
            //     ? '#ERROR!' 
            //     : newValue;
            this.hyperFormula.setCellContents(cellAddress, [[newValue]]);
            this.updateDependentFormulas();
        }
    });
    
    return cellAddress;
}

  /**
   * Create a formula that references reactive variables
   */
  public createFormula(name: string, formulaString: string): FormulaInfo {
    // Replace $varName references with cell references
    const processedFormula = formulaString.replace(/\$(\w+)/g, (match, varName) => {
      const cellAddress = this.reactiveVarToCellMap.get(varName);
      if (!cellAddress) {
        // Register the variable if it doesn't exist yet
        this.registerReactiveVariable(varName, 0);
        const newAddress = this.reactiveVarToCellMap.get(varName);
        return this.hyperFormula.simpleCellAddressToString(newAddress!);
      }
      return this.hyperFormula.simpleCellAddressToString(cellAddress);
    });
    
    // Find a cell for this formula
    const row = this.nextReactiveVarRow++;
    const col = 1; // Use column 1 for formulas
    const cellAddress: SimpleCellAddress = { sheet: this.hyperFormula.getSheetId(this.mainSheetId), row, col };
    
    // Store the mapping
    this.reactiveVarToCellMap.set(name, cellAddress);
    this.cellToReactiveVarMap.set(`${row},${col}`, name);
    
    // Set the formula in HyperFormula
    this.hyperFormula.setCellContents(cellAddress, [[processedFormula]]);
    
    // Get initial value and create reactive value
    const initialValue = this.hyperFormula.getCellValue(cellAddress);
    
    // Find dependencies
    const dependencies = this.findFormulaDependencies(cellAddress);
    
    // Define reactive value
    this.reactiveStore.define(
      name,
      initialValue,
      () => this.hyperFormula.getCellValue(cellAddress),
      dependencies
    );
    
    return {
      name,
      cellAddress,
      initialValue,
      dependencies
    };
  }

  /**
   * Find reactive variable dependencies for a formula
   */
private findFormulaDependencies(cellAddress: SimpleCellAddress): string[] {
    const dependencies: string[] = [];
    // const formulaDependencies: SimpleCellAddress[] = this.hyperFormula.getCellDependencies(cellAddress);
    
    // formulaDependencies.forEach((depAddress: SimpleCellAddress) => {
    //     const key: string = `${depAddress.row},${depAddress.col}`;
    //     const varName: string | undefined = this.cellToReactiveVarMap.get(key);
    //     if (varName) {
    //         dependencies.push(varName);
    //     }
    // });
    
    return dependencies;
}

/**
 * Update all formulas when reactive variables change
 */
private updateDependentFormulas(): void {
    // HyperFormula automatically recalculates dependent cells
    // We just need to update our reactive store with new values
    
    this.reactiveVarToCellMap.forEach((cellAddress, varName) => {
      // Skip updating source variables (in column 0)
      if (cellAddress.col === 0) return;
      
      const currentValue = this.hyperFormula.getCellValue(cellAddress);
      const reactiveValue = this.reactiveStore.get(varName);
      
      if (reactiveValue && reactiveValue.get() !== currentValue) {
        reactiveValue.setValue(currentValue);
      }
    });
  }

  /**
   * Add a named range for easier formula writing
   */
  public defineNamedRange(name: string, rangeString: string): void {
    this.hyperFormula.addNamedExpression(name, rangeString);
  }



  /**
   * Create a new sheet and populate it with data
   */
  public createSheet(name: string, data: any[][]): string {
    const sheetId = this.hyperFormula.addSheet(name);
    if (data.length > 0) {
      this.hyperFormula.setCellContents(
        { sheet: this.hyperFormula.getSheetId(sheetId), row: 0, col: 0 },
        data
      );
    }
    return sheetId;
  }

  /**
   * Get the HyperFormula instance for advanced usage
   */
  public getHyperFormula(): HyperFormula {
    return this.hyperFormula;
  }

  /**
   * Get cell address for a reactive variable
   */
  public getCellAddress(varName: string): SimpleCellAddress | undefined {
    return this.reactiveVarToCellMap.get(varName);
  }

  /**
   * Get reactive variable name for a cell address
   */
  public getReactiveVarName(cellAddress: SimpleCellAddress): string | undefined {
    const key = `${cellAddress.row},${cellAddress.col}`;
    return this.cellToReactiveVarMap.get(key);
  }
}


// Example usage
export function createReactiveSystem() {
  // Create reactive store
  const reactiveStore = new ReactiveStore();
  
  // Create formula engine
  const formulaEngine = new ReactiveFormulaEngine(reactiveStore);
  
  return {
    reactiveStore,
    formulaEngine
  };
}
