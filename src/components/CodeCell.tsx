import React, { useEffect, useState, useCallback } from 'react';
import { useReactiveSystem, useReactiveValue } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { CodeCellDefinition } from '@/Types/NotebookModel';
import { log } from './DynamicNotebook';
import { ObjectDisplay } from './ObjectDisplay';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import ConsoleOutput from './ConsoleOutput';
import { PlayIcon } from '@heroicons/react/24/solid';
import { Button } from './ui/button';
import { DomElementDisplay } from './DomElementDisplay';
import { CodeSummary } from './CodeSummary';
import { useCodeCompletions, useModuleCompletions } from '@/hooks/useCodeCompletions';
import { useEnhancedCompletions } from '@/hooks/useRuntimeCompletions';
import { LatexRenderer, isLatexContent, renderMixedContent } from './LatexRenderer';

interface CodeCellProps {
  definition: CodeCellDefinition;
  initialized: boolean;
  isEditMode?: boolean; // NEW: Add isEditMode prop
}

// Add CodeCell component for display purposes
export function CodeCell({ definition, initialized, isEditMode = false }: CodeCellProps) {
    const { codeCellEngine } = useReactiveSystem();
    const { updateCell } = useApplication();

    // Get code completions for IntelliSense
    const codeCompletions = useCodeCompletions();
    const moduleCompletions = useModuleCompletions();
    const runtimeCompletions = useEnhancedCompletions(definition.id);

    // Subscribe to execution count to know when cell re-executes
    const [executionCount] = useReactiveValue(`__cell_${definition.id}_execution`, 0);
    
    // Debug log execution count changes
    useEffect(() => {
        console.log('🎯 CodeCell execution count changed for', definition.id, ':', executionCount);
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
    const [error, setError] = React.useState<Error | null>(null);
    const [dependencies, setDependencies] = React.useState<string[]>([]);
    const [consoleOutput, setConsoleOutput] = React.useState<any[]>([]);
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
            setError(null);
            const newExports = codeCellEngine.getCellExports(definition.id);
            const newDependencies = codeCellEngine.getCellDependencies(definition.id);
            const rawOutput = codeCellEngine.getCellOutput(definition.id);
            const cellOutputValues = codeCellEngine.getCellOutputValues(definition.id);

            setExports(newExports);
            setDependencies(newDependencies);
            setConsoleOutput(rawOutput);
            setOutputValues(cellOutputValues);

            log.debug(`Code cell ${definition.id} UI updated after execution:`, {
                exports: newExports,
                dependencies: newDependencies,
                outputValues: cellOutputValues,
                executionCount
            });

        } catch (err) {
            setError(err as Error);
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
        setIsStaticDirty(newIsStatic !== (definition.isStatic || false));
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
        // Commit any unsaved changes before executing
        if (isDirty || isStaticDirty) {
            commitChanges();
        }
        
        // Clear previous DOM output using predictable ID to avoid timing issues
        const outputContainerId = `${definition.id}-outEl`;
        const outputContainer = document.getElementById(outputContainerId);
        if (outputContainer) {
            outputContainer.innerHTML = '';
        } else if (outputContainerRef.current) {
            // Fallback to ref if ID lookup fails
            outputContainerRef.current.innerHTML = '';
        }
        
        // Execute with the current code and static flag
        try {
            await codeCellEngine.executeCodeCell(definition.id, currentCode, outputContainerRef.current || undefined, isStatic);
            log.debug(`Code cell ${definition.id} executed (static: ${isStatic})`);
        } catch (error) {
            log.error(`Error executing code cell ${definition.id}:`, error);
        }
    };

    return (
        <div className={`cell code-cell border rounded-lg mb-4 overflow-hidden ${
            isStatic 
                ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20' 
                : 'border-border bg-background'
        }`}>
            {/* Code Summary - styled like code comments */}
            <div className="flex items-center justify-between">
                <CodeSummary 
                    code={currentCode}
                    exports={exports}
                    dependencies={dependencies}
                />
                {(isDirty || isStaticDirty) && isEditMode && (
                    <div className="px-4 py-2">
                        <span className="text-orange-500 text-xs font-medium">
                            • Unsaved changes
                        </span>
                    </div>
                )}
            </div>

            {/* Code Editor (Edit Mode) */}
            {isEditMode && (
                <div className="code-content bg-background-secondary px-4 py-3 overflow-x-auto">
                    <Editor
                        value={currentCode}
                        language="javascript"
                        theme={oneDark}
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
                                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-secondary-foreground">
                                    Static mode (manual execution only)
                                </span>
                                {isStatic && (
                                    <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
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

            {/* DOM Output Container with predictable ID */}
            <div 
                id={`${definition.id}-outEl`}
                ref={outputContainerRef}
                className="dom-output-container bg-background border-t border-border"
                style={{ minHeight: '0px' }}
            />

            {/* Output Values Display - No explicit label */}
            {outputValues.length > 0 && (
                <div className="output-values bg-background-secondary  border-t border-border">
                    <div className="output-content ">
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
                                    <span className="text-accent-foreground font-mono text-sm">
                                        {value === null ? 'null' : String(value)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Console Output Display - Styled like terminal/log */}
            {consoleOutput.length > 0 && (
                <div className="console-output bg-muted/30 px-4 py-3 border-t border-border font-mono text-xs">
                    <div className="space-y-1">
                        {consoleOutput.map((output, index) => ConsoleOutput(output, index))}
                    </div>
                </div>
            )}

            {error && (
                <div className="code-error bg-destructive/10 border-t border-destructive px-4 py-3">
                    <div className="text-xs font-medium text-destructive mb-1">Execution Error:</div>
                    <div className="text-sm text-destructive">{error.message}</div>
                </div>
            )}
        </div>
    );
}
