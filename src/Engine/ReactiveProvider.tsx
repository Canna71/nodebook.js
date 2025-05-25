import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReactiveStore, ReactiveFormulaEngine, createReactiveSystem } from './RactiveSystem';

// Create context for reactive system
interface ReactiveContextType {
  reactiveStore: ReactiveStore;
  formulaEngine: ReactiveFormulaEngine;
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
    // Create or update formula
    formulaEngine.createFormula(name, formula);
    
    // Get initial value
    setValue(reactiveStore.getValue<T>(name));
    
    // Subscribe to changes
    const unsubscribe = reactiveStore.subscribe<T>(name, (newValue) => {
      setValue(newValue);
    });
    
    return unsubscribe || undefined;
  }, [name, formula, formulaEngine, reactiveStore]);
  
  return value;
}
