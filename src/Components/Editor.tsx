import React, { useRef, useEffect } from 'react'
import { EditorState, Compartment, Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { indentWithTab } from '@codemirror/commands'
import { autocompletion, Completion, CompletionSource, CompletionContext } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { placeholder as cmPlaceholder } from '@codemirror/view' // NEW: Add missing import
import { markdown } from "@codemirror/lang-markdown"

interface EditorDimensions {
    width?: string | number;
    height?: string | number;
    minWidth?: string | number;
    minHeight?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
    autoHeight?: boolean; // Grow with content
    autoWidth?: boolean;  // Grow with content
}

type EditorProps = {
    value: string
    onChange?: (value: string) => void
    language?: 'javascript' | 'json' | 'xml' | 'text' | 'url' | 'markdown'
    customCompletions?: Completion[]
    customVariableCompletions?: string[]
    objectCompletions?: { object: string, methods: Completion[] }[]
    reactiveVariables?: string[] // NEW: Add reactive variables
    availableModules?: string[] // NEW: Add available modules
    placeholder?: string
    theme?: Extension
    dimensions?: EditorDimensions
    showLineNumbers?: boolean
}

function getLanguageExtension(language: string | undefined): Extension {
    switch (language) {
        case 'json':
            return json()
        case 'xml':
            return xml()
        case 'markdown': // NEW: Add markdown case
            return markdown()
        case 'text':
            return [] // plain text, no language extension
        case 'url':
            return [] // plain text, no language extension
        case 'javascript':
        default:
            return javascript({ typescript: true })
    }
}

function getDimensionValue(value: string | number | undefined, context?: { fontSize?: number }): string | undefined {
    if (value === undefined) return undefined;
    
    if (typeof value === 'number') {
        return `${value}px`;
    }
    
    // Handle string values
    if (typeof value === 'string') {
        // For em units, convert to pixels if we have font context
        if (value.endsWith('em') && context?.fontSize) {
            const emValue = parseFloat(value);
            return `${emValue * context.fontSize}px`;
        }
        
        // For rem units, convert using default browser font size (16px)
        if (value.endsWith('rem')) {
            const remValue = parseFloat(value);
            return `${remValue * 16}px`;
        }
        
        // Return as-is for other units
        return value;
    }
    
    return undefined;
}

function getEditorStyle(language: string | undefined, dimensions?: EditorDimensions): React.CSSProperties {
    // Default dimensions based on language
    const isUrl = language === 'url';
    
    // Get font context - try to determine the actual font size
    const defaultFontSize = 14; // Common monospace font size in editors
    const fontContext = { fontSize: defaultFontSize };
    
    // Build style object - FORCE width constraint
    const style: React.CSSProperties = {
        border: '1px solid #ccc',
        fontFamily: 'monospace',
        fontSize: `${defaultFontSize}px`,
        width: '100%', // Always constrain to container width
        maxWidth: '100%', // Prevent overflow
        overflow: 'hidden', // Hide any overflow
        boxSizing: 'border-box'
    };

    if (dimensions) {
        // Apply custom dimensions with font context
        if (dimensions.width !== undefined) {
            style.width = getDimensionValue(dimensions.width, fontContext);
            style.maxWidth = style.width; // Ensure max-width matches
        }
        
        if (dimensions.height !== undefined) {
            style.height = getDimensionValue(dimensions.height, fontContext);
        } else if (!dimensions.autoHeight) {
            style.height = isUrl ? 'auto' : '400px';
        }
        
        if (dimensions.minWidth !== undefined) {
            style.minWidth = getDimensionValue(dimensions.minWidth, fontContext);
        }
        
        if (dimensions.minHeight !== undefined) {
            style.minHeight = getDimensionValue(dimensions.minHeight, fontContext);
        } else if (isUrl) {
            style.minHeight = '32px';
        }
        
        if (dimensions.maxWidth !== undefined) {
            style.maxWidth = getDimensionValue(dimensions.maxWidth, fontContext);
        } else {
            style.maxWidth = '100%'; // Always set a max-width
        }
        
        if (dimensions.maxHeight !== undefined) {
            style.maxHeight = getDimensionValue(dimensions.maxHeight, fontContext);
        }
        
        // Auto sizing - disabled to prevent expansion
        if (dimensions.autoHeight) {
            style.height = 'auto';
            const computedMinHeight = getDimensionValue(dimensions.minHeight, fontContext) || '60px';
            style.minHeight = computedMinHeight;
            // Don't allow auto-height to expand indefinitely
            style.maxHeight = getDimensionValue(dimensions.maxHeight, fontContext) || '400px';
        }
        
        if (dimensions.autoWidth) {
            // Completely disable auto-width - it causes the expansion issue
            style.width = '100%';
            style.maxWidth = '100%';
        }
    } else {
        // Default behavior when no dimensions specified
        style.height = isUrl ? 'auto' : '400px';
        style.maxWidth = '100%';
        if (isUrl) {
            style.minHeight = '32px';
        }
    }

    return style;
}

function getAutoSizeExtensions(dimensions?: EditorDimensions): Extension[] {
    const extensions: Extension[] = [];
    
    // Always add width constraints to prevent horizontal overflow
    extensions.push(
        EditorView.theme({
            '.cm-editor': {
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            },
            '.cm-scroller': {
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'auto' // Enable scrolling instead of expansion
            },
            '.cm-content': {
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
            }
        })
    );
    
    if (dimensions?.autoHeight) {
        // Convert relative units to pixels for CodeMirror theme
        const fontContext = { fontSize: 14 };
        const maxHeight = dimensions.maxHeight ? getDimensionValue(dimensions.maxHeight, fontContext) : '400px';
        
        extensions.push(
            EditorView.theme({
                '.cm-editor': {
                    height: 'auto',
                    maxHeight: maxHeight
                },
                '.cm-scroller': {
                    // Key fix: ensure scroller handles overflow properly
                    maxHeight: maxHeight,
                    overflowY: 'auto',
                    overflowX: 'auto'
                },
                '.cm-content': {
                    minHeight: getDimensionValue(dimensions.minHeight, fontContext) || '56px'
                }
            }),
            // Add scroll handling extension
            EditorView.domEventHandlers({
                scroll(event, view) {
                    // Let CodeMirror handle its own scrolling
                    event.stopPropagation();
                    return false;
                }
            })
        );
    }
    
    return extensions;
}

// Enhanced JavaScript completion source with intellisense
function createJavaScriptCompletionSource(
    customCompletions: Completion[] = [],
    objectCompletions: { object: string, methods: Completion[] }[] = [],
    reactiveVariables: string[] = [],
    availableModules: string[] = []
): CompletionSource {
    return (context: CompletionContext) => {
        const { state, pos } = context;
        const tree = syntaxTree(state);
        const node = tree.resolveInner(pos, -1);
        
        // Get the word being typed
        const word = context.matchBefore(/[\w$]+/);
        if (!word && !context.explicit) return null;
        
        const line = state.doc.lineAt(pos);
        const lineText = line.text;
        const beforeCursor = lineText.slice(0, pos - line.from);
        
        let completions: Completion[] = [];
        
        // 1. Handle require() statements
        if (beforeCursor.includes('require(') && !beforeCursor.includes(')')) {
            const moduleCompletions = availableModules.map(moduleName => ({
                label: `'${moduleName}'`,
                type: 'module' as const,
                info: `Import ${moduleName} module`,
                apply: `'${moduleName}')`
            }));
            
            return {
                from: word?.from || pos,
                options: moduleCompletions,
                validFor: /^['"]/
            };
        }
        
        // 2. Handle object member access (e.g., obj.method)
        const memberMatch = beforeCursor.match(/(\w+)\.(\w*)$/);
        if (memberMatch) {
            const objectName = memberMatch[1];
            const partialMember = memberMatch[2];
            
            // Check if it's a known object with methods
            const objectCompletion = objectCompletions.find(obj => obj.object === objectName);
            if (objectCompletion) {
                return {
                    from: pos - partialMember.length,
                    options: objectCompletion.methods
                };
            }
            
            // Built-in JavaScript objects
            const builtinCompletions = getBuiltinObjectCompletions(objectName);
            if (builtinCompletions.length > 0) {
                return {
                    from: pos - partialMember.length,
                    options: builtinCompletions
                };
            }
        }
        
        // 3. Handle exports object
        if (beforeCursor.endsWith('exports.')) {
            return {
                from: pos,
                options: [
                    {
                        label: 'variableName',
                        type: 'property',
                        info: 'Export a variable to make it available to other cells'
                    }
                ]
            };
        }
        
        // 4. General identifier completions
        if (word) {
            // Add reactive variables
            const reactiveCompletions = reactiveVariables.map(varName => ({
                label: varName,
                type: 'variable' as const,
                info: `Reactive variable: ${varName}`,
                boost: 99 // Higher priority for reactive variables
            }));
            
            // Add JavaScript built-ins
            const builtinCompletions = getJavaScriptBuiltins();
            
            // Add custom completions
            completions = [
                ...reactiveCompletions,
                ...customCompletions,
                ...builtinCompletions
            ];
            
            // Filter completions based on what's being typed
            const filter = word.text.toLowerCase();
            const filtered = completions.filter(c => 
                c.label.toLowerCase().includes(filter)
            );
            
            return {
                from: word.from,
                options: filtered
            };
        }
        
        return null;
    };
}

// Get completions for built-in JavaScript objects
function getBuiltinObjectCompletions(objectName: string): Completion[] {
    const completions: { [key: string]: Completion[] } = {
        'Math': [
            { label: 'PI', type: 'constant', info: 'π (pi)' },
            { label: 'E', type: 'constant', info: 'Euler\'s number' },
            { label: 'abs', type: 'function', info: 'Math.abs(x) - Absolute value' },
            { label: 'ceil', type: 'function', info: 'Math.ceil(x) - Round up' },
            { label: 'floor', type: 'function', info: 'Math.floor(x) - Round down' },
            { label: 'round', type: 'function', info: 'Math.round(x) - Round to nearest integer' },
            { label: 'max', type: 'function', info: 'Math.max(...args) - Maximum value' },
            { label: 'min', type: 'function', info: 'Math.min(...args) - Minimum value' },
            { label: 'random', type: 'function', info: 'Math.random() - Random number [0, 1)' },
            { label: 'sqrt', type: 'function', info: 'Math.sqrt(x) - Square root' },
            { label: 'pow', type: 'function', info: 'Math.pow(base, exp) - Power function' },
            { label: 'sin', type: 'function', info: 'Math.sin(x) - Sine function' },
            { label: 'cos', type: 'function', info: 'Math.cos(x) - Cosine function' },
            { label: 'tan', type: 'function', info: 'Math.tan(x) - Tangent function' }
        ],
        'console': [
            { label: 'log', type: 'function', info: 'console.log(...args) - Log to console' },
            { label: 'warn', type: 'function', info: 'console.warn(...args) - Warning message' },
            { label: 'error', type: 'function', info: 'console.error(...args) - Error message' },
            { label: 'info', type: 'function', info: 'console.info(...args) - Info message' },
            { label: 'table', type: 'function', info: 'console.table(data) - Display data as table' }
        ],
        'Array': [
            { label: 'from', type: 'function', info: 'Array.from(iterable) - Create array from iterable' },
            { label: 'isArray', type: 'function', info: 'Array.isArray(obj) - Check if object is array' }
        ],
        'Object': [
            { label: 'keys', type: 'function', info: 'Object.keys(obj) - Get object keys' },
            { label: 'values', type: 'function', info: 'Object.values(obj) - Get object values' },
            { label: 'entries', type: 'function', info: 'Object.entries(obj) - Get key-value pairs' },
            { label: 'assign', type: 'function', info: 'Object.assign(target, ...sources) - Copy properties' }
        ],
        'JSON': [
            { label: 'parse', type: 'function', info: 'JSON.parse(str) - Parse JSON string' },
            { label: 'stringify', type: 'function', info: 'JSON.stringify(obj) - Convert to JSON string' }
        ]
    };
    
    return completions[objectName] || [];
}

// Get JavaScript built-in completions
function getJavaScriptBuiltins(): Completion[] {
    return [
        // Global functions
        { label: 'parseInt', type: 'function', info: 'parseInt(str, radix) - Parse integer' },
        { label: 'parseFloat', type: 'function', info: 'parseFloat(str) - Parse floating point number' },
        { label: 'isNaN', type: 'function', info: 'isNaN(value) - Check if value is NaN' },
        { label: 'isFinite', type: 'function', info: 'isFinite(value) - Check if value is finite' },
        { label: 'setTimeout', type: 'function', info: 'setTimeout(fn, delay) - Execute function after delay' },
        { label: 'setInterval', type: 'function', info: 'setInterval(fn, delay) - Execute function repeatedly' },
        { label: 'clearTimeout', type: 'function', info: 'clearTimeout(id) - Clear timeout' },
        { label: 'clearInterval', type: 'function', info: 'clearInterval(id) - Clear interval' },
        
        // Global objects
        { label: 'Math', type: 'namespace', info: 'Mathematical functions and constants' },
        { label: 'Date', type: 'class', info: 'Date constructor' },
        { label: 'Array', type: 'class', info: 'Array constructor' },
        { label: 'Object', type: 'class', info: 'Object constructor' },
        { label: 'String', type: 'class', info: 'String constructor' },
        { label: 'Number', type: 'class', info: 'Number constructor' },
        { label: 'Boolean', type: 'class', info: 'Boolean constructor' },
        { label: 'RegExp', type: 'class', info: 'Regular expression constructor' },
        { label: 'Error', type: 'class', info: 'Error constructor' },
        { label: 'JSON', type: 'namespace', info: 'JSON utility functions' },
        { label: 'console', type: 'namespace', info: 'Console logging functions' },
        
        // Keywords and constants
        { label: 'undefined', type: 'constant', info: 'Undefined value' },
        { label: 'null', type: 'constant', info: 'Null value' },
        { label: 'true', type: 'constant', info: 'Boolean true' },
        { label: 'false', type: 'constant', info: 'Boolean false' },
        { label: 'Infinity', type: 'constant', info: 'Positive infinity' },
        { label: 'NaN', type: 'constant', info: 'Not a Number' },
        
        // Notebook-specific functions
        { label: 'require', type: 'function', info: 'require(module) - Import a module' },
        { label: 'exports', type: 'namespace', info: 'Export variables for other cells' },
        { label: 'output', type: 'function', info: 'output(...values) - Display output values' },
        { label: 'outEl', type: 'variable', info: 'Direct access to output container DOM element' }
    ];
}

export default function Editor({
    value,
    onChange,
    language = 'javascript',
    customCompletions,
    customVariableCompletions,
    objectCompletions,
    reactiveVariables = [], // NEW
    availableModules = [], // NEW
    placeholder,
    theme,
    dimensions,
    showLineNumbers = true
}: EditorProps) {
    const editorRef = useRef<HTMLDivElement | null>(null)
    const viewRef = useRef<EditorView | null>(null)

    // Compartments for dynamic reconfiguration
    const basicSetupCompartment = useRef(new Compartment()).current
    const languageCompartment = useRef(new Compartment()).current
    const listenerCompartment = useRef(new Compartment()).current
    const completionCompartment = useRef(new Compartment()).current
    const placeholderCompartment = useRef(new Compartment()).current
    const themeCompartment = useRef(new Compartment()).current
    const dimensionsCompartment = useRef(new Compartment()).current // NEW

    // Custom variable completion source for {{variable}} in JSON
    const variableCompletionSource: CompletionSource = customVariableCompletions
        ? (context) => {
            const word = context.matchBefore(/\{\{[\w-]*$/)
            if (!word) return null
            if (!context.state.sliceDoc(word.from, context.pos).startsWith("{{")) return null
            return {
                from: word.from + 2,
                options: customVariableCompletions.map(v => ({
                    label: v,
                    type: "variable"
                }))
            }
        }
        : () => null

    // Enhanced completion source for JavaScript
    const enhancedJSCompletionSource = createJavaScriptCompletionSource(
        customCompletions || [],
        objectCompletions || [],
        reactiveVariables,
        availableModules
    );

    // Custom completions for JavaScript: context-aware (top-level and after object.)
    const jsCustomCompletionSource: CompletionSource = (context) => {
        // Use enhanced completion source for JavaScript
        if (language === 'javascript') {
            return enhancedJSCompletionSource(context);
        }
        
        // Fallback to original logic for other cases
        // Check for object member completion (e.g., volt.)
        if (objectCompletions && objectCompletions.length > 0) {
            for (const obj of objectCompletions) {
                const regex = new RegExp(`${obj.object.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\w*$`)
                const afterDot = context.matchBefore(regex)
                if (afterDot) {
                    return {
                        from: afterDot.from + obj.object.length + 1,
                        options: obj.methods
                    }
                }
            }
        }
        
        // Top-level identifier completions
        const before = context.matchBefore(/[a-zA-Z_$][\w$]*$/)
        if (before && (!context.explicit && before.from === before.to)) return null
        if (before) {
            const objectLabels = (objectCompletions ?? []).map(o => o.object)
            const objectCompletionsList = (objectCompletions ?? []).map(o => ({
                label: o.object,
                type: "variable",
                info: `Global ${o.object} object`,
                apply: o.object
            }))
            const customList = (customCompletions ?? []).filter(
                c => !objectLabels.includes(c.label)
            )
            return {
                from: before.from,
                options: [...objectCompletionsList, ...customList]
            }
        }
        return null
    }

    // Initialize editor
    useEffect(() => {
        if (editorRef.current && !viewRef.current) {
            const listener = EditorView.updateListener.of((update) => {
                if (update.docChanged && onChange) {
                    onChange(update.state.doc.toString())
                }
            })

            // Setup extensions for URL mode
            let urlExtensions: Extension[] = []
            if (language === 'url') {
                urlExtensions = [
                    EditorView.theme({
                        '.cm-content': { minHeight: '32px' },
                        '.cm-editor': { minHeight: '32px' }
                    })
                ]
            }

            // Auto-size extensions
            const autoSizeExtensions = getAutoSizeExtensions(dimensions);

            // Placeholder extension
            let placeholderExt = placeholder
                ? placeholderCompartment.of(cmPlaceholder(placeholder))
                : []

            // Theme extension
            let themeExt = theme
                ? themeCompartment.of(theme)
                : themeCompartment.of([])

            // Line numbers extension - hide if showLineNumbers is false
            const lineNumbersExt = showLineNumbers ? [] : EditorView.theme({
                '.cm-lineNumbers': { display: 'none' }
            });

            // Setup initial completion sources
            let initialCompletionSources: CompletionSource[] = [];
            if (language === "json" && customVariableCompletions) {
                initialCompletionSources.push(variableCompletionSource);
            }
            if (language === "javascript") {
                initialCompletionSources.push(jsCustomCompletionSource);
            }

            const startState = EditorState.create({
                doc: value,
                extensions: [
                    basicSetupCompartment.of(
                        language === 'url'
                            ? [
                                keymap.of([indentWithTab]),
                                autocompletion(),
                            ]
                            : [
                                basicSetup,
                                keymap.of([indentWithTab]),
                                autocompletion()
                            ]
                    ),
                    languageCompartment.of(getLanguageExtension(language)),
                    listenerCompartment.of(listener),
                    completionCompartment.of(
                        initialCompletionSources.length > 0
                            ? autocompletion({ 
                                override: initialCompletionSources,
                                maxRenderedOptions: 20,
                                optionClass: (completion) => {
                                    return `cm-completionLabel-${completion.type || 'default'}`;
                                }
                            })
                            : autocompletion()
                    ),
                    dimensionsCompartment.of(autoSizeExtensions),
                    lineNumbersExt,
                    ...urlExtensions,
                    placeholderExt,
                    themeExt
                ]
            })
            viewRef.current = new EditorView({
                state: startState,
                parent: editorRef.current
            })
        }
        return () => {
            if (viewRef.current) {
                viewRef.current.destroy()
                viewRef.current = null
            }
        }
    }, [showLineNumbers]) // NEW: Add showLineNumbers to dependencies

    // Update document if value prop changes
    useEffect(() => {
        if (viewRef.current) {
            const currentValue = viewRef.current.state.doc.toString()
            if (value !== currentValue) {
                viewRef.current.dispatch({
                    changes: {
                        from: 0,
                        to: currentValue.length,
                        insert: value
                    }
                })
            }
        }
    }, [value])

    // Update language if prop changes
    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.dispatch({
                effects: languageCompartment.reconfigure(getLanguageExtension(language))
            })
        }
    }, [language])

    // Update listener if onChange changes
    useEffect(() => {
        if (viewRef.current) {
            const listener = EditorView.updateListener.of((update) => {
                if (update.docChanged && onChange) {
                    onChange(update.state.doc.toString())
                }
            })
            viewRef.current.dispatch({
                effects: listenerCompartment.reconfigure(listener)
            })
        }
    }, [onChange])

    // Update custom completions if prop changes
    useEffect(() => {
        if (viewRef.current) {
            let sources: CompletionSource[] = []
            if (language === "json" && customVariableCompletions) {
                sources.push(variableCompletionSource)
            }
            if (language === "javascript") {
                sources.push(jsCustomCompletionSource)
            }
            viewRef.current.dispatch({
                effects: completionCompartment.reconfigure(
                    sources.length > 0
                        ? autocompletion({ 
                            override: sources,
                            maxRenderedOptions: 20,
                            optionClass: (completion) => {
                                return `cm-completionLabel-${completion.type || 'default'}`;
                            }
                        })
                        : autocompletion()
                )
            })
        }
    }, [customCompletions, customVariableCompletions, objectCompletions, reactiveVariables, availableModules, language])

    // Update placeholder if prop changes
    useEffect(() => {
        if (viewRef.current) {
            const placeholderExt = placeholder
                ? placeholderCompartment.reconfigure(cmPlaceholder(placeholder))
                : placeholderCompartment.reconfigure([])
            viewRef.current.dispatch({
                effects: placeholderExt
            })
        }
    }, [placeholder])

    // Update theme if prop changes
    useEffect(() => {
        if (viewRef.current) {
            const themeExt = theme
                ? themeCompartment.reconfigure(theme)
                : themeCompartment.reconfigure([])
            viewRef.current.dispatch({
                effects: themeExt
            })
        }
    }, [theme])

    // NEW: Update dimensions when props change
    useEffect(() => {
        if (viewRef.current) {
            const autoSizeExtensions = getAutoSizeExtensions(dimensions);
            viewRef.current.dispatch({
                effects: dimensionsCompartment.reconfigure(autoSizeExtensions)
            })
        }
    }, [dimensions])

    return (
        <div
            ref={editorRef}
            style={getEditorStyle(language, dimensions)}
        />
    )
}