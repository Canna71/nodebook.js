import { useMemo, useCallback } from 'react';
import { Completion } from '@codemirror/autocomplete';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';

/**
 * Hook that provides runtime-based code completions by introspecting
 * the actual execution environment and available objects
 */
export function useRuntimeCompletions(cellId: string) {
    const { codeCellEngine, reactiveStore } = useReactiveSystem();

    /**
     * Introspect an object to get its properties and methods
     */
    const introspectObject = useCallback((obj: any, maxDepth = 2, currentDepth = 0): Completion[] => {
        if (!obj || currentDepth >= maxDepth) return [];

        const completions: Completion[] = [];
        const seen = new Set<string>();

        try {
            // Get all property names (own and inherited)
            const allProps = new Set<string>();
            
            // Add own properties
            Object.getOwnPropertyNames(obj).forEach(prop => allProps.add(prop));
            
            // Add prototype properties (for methods)
            let proto = Object.getPrototypeOf(obj);
            while (proto && proto !== Object.prototype && currentDepth < 2) {
                Object.getOwnPropertyNames(proto).forEach(prop => allProps.add(prop));
                proto = Object.getPrototypeOf(proto);
            }

            for (const prop of allProps) {
                if (seen.has(prop) || prop.startsWith('_') || prop === 'constructor') {
                    continue;
                }
                seen.add(prop);

                try {
                    const descriptor = Object.getOwnPropertyDescriptor(obj, prop) ||
                                    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), prop);
                    
                    if (!descriptor) continue;

                    const value = obj[prop];
                    const isFunction = typeof value === 'function';
                    const isGetter = descriptor.get !== undefined;
                    
                    let type: string;
                    let info: string;
                    
                    if (isFunction) {
                        type = 'method';
                        // Try to get function signature
                        const funcStr = value.toString();
                        const paramMatch = funcStr.match(/\(([^)]*)\)/);
                        const params = paramMatch ? paramMatch[1] : '';
                        info = `${prop}(${params})`;
                    } else if (isGetter) {
                        type = 'property';
                        info = `${prop} (getter)`;
                    } else {
                        type = 'property';
                        const valueType = typeof value;
                        info = `${prop}: ${valueType}`;
                        
                        if (valueType === 'object' && value !== null) {
                            info += ` (${value.constructor?.name || 'Object'})`;
                        }
                    }

                    completions.push({
                        label: prop,
                        type: type as any,
                        info,
                        detail: 'Runtime',
                        apply: prop
                    });
                } catch (error) {
                    // Skip properties that can't be accessed
                }
            }
        } catch (error) {
            console.warn('Error introspecting object:', error);
        }

        return completions.sort((a, b) => a.label.localeCompare(b.label));
    }, []);

    /**
     * Get runtime completions by executing introspection code in the cell context
     */
    const getRuntimeCompletions = useCallback(async (objectPath: string): Promise<Completion[]> => {
        console.log('getRuntimeCompletions called with:', objectPath);
        
        try {
            // Create introspection code that will run in the cell's context
            const introspectionCode = `
                console.log('Introspecting object:', '${objectPath}');
                const target = ${objectPath};
                console.log('Target found:', typeof target, target);
                
                if (typeof target === 'undefined') {
                    console.log('Target is undefined');
                    return [];
                } else {
                    const completions = [];
                    const seen = new Set();
                    
                    // Get own properties
                    Object.getOwnPropertyNames(target).forEach(prop => {
                        if (prop.startsWith('_') || prop === 'constructor') return;
                        if (seen.has(prop)) return;
                        seen.add(prop);
                        
                        try {
                            const value = target[prop];
                            const isFunction = typeof value === 'function';
                            
                            completions.push({
                                label: prop,
                                type: isFunction ? 'method' : 'property',
                                info: isFunction ? prop + '()' : prop + ': ' + typeof value,
                                detail: 'Runtime',
                                apply: prop
                            });
                        } catch (e) {
                            // Skip inaccessible properties
                        }
                    });
                    
                    // Get prototype properties
                    const proto = Object.getPrototypeOf(target);
                    if (proto && proto !== Object.prototype) {
                        Object.getOwnPropertyNames(proto).forEach(prop => {
                            if (prop.startsWith('_') || prop === 'constructor') return;
                            if (seen.has(prop)) return;
                            seen.add(prop);
                            
                            try {
                                const value = target[prop];
                                const isFunction = typeof value === 'function';
                                
                                if (isFunction) {
                                    completions.push({
                                        label: prop,
                                        type: 'method',
                                        info: prop + '()',
                                        detail: 'Runtime',
                                        apply: prop
                                    });
                                }
                            } catch (e) {
                                // Skip inaccessible properties
                            }
                        });
                    }
                    
                    console.log('Found completions:', completions);
                    const result = completions.sort((a, b) => a.label.localeCompare(b.label));
                    console.log('Returning result:', result);
                    return result;
                }
            `;

            console.log('Executing introspection code in cell context...');
            // Execute in the cell's context
            const result = await codeCellEngine.evaluateInCellContext(cellId, introspectionCode);
            console.log('Introspection result:', result);
            
            // Validate and filter the results
            if (Array.isArray(result)) {
                const validResults = result.filter(item => 
                    item && 
                    typeof item === 'object' &&
                    typeof item.label === 'string' &&
                    item.label.length > 0 &&
                    typeof item.type === 'string' &&
                    typeof item.info === 'string' &&
                    typeof item.apply === 'string'
                );
                console.log('Valid completions:', validResults.length, 'out of', result.length);
                return validResults.length > 0 ? validResults : [];
            }
            
            console.log('Result is not an array:', typeof result);
            return [];
        } catch (error) {
            console.warn('Error getting runtime completions:', error);
            return [];
        }
    }, [cellId, codeCellEngine]);

    /**
     * Get all variables currently in scope for the cell
     */
    const getScopeVariables = useCallback(async (): Promise<Completion[]> => {
        try {
            const scopeIntrospectionCode = `
                (function() {
                    const variables = [];
                    
                    // Get all variables from different scopes
                    try {
                        // Global variables from the cell context
                        const globalVars = Object.getOwnPropertyNames(globalThis);
                        globalVars.forEach(varName => {
                            if (!varName.startsWith('_') && 
                                !['console', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 'Symbol', 'BigInt'].includes(varName)) {
                                try {
                                    const value = globalThis[varName];
                                    variables.push({
                                        label: varName,
                                        type: typeof value === 'function' ? 'function' : 'variable',
                                        info: varName + ': ' + typeof value,
                                        detail: 'Scope'
                                    });
                                } catch (e) {}
                            }
                        });
                        
                        // Local variables from current execution context
                        // This would need to be enhanced based on your execution model
                        
                        return variables;
                    } catch (error) {
                        return [];
                    }
                })()
            `;

            const result = await codeCellEngine.evaluateInCellContext(cellId, scopeIntrospectionCode);
            return Array.isArray(result) ? result : [];
        } catch (error) {
            console.warn('Error getting scope variables:', error);
            return [];
        }
    }, [cellId, codeCellEngine]);

    return {
        introspectObject,
        getRuntimeCompletions,
        getScopeVariables
    };
}

