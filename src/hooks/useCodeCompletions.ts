import { useMemo } from 'react';
import { Completion } from '@codemirror/autocomplete';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';

/**
 * Hook to generate code completion suggestions for JavaScript code cells
 * Includes reactive values, available modules, and utility functions
 */
export function useCodeCompletions() {
    const { reactiveStore, codeCellEngine } = useReactiveSystem();

    const completions = useMemo(() => {
        const suggestions: Completion[] = [];

        // 1. Available modules
        const availableModules = codeCellEngine.getAvailableModules();
        availableModules.forEach(moduleName => {
            suggestions.push({
                label: moduleName,
                type: "module",
                info: `Module: ${moduleName}`,
                detail: "Available module"
            });
        });

        // 2. Reactive system globals
        const systemGlobals = [
            {
                label: "exports",
                type: "object",
                info: "Export values to make them available to other cells",
                detail: "Reactive System"
            },
            {
                label: "console",
                type: "object", 
                info: "Console object for logging",
                detail: "Built-in"
            },
            {
                label: "Math",
                type: "object",
                info: "Math object with mathematical functions",
                detail: "Built-in"
            },
            {
                label: "require",
                type: "function",
                info: "Load modules",
                detail: "Module System"
            },
            {
                label: "process",
                type: "object",
                info: "Node.js process object",
                detail: "Node.js"
            },
            {
                label: "Buffer",
                type: "function",
                info: "Node.js Buffer constructor",
                detail: "Node.js"
            },
            {
                label: "__dirname",
                type: "string",
                info: "Current directory path",
                detail: "Node.js"
            },
            {
                label: "__filename", 
                type: "string",
                info: "Current file path",
                detail: "Node.js"
            }
        ];

        suggestions.push(...systemGlobals);

        // 3. DOM helper functions
        const domHelpers = [
            {
                label: "output",
                type: "function",
                info: "Output DOM elements or data to the cell",
                detail: "DOM Helper"
            },
            {
                label: "outEl",
                type: "object",
                info: "Direct access to output container",
                detail: "DOM Helper"
            },
            {
                label: "createContainer",
                type: "function",
                info: "Create a styled container that auto-outputs",
                detail: "DOM Helper"
            },
            {
                label: "createGradientContainer",
                type: "function", 
                info: "Create a gradient container with title",
                detail: "DOM Helper"
            },
            {
                label: "createElement",
                type: "function",
                info: "Create any HTML element with options",
                detail: "DOM Helper"
            },
            {
                label: "createDiv",
                type: "function",
                info: "Create a div element with options",
                detail: "DOM Helper"
            },
            {
                label: "createTitle",
                type: "function",
                info: "Create a title element (h1-h6)",
                detail: "DOM Helper"
            },
            {
                label: "createTable",
                type: "function",
                info: "Create a table from data",
                detail: "DOM Helper"
            },
            {
                label: "createButton",
                type: "function",
                info: "Create a styled button",
                detail: "DOM Helper"
            },
            {
                label: "createList",
                type: "function",
                info: "Create ordered or unordered list",
                detail: "DOM Helper"
            },
            {
                label: "createKeyValueGrid",
                type: "function",
                info: "Create a responsive key-value grid",
                detail: "DOM Helper"
            },
            {
                label: "createOutElContainer",
                type: "function",
                info: "Create container for manual output to outEl",
                detail: "DOM Helper"
            },
            {
                label: "createOutElGradientContainer",
                type: "function",
                info: "Create gradient container for manual output",
                detail: "DOM Helper"
            },
            {
                label: "build",
                type: "function",
                info: "Fluent API for building elements",
                detail: "DOM Helper"
            },
            {
                label: "generateId",
                type: "function",
                info: "Generate unique ID for elements",
                detail: "DOM Helper"
            }
        ];

        suggestions.push(...domHelpers);

        // 4. Reactive variables (get all variable names from the reactive store)
        try {
            const variableNames = reactiveStore.getAllVariableNames();
            variableNames.forEach(varName => {
                // Skip internal variables
                if (!varName.startsWith('__cell_')) {
                    suggestions.push({
                        label: varName,
                        type: "variable",
                        info: `Reactive variable: ${varName}`,
                        detail: "Reactive Value"
                    });
                }
            });
        } catch (error) {
            console.warn('Failed to get reactive variable names:', error);
        }

        return suggestions;
    }, [reactiveStore, codeCellEngine]);

    return completions;
}

