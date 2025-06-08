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
            // Look for patterns like "{{variable" or "{{var|filter" within markdown
            const beforeCursor = context.state.sliceDoc(0, context.pos);
            
            // Find the last occurrence of {{ before the cursor
            const lastOpenBrace = beforeCursor.lastIndexOf('{{');
            if (lastOpenBrace === -1) {
                return null; // Not inside a {{ block
            }
            
            // Check if there's a closing }} after the opening {{
            const afterOpenBrace = beforeCursor.slice(lastOpenBrace);
            const hasClosingBrace = afterOpenBrace.includes('}}');
            if (hasClosingBrace) {
                return null; // Already closed, no completion needed
            }
            
            // Extract the content after {{ up to the cursor
            const contentAfterBrace = beforeCursor.slice(lastOpenBrace + 2);
            
            // Check if we're before a pipe (filter syntax)
            const pipeIndex = contentAfterBrace.indexOf('|');
            const isBeforePipe = pipeIndex === -1 || context.pos <= lastOpenBrace + 2 + pipeIndex;
            
            if (!isBeforePipe) {
                return null; // Don't complete after pipe (filter section)
            }
            
            // Match the current word being typed
            const wordMatch = contentAfterBrace.match(/^([a-zA-Z_][a-zA-Z0-9_.]*)$/);
            if (!wordMatch && contentAfterBrace.trim() !== '') {
                return null; // Invalid variable name pattern
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
                    from: lastOpenBrace + 2, // Start after {{
                    to: context.pos, // End at cursor
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
