import React, { useRef, useEffect } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { lineNumbers } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { EditorState, Compartment, Extension } from '@codemirror/state'
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { xml } from "@codemirror/lang-xml"
import { indentWithTab } from '@codemirror/commands'
import { autocompletion, Completion, CompletionSource } from '@codemirror/autocomplete'
import { placeholder as cmPlaceholder } from '@codemirror/view'

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
    language?: 'javascript' | 'json' | 'xml' | 'text' | 'url'
    customCompletions?: Completion[]
    customVariableCompletions?: string[]
    objectCompletions?: { object: string, methods: Completion[] }[]
    placeholder?: string
    theme?: Extension
    dimensions?: EditorDimensions // NEW: flexible dimensions
}

function getLanguageExtension(language: string | undefined): Extension {
    switch (language) {
        case 'json':
            return json()
        case 'xml':
            return xml()
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
    
    // Build style object
    const style: React.CSSProperties = {
        border: '1px solid #ccc',
        fontFamily: 'monospace',
        fontSize: `${defaultFontSize}px`, // Ensure consistent font size
        width: '100%', // Always constrain to container width
        boxSizing: 'border-box'
    };

    if (dimensions) {
        // Apply custom dimensions with font context
        if (dimensions.width !== undefined) {
            style.width = getDimensionValue(dimensions.width, fontContext);
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
        }
        
        if (dimensions.maxHeight !== undefined) {
            style.maxHeight = getDimensionValue(dimensions.maxHeight, fontContext);
        }
        
        // Auto sizing
        if (dimensions.autoHeight) {
            style.height = 'auto';
            // Convert minHeight to pixels for reliability
            const computedMinHeight = getDimensionValue(dimensions.minHeight, fontContext) || '60px';
            style.minHeight = computedMinHeight;
        }
        
        if (dimensions.autoWidth) {
            style.width = 'auto';
            const computedMinWidth = getDimensionValue(dimensions.minWidth, fontContext) || '200px';
            style.minWidth = computedMinWidth;
        }
    } else {
        // Default behavior when no dimensions specified
        style.height = isUrl ? 'auto' : '400px';
        if (isUrl) {
            style.minHeight = '32px';
        }
    }

    return style;
}

function getAutoSizeExtensions(dimensions?: EditorDimensions): Extension[] {
    const extensions: Extension[] = [];
    
    if (dimensions?.autoHeight || dimensions?.autoWidth) {
        // Convert relative units to pixels for CodeMirror theme
        const fontContext = { fontSize: 14 };
        
        extensions.push(
            EditorView.theme({
                '.cm-editor': {
                    ...(dimensions.autoHeight && { 
                        height: 'auto',
                        width: '100%', // Ensure it doesn't exceed container width
                        '& .cm-scroller': { 
                            overflow: 'auto',
                            maxHeight: dimensions.maxHeight ? getDimensionValue(dimensions.maxHeight, fontContext) : 'none'
                        }
                    }),
                    ...(dimensions.autoWidth && { 
                        width: 'auto',
                        '& .cm-scroller': { 
                            overflowX: 'auto',
                            maxWidth: dimensions.maxWidth ? getDimensionValue(dimensions.maxWidth, fontContext) : 'none'
                        }
                    })
                },
                '.cm-content': {
                    ...(dimensions.autoHeight && { 
                        minHeight: getDimensionValue(dimensions.minHeight, fontContext) || '56px' // 4em ≈ 56px at 14px font
                    }),
                    ...(dimensions.autoWidth && { 
                        minWidth: getDimensionValue(dimensions.minWidth, fontContext) || '200px' 
                    })
                },
                // Add width constraints to prevent overflow
                '.cm-scroller': {
                    width: '100%',
                    boxSizing: 'border-box'
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
    placeholder,
    theme,
    dimensions // NEW
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
        // Check for object member completion (e.g., volt.)
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
        // Top-level identifier completions: suggest all object names from objectCompletions
        const before = context.matchBefore(/[a-zA-Z_$][\w$]*$/)
        if (before && (!context.explicit && before.from === before.to)) return null
        if (before) {
            // Collect all object names as completions
            const objectLabels = (objectCompletions ?? []).map(o => o.object)
            const objectCompletionsList = (objectCompletions ?? []).map(o => ({
                label: o.object,
                type: "variable",
                info: `Global ${o.object} object`,
                apply: o.object
            }))
            // Optionally merge with customCompletions (excluding duplicates)
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
                        customCompletions || customVariableCompletions
                            ? autocompletion({ override: [jsCustomCompletionSource, variableCompletionSource] })
                            : []
                    ),
                    dimensionsCompartment.of(autoSizeExtensions), // NEW: dimensions
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
    }, [])

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
            let sources: CompletionSource[] = []
            if (language === "json" && customVariableCompletions) {
                sources.push(variableCompletionSource)
            }
            if (language === "javascript" && (customCompletions || objectCompletions)) {
                sources.push(jsCustomCompletionSource)
            }
            viewRef.current.dispatch({
                effects: completionCompartment.reconfigure(
                    sources.length
                        ? autocompletion({ override: sources })
                        : []
                )
            })
        }
    }, [customCompletions, customVariableCompletions, objectCompletions, language])

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