/**
 * Enhanced completion hook that combines static and runtime completions
 */
export function useEnhancedCompletions(cellId: string) {
    const { getRuntimeCompletions, getScopeVariables } = useRuntimeCompletions(cellId);

    /**
     * Get completions for object member access (e.g., "Math." or "myVar.")
     */
    const getObjectCompletions = useCallback(async (objectPath: string): Promise<Completion[]> => {
        console.log('Runtime completions requested for:', objectPath);
        
        try {
            // First try runtime introspection
            const runtimeCompletions = await getRuntimeCompletions(objectPath);
            console.log('Runtime completions found:', runtimeCompletions.length, 'items');
            
            if (Array.isArray(runtimeCompletions) && runtimeCompletions.length > 0) {
                return runtimeCompletions;
            }

            // Fallback to static completions for known objects
            const staticCompletions = getStaticObjectCompletions(objectPath);
            console.log('Static fallback completions found:', staticCompletions.length, 'items');
            return Array.isArray(staticCompletions) ? staticCompletions : [];
        } catch (error) {
            console.warn('Error in getObjectCompletions:', error);
            return [];
        }
    }, [getRuntimeCompletions]);

    return {
        getObjectCompletions,
        getScopeVariables
    };
}

/**
 * Static fallback completions for well-known objects
 */
function getStaticObjectCompletions(objectPath: string): Completion[] {
    try {
        switch (objectPath) {
            case 'Math':
                return [
                    { label: 'PI', type: 'property', info: 'Math.PI - π constant', apply: 'PI' },
                    { label: 'E', type: 'property', info: 'Math.E - Euler\'s number', apply: 'E' },
                    { label: 'abs', type: 'method', info: 'Math.abs(x) - Absolute value', apply: 'abs' },
                    { label: 'ceil', type: 'method', info: 'Math.ceil(x) - Round up', apply: 'ceil' },
                    { label: 'floor', type: 'method', info: 'Math.floor(x) - Round down', apply: 'floor' },
                    { label: 'max', type: 'method', info: 'Math.max(...args) - Maximum value', apply: 'max' },
                    { label: 'min', type: 'method', info: 'Math.min(...args) - Minimum value', apply: 'min' },
                    { label: 'random', type: 'method', info: 'Math.random() - Random number [0,1)', apply: 'random' },
                    { label: 'round', type: 'method', info: 'Math.round(x) - Round to nearest integer', apply: 'round' },
                    { label: 'sqrt', type: 'method', info: 'Math.sqrt(x) - Square root', apply: 'sqrt' }
                ];
            
            case 'console':
                return [
                    { label: 'log', type: 'method', info: 'console.log(...args) - Log message', apply: 'log' },
                    { label: 'warn', type: 'method', info: 'console.warn(...args) - Warning message', apply: 'warn' },
                    { label: 'error', type: 'method', info: 'console.error(...args) - Error message', apply: 'error' },
                    { label: 'info', type: 'method', info: 'console.info(...args) - Info message', apply: 'info' },
                    { label: 'table', type: 'method', info: 'console.table(data) - Display data as table', apply: 'table' }
                ];
            
            default:
                return [];
        }
    } catch (error) {
        console.warn('Error in getStaticObjectCompletions:', error);
        return [];
    }
}
