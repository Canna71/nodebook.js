import React, { useEffect } from 'react';
import { NotebookModel, CellDefinition, CodeCellDefinition, InputCellDefinition, FormulaCellDefinition } from '../Types/NotebookModel';
import { useReactiveSystem, useCodeCellModules } from '../Engine/ReactiveProvider';
import anylogger from 'anylogger';
import { InputCell } from './InputCell';
import { MarkdownCell } from './MarkdownCell';
import { CodeCell } from './CodeCell';
import { FormulaCell } from './FormulaCell';
export const log = anylogger("DynamicNotebook");

interface DynamicNotebookProps {
  model: NotebookModel;
}

export function DynamicNotebook({ model }: DynamicNotebookProps) {
  const { reactiveStore, formulaEngine, codeCellEngine } = useReactiveSystem();
  const { getAvailableModules } = useCodeCellModules();
  const [initialized, setInitialized] = React.useState(false);

  // Initialize reactive values and formulas from cells
  useEffect(() => {
    const initializeNotebook = async () => {
      // Initialize reactive values from input cells first
      model.cells.forEach(cell => {
        if (cell.type === 'input') {
          const inputCell = cell as InputCellDefinition;
          if (!reactiveStore.get(inputCell.variableName)) {
            reactiveStore.define(inputCell.variableName, inputCell.defaultValue);
            log.debug(`Initialized reactive value from input cell: ${inputCell.variableName} = ${inputCell.defaultValue}`);
          }
        }
      });

      // Initialize formulas from formula cells after reactive values
      model.cells.forEach(cell => {
        if (cell.type === 'formula') {
          const formulaCell = cell as FormulaCellDefinition;
          formulaEngine.createFormula(formulaCell.variableName, formulaCell.formula);
          log.debug(`Initialized formula from formula cell: ${formulaCell.variableName} = ${formulaCell.formula}`);
        }
      });

      // Don't execute code cells during initialization - let individual CodeCell components handle this
      // when they mount and have their DOM containers ready
      log.debug('Notebook initialized with reactive values and formulas from cells. Code cells will execute when components mount.');

      // Mark as initialized to trigger component rendering
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
      case 'formula':
        return <FormulaCell key={cell.id} definition={cell} initialized={initialized} />;
      case 'code':
        return <CodeCell key={cell.id} definition={cell} initialized={initialized} />;
      default:
        log.warn(`Unknown cell type: ${(cell as any).type}`);
        return null;
    }
  };

  return (
    <div className="dynamic-notebook">
      <header>
        <h1 className="text-2xl font-bold text-foreground mb-2">{model.title}</h1>
        {model.description && <p className="description text-secondary-foreground mb-4">{model.description}</p>}
        
        {/* Module status */}
        <details className="mb-4 text-sm text-foreground">
          <summary className="cursor-pointer hover:bg-background-secondary px-2 py-1 rounded">
            Available Modules ({getAvailableModules().length})
          </summary>
          <div className="mt-2 ml-4 grid grid-cols-3 gap-2">
            {getAvailableModules().map(module => (
              <span 
                key={module} 
                className="inline-block bg-background-secondary text-foreground rounded px-2 py-1 text-xs"
              >
                {module}
              </span>
            ))}
          </div>
        </details>
      </header>
      <div className="notebook-cells space-y-4">
        {(model.cells ?? []).map(renderCell)}
      </div>
    </div>
  );
}


