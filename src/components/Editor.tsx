import React, { useRef, useEffect } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { lineNumbers } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { EditorState, Compartment, Extension } from '@codemirror/state'
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { xml } from "@codemirror/lang-xml"
import { markdown } from "@codemirror/lang-markdown" // NEW: Add markdown support
import { indentWithTab } from '@codemirror/commands'
import { autocompletion, Completion, CompletionSource, completionKeymap } from '@codemirror/autocomplete'
import { placeholder as cmPlaceholder } from '@codemirror/view'
import { syntaxTree } from "@codemirror/language"

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
    language?: 'javascript' | 'json' | 'xml' | 'text' | 'url' | 'markdown' // NEW: Add markdown
    customCompletions?: Completion[]
    customVariableCompletions?: string[]
    objectCompletions?: { object: string, methods: Completion[] }[]
    runtimeCompletions?: { 
        getObjectCompletions: (objectPath: string) => Promise<Completion[]>;
        getScopeVariables?: () => Promise<Completion[]>;
    }
    markdownCompletions?: CompletionSource // NEW: Add markdown completion source
    placeholder?: string
    theme?: Extension
    dimensions?: EditorDimensions
    showLineNumbers?: boolean // NEW: Option to hide line numbers
}

function getLanguageExtension(
    language: string | undefined, 
    customCompletions?: Completion[], 
    objectCompletions?: { object: string, methods: Completion[] }[],
    runtimeCompletions?: { 
        getObjectCompletions: (objectPath: string) => Promise<Completion[]>;
        getScopeVariables?: () => Promise<Completion[]>;
    },
    markdownCompletions?: CompletionSource
): Extension {
    switch (language) {
        case 'json':
            return json()
        case 'xml':
            return xml()
        case 'markdown': // NEW: Add markdown case with completion support
            if (markdownCompletions) {
                return [markdown(), autocompletion({ override: [markdownCompletions] })]
            }
            return markdown()
        case 'text':
            return [] // plain text, no language extension
        case 'url':
            return [] // plain text, no language extension
        case 'javascript':
        default:
            const jsLang = javascript({ typescript: true })
            
            // If we have any completions, add them to the language data
            if (customCompletions || objectCompletions || runtimeCompletions) {
                // Create a single comprehensive completion source
                const combinedCompletionSource = async (context: any) => {
                    try {
                        // Check for object member completion (e.g., Math.)
                        const objectAccess = context.matchBefore(/([a-zA-Z_$][\w$]*)\.\w*$/)
                        if (objectAccess) {
                            const objectName = objectAccess.text.split('.')[0]
                            const fromPos = objectAccess.from + objectName.length + 1; // after "object."
                            
                            // Try runtime completions first
                            if (runtimeCompletions) {
                                try {
                                    const runtimeResults = await runtimeCompletions.getObjectCompletions(objectName)
                                    
                                    if (Array.isArray(runtimeResults) && runtimeResults.length > 0) {
                                        // Validate each completion item
                                        const validResults = runtimeResults.filter(item => 
                                            item && 
                                            typeof item === 'object' && 
                                            typeof item.label === 'string' && 
                                            item.label.length > 0 &&
                                            typeof item.type === 'string' &&
                                            typeof item.info === 'string'
                                        ).map(item => ({
                                            label: item.label,
                                            type: item.type,
                                            info: item.info,
                                            detail: item.detail || 'Runtime',
                                            apply: item.apply || item.label
                                        }))
                                        
                                        if (validResults.length > 0) {
                                            return {
                                                from: fromPos,
                                                options: validResults
                                            }
                                        }
                                    }
                                } catch (error) {
                                    // Silently ignore runtime completion errors
                                }
                            }
                            
                            // Fallback to static object completions
                            if (objectCompletions && Array.isArray(objectCompletions)) {
                                for (const obj of objectCompletions) {
                                    if (obj && obj.object === objectName && obj.methods && Array.isArray(obj.methods)) {
                                        const validMethods = obj.methods.filter(method => 
                                            method && 
                                            typeof method === 'object' &&
                                            typeof method.label === 'string' && 
                                            method.label.length > 0
                                        )
                                        
                                        if (validMethods.length > 0) {
                                            return {
                                                from: fromPos,
                                                options: validMethods
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Top-level identifier completions
                        const before = context.matchBefore(/[a-zA-Z_$][\w$]*$/)
                        if (before) {
                            // Only show our custom completions for explicit requests or longer matches
                            // This allows built-in JS completions to show for short inputs
                            if (context.explicit || before.to - before.from >= 2) {
                                const allOptions: any[] = []
                                
                                // Add object names as completions
                                if (objectCompletions && Array.isArray(objectCompletions)) {
                                    const objectCompletionsList = objectCompletions
                                        .filter(o => o && o.object && typeof o.object === 'string')
                                        .map(o => ({
                                            label: o.object,
                                            type: "variable",
                                            info: `Global ${o.object} object`,
                                            apply: o.object
                                        }))
                                    allOptions.push(...objectCompletionsList)
                                }
                                
                                // Add custom completions (includes reactive variables from useCodeCompletions)
                                if (customCompletions && Array.isArray(customCompletions)) {
                                    const objectLabels = allOptions.map(opt => opt.label)
                                    const customList = customCompletions
                                        .filter(c => 
                                            c && 
                                            typeof c === 'object' &&
                                            typeof c.label === 'string' && 
                                            c.label.length > 0 &&
                                            !objectLabels.includes(c.label)
                                        )
                                    allOptions.push(...customList)
                                }
                                
                                // Add runtime scope variables (reactive variables + runtime exports)
                                // Only call once per completion session to prevent event loops
                                if (runtimeCompletions && runtimeCompletions.getScopeVariables && context.explicit) {
                                    try {
                                        const scopeVars = await runtimeCompletions.getScopeVariables()
                                        if (Array.isArray(scopeVars)) {
                                            const existingLabels = new Set(allOptions.map(opt => opt.label))
                                            const scopeList = scopeVars
                                                .filter(v => 
                                                    v && 
                                                    typeof v === 'object' &&
                                                    typeof v.label === 'string' && 
                                                    v.label.length > 0 &&
                                                    !existingLabels.has(v.label)
                                                )
                                            allOptions.push(...scopeList)
                                        }
                                    } catch (error) {
                                        // Silently ignore errors to prevent console noise
                                    }
                                }
                                
                                if (allOptions.length > 0) {
                                    return {
                                        from: before.from,
                                        options: allOptions
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        // Silently ignore completion errors to prevent console noise
                    }
                    
                    return null
                }
                
                return [
                    jsLang,
                    jsLang.language.data.of({
                        autocomplete: combinedCompletionSource
                    })
                ]
            }
            
            return jsLang
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

export default function Editor({
    value,
    onChange,
    language = 'javascript',
    customCompletions,
    customVariableCompletions,
    objectCompletions,
    runtimeCompletions,
    markdownCompletions,
    placeholder,
    theme,
    dimensions,
    showLineNumbers = true // NEW: Default to true for backward compatibility
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

    // Custom completions for JavaScript: context-aware (top-level and after object.)
    const jsCustomCompletionSource: CompletionSource = (context) => {
        // Check for object member completion (e.g., Math.)
        if (objectCompletions && objectCompletions.length > 0) {
            for (const obj of objectCompletions) {
                const regex = new RegExp(`${obj.object.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.\\w*$`)
                const afterDot = context.matchBefore(regex)
                if (afterDot) {
                    return {
                        from: afterDot.from + obj.object.length + 1, // after "object."
                        options: obj.methods
                    }
                }
            }
        }
        
        // Top-level identifier completions
        const before = context.matchBefore(/[a-zA-Z_$][\w$]*$/)
        if (before) {
            // Only show our custom completions for explicit requests or longer matches
            // This allows built-in JS completions to show for short inputs
            if (context.explicit || before.to - before.from >= 2) {
                // Collect all object names as completions
                const objectLabels = (objectCompletions ?? []).map(o => o.object)
                const objectCompletionsList = (objectCompletions ?? []).map(o => ({
                    label: o.object,
                    type: "variable",
                    info: `Global ${o.object} object`,
                    apply: o.object
                }))
                // Merge with customCompletions (excluding duplicates)
                const customList = (customCompletions ?? []).filter(
                    c => !objectLabels.includes(c.label)
                )
                
                if (objectCompletionsList.length > 0 || customList.length > 0) {
                    return {
                        from: before.from,
                        options: [...objectCompletionsList, ...customList]
                    }
                }
            }
        }
        return null
    }

    // Initialize editor
    useEffect(() => {
        if (editorRef.current && !viewRef.current) {
            const listener = EditorView.updateListener.of((update) => {
                if (update.docChanged && onChange) {
                    const doc = update.state.doc.toString()
                    onChange(doc)
                }
            })

            // Setup extensions for URL mode
            let urlExtensions: Extension[] = []
            if (language === 'url') {
                urlExtensions = [
                    EditorView.lineWrapping,
                    EditorView.editable.of(true),
                    EditorView.contentAttributes.of({ spellCheck: 'false', autocorrect: 'off', autocomplete: 'off', autocapitalize: 'off' }),
                    EditorView.domEventHandlers({
                        paste(event, view) {
                            const text = event.clipboardData?.getData('text/plain') ?? ''
                            if (text.includes('\n')) {
                                event.preventDefault()
                                view.dispatch({
                                    changes: { from: view.state.selection.main.from, to: view.state.selection.main.to, insert: text.replace(/\n/g, '') }
                                })
                                return true
                            }
                            return false
                        }
                    }),
                    EditorView.inputHandler.of((view, from, to, text) => {
                        if (text.includes('\n')) {
                            view.dispatch({
                                changes: { from, to, insert: text.replace(/\n/g, '') }
                            })
                            return true
                        }
                        return false
                    }),
                    EditorView.theme({
                        '.cm-content': { whiteSpace: 'pre', overflowX: 'auto' },
                        '.cm-lineNumbers': { display: 'none' }
                    }),
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

            const startState = EditorState.create({
                doc: value,
                extensions: [
                    basicSetupCompartment.of(
                        language === 'url'
                            ? [
                                keymap.of([indentWithTab, ...completionKeymap]),
                                autocompletion(),
                            ]
                            : [
                                basicSetup,
                                keymap.of([indentWithTab, ...completionKeymap]),
                                autocompletion({
                                    activateOnTyping: true,
                                    closeOnBlur: false,
                                    icons: true,
                                    defaultKeymap: true,
                                    maxRenderedOptions: 100
                                })
                            ]
                    ),
                    languageCompartment.of(getLanguageExtension(language, customCompletions, objectCompletions, runtimeCompletions, markdownCompletions)),
                    listenerCompartment.of(listener),
                    // Setup completion compartment for JSON variable completions only
                    completionCompartment.of(
                        language === 'json' && customVariableCompletions
                            ? autocompletion({ override: [variableCompletionSource] })
                            : []
                    ),
                    dimensionsCompartment.of(autoSizeExtensions),
                    lineNumbersExt, // NEW: Line numbers control
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
                effects: languageCompartment.reconfigure(getLanguageExtension(language, customCompletions, objectCompletions, runtimeCompletions, markdownCompletions))
            })
        }
    }, [language, customCompletions, objectCompletions, runtimeCompletions, markdownCompletions])

    // Update listener if onChange changes
    useEffect(() => {
        if (viewRef.current) {
            const listener = EditorView.updateListener.of((update) => {
                if (update.docChanged && onChange) {
                    const doc = update.state.doc.toString()
                    onChange(doc)
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
            if (language === "json" && customVariableCompletions) {
                // For JSON, override the default completions with variable completions
                viewRef.current.dispatch({
                    effects: completionCompartment.reconfigure(
                        autocompletion({ override: [variableCompletionSource] })
                    )
                })
            } else {
                // For other languages, completions are handled in language extension
                viewRef.current.dispatch({
                    effects: completionCompartment.reconfigure([])
                })
            }
        }
    }, [customVariableCompletions, language])

    // Update placeholder if prop changes
    useEffect(() => {
        if (viewRef.current) {
            if (placeholder) {
                viewRef.current.dispatch({
                    effects: placeholderCompartment.reconfigure(cmPlaceholder(placeholder))
                })
            } else {
                viewRef.current.dispatch({
                    effects: placeholderCompartment.reconfigure([])
                })
            }
        }
    }, [placeholder])

    // Update theme if prop changes
    useEffect(() => {
        if (viewRef.current) {
            viewRef.current.dispatch({
                effects: themeCompartment.reconfigure(theme || [])
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