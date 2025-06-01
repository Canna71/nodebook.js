import React, { useRef, useEffect } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { lineNumbers } from '@codemirror/view' // For future use if needed
import { keymap } from '@codemirror/view'
import { EditorState, Compartment, Extension } from '@codemirror/state'
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { xml } from "@codemirror/lang-xml"
import { indentWithTab } from '@codemirror/commands'
import { autocompletion, Completion, CompletionSource } from '@codemirror/autocomplete'
import { placeholder as cmPlaceholder } from '@codemirror/view'

type EditorProps = {
    value: string
    onChange?: (value: string) => void
    language?: 'javascript' | 'json' | 'xml' | 'text' | 'url'
    customCompletions?: Completion[]
    customVariableCompletions?: string[]
    objectCompletions?: { object: string, methods: Completion[] }[]
    placeholder?: string // NEW
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

export default function Editor({
    value,
    onChange,
    language = 'javascript',
    customCompletions,
    customVariableCompletions,
    objectCompletions,
    placeholder // NEW
}: EditorProps) {
    const editorRef = useRef<HTMLDivElement | null>(null)
    const viewRef = useRef<EditorView | null>(null)

    // Compartments for dynamic reconfiguration
    const basicSetupCompartment = useRef(new Compartment()).current
    const languageCompartment = useRef(new Compartment()).current
    const listenerCompartment = useRef(new Compartment()).current
    const completionCompartment = useRef(new Compartment()).current
    const placeholderCompartment = useRef(new Compartment()).current // NEW

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
            let urlExtensions: any[] = []
            if (language === 'url') {
                urlExtensions = [
                    EditorView.lineWrapping,
                    EditorView.editable.of(true),
                    EditorView.contentAttributes.of({ spellCheck: 'false', autocorrect: 'off', autocomplete: 'off', autocapitalize: 'off' }),
                    EditorView.domEventHandlers({
                        paste(event, view) {
                            // Remove line breaks from pasted text
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
                        // Prevent line breaks
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
                        '.cm-lineNumbers': { display: 'none' } // Hides line numbers (extra safety)
                    }),
                ]
            }

            // Placeholder extension
            let placeholderExt = placeholder
                ? placeholderCompartment.of(cmPlaceholder(placeholder))
                : []

            const startState = EditorState.create({
                doc: value,
                extensions: [
                    basicSetupCompartment.of(
                        language === 'url'
                            ? [
                                keymap.of([indentWithTab]),
                                autocompletion(),
                                // Do NOT include lineNumbers() or basicSetup
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
                    ...urlExtensions,
                    placeholderExt
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
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return (
        <div
            ref={editorRef}
            style={{
                height: language === 'url' ? 'auto' : '400px',
                border: '1px solid #ccc',
                minHeight: language === 'url' ? '32px' : undefined,
                fontFamily: 'monospace'
            }}
        />
    )
}