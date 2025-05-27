import React, { useEffect } from 'react';
import { NotebookModel, CellDefinition, InputCellDefinition, MarkdownCellDefinition, FormulaCellDefinition } from '../Types/NotebookModel';
import { useReactiveSystem, useReactiveValue, useReactiveFormula } from '../Engine/ReactiveProvider';
import { renderMarkdownWithValues } from '../Engine/markdown';

interface DynamicNotebookProps {
  model: NotebookModel;
}

export function DynamicNotebook({ model }: DynamicNotebookProps) {
  const { reactiveStore, formulaEngine } = useReactiveSystem();
  const [initialized, setInitialized] = React.useState(false);

  // Initialize reactive values and formulas
  useEffect(() => {
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

    // Mark as initialized to trigger markdown cell rendering
    setInitialized(true);
  }, [model, reactiveStore, formulaEngine]);

  const renderCell = (cell: CellDefinition) => {
    switch (cell.type) {
      case 'input':
        return <InputCell key={cell.id} definition={cell} />;
      case 'markdown':
        return <MarkdownCell key={cell.id} definition={cell} initialized={initialized} />;
      case 'formula':
        return <FormulaCell key={cell.id} definition={cell} />;
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
