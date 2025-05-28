import React, { useEffect } from 'react';
import { NotebookModel, CellDefinition, InputCellDefinition, MarkdownCellDefinition, FormulaCellDefinition, CodeCellDefinition } from '../Types/NotebookModel';
import { useReactiveSystem, useReactiveValue, useReactiveFormula } from '../Engine/ReactiveProvider';
import { renderMarkdownWithValues } from '../Engine/markdown';

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

  useEffect(() => {
    if (!initialized) return; // Wait for initialization

    const updateContent = () => {
      if (definition.variables && definition.variables.length > 0) {
        // Get all calculated values
        const calculatedValues: { [key: string]: any } = {};
        definition.variables.forEach(varName => {
          const value = reactiveStore.getValue(varName);
          calculatedValues[varName] = value;
          console.log(`Variable ${varName}:`, value); // Debug log
        });
        
        console.log('Calculated values:', calculatedValues); // Debug log
        
        // Use the markdown renderer with values
        const rendered = renderMarkdownWithValues(definition.content, calculatedValues);
        console.log('Rendered content:', rendered); // Debug log
        setRenderedContent(rendered);
      } else {
        setRenderedContent(definition.content);
      }
    };

    if (definition.variables && definition.variables.length > 0) {
      // Subscribe to all variables mentioned in this cell
      const unsubscribers = definition.variables.map(varName => {
        return reactiveStore.subscribe(varName, (value) => {
          console.log(`Variable ${varName} changed to:`, value); // Debug log
          updateContent();
        });
      });

      // Initial render
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
  const [output, setOutput] = React.useState<string>('');

  useEffect(() => {
    if (!initialized) return;

    try {
      setError(null);
      const newExports = codeCellEngine.executeCodeCell(definition.id, definition.code);
      const newDependencies = codeCellEngine.getCellDependencies(definition.id);
      const cellOutput = codeCellEngine.getCellOutputText(definition.id);
      
      setExports(newExports);
      setDependencies(newDependencies);
      setOutput(cellOutput);
    } catch (err) {
      setError(err as Error);
      setExports([]);
      setDependencies([]);
      // Get output even on error (it might contain error info)
      const cellOutput = codeCellEngine.getCellOutputText(definition.id);
      setOutput(cellOutput);
    }
  }, [initialized, definition.id, definition.code, codeCellEngine]);

  return (
    <div className="cell code-cell">
      <div className="code-header">
        <span>Code Cell: {definition.id}</span>
        {dependencies.length > 0 && (
          <span className="dependencies">
            Dependencies: {dependencies.join(', ')}
          </span>
        )}
      </div>
      <pre className="code-content">
        <code>{definition.code}</code>
      </pre>
      
      {/* Console Output Display */}
      {output && (
        <div className="console-output">
          <div className="console-header">Console Output:</div>
          <pre className="console-content">{output}</pre>
        </div>
      )}
      
      {error && (
        <div className="code-error">
          Error: {error.message}
        </div>
      )}
      {exports.length > 0 && (
        <div className="code-exports">
          Exports: {exports.join(', ')}
        </div>
      )}
    </div>
  );
}
