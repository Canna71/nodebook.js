import React, { useEffect, useState, useCallback } from 'react';
import { useReactiveSystem, useReactiveValue } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { CodeCellDefinition } from '@/Types/NotebookModel';
import { log } from './DynamicNotebook';
import { ObjectDisplay } from './ObjectDisplay';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import { PlayIcon } from '@heroicons/react/24/solid';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import { DomElementDisplay } from './DomElementDisplay';
import { CodeSummary } from './CodeSummary';
import { useCodeCompletions, useModuleCompletions } from '@/hooks/useCodeCompletions';
import { useEnhancedCompletions } from '@/hooks/useRuntimeCompletions';
import { LatexRenderer, isLatexContent, renderMixedContent } from './LatexRenderer';
import { useTheme } from '@/lib/themeHelpers';

interface CodeCellProps {
  definition: CodeCellDefinition;
  initialized: boolean;
  isEditMode?: boolean;
  onExecuteRequested?: (executeCallback: () => Promise<void>) => void;
}

// Add CodeCell component for display purposes
export function CodeCell({ definition, initialized, isEditMode = false, onExecuteRequested }: CodeCellProps) {
    const { codeCellEngine } = useReactiveSystem();
    const { updateCell } = useApplication();
    
    // Get current theme for CodeMirror
    const currentTheme = useTheme();
    const editorTheme = currentTheme === 'dark' ? oneDark : undefined; // undefined for light mode (default)

    // Get code completions for IntelliSense
    const codeCompletions = useCodeCompletions();
    const moduleCompletions = useModuleCompletions();
    const runtimeCompletions = useEnhancedCompletions(definition.id);

    // Subscribe to execution count to know when cell re-executes
    const [executionCount] = useReactiveValue(`__cell_${definition.id}_execution`, 0);
    
    // Subscribe to error state from reactive system
    const [error] = useReactiveValue(`__cell_${definition.id}_error`, null);
    
    // Subscribe to execution state from reactive system
    const [executionState] = useReactiveValue(`__cell_${definition.id}_state`, 'idle');
    
    // Debug log error state changes
    useEffect(() => {
        log.debug('CodeCell error state changed for', definition.id, ':', error?.message || 'null');
    }, [error, definition.id]);
    
    // Debug log execution count changes (using log instead of console to avoid capture)
    useEffect(() => {
        log.debug('CodeCell execution count changed for', definition.id, ':', executionCount);
    }, [executionCount, definition.id]);

    // Local state for the code being edited
    const [currentCode, setCurrentCode] = useState(definition.code || '');
    const [isDirty, setIsDirty] = useState(false);
    
    // Static mode state management
    const [isStatic, setIsStatic] = useState(definition.isStatic || false);
    const [isStaticDirty, setIsStaticDirty] = useState(false);

    // Add ref for DOM output container
    const outputContainerRef = React.useRef<HTMLDivElement>(null);

    const [exports, setExports] = React.useState<string[]>([]);
    
    // Copy functionality for cell output
    const [isOutputHovered, setIsOutputHovered] = useState(false);
    const [hasDOMOutput, setHasDOMOutput] = useState(false);
    
    // Monitor DOM output container for content changes
    useEffect(() => {
        const container = outputContainerRef.current;
        if (!container) return;
        
        const observer = new MutationObserver(() => {
            setHasDOMOutput(container.innerHTML.trim().length > 0);
        });
        
        observer.observe(container, { 
            childList: true, 
            subtree: true, 
            characterData: true 
        });
        
        // Initial check
        setHasDOMOutput(container.innerHTML.trim().length > 0);
        
        return () => observer.disconnect();
    }, []);
    
    const copyOutputAsHTML = useCallback(async () => {
        try {
            // Get the DOM output container
            const domContainer = document.getElementById(`${definition.id}-outEl`);
            
            // Get the output values container
            const outputValuesContainer = document.querySelector(`#cell-${definition.id} .output-values`);
            
            // Get the error container if it exists
            const errorContainer = document.querySelector(`#cell-${definition.id} .code-error`);
            
            let htmlContent = '';
            
            // Add DOM output content
            if (domContainer && domContainer.innerHTML.trim()) {
                htmlContent += '<div class="dom-output">' + domContainer.innerHTML + '</div>';
            }
            
            // Add output values content
            if (outputValuesContainer) {
                htmlContent += '<div class="output-values">' + outputValuesContainer.innerHTML + '</div>';
            }
            
            // Add error content
            if (errorContainer) {
                htmlContent += '<div class="code-error">' + errorContainer.innerHTML + '</div>';
            }
            
            if (htmlContent) {
                // Create a complete HTML structure
                const fullHTML = `
                    <div class="notebook-cell-output">
                        ${htmlContent}
                    </div>
                `;
                
                // Copy as HTML
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([fullHTML], { type: 'text/html' }),
                        'text/plain': new Blob([[domContainer?.textContent || '', outputValuesContainer?.textContent || '', errorContainer?.textContent || ''].filter(Boolean).join('\n')], { type: 'text/plain' })
                    })
                ]);
                
                log.info('Cell output copied to clipboard as HTML');
            } else {
                log.warn('No output content to copy');
            }
        } catch (error) {
            log.error('Failed to copy cell output:', error);
            // Fallback to text copying
            try {
                const domContainer = document.getElementById(`${definition.id}-outEl`);
                const outputValuesContainer = document.querySelector(`#cell-${definition.id} .output-values`);
                const errorContainer = document.querySelector(`#cell-${definition.id} .code-error`);
                
                const textContent = [
                    domContainer?.textContent || '',
                    outputValuesContainer?.textContent || '',
                    errorContainer?.textContent || ''
                ].filter(Boolean).join('\n');
                
                if (textContent) {
                    await navigator.clipboard.writeText(textContent);
                    log.info('Cell output copied to clipboard as text (fallback)');
                }
            } catch (fallbackError) {
                log.error('Failed to copy cell output as text:', fallbackError);
            }
        }
    }, [definition.id]);
    const [dependencies, setDependencies] = React.useState<string[]>([]);
    const [outputValues, setOutputValues] = React.useState<any[]>([]);

    // Update local state when definition changes
    useEffect(() => {
        setCurrentCode(definition.code || '');
        setIsDirty(false);
        setIsStatic(definition.isStatic || false);
        setIsStaticDirty(false);
    }, [definition.code, definition.isStatic]);

    // Separate effect for initial setup - only runs once when initialized
    useEffect(() => {
        if (!initialized || !outputContainerRef.current) return;

        // Set up DOM container reference for future executions
        log.debug(`Code cell ${definition.id} setting up DOM container reference`);
        const cellInfo = codeCellEngine['executedCells'].get(definition.id);
        if (cellInfo) {
            cellInfo.lastOutputContainer = outputContainerRef.current;
        }
    }, [initialized, definition.id, codeCellEngine]);

    // Separate effect for execution count changes - only runs when cell is actually executed
    useEffect(() => {
        if (!initialized) return;

        try {
            const newExports = codeCellEngine.getCellExports(definition.id);
            const newDependencies = codeCellEngine.getCellDependencies(definition.id);
            const cellOutputValues = codeCellEngine.getCellOutputValues(definition.id);

            setExports(newExports);
            setDependencies(newDependencies);
            setOutputValues(cellOutputValues);

            log.debug(`Code cell ${definition.id} UI updated after execution:`, {
                exports: newExports,
                dependencies: newDependencies,
                outputValues: cellOutputValues,
                executionCount
            });

        } catch (err) {
            // Error state is now handled reactively, just reset the display state
            setExports([]);
            setDependencies([]);
            setOutputValues([]);
        }
    }, [initialized, definition.id, codeCellEngine, executionCount]);

    const onCodeChange = (newCode: string) => {
        // Update local state immediately for responsive editing
        setCurrentCode(newCode);
        
        // Mark as dirty if there are actual changes
        const hasChanges = newCode !== definition.code;
        setIsDirty(hasChanges);
        
        log.debug(`Code cell ${definition.id} code editing (dirty: ${hasChanges})`);
    };

    // Handle static mode toggle
    const onStaticToggle = (newIsStatic: boolean) => {
        setIsStatic(newIsStatic);
        const staticDirty = newIsStatic !== (definition.isStatic || false);
        setIsStaticDirty(staticDirty);
        
        log.debug(`Code cell ${definition.id} static mode toggle (static: ${newIsStatic})`);
    };

    // Commit changes to the cell definition and engine
    const commitChanges = useCallback(() => {
        if (!isDirty && !isStaticDirty) return;

        // Update the engine's internal tracking if code changed
        if (isDirty) {
            codeCellEngine.updateCodeCell(definition.id, currentCode);
        }
        
        // Update the notebook model through state manager
        const updates: Partial<CodeCellDefinition> = {};
        if (isDirty) {
            updates.code = currentCode;
        }
        if (isStaticDirty) {
            updates.isStatic = isStatic;
        }
        
        updateCell(definition.id, updates, 'Update code cell');
        
        setIsDirty(false);
        setIsStaticDirty(false);
        
        log.debug(`Code cell ${definition.id} changes committed`, updates);
    }, [isDirty, isStaticDirty, currentCode, isStatic, definition.id, codeCellEngine, updateCell]);

    // Discard changes and revert to saved state
    const discardChanges = useCallback(() => {
        setCurrentCode(definition.code);
        setIsStatic(definition.isStatic || false);
        setIsDirty(false);
        setIsStaticDirty(false);
        
        log.debug(`Code cell ${definition.id} changes discarded`);
    }, [definition.code, definition.isStatic, definition.id]);

    // Keyboard shortcuts for edit mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isEditMode || (!isDirty && !isStaticDirty)) return;
            
            // Ctrl+Enter or Cmd+Enter to apply changes
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                commitChanges();
            }
            
            // Escape to cancel changes
            if (e.key === 'Escape') {
                e.preventDefault();
                discardChanges();
            }
        };

        if (isEditMode) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isEditMode, isDirty, isStaticDirty, commitChanges, discardChanges]);

    const onExecute = async () => {
        // Prevent double execution
        if (executionState === 'running') {
            log.debug(`Code cell ${definition.id} is already executing, skipping`);
            return;
        }
        
        // Always commit current changes before executing (simplified approach)
        // Update the engine's internal tracking if code changed
        if (currentCode !== definition.code) {
            codeCellEngine.updateCodeCell(definition.id, currentCode);
        }
        
        // Update the notebook model through state manager
        const updates: Partial<CodeCellDefinition> = {};
        if (currentCode !== definition.code) {
            updates.code = currentCode;
        }
        if (isStatic !== (definition.isStatic || false)) {
            updates.isStatic = isStatic;
        }
        
        if (Object.keys(updates).length > 0) {
            updateCell(definition.id, updates, 'Auto-commit changes before execution');
        }
        
        // Reset dirty flags since we just committed
        setIsDirty(false);
        setIsStaticDirty(false);
        
        // Execute with the current code and static flag
        try {
            await codeCellEngine.executeCodeCell(definition.id, currentCode, outputContainerRef.current || undefined, isStatic);
            log.debug(`Code cell ${definition.id} executed (static: ${isStatic})`);
        } catch (error) {
            log.error(`Error executing code cell ${definition.id}:`, error);
        }
    };

    // Register execute callback for external use (play button)
    useEffect(() => {
        if (onExecuteRequested) {
            onExecuteRequested(onExecute);
        }
    }, [onExecuteRequested, onExecute]);

    // Clear output values immediately when execution starts (React state management)
    useEffect(() => {
        if (executionState === 'running') {
            setOutputValues([]);
            log.debug(`Code cell ${definition.id} output values cleared at execution start (React state)`);
        }
    }, [executionState, definition.id]);

    return (
        <div 
            id={`cell-${definition.id}`}
            className={`cell code-cell border rounded-lg mb-4 overflow-hidden ${
                error 
                    ? 'border-destructive bg-destructive/5 dark:bg-destructive/10' // Error state styling
                    : isStatic 
                        ? 'border-l-4 border-l-amber-400/60 border-border bg-background' 
                        : 'border-border bg-background'
            }`}
        >
            {/* Code Summary - hidden in reading mode via CSS */}
            <div className="flex items-center justify-between">
                <CodeSummary 
                    code={currentCode}
                    exports={exports}
                    dependencies={dependencies}
                    error={error}
                />
                {(isDirty || isStaticDirty) && isEditMode && (
                    <div className="px-4 py-2">
                        <span className="text-warning-accent text-xs font-medium">
                            • Unsaved changes
                        </span>
                    </div>
                )}
            </div>

            {/* Code Editor (Edit Mode) - hidden in reading mode via CSS */}
            {isEditMode && (
                <div className="code-content bg-background-secondary px-4 py-3 overflow-x-auto">
                    <Editor
                        value={currentCode}
                        language="javascript"
                        theme={editorTheme}
                        onChange={onCodeChange}
                        customCompletions={codeCompletions}
                        objectCompletions={moduleCompletions}
                        runtimeCompletions={runtimeCompletions}
                        dimensions={{
                            width: '100%',
                            minHeight: '100px',
                            autoHeight: true,
                            maxHeight: '600px'
                        }}
                    />
                    
                    {/* Static Mode Toggle - visible in edit mode */}
                    {isEditMode && (
                        <div className="mt-3 pt-2 border-t border-border">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={isStatic}
                                    onChange={(e) => onStaticToggle(e.target.checked)}
                                    className="rounded border-border text-warning-accent focus:ring-warning-accent"
                                />
                                <span className="text-secondary-foreground">
                                    Static mode (manual execution only)
                                </span>
                                {isStatic && (
                                    <span className="text-xs text-warning-accent bg-warning-accent/10 px-1.5 py-0.5 rounded">
                                        Static
                                    </span>
                                )}
                            </label>
                        </div>
                    )}
                    
                    {/* Action buttons - only show when there are changes */}
                    {(isDirty || isStaticDirty) && (
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                            <Button
                                onClick={commitChanges}
                                size="sm"
                                className="h-7 px-3 text-xs"
                                title="Apply changes (Ctrl+Enter)"
                            >
                                Apply Changes
                            </Button>
                            <Button
                                onClick={discardChanges}
                                variant="outline"
                                size="sm"
                                className="h-7 px-3 text-xs"
                                title="Cancel changes (Escape)"
                            >
                                Cancel
                            </Button>
                            <span className="text-xs text-secondary-foreground ml-2">
                                <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Ctrl+Enter</kbd> to apply, <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Esc</kbd> to cancel
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* DOM Output Container with predictable ID - ALWAYS RENDERED */}
            <div 
                id={`${definition.id}-outEl`}
                ref={outputContainerRef}
                className="dom-output-container bg-background border-t border-border"
                style={{ minHeight: '0px' }}
            />

            {/* Cell Output Section with Copy Button */}
            {(outputValues.length > 0 || error || hasDOMOutput) && (
                <div 
                    className="cell-output-section relative"
                    onMouseEnter={() => setIsOutputHovered(true)}
                    onMouseLeave={() => setIsOutputHovered(false)}
                >
                    {/* Copy Output Button */}
                    {isOutputHovered && (
                        <Button
                            onClick={copyOutputAsHTML}
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 z-10 h-6 w-6 p-0 opacity-70 hover:opacity-100 bg-background/80 backdrop-blur-sm border border-border/50"
                            title="Copy output as HTML"
                        >
                            <DocumentDuplicateIcon className="w-3 h-3" />
                        </Button>
                    )}

                    {/* Output Values Display - No explicit label */}
                    {outputValues.length > 0 && (
                        <div className="output-values bg-background-secondary border-t border-border">
                            <div className="output-content">
                                {outputValues.map((value, index) => (
                                    <div key={index} className="output-item px-4 py-1 [&:not(:last-child)]:border-b">
                                        {/* {outputValues.length > 1 && (
                                            <div className="text-xs text-secondary-foreground mb-1">#{index + 1}:</div>
                                        )} */}
                                        {value instanceof HTMLElement || value instanceof SVGElement ? (
                                            <DomElementDisplay
                                                element={value}
                                                name={false}
                                            />
                                        ) : typeof value === 'object' && value !== null ? (
                                            <ObjectDisplay
                                                data={value}
                                                name={false}
                                                collapsed={false}
                                                displayDataTypes={false}
                                                displayObjectSize={false} />
                                        ) : typeof value === 'string' && isLatexContent(value) ? (
                                            <div className="latex-output">
                                                {renderMixedContent(value)}
                                            </div>
                                        ) : (
                                            <span className="text-accent-foreground font-mono text-sm whitespace-pre-wrap">
                                                {value === null ? 'null' : String(value)}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="code-error bg-destructive/10 border-t border-destructive px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="text-xs font-medium text-destructive">Execution Error:</div>
                                <div className="text-xs text-muted-foreground">Check console for details</div>
                            </div>
                            <div className="text-sm text-foreground font-mono mt-1">
                                {error.message}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
