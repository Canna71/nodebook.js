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

        // 2. Reactive system globals and common JavaScript globals
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
                info: "Console object for logging and debugging",
                detail: "JavaScript Global"
            },
            {
                label: "Math",
                type: "object",
                info: "Math object with mathematical functions and constants",
                detail: "JavaScript Global"
            },
            {
                label: "Object",
                type: "object",
                info: "Object constructor with utility methods",
                detail: "JavaScript Global"
            },
            {
                label: "Array",
                type: "object",
                info: "Array constructor with utility methods",
                detail: "JavaScript Global"
            },
            {
                label: "String",
                type: "object",
                info: "String constructor with utility methods",
                detail: "JavaScript Global"
            },
            {
                label: "Number",
                type: "object",
                info: "Number constructor with utility methods",
                detail: "JavaScript Global"
            },
            {
                label: "Date",
                type: "object",
                info: "Date constructor for working with dates and times",
                detail: "JavaScript Global"
            },
            {
                label: "JSON",
                type: "object",
                info: "JSON object for parsing and stringifying",
                detail: "JavaScript Global"
            },
            {
                label: "Promise",
                type: "object",
                info: "Promise constructor for asynchronous operations",
                detail: "JavaScript Global"
            },
            {
                label: "RegExp",
                type: "object",
                info: "Regular expression constructor",
                detail: "JavaScript Global"
            },
            {
                label: "Error",
                type: "object",
                info: "Error constructor for creating error objects",
                detail: "JavaScript Global"
            },
            {
                label: "setTimeout",
                type: "function",
                info: "Execute a function after a delay",
                detail: "Browser/Node.js Global"
            },
            {
                label: "setInterval",
                type: "function",
                info: "Execute a function repeatedly at intervals",
                detail: "Browser/Node.js Global"
            },
            {
                label: "clearTimeout",
                type: "function",
                info: "Cancel a timeout created by setTimeout",
                detail: "Browser/Node.js Global"
            },
            {
                label: "clearInterval",
                type: "function",
                info: "Cancel an interval created by setInterval",
                detail: "Browser/Node.js Global"
            },
            {
                label: "require",
                type: "function",
                info: "Load modules (Node.js/Nodebook.js module system)",
                detail: "Module System"
            },
            {
                label: "process",
                type: "object",
                info: "Node.js process object with environment info",
                detail: "Node.js Global"
            },
            {
                label: "Buffer",
                type: "function",
                info: "Node.js Buffer constructor for binary data",
                detail: "Node.js Global"
            },
            {
                label: "__dirname",
                type: "string",
                info: "Current directory path",
                detail: "Node.js Global"
            },
            {
                label: "__filename", 
                type: "string",
                info: "Current file path",
                detail: "Node.js Global"
            },
            {
                label: "global",
                type: "object",
                info: "Node.js global object",
                detail: "Node.js Global"
            },
            {
                label: "globalThis",
                type: "object",
                info: "Universal global object reference",
                detail: "JavaScript Global"
            }
        ];

        suggestions.push(...systemGlobals);

        // 2.5. zx shell scripting globals
        const zxGlobals = [
            {
                label: "$",
                type: "function",
                info: "Execute shell commands with zx - await $`command`",
                detail: "zx Global"
            },
            {
                label: "cd",
                type: "function", 
                info: "Change directory - cd('/path/to/dir')",
                detail: "zx Global"
            },
            {
                label: "question",
                type: "function",
                info: "Prompt user for input - await question('What is your name?')",
                detail: "zx Global"
            },
            {
                label: "sleep",
                type: "function",
                info: "Sleep for specified milliseconds - await sleep(1000)",
                detail: "zx Global"
            },
            {
                label: "echo",
                type: "function",
                info: "Print to stdout - echo('message')",
                detail: "zx Global"
            },
            {
                label: "within",
                type: "function",
                info: "Create new async context - await within(async () => { ... })",
                detail: "zx Global"
            },
            {
                label: "stdin",
                type: "function",
                info: "Read from stdin - await stdin()",
                detail: "zx Global"
            },
            {
                label: "glob",
                type: "function",
                info: "File globbing utility - await glob('**/*.js')",
                detail: "zx Global"
            },
            {
                label: "which",
                type: "function",
                info: "Find executable in PATH - await which('git')",
                detail: "zx Global"
            },
            {
                label: "chalk",
                type: "object",
                info: "Terminal string styling - chalk.blue('text')",
                detail: "zx Global"
            },
            {
                label: "YAML",
                type: "object",
                info: "YAML parser - YAML.parse(yamlString)",
                detail: "zx Global"
            },
            {
                label: "argv",
                type: "array",
                info: "Command line arguments (minimist parsed)",
                detail: "zx Global"
            },
            {
                label: "minimist",
                type: "function",
                info: "Command line argument parser",
                detail: "zx Global"
            },
            {
                label: "fetch",
                type: "function",
                info: "HTTP requests - await fetch('https://api.example.com')",
                detail: "zx Global"
            },
            {
                label: "retry",
                type: "function",
                info: "Retry function with backoff - await retry(5, () => $`curl url`)",
                detail: "zx Global"
            },
            {
                label: "spinner",
                type: "function",
                info: "CLI spinner - await spinner('loading...', () => longTask())",
                detail: "zx Global"
            },
            {
                label: "ps",
                type: "object",
                info: "Process listing - await ps.lookup({ command: 'node' })",
                detail: "zx Global"
            },
            {
                label: "kill",
                type: "function",
                info: "Kill process - await kill(pid, 'SIGTERM')",
                detail: "zx Global"
            },
            {
                label: "tmpdir",
                type: "function",
                info: "Create temporary directory - tmpdir() or tmpdir('subdir')",
                detail: "zx Global"
            },
            {
                label: "tmpfile",
                type: "function",
                info: "Create temporary file - tmpfile('name.txt', 'content')",
                detail: "zx Global"
            },
            {
                label: "dotenv",
                type: "object", 
                info: "Environment variable utilities - dotenv.config('.env')",
                detail: "zx Global"
            },
            {
                label: "quote",
                type: "function",
                info: "Quote strings for bash - quote('$FOO')",
                detail: "zx Global"
            },
            {
                label: "quotePowerShell", 
                type: "function",
                info: "Quote strings for PowerShell - quotePowerShell('$FOO')",
                detail: "zx Global"
            },
            {
                label: "useBash",
                type: "function",
                info: "Enable bash preset - useBash()",
                detail: "zx Global"
            },
            {
                label: "usePowerShell",
                type: "function", 
                info: "Switch to PowerShell - usePowerShell()",
                detail: "zx Global"
            },
            {
                label: "usePwsh",
                type: "function",
                info: "Set pwsh as default shell - usePwsh()",
                detail: "zx Global"
            },
            {
                label: "syncProcessCwd",
                type: "function",
                info: "Keep process.cwd() in sync with $ - syncProcessCwd()",
                detail: "zx Global"
            },
            {
                label: "fs",
                type: "object",
                info: "File system utilities (fs-extra) - fs.readJson('package.json')",
                detail: "zx Global"
            },
            {
                label: "os",
                type: "object",
                info: "Operating system utilities - os.homedir()",
                detail: "zx Global"
            },
            {
                label: "path",
                type: "object",
                info: "Path utilities - path.join(basedir, 'output')",
                detail: "zx Global"
            }
        ];

        suggestions.push(...zxGlobals);

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
            const filteredVariables = variableNames.filter(varName => !varName.startsWith('__cell_'));
            
            filteredVariables.forEach(varName => {
                suggestions.push({
                    label: varName,
                    type: "variable",
                    info: `Reactive variable: ${varName}`,
                    detail: "Reactive Value",
                    apply: varName
                });
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
