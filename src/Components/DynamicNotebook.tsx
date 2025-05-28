import React, { useEffect } from 'react';
import { NotebookModel, CellDefinition, InputCellDefinition, MarkdownCellDefinition, FormulaCellDefinition, CodeCellDefinition } from '../Types/NotebookModel';
import { useReactiveSystem, useReactiveValue, useReactiveFormula } from '../Engine/ReactiveProvider';
import { renderMarkdownWithValues } from '../Engine/markdown';
import { ObjectDisplay } from './ObjectDisplay';

interface DynamicNotebookProps {
  model: NotebookModel;
}

export function DynamicNotebook({ model }: DynamicNotebookProps) {
  const { reactiveStore, formulaEngine, codeCellEngine } = useReactiveSystem();
  const [initialized, setInitialized] = React.useState(false);

  // Initialize reactive values and formulas
  useEffect(() => {
    const initializeNotebook = async () => {
      // Initialize reactive values first
      model.reactiveValues.forEach(valueDefinition => {
        if (!reactiveStore.get(valueDefinition.name)) {
          reactiveStore.define(valueDefinition.name, valueDefinition.defaultValue);
        }
      });

      // Initialize formulas after reactive values
      model.formulas.forEach(formulaDefinition => {
        formulaEngine.createFormula(formulaDefinition.name, formulaDefinition.formula);
      });

      // Execute all code cells during initialization
      const codeCells = model.cells.filter(cell => cell.type === 'code') as CodeCellDefinition[];
      for (const codeCell of codeCells) {
        try {
          const exports = codeCellEngine.executeCodeCell(codeCell.id, codeCell.code);
          console.log(`Code cell ${codeCell.id} executed, exports:`, exports);
        } catch (error) {
          console.error(`Error executing code cell ${codeCell.id}:`, error);
        }
      }

      // Mark as initialized to trigger markdown cell rendering
      setInitialized(true);
    };

    initializeNotebook();
  }, [model, reactiveStore, formulaEngine, codeCellEngine]);

  const renderCell = (cell: CellDefinition) => {
    switch (cell.type) {
      case 'input':
        return <InputCell key={cell.id} definition={cell} />;
      case 'markdown':
        return <MarkdownCell key={cell.id} definition={cell} initialized={initialized} />;
      case 'code':
        return <CodeCell key={cell.id} definition={cell} initialized={initialized} />;
      default:
        return null;
    }
  };

  return (
    <div className="dynamic-notebook">
      <header>
        <h1>{model.title}</h1>
        {model.description && <p className="description">{model.description}</p>}
      </header>
      <div className="notebook-cells">
        {model.cells.map(renderCell)}
      </div>
    </div>
  );
}

function InputCell({ definition }: { definition: InputCellDefinition }) {
  const [value, setValue] = useReactiveValue(definition.variableName, definition.defaultValue);

  const renderInput = () => {
    const commonProps = {
      value: value ?? definition.defaultValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newValue = definition.inputType === 'number' || definition.inputType === 'range'
          ? Number(e.target.value)
          : definition.inputType === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
        setValue(newValue);
      }
    };

    switch (definition.inputType) {
      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            min={definition.props?.min}
            max={definition.props?.max}
            step={definition.props?.step}
          />
        );
      case 'range':
        return (
          <div>
            <input
              type="range"
              {...commonProps}
              min={definition.props?.min}
              max={definition.props?.max}
              step={definition.props?.step}
            />
            <span>{value}</span>
          </div>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value ?? definition.defaultValue}
            onChange={(e) => setValue(e.target.checked)}
          />
        );
      case 'select':
        return (
          <select {...commonProps}>
            {definition.props?.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            {...commonProps}
            placeholder={definition.props?.placeholder}
          />
        );
    }
  };

  return (
    <div className="cell input-cell">
      <label>{definition.label}:</label>
      {renderInput()}
    </div>
  );
}

