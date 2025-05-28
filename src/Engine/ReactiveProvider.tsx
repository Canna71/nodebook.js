import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ReactiveStore, ReactiveFormulaEngine, CodeCellEngine, createReactiveSystem } from './RactiveSystem';
import anylogger from "anylogger";
const log = anylogger("ReactiveProvider");
log.debug("Initializing ReactiveProvider");

// Create context for reactive system
interface ReactiveContextType {
    reactiveStore: ReactiveStore;
    formulaEngine: ReactiveFormulaEngine;
    codeCellEngine: CodeCellEngine;
}

const ReactiveContext = createContext<ReactiveContextType | null>(null);

// Provider component
export const ReactiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [system] = useState(() => createReactiveSystem());

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
        console.debug(`useReactiveFormula: ${name} with expression: ${formula}`);

        log.debug(`Creatingformula: ${name} with expression: ${formula}`);
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

// Hook for executing code cells
export function useCodeCell(cellId: string, code: string, autoExecute: boolean = false): [string[], () => void, Error | null] {
    const { codeCellEngine } = useReactiveSystem();
    const [exports, setExports] = useState<string[]>([]);
    const [error, setError] = useState<Error | null>(null);

    const executeCell = useCallback(() => {
        try {
            setError(null);
            const newExports = codeCellEngine.executeCodeCell(cellId, code);
            setExports(newExports);
        } catch (err) {
            setError(err as Error);
            setExports([]);
        }
    }, [cellId, code, codeCellEngine]);

    useEffect(() => {
        if (autoExecute && code.trim()) {
            executeCell();
        }
    }, [autoExecute, code, executeCell]);

    return [exports, executeCell, error];
}
