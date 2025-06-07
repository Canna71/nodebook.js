import React, { useEffect, useState } from 'react';
import { useReactiveSystem, useReactiveValue } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { CodeCellDefinition } from '@/Types/NotebookModel';
import { log } from './DynamicNotebook';
import { ObjectDisplay } from './ObjectDisplay';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import ConsoleOutput from './ConsoleOutput';
import { PlayIcon } from '@heroicons/react/24/solid';
import { DomElementDisplay } from './DomElementDisplay';
import { CodeSummary } from './CodeSummary';

interface CodeCellProps {
  definition: CodeCellDefinition;
  initialized: boolean;
  isEditMode?: boolean; // NEW: Add isEditMode prop
}

// Add CodeCell component for display purposes
export function CodeCell({ definition, initialized, isEditMode = false }: CodeCellProps) {
    const { codeCellEngine, reactiveStore } = useReactiveSystem();
    const { currentModel, setModel, setDirty } = useApplication();

    // Subscribe to execution count to know when cell re-executes
    const [executionCount] = useReactiveValue(`__cell_${definition.id}_execution`, 0);

    // Local state for the code being edited
    const [currentCode, setCurrentCode] = useState(definition.code);

    // Add ref for DOM output container
    const outputContainerRef = React.useRef<HTMLDivElement>(null);

    const [exports, setExports] = React.useState<string[]>([]);
    const [error, setError] = React.useState<Error | null>(null);
    const [dependencies, setDependencies] = React.useState<string[]>([]);
    const [consoleOutput, setConsoleOutput] = React.useState<any[]>([]);
    const [outputValues, setOutputValues] = React.useState<any[]>([]);

    // Update local state when definition changes
    useEffect(() => {
        setCurrentCode(definition.code);
    }, [definition.code]);

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

            log.debug(`Code cell ${definition.id} UI updated:`, {
                exports: newExports,
                dependencies: newDependencies,
                outputValues: cellOutputValues
            });

            // Execute the cell with DOM container when component first mounts and is initialized
            // This ensures DOM output works from the start
            if (outputContainerRef.current && executionCount === 0) {
                log.debug(`Code cell ${definition.id} executing for the first time with DOM container`);
                codeCellEngine.executeCodeCell(definition.id, currentCode, outputContainerRef.current);
            }

        } catch (err) {
            setError(err as Error);
            setExports([]);
            setDependencies([]);
            setOutputValues([]);
        }
    }, [initialized, definition.id, codeCellEngine, executionCount, currentCode]);

    // Get available reactive variables for intellisense
    const [reactiveVariables, setReactiveVariables] = React.useState<string[]>([]);
    const [availableModules, setAvailableModules] = React.useState<string[]>([]);

    // Update reactive variables list when reactive store changes
    useEffect(() => {
        try {
            const variables = reactiveStore.getAllVariableNames();
            console.log('🔍 All variables from store:', variables);
            
            // Filter out internal variables
            const userVariables = variables.filter(name => 
                !name.startsWith('__cell_') && 
                !name.startsWith('__internal_')
            );
            console.log('✅ User variables for intellisense:', userVariables);
            
            setReactiveVariables(userVariables);
        } catch (error) {
            console.error('❌ Failed to get reactive variables for intellisense:', error);
            log.warn('Failed to get reactive variables for intellisense:', error);
        }
    }, [reactiveStore, executionCount]);

    // Get available modules
    useEffect(() => {
        try {
            const modules = codeCellEngine.getAvailableModules();
            console.log('📦 Available modules for intellisense:', modules);
            setAvailableModules(modules);
        } catch (error) {
            console.error('❌ Failed to get available modules for intellisense:', error);
            log.warn('Failed to get available modules for intellisense:', error);
        }
    }, [codeCellEngine]);

    // Define object completions for common APIs
    const objectCompletions = React.useMemo(() => [
        {
            object: 'dfd',
            methods: [
                { label: 'DataFrame', type: 'class', info: 'Create a new DataFrame' },
                { label: 'Series', type: 'class', info: 'Create a new Series' },
                { label: 'read_csv', type: 'function', info: 'Read CSV file into DataFrame' },
                { label: 'read_json', type: 'function', info: 'Read JSON file into DataFrame' },
                { label: 'concat', type: 'function', info: 'Concatenate DataFrames' },
                { label: 'merge', type: 'function', info: 'Merge DataFrames' }
            ]
        }
    ], []);

    const onCodeChange = (newCode: string) => {
        // Update local state immediately for responsive editing
        setCurrentCode(newCode);
        
        // Update the engine's internal tracking
        codeCellEngine.updateCodeCell(definition.id, newCode);
        
        // Update the notebook model to persist changes
        if (currentModel) {
            const updatedModel = {
                ...currentModel,
                cells: currentModel.cells.map(cell => 
                    cell.id === definition.id 
                        ? { ...cell, code: newCode }
                        : cell
                )
            };
            setModel(updatedModel);
            setDirty(true);
        }
        
        log.debug(`Code cell ${definition.id} code updated`);
    };

    const onExecute = () => {
        // Clear previous DOM output
        if (outputContainerRef.current) {
            outputContainerRef.current.innerHTML = '';
        }
        
        // Execute with the current code (which might be different from definition.code)
        codeCellEngine.executeCodeCell(definition.id, currentCode, outputContainerRef.current || undefined);
        log.debug(`Code cell ${definition.id} executed with current code`);
    };

    return (
        <div className="cell code-cell border border-border rounded-lg mb-4 bg-background overflow-hidden">
            {/* Code Summary - styled like code comments */}
            <CodeSummary 
                code={currentCode}
                exports={exports}
                dependencies={dependencies}
            />

            {/* Code Editor (Edit Mode) */}
            {isEditMode && (
                <div className="code-content bg-background-secondary px-4 py-3 overflow-x-auto">
                    <Editor
                        value={currentCode}
                        language="javascript"
                        theme={oneDark}
                        onChange={onCodeChange}
                        reactiveVariables={reactiveVariables}
                        availableModules={availableModules}
                        objectCompletions={objectCompletions}
                        dimensions={{
                            width: '100%',
                            minHeight: '100px',
                            autoHeight: true,
                            maxHeight: '600px'
                        }}
                    />
                </div>
            )}

            {/* DOM Output Container */}
            <div 
                ref={outputContainerRef}
                className="dom-output-container bg-background border-t border-border"
                style={{ minHeight: '0px' }}
            />

            {/* Output Values Display - No explicit label */}
            {outputValues.length > 0 && (
                <div className="output-values bg-background-secondary px-4 py-3 border-t border-border">
                    <div className="output-content space-y-2">
                        {outputValues.map((value, index) => (
                            <div key={index} className="output-item">
                                {outputValues.length > 1 && (
                                    <div className="text-xs text-secondary-foreground mb-1">#{index + 1}:</div>
                                )}
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