function MarkdownCell({ definition, initialized }: { definition: MarkdownCellDefinition; initialized: boolean }) {
  const { reactiveStore } = useReactiveSystem();
  const [renderedContent, setRenderedContent] = React.useState(definition.content);

  // Utility to extract variable names from {{var}} in markdown content
  function extractVariablesFromContent(content: string): string[] {
    const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(\|[^}]*)?\}\}/g;
    const vars = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      vars.add(match[1]);
    }
    return Array.from(vars);
  }

  useEffect(() => {
    if (!initialized) return; // Wait for initialization

    // Automatically extract variables from content if not explicitly provided
    const variables = definition.variables && definition.variables.length > 0
      ? definition.variables
      : extractVariablesFromContent(definition.content);

    const updateContent = () => {
      if (variables.length > 0) {
        const calculatedValues: { [key: string]: any } = {};
        variables.forEach(varName => {
          const value = reactiveStore.getValue(varName);
          calculatedValues[varName] = value;
        });
        const rendered = renderMarkdownWithValues(definition.content, calculatedValues);
        setRenderedContent(rendered);
      } else {
        setRenderedContent(definition.content);
      }
    };

    if (variables.length > 0) {
      const unsubscribers = variables.map(varName => {
        return reactiveStore.subscribe(varName, () => {
          updateContent();
        });
      });

      updateContent();

      return () => {
        unsubscribers.forEach(unsub => unsub?.());
      };
    } else {
      updateContent();
    }
  }, [definition, reactiveStore, initialized]);

  return (
    <div className="cell markdown-cell">
      <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
    </div>
  );
}

function FormulaCell({ definition }: { definition: FormulaCellDefinition }) {
  const value = useReactiveFormula(definition.variableName, definition.formula);

  const formatValue = (val: any) => {
    if (val == null) return '';
    
    switch (definition.outputFormat) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: definition.decimals ?? 2
        }).format(val);
      case 'percentage':
        return `${val.toFixed(definition.decimals ?? 1)}%`;
      case 'number':
        return val.toFixed(definition.decimals ?? 2);
      default:
        return val.toString();
    }
  };

  return (
    <div className="cell formula-cell">
      <div className="formula-output">
        {formatValue(value)}
      </div>
    </div>
  );
}

// Add CodeCell component for display purposes
function CodeCell({ definition, initialized }: { definition: CodeCellDefinition; initialized: boolean }) {
  const { codeCellEngine } = useReactiveSystem();
  const [exports, setExports] = React.useState<string[]>([]);
  const [error, setError] = React.useState<Error | null>(null);
  const [dependencies, setDependencies] = React.useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = React.useState<any[]>([]);

  useEffect(() => {
    if (!initialized) return;

    try {
      setError(null);
      const newExports = codeCellEngine.executeCodeCell(definition.id, definition.code);
      const newDependencies = codeCellEngine.getCellDependencies(definition.id);
      const rawOutput = codeCellEngine.getCellOutput(definition.id);
      
      setExports(newExports);
      setDependencies(newDependencies);
      setConsoleOutput(rawOutput);
    } catch (err) {
      setError(err as Error);
      setExports([]);
      setDependencies([]);
      // Get output even on error (it might contain error info)
      const rawOutput = codeCellEngine.getCellOutput(definition.id);
      setConsoleOutput(rawOutput);
    }
  }, [initialized, definition.id, definition.code, codeCellEngine]);

  // Render individual console output line
  const renderConsoleOutput = (output: any, index: number) => {
    const prefix = output.type === 'log' ? '' : `[${output.type.toUpperCase()}] `;
    
    if (output.isObject && output.data) {
      return (
        <div key={index} className="console-line mb-3">
          <div className="mb-1">
            <span className="text-xs text-gray-300">{prefix}</span>
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
                        theme="monokai" 
                        collapsed={false}
                        displayDataTypes={false}
                        displayObjectSize={false}
                      />
                    ) : (
                      <span className="text-green-400 font-mono text-sm">{arg.message}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Single object
              <ObjectDisplay 
                data={output.data} 
                theme="monokai" 
                collapsed={false}
                displayDataTypes={false}
                displayObjectSize={false}
              />
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
    <div className="cell code-cell border border-gray-300 rounded-lg mb-4 bg-white">
      <div className="code-header bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Code Cell: {definition.id}</span>
          {dependencies.length > 0 && (
            <span className="text-xs text-gray-500">
              Dependencies: {dependencies.join(', ')}
            </span>
          )}
        </div>
        {exports.length > 0 && (
          <div className="mt-1 text-xs text-gray-600">
            <strong>Exports:</strong> {exports.join(', ')}
          </div>
        )}
      </div>
      
      <pre className="code-content bg-gray-900 text-green-400 px-4 py-3 overflow-x-auto">
        <code>{definition.code}</code>
      </pre>
      
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
