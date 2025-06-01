import React, { useEffect } from 'react';
import { useReactiveSystem, useReactiveValue } from '@/Engine/ReactiveProvider';
import { CodeCellDefinition } from '@/Types/NotebookModel';
import { log } from './DynamicNotebook';
import { ObjectDisplay } from './ObjectDisplay';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark'; // NEW: Import dark theme

// Add CodeCell component for display purposes
export function CodeCell({ definition, initialized }: { definition: CodeCellDefinition; initialized: boolean; }) {
    const { codeCellEngine } = useReactiveSystem();

    // Subscribe to execution count to know when cell re-executes
    const [executionCount] = useReactiveValue(`__cell_${definition.id}_execution`, 0);

    const [exports, setExports] = React.useState<string[]>([]);
    const [error, setError] = React.useState<Error | null>(null);
    const [dependencies, setDependencies] = React.useState<string[]>([]);
    const [consoleOutput, setConsoleOutput] = React.useState<any[]>([]);
    const [outputValues, setOutputValues] = React.useState<any[]>([]);

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
        } catch (err) {
            setError(err as Error);
            setExports([]);
            setDependencies([]);
            setOutputValues([]);
        }
    }, [initialized, definition.id, codeCellEngine, executionCount]);

    // Render individual console output line
    const renderConsoleOutput = (output: any, index: number) => {
        const prefix = output.type === 'log' ? '' : `[${output.type.toUpperCase()}] `;

        if (output.isObject && output.data) {
            return (
                <div key={index} className="console-line mb-3">
                    <div className="mb-1">
                        <span className="text-xs text-primary">{prefix}</span>
                    </div>
                    <div className="ml-0">
                        {Array.isArray(output.data) ? (
                            // Mixed arguments - render each one appropriately
                            <div className="space-y-2">
                                {output.data.map((arg: any, argIndex: number) => (
                                    <div key={argIndex}>
                                        {arg.type === 'object' ? (
                                            <ObjectDisplay
                                                data={arg.data}
                                                name={false}
                                                collapsed={false}
                                                displayDataTypes={false}
                                                displayObjectSize={false} />
                                        ) : (
                                            <span className="text-accent font-mono text-sm">{arg.message}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Single object
                            <ObjectDisplay
                                data={output.data}
                                name={false}
                                collapsed={false}
                                displayDataTypes={false}
                                displayObjectSize={false} />
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div key={index} className="console-line">
                <span className="text-xs">{prefix}{output.message}</span>
            </div>
        );
    };

    return (
        <div className="cell code-cell border border-border rounded-lg mb-4 bg-white">
            <div className="code-header bg-background-secondary px-4 py-2 border-b border-border">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-secondary">Code Cell: {definition.id}</span>
                    {dependencies.length > 0 && (
                        <span className="text-xs text-primary">
                            Dependencies: {dependencies.join(', ')}
                        </span>
                    )}
                </div>
                {exports.length > 0 && (
                    <div className="mt-1 text-xs text-primary">
                        <strong>Exports:</strong> {exports.join(', ')}
                    </div>
                )}
            </div>

            <pre className="code-content bg-background-secondary px-4 py-3 overflow-x-auto">
                {/* <code>{definition.code}</code> */}
                <Editor
                    value={definition.code}
                    language="javascript"
                    theme={oneDark} // NEW: Apply dark theme
                    />
            </pre>

            {/* --- Enhanced Output Values Display --- */}
            {outputValues.length > 0 && (
                <div className="output-values bg-background-secondary px-4 py-3 border-t border-border">
                    <div className="text-xs font-medium text-primary mb-2">
                        Output Values {outputValues.length > 1 && `(${outputValues.length})`}:
                    </div>
                    <div className="output-content space-y-2">
                        {outputValues.map((value, index) => (
                            <div key={index} className="output-item">
                                {outputValues.length > 1 && (
                                    <div className="text-xs text-accent mb-1">#{index + 1}:</div>
                                )}
                                {typeof value === 'object' && value !== null ? (
                                    <ObjectDisplay
                                        data={value}
                                        name={false}
                                        collapsed={false}
                                        displayDataTypes={false}
                                        displayObjectSize={false} />
                                ) : (
                                    <span className="text-blue-700 font-mono text-sm">
                                        {value === null ? 'null' : String(value)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Console Output Display */}
            {consoleOutput.length > 0 && (
                <div className="console-output bg-black text-green-400 px-4 py-3 border-t border-gray-700">
                    <div className="text-xs font-medium text-gray-300 mb-2">Console Output:</div>
                    <div className="space-y-1">
                        {consoleOutput.map((output, index) => renderConsoleOutput(output, index))}
                    </div>
                </div>
            )}

            {error && (
                <div className="code-error bg-red-50 border-t border-red-200 px-4 py-3">
                    <div className="text-xs font-medium text-red-800 mb-1">Execution Error:</div>
                    <div className="text-sm text-red-700">{error.message}</div>
                </div>
            )}
        </div>
    );
}