/**
 * Hook to generate object completions for common modules
 * Returns object.method completions for well-known modules
 */
export function useModuleCompletions() {
    const { codeCellEngine } = useReactiveSystem();

    const objectCompletions = useMemo(() => {
        const completions: { object: string; methods: Completion[] }[] = [];

        // Check which modules are available and add their common methods
        const availableModules = codeCellEngine.getAvailableModules();

        // Math object completions
        completions.push({
            object: "Math",
            methods: [
                { label: "PI", type: "property", info: "π (pi) constant" },
                { label: "E", type: "property", info: "Euler's number" },
                { label: "abs", type: "method", info: "Math.abs(x) - Absolute value" },
                { label: "ceil", type: "method", info: "Math.ceil(x) - Round up" },
                { label: "floor", type: "method", info: "Math.floor(x) - Round down" },
                { label: "round", type: "method", info: "Math.round(x) - Round to nearest integer" },
                { label: "max", type: "method", info: "Math.max(...args) - Maximum value" },
                { label: "min", type: "method", info: "Math.min(...args) - Minimum value" },
                { label: "pow", type: "method", info: "Math.pow(x, y) - x to the power of y" },
                { label: "sqrt", type: "method", info: "Math.sqrt(x) - Square root" },
                { label: "random", type: "method", info: "Math.random() - Random number [0,1)" },
                { label: "sin", type: "method", info: "Math.sin(x) - Sine" },
                { label: "cos", type: "method", info: "Math.cos(x) - Cosine" },
                { label: "tan", type: "method", info: "Math.tan(x) - Tangent" }
            ]
        });

        // Console object completions
        completions.push({
            object: "console",
            methods: [
                { label: "log", type: "method", info: "console.log(...args) - Log message" },
                { label: "warn", type: "method", info: "console.warn(...args) - Warning message" },
                { label: "error", type: "method", info: "console.error(...args) - Error message" },
                { label: "info", type: "method", info: "console.info(...args) - Info message" },
                { label: "debug", type: "method", info: "console.debug(...args) - Debug message" },
                { label: "table", type: "method", info: "console.table(data) - Display data as table" },
                { label: "time", type: "method", info: "console.time(label) - Start timer" },
                { label: "timeEnd", type: "method", info: "console.timeEnd(label) - End timer" }
            ]
        });

        // Process object completions (Node.js)
        if (availableModules.includes('process')) {
            completions.push({
                object: "process",
                methods: [
                    { label: "cwd", type: "method", info: "process.cwd() - Current working directory" },
                    { label: "env", type: "property", info: "process.env - Environment variables" },
                    { label: "platform", type: "property", info: "process.platform - Operating system platform" },
                    { label: "version", type: "property", info: "process.version - Node.js version" },
                    { label: "versions", type: "property", info: "process.versions - Version information" }
                ]
            });
        }

        // Danfojs completions
        if (availableModules.includes('danfojs')) {
            completions.push({
                object: "dfd",
                methods: [
                    { label: "DataFrame", type: "class", info: "dfd.DataFrame(data) - Create DataFrame" },
                    { label: "Series", type: "class", info: "dfd.Series(data) - Create Series" },
                    { label: "readCSV", type: "method", info: "dfd.readCSV(path) - Read CSV file" },
                    { label: "readJSON", type: "method", info: "dfd.readJSON(path) - Read JSON file" },
                    { label: "concat", type: "method", info: "dfd.concat([df1, df2]) - Concatenate DataFrames" },
                    { label: "merge", type: "method", info: "dfd.merge(df1, df2) - Merge DataFrames" }
                ]
            });
        }

        return completions;
    }, [codeCellEngine]);

    return objectCompletions;
}
