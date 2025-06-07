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
            // First get reactive variables from the reactive store
            const reactiveVariables: Completion[] = [];
            try {
                const variableNames = reactiveStore.getAllVariableNames();
                
                variableNames.forEach(varName => {
                    // Skip internal variables but include user-defined ones
                    if (!varName.startsWith('__cell_') && !varName.startsWith('__')) {
                        reactiveVariables.push({
                            label: varName,
                            type: 'variable',
                            info: `Reactive variable: ${varName}`,
                            detail: 'Reactive Store',
                            apply: varName
                        });
                    }
                });
            } catch (error) {
                console.warn('Error getting reactive variables:', error);
            }

            // Then introspect the runtime scope
            const scopeIntrospectionCode = `
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
                                    detail: 'Runtime Scope',
                                    apply: varName
                                });
                            } catch (e) {}
                        }
                    });
                    
                    // Check for exported variables from other cells
                    if (typeof exports !== 'undefined') {
                        Object.getOwnPropertyNames(exports).forEach(varName => {
                            try {
                                const value = exports[varName];
                                variables.push({
                                    label: varName,
                                    type: typeof value === 'function' ? 'function' : 'variable',
                                    info: varName + ': ' + typeof value + ' (exported)',
                                    detail: 'Cell Export',
                                    apply: varName
                                });
                            } catch (e) {}
                        });
                    }
                    
                    console.log('Runtime scope variables found:', variables);
                    return variables; // Return the variables array
                } catch (error) {
                    console.error('Error in scope introspection:', error);
                    return [];
                }
            `;

            const result = await codeCellEngine.evaluateInCellContext(cellId, scopeIntrospectionCode);
            const runtimeVariables = Array.isArray(result) ? result : [];
            console.log('Runtime variables after evaluation:', runtimeVariables.length, 'items');
            
            // Combine both sources, avoiding duplicates
            const allVariables = [...reactiveVariables];
            const reactiveLabels = new Set(reactiveVariables.map(v => v.label));
            
            let addedCount = 0;
            runtimeVariables.forEach(variable => {
                if (variable && typeof variable === 'object' && 
                    typeof variable.label === 'string' && 
                    !reactiveLabels.has(variable.label)) {
                    allVariables.push(variable);
                    addedCount++;
                }
            });
            
            console.log('Added', addedCount, 'runtime variables to completions. Total:', allVariables.length);
            return allVariables;
        } catch (error) {
            console.warn('Error getting scope variables:', error);
            return [];
        }
    }, [cellId, codeCellEngine, reactiveStore]);

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
            // For well-known objects, prefer static completions with documentation
            const staticCompletions = getStaticObjectCompletions(objectPath);
            if (Array.isArray(staticCompletions) && staticCompletions.length > 0) {
                console.log('Using static completions for known object:', objectPath, staticCompletions.length, 'items');
                return staticCompletions;
            }

            // For user-defined objects, use runtime introspection
            const runtimeCompletions = await getRuntimeCompletions(objectPath);
            console.log('Runtime completions found:', runtimeCompletions.length, 'items');
            
            if (Array.isArray(runtimeCompletions) && runtimeCompletions.length > 0) {
                return runtimeCompletions;
            }

            console.log('No completions found for:', objectPath);
            return [];
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
                    { label: 'PI', type: 'property', info: 'Math.PI - π constant (3.14159...)', apply: 'PI' },
                    { label: 'E', type: 'property', info: 'Math.E - Euler\'s number (2.718...)', apply: 'E' },
                    { label: 'LN2', type: 'property', info: 'Math.LN2 - Natural logarithm of 2', apply: 'LN2' },
                    { label: 'LN10', type: 'property', info: 'Math.LN10 - Natural logarithm of 10', apply: 'LN10' },
                    { label: 'LOG2E', type: 'property', info: 'Math.LOG2E - Base 2 logarithm of E', apply: 'LOG2E' },
                    { label: 'LOG10E', type: 'property', info: 'Math.LOG10E - Base 10 logarithm of E', apply: 'LOG10E' },
                    { label: 'SQRT1_2', type: 'property', info: 'Math.SQRT1_2 - Square root of 1/2', apply: 'SQRT1_2' },
                    { label: 'SQRT2', type: 'property', info: 'Math.SQRT2 - Square root of 2', apply: 'SQRT2' },
                    { label: 'abs', type: 'method', info: 'Math.abs(x) - Returns absolute value of x', apply: 'abs' },
                    { label: 'acos', type: 'method', info: 'Math.acos(x) - Returns arccosine of x (in radians)', apply: 'acos' },
                    { label: 'asin', type: 'method', info: 'Math.asin(x) - Returns arcsine of x (in radians)', apply: 'asin' },
                    { label: 'atan', type: 'method', info: 'Math.atan(x) - Returns arctangent of x (in radians)', apply: 'atan' },
                    { label: 'atan2', type: 'method', info: 'Math.atan2(y, x) - Returns arctangent of y/x (in radians)', apply: 'atan2' },
                    { label: 'ceil', type: 'method', info: 'Math.ceil(x) - Returns smallest integer >= x', apply: 'ceil' },
                    { label: 'cos', type: 'method', info: 'Math.cos(x) - Returns cosine of x (x in radians)', apply: 'cos' },
                    { label: 'exp', type: 'method', info: 'Math.exp(x) - Returns E^x', apply: 'exp' },
                    { label: 'floor', type: 'method', info: 'Math.floor(x) - Returns largest integer <= x', apply: 'floor' },
                    { label: 'log', type: 'method', info: 'Math.log(x) - Returns natural logarithm of x', apply: 'log' },
                    { label: 'max', type: 'method', info: 'Math.max(...args) - Returns largest of zero or more numbers', apply: 'max' },
                    { label: 'min', type: 'method', info: 'Math.min(...args) - Returns smallest of zero or more numbers', apply: 'min' },
                    { label: 'pow', type: 'method', info: 'Math.pow(x, y) - Returns x raised to the power of y', apply: 'pow' },
                    { label: 'random', type: 'method', info: 'Math.random() - Returns random number between 0 (inclusive) and 1 (exclusive)', apply: 'random' },
                    { label: 'round', type: 'method', info: 'Math.round(x) - Returns x rounded to nearest integer', apply: 'round' },
                    { label: 'sin', type: 'method', info: 'Math.sin(x) - Returns sine of x (x in radians)', apply: 'sin' },
                    { label: 'sqrt', type: 'method', info: 'Math.sqrt(x) - Returns square root of x', apply: 'sqrt' },
                    { label: 'tan', type: 'method', info: 'Math.tan(x) - Returns tangent of x (x in radians)', apply: 'tan' },
                    { label: 'trunc', type: 'method', info: 'Math.trunc(x) - Returns integer part of x', apply: 'trunc' }
                ];
            
            case 'console':
                return [
                    { label: 'log', type: 'method', info: 'console.log(...data) - Outputs a message to console', apply: 'log' },
                    { label: 'warn', type: 'method', info: 'console.warn(...data) - Outputs warning message', apply: 'warn' },
                    { label: 'error', type: 'method', info: 'console.error(...data) - Outputs error message', apply: 'error' },
                    { label: 'info', type: 'method', info: 'console.info(...data) - Outputs informational message', apply: 'info' },
                    { label: 'debug', type: 'method', info: 'console.debug(...data) - Outputs debug message', apply: 'debug' },
                    { label: 'table', type: 'method', info: 'console.table(data) - Displays tabular data as a table', apply: 'table' },
                    { label: 'time', type: 'method', info: 'console.time(label) - Starts a timer', apply: 'time' },
                    { label: 'timeEnd', type: 'method', info: 'console.timeEnd(label) - Stops a timer and logs elapsed time', apply: 'timeEnd' },
                    { label: 'count', type: 'method', info: 'console.count(label) - Logs number of times called', apply: 'count' },
                    { label: 'clear', type: 'method', info: 'console.clear() - Clears the console', apply: 'clear' }
                ];

            case 'Object':
                return [
                    { label: 'keys', type: 'method', info: 'Object.keys(obj) - Returns array of object\'s own property names', apply: 'keys' },
                    { label: 'values', type: 'method', info: 'Object.values(obj) - Returns array of object\'s own property values', apply: 'values' },
                    { label: 'entries', type: 'method', info: 'Object.entries(obj) - Returns array of [key, value] pairs', apply: 'entries' },
                    { label: 'assign', type: 'method', info: 'Object.assign(target, ...sources) - Copies properties to target object', apply: 'assign' },
                    { label: 'create', type: 'method', info: 'Object.create(proto) - Creates new object with specified prototype', apply: 'create' },
                    { label: 'defineProperty', type: 'method', info: 'Object.defineProperty(obj, prop, descriptor) - Defines property on object', apply: 'defineProperty' },
                    { label: 'freeze', type: 'method', info: 'Object.freeze(obj) - Freezes an object', apply: 'freeze' },
                    { label: 'hasOwnProperty', type: 'method', info: 'Object.hasOwnProperty(prop) - Returns boolean indicating if object has property', apply: 'hasOwnProperty' }
                ];

            case 'Array':
                return [
                    { label: 'from', type: 'method', info: 'Array.from(arrayLike) - Creates array from array-like object', apply: 'from' },
                    { label: 'isArray', type: 'method', info: 'Array.isArray(value) - Returns true if value is an array', apply: 'isArray' },
                    { label: 'of', type: 'method', info: 'Array.of(...elements) - Creates array with elements', apply: 'of' }
                ];

            case 'JSON':
                return [
                    { label: 'parse', type: 'method', info: 'JSON.parse(text) - Parses JSON string and returns JavaScript value', apply: 'parse' },
                    { label: 'stringify', type: 'method', info: 'JSON.stringify(value) - Converts JavaScript value to JSON string', apply: 'stringify' }
                ];

            case 'Date':
                return [
                    { label: 'now', type: 'method', info: 'Date.now() - Returns current timestamp in milliseconds', apply: 'now' },
                    { label: 'parse', type: 'method', info: 'Date.parse(dateString) - Parses date string and returns timestamp', apply: 'parse' },
                    { label: 'UTC', type: 'method', info: 'Date.UTC(year, month, ...) - Returns UTC timestamp', apply: 'UTC' }
                ];

            case 'Number':
                return [
                    { label: 'isNaN', type: 'method', info: 'Number.isNaN(value) - Returns true if value is NaN', apply: 'isNaN' },
                    { label: 'isFinite', type: 'method', info: 'Number.isFinite(value) - Returns true if value is finite number', apply: 'isFinite' },
                    { label: 'isInteger', type: 'method', info: 'Number.isInteger(value) - Returns true if value is integer', apply: 'isInteger' },
                    { label: 'parseFloat', type: 'method', info: 'Number.parseFloat(string) - Parses string and returns floating point number', apply: 'parseFloat' },
                    { label: 'parseInt', type: 'method', info: 'Number.parseInt(string, radix) - Parses string and returns integer', apply: 'parseInt' },
                    { label: 'MAX_VALUE', type: 'property', info: 'Number.MAX_VALUE - Largest representable positive number', apply: 'MAX_VALUE' },
                    { label: 'MIN_VALUE', type: 'property', info: 'Number.MIN_VALUE - Smallest representable positive number', apply: 'MIN_VALUE' },
                    { label: 'NaN', type: 'property', info: 'Number.NaN - Not-a-Number value', apply: 'NaN' },
                    { label: 'POSITIVE_INFINITY', type: 'property', info: 'Number.POSITIVE_INFINITY - Positive infinity', apply: 'POSITIVE_INFINITY' },
                    { label: 'NEGATIVE_INFINITY', type: 'property', info: 'Number.NEGATIVE_INFINITY - Negative infinity', apply: 'NEGATIVE_INFINITY' }
                ];

            case 'String':
                return [
                    { label: 'fromCharCode', type: 'method', info: 'String.fromCharCode(...codes) - Creates string from character codes', apply: 'fromCharCode' },
                    { label: 'fromCodePoint', type: 'method', info: 'String.fromCodePoint(...codePoints) - Creates string from code points', apply: 'fromCodePoint' },
                    { label: 'raw', type: 'method', info: 'String.raw(template, ...substitutions) - Returns raw template string', apply: 'raw' }
                ];

            case 'Promise':
                return [
                    { label: 'all', type: 'method', info: 'Promise.all(iterable) - Returns promise that resolves when all promises resolve', apply: 'all' },
                    { label: 'allSettled', type: 'method', info: 'Promise.allSettled(iterable) - Returns promise that resolves when all promises settle', apply: 'allSettled' },
                    { label: 'any', type: 'method', info: 'Promise.any(iterable) - Returns promise that resolves when any promise resolves', apply: 'any' },
                    { label: 'race', type: 'method', info: 'Promise.race(iterable) - Returns promise that settles when first promise settles', apply: 'race' },
                    { label: 'reject', type: 'method', info: 'Promise.reject(reason) - Returns rejected promise', apply: 'reject' },
                    { label: 'resolve', type: 'method', info: 'Promise.resolve(value) - Returns resolved promise', apply: 'resolve' }
                ];
            
            default:
                return [];
        }
    } catch (error) {
        console.warn('Error in getStaticObjectCompletions:', error);
        return [];
    }
}
