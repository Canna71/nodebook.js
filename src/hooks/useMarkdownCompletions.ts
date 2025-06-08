import { useMemo } from 'react';
import { CompletionSource } from '@codemirror/autocomplete';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';

/**
 * Hook to generate autocompletion for markdown cells
 * Provides reactive variable completions within {{}} blocks
 */
export function useMarkdownCompletions() {
    const { reactiveStore } = useReactiveSystem();

    const markdownCompletionSource: CompletionSource = useMemo(() => {
        return (context) => {
            // Look for patterns like "{{variable" or "{{expr + var" within markdown
            const beforeCursor = context.state.sliceDoc(0, context.pos);
            
            // Find the last occurrence of {{ before the cursor
            const lastOpenBrace = beforeCursor.lastIndexOf('{{');
            if (lastOpenBrace === -1) {
                return null; // Not inside a {{ block
            }
            
            // Check if there's a closing }} between the {{ and cursor
            const afterOpenBrace = beforeCursor.slice(lastOpenBrace + 2);
            const closingBraceIndex = afterOpenBrace.indexOf('}}');
            if (closingBraceIndex !== -1 && lastOpenBrace + 2 + closingBraceIndex < context.pos) {
                return null; // Cursor is after the closing }}
            }
            
            // Extract the content after {{ up to the cursor
            const contentAfterBrace = beforeCursor.slice(lastOpenBrace + 2);
            
            // Check if we're before a pipe (filter syntax)
            const pipeIndex = contentAfterBrace.indexOf('|');
            const isBeforePipe = pipeIndex === -1 || context.pos <= lastOpenBrace + 2 + pipeIndex;
            
            if (!isBeforePipe) {
                return null; // Don't complete after pipe (filter section)
            }
            
            // Find the current word at cursor position within the {{ block
            // Look for word boundaries to determine completion range
            const textBeforePipe = pipeIndex >= 0 ? contentAfterBrace.slice(0, pipeIndex) : contentAfterBrace;
            
            // Match identifier pattern at cursor position
            const wordMatch = context.matchBefore(/[a-zA-Z_][a-zA-Z0-9_]*$/);
            
            // Determine completion range
            let completionFrom: number;
            let completionTo: number;
            
            if (wordMatch) {
                // We're in the middle of typing a word - complete from the start of the word
                completionFrom = wordMatch.from;
                completionTo = wordMatch.to;
            } else {
                // Check if cursor is in a valid position to start a new identifier
                const charBeforeCursor = context.pos > 0 ? beforeCursor[context.pos - 1] : '';
                const isValidStartPosition = (
                    context.pos === lastOpenBrace + 2 || // Right after {{
                    /[\s+\-*/()=<>!&|,.]/.test(charBeforeCursor) || // After operators or punctuation
                    charBeforeCursor === '' // At start of document
                );
                
                if (!isValidStartPosition) {
                    return null; // Not in a valid completion position
                }
                
                completionFrom = context.pos;
                completionTo = context.pos;
            }
            
            // Get all reactive variables
            try {
                const allVariables = reactiveStore.getAllVariableNames();
                const userVariables = allVariables.filter(varName => 
                    !varName.startsWith('__cell_') && 
                    !varName.startsWith('__formula_') &&
                    !varName.startsWith('__')
                );
                
                const completions = userVariables.map(varName => {
                    const value = reactiveStore.getValue(varName);
                    let info = `Reactive variable: ${varName}`;
                    
                    // Add type and value info
                    if (value !== undefined && value !== null) {
                        const type = typeof value;
                        if (type === 'object') {
                            if (Array.isArray(value)) {
                                info += ` - Array[${value.length}]`;
                            } else {
                                info += ` - Object`;
                            }
                        } else {
                            const valueStr = String(value);
                            const preview = valueStr.length > 30 ? valueStr.slice(0, 30) + '...' : valueStr;
                            info += ` - ${type} (${preview})`;
                        }
                    } else {
                        info += ` - ${value}`;
                    }
                    
                    return {
                        label: varName,
                        type: "variable",
                        info,
                        detail: "Reactive Variable",
                        apply: varName
                    };
                });
                
                // Only show completions if we have variables
                if (completions.length === 0) {
                    return null;
                }
                
                return {
                    from: completionFrom,
                    to: completionTo,
                    options: completions,
                    validFor: /^[a-zA-Z_][a-zA-Z0-9_.]*$/ // Valid characters for variable names
                };
            } catch (error) {
                console.warn('Error getting reactive variables for markdown completion:', error);
                return null;
            }
        };
    }, [reactiveStore]);

    return markdownCompletionSource;
}
