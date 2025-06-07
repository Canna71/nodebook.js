import { useMemo, useCallback } from 'react';
import { Completion } from '@codemirror/autocomplete';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';

/**
 * Hook for runtime completions in formula cells
 * Provides dynamic object property completions based on current reactive values
 */
export function useFormulaRuntimeCompletions() {
    const { reactiveStore, codeCellEngine } = useReactiveSystem();

    // Get object completions for a given object path
    const getObjectCompletions = useCallback(async (objectPath: string): Promise<Completion[]> => {
        try {
            // For formulas, we need to handle both $variable and variable syntax
            const cleanPath = objectPath.startsWith('$') ? objectPath.slice(1) : objectPath;
            
            // Get the object from reactive store
            const value = reactiveStore.getValue(cleanPath);
            
            if (!value || typeof value !== 'object') {
                return [];
            }

            const completions: Completion[] = [];
            
            // Get all enumerable properties
            const properties = Object.getOwnPropertyNames(value);
            const prototype = Object.getPrototypeOf(value);
            
            // Add own properties
            properties.forEach(prop => {
                if (typeof prop === 'string' && !prop.startsWith('_')) {
                    const propValue = (value as Record<string, any>)[prop];
                    let type: string;
                    let info: string;
                    
                    if (typeof propValue === 'function') {
                        type = 'method';
                        info = `${cleanPath}.${prop}() - Method`;
                    } else if (typeof propValue === 'object' && propValue !== null) {
                        type = 'property';
                        info = `${cleanPath}.${prop} - Object property`;
                    } else {
                        type = 'property';
                        info = `${cleanPath}.${prop} - ${typeof propValue}`;
                    }
                    
                    completions.push({
                        label: prop,
                        type,
                        info,
                        detail: `${cleanPath} property`
                    });
                }
            });

            // Add prototype methods for common objects
            if (prototype) {
                const prototypeProps = Object.getOwnPropertyNames(prototype);
                prototypeProps.forEach(prop => {
                    if (typeof prop === 'string' && 
                        !prop.startsWith('_') && 
                        prop !== 'constructor' &&
                        typeof prototype[prop] === 'function') {
                        
                        completions.push({
                            label: prop,
                            type: 'method',
                            info: `${cleanPath}.${prop}() - Inherited method`,
                            detail: `${cleanPath} method`
                        });
                    }
                });
            }

            // Special handling for arrays
            if (Array.isArray(value)) {
                const arrayMethods = [
                    'length', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice',
                    'join', 'reverse', 'sort', 'concat', 'indexOf', 'lastIndexOf',
                    'forEach', 'map', 'filter', 'reduce', 'reduceRight', 'every',
                    'some', 'find', 'findIndex', 'includes'
                ];
                
                arrayMethods.forEach(method => {
                    if (!completions.some(c => c.label === method)) {
                        completions.push({
                            label: method,
                            type: method === 'length' ? 'property' : 'method',
                            info: `${cleanPath}.${method} - Array ${method === 'length' ? 'property' : 'method'}`,
                            detail: 'Array'
                        });
                    }
                });
            }

            // Special handling for DataFrames (if using danfo.js)
            if (value.constructor && value.constructor.name === 'DataFrame') {
                const dfMethods = [
                    'head', 'tail', 'shape', 'columns', 'index', 'dtypes',
                    'describe', 'sum', 'mean', 'std', 'min', 'max', 'count',
                    'iloc', 'loc', 'query', 'groupby', 'sort_values',
                    'drop', 'dropna', 'fillna', 'reset_index'
                ];
                
                dfMethods.forEach(method => {
                    if (!completions.some(c => c.label === method)) {
                        completions.push({
                            label: method,
                            type: ['shape', 'columns', 'index', 'dtypes'].includes(method) ? 'property' : 'method',
                            info: `${cleanPath}.${method} - DataFrame ${['shape', 'columns', 'index', 'dtypes'].includes(method) ? 'property' : 'method'}`,
                            detail: 'DataFrame'
                        });
                    }
                });
            }

            return completions;
        } catch (error) {
            console.warn('Error getting object completions for formula:', error);
            return [];
        }
    }, [reactiveStore]);

    // Get current scope variables (reactive variables)
    const getScopeVariables = useCallback(async (): Promise<Completion[]> => {
        try {
            const allVariables = reactiveStore.getAllVariableNames();
            const completions: Completion[] = [];
            
            allVariables.forEach(varName => {
                // Skip internal variables
                if (varName.startsWith('__cell_') || varName.startsWith('__formula_')) {
                    return;
                }
                
                const value = reactiveStore.getValue(varName);
                let type: string;
                let info: string;
                
                if (value === null || value === undefined) {
                    type = 'variable';
                    info = `${varName} - ${value}`;
                } else if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        type = 'variable';
                        info = `${varName} - Array[${value.length}]`;
                    } else if (value.constructor && value.constructor.name === 'DataFrame') {
                        type = 'variable';
                        info = `${varName} - DataFrame`;
                    } else {
                        type = 'variable';
                        info = `${varName} - Object`;
                    }
                } else {
                    type = 'variable';
                    info = `${varName} - ${typeof value} (${String(value).slice(0, 50)}${String(value).length > 50 ? '...' : ''})`;
                }
                
                // Add both with and without $ prefix
                completions.push({
                    label: varName,
                    type,
                    info,
                    detail: 'Reactive Variable'
                });
                
                completions.push({
                    label: `$${varName}`,
                    type,
                    info: `${info} (legacy syntax)`,
                    detail: 'Reactive Variable'
                });
            });
            
            return completions;
        } catch (error) {
            console.warn('Error getting scope variables for formula:', error);
            return [];
        }
    }, [reactiveStore]);

    const runtimeCompletions = useMemo(() => ({
        getObjectCompletions,
        getScopeVariables
    }), [getObjectCompletions, getScopeVariables]);

    return runtimeCompletions;
}
