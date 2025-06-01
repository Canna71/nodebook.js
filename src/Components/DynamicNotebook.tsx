import React, { useEffect } from 'react';
import { NotebookModel, CellDefinition, CodeCellDefinition } from '../Types/NotebookModel';
import { useReactiveSystem, useCodeCellModules } from '../Engine/ReactiveProvider';
import anylogger from 'anylogger';
import { InputCell } from './InputCell';
import { MarkdownCell } from './MarkdownCell';
import { CodeCell } from './CodeCell';
export const log = anylogger("DynamicNotebook");

interface DynamicNotebookProps {
  model: NotebookModel;
}

export function DynamicNotebook({ model }: DynamicNotebookProps) {
  const { reactiveStore, formulaEngine, codeCellEngine } = useReactiveSystem();
  const { getAvailableModules } = useCodeCellModules();
  const [initialized, setInitialized] = React.useState(false);

  // Initialize reactive values and formulas
  useEffect(() => {
    const initializeNotebook = async () => {
      // Initialize reactive values first with fallback to empty array
      (model.reactiveValues ?? []).forEach(valueDefinition => {
        if (!reactiveStore.get(valueDefinition.name)) {
          reactiveStore.define(valueDefinition.name, valueDefinition.defaultValue);
        }
      });

      // Initialize formulas after reactive values with fallback to empty array
      (model.formulas ?? []).forEach(formulaDefinition => {
        formulaEngine.createFormula(formulaDefinition.name, formulaDefinition.formula);
      });

      // Execute all code cells during initialization with fallback to empty array
      const codeCells = (model.cells ?? []).filter(cell => cell.type === 'code') as CodeCellDefinition[];
      for (const codeCell of codeCells) {
        try {
          const exports = codeCellEngine.executeCodeCell(codeCell.id, codeCell.code);
          log.info(`Code cell ${codeCell.id} executed, exports:`, exports);
        } catch (error) {
          log.error(`Error executing code cell ${codeCell.id}:`, error);
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
        
        {/* Module status */}
        <details className="mb-4 text-sm text-primary">
          <summary className="cursor-pointer hover:bg-background-hover">
            Available Modules ({getAvailableModules().length})
          </summary>
          <div className="mt-2 ml-4 grid grid-cols-3 gap-2">
            {getAvailableModules().map(module => (
              <span 
                key={module} 
                className="inline-block bg-background-secondary text-primary rounded px-2 py-1 text-xs"
              >
                {module}
              </span>
            ))}
          </div>
        </details>
      </header>
      <div className="notebook-cells">
        {(model.cells ?? []).map(renderCell)}
      </div>
    </div>
  );
}


