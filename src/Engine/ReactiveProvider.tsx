import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReactiveStore, ReactiveFormulaEngine, CodeCellEngine, FormulaEngine, createReactiveSystem } from './ReactiveSystem';
import { useApplication } from './ApplicationProvider';
import anylogger from "anylogger";
import { moduleRegistry } from './ModuleRegistry';

const log = anylogger("ReactiveProvider");
log.debug("Initializing ReactiveProvider");

// Create context for reactive system
interface ReactiveContextType {
    reactiveStore: ReactiveStore;
    formulaEngine: ReactiveFormulaEngine;
    enhancedFormulaEngine: FormulaEngine;
    codeCellEngine: CodeCellEngine;
}

const ReactiveContext = createContext<ReactiveContextType | null>(null);

// Provider component
export const ReactiveProvider: React.FC<{ 
  children: React.ReactNode;
}> = ({ children }) => {
    const [system] = useState(() => createReactiveSystem());
    const { setStorageExporter, currentModel, stateManager } = useApplication();

    // Set up storage exporter on mount
    useEffect(() => {
        try {
            if (!system?.codeCellEngine) {
                log.warn('CodeCellEngine not available, skipping storage exporter setup');
                return;
            }

            const exporter = () => {
                log.debug('Storage exporter called, codeCellEngine:', !!system.codeCellEngine);
                if (!system.codeCellEngine) {
                    log.error('CodeCellEngine not available during export');
                    return {};
                }
                return system.codeCellEngine.exportStorageToNotebook();
            };
            setStorageExporter(exporter);
            
            // Set up storage change handler to mark notebook as dirty
            const handleStorageChange = () => {
                if (currentModel && stateManager) {
                    log.debug('Storage changed, updating notebook model');
                    const updatedStorage = system.codeCellEngine.exportStorageToNotebook();
                    const updatedModel = {
                        ...currentModel,
                        storage: updatedStorage
                    };
                    stateManager.setNotebookModel(updatedModel, 'Update notebook storage');
                }
            };
            
            // Set the storage change handler on the code cell engine
            system.codeCellEngine.setStorageChangeHandler(handleStorageChange);
            
            log.debug('Storage exporter and change handler registered with ApplicationProvider');
        } catch (error) {
            log.error('Error setting up storage exporter:', error);
        }
        
        // Cleanup on unmount
        return () => {
            log.debug('Cleaning up storage exporter and change handler');
            setStorageExporter(null);
            if (system?.codeCellEngine) {
                system.codeCellEngine.setStorageChangeHandler(undefined);
            }
        };
    }, [system, system?.codeCellEngine, setStorageExporter, currentModel, stateManager]);

    return (
        <ReactiveContext.Provider value={system}>
            {children}
        </ReactiveContext.Provider>
    );
};

// Hook for accessing reactive system
export function useReactiveSystem() {
    const context = useContext(ReactiveContext);
    if (!context) {
        throw new Error('useReactiveSystem must be used within a ReactiveProvider');
    }
    return context;
}

// Hook for reactive values
export function useReactiveValue<T>(name: string, initialValue?: T): [T | undefined, (value: T) => void] {
    const { reactiveStore } = useReactiveSystem();
    const [value, setValue] = useState<T | undefined>(() => {
        // Initialize if needed
        if (initialValue !== undefined && !reactiveStore.get(name)) {
            reactiveStore.define<T>(name, initialValue);
        }
        return reactiveStore.getValue<T>(name);
    });

    useEffect(() => {
        // Subscribe to changes
        const unsubscribe = reactiveStore.subscribe<T>(name, (newValue) => {
            setValue(newValue);
        });

        return unsubscribe || undefined;
    }, [name, reactiveStore]);

    const updateValue = (newValue: T) => {
        const reactiveValue = reactiveStore.get<T>(name);
        if (reactiveValue) {
            reactiveValue.setValue(newValue);
        } else {
            reactiveStore.define<T>(name, newValue);
        }
    };

    return [value, updateValue];
}

// Hook for creating formulas
export function useReactiveFormula<T>(name: string, formula: string): T | undefined {
    const { formulaEngine, reactiveStore } = useReactiveSystem();
    const [value, setValue] = useState<T | undefined>(undefined);

    useEffect(() => {
        log.debug(`useReactiveFormula: ${name} with expression: ${formula}`);

        // Create or update formula
        formulaEngine.createFormula(name, formula);

        // Get initial value
        setValue(reactiveStore.getValue<T>(name));

        // Subscribe to changes
        const unsubscribe = reactiveStore.subscribe<T>(name, (newValue) => {
            log.debug(`Formula ${name} updated:`, newValue);
            setValue(newValue);
        });

        return unsubscribe || undefined;
    }, [name, formula, formulaEngine, reactiveStore]);

    return value;
}

// Hook for managing modules
export function useCodeCellModules() {
    const { codeCellEngine } = useReactiveSystem();
    
    return {
        getCachedModules: () => codeCellEngine.getCachedModules(),
        getGlobalVariables: () => codeCellEngine.getGlobalVariables(),
        getAvailableModules: () => codeCellEngine.getAvailableModules(),
        hasModule: (name: string) => codeCellEngine.hasModule(name),
        registerModule: (name: string, moduleExports: any) => codeCellEngine.registerModule(name, moduleExports),
        preloadModules: (moduleNames: string[]) => codeCellEngine.preloadModules(moduleNames),
        clearModuleCache: () => codeCellEngine.clearModuleCache(),
        clearGlobalScope: () => codeCellEngine.clearGlobalScope()
    };
}
