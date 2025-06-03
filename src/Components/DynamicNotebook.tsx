import React, { useEffect, useState } from 'react';
import { NotebookModel, CellDefinition, InputCellDefinition, FormulaCellDefinition, NotebookEditingState } from '../Types/NotebookModel';
import { useReactiveSystem, useCodeCellModules } from '../Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import anylogger from 'anylogger';
import { InputCell } from './InputCell';
import { MarkdownCell } from './MarkdownCell';
import { CodeCell } from './CodeCell';
import { FormulaCell } from './FormulaCell';
import { CellContainer } from './CellContainer';
import { AddCellButton } from './AddCellButton';
export const log = anylogger("DynamicNotebook");

interface DynamicNotebookProps {
  model: NotebookModel;
}

export function DynamicNotebook({ model }: DynamicNotebookProps) {
  const { reactiveStore, formulaEngine, codeCellEngine } = useReactiveSystem();
  const { currentModel, setModel, setDirty } = useApplication();
  const { getAvailableModules } = useCodeCellModules();
  const [initialized, setInitialized] = React.useState(false);

  // Editing state
  const [editingState, setEditingState] = useState<NotebookEditingState>({
    selectedCellId: null,
    editModeCells: new Set(),
    focusedCellId: null
  });

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

  // Cell management functions
  const generateCellId = (): string => {
    return `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addCell = (cellType: CellDefinition['type'], insertIndex?: number) => {
    if (!currentModel) return;

    const newId = generateCellId();
    let newCell: CellDefinition;

    switch (cellType) {
      case 'markdown':
        newCell = {
          type: 'markdown',
          id: newId,
          content: '# New Section\n\nAdd your content here...'
        };
        break;
      case 'code':
        newCell = {
          type: 'code',
          id: newId,
          code: '// Write your code here\nconsole.log("Hello, world!");'
        };
        break;
      case 'formula':
        newCell = {
          type: 'formula',
          id: newId,
          variableName: `result_${Date.now()}`,
          formula: '$variable1 + $variable2',
          outputFormat: 'number'
        };
        break;
      case 'input':
        newCell = {
          type: 'input',
          id: newId,
          label: 'New Input',
          inputType: 'number',
          variableName: `input_${Date.now()}`,
          defaultValue: 0
        };
        break;
      default:
        return;
    }

    const newCells = [...currentModel.cells];
    const targetIndex = insertIndex ?? newCells.length;
    newCells.splice(targetIndex, 0, newCell);

    setModel({ ...currentModel, cells: newCells });
    setDirty(true);

    // Select and edit the new cell
    setEditingState(prev => ({
      ...prev,
      selectedCellId: newId,
      editModeCells: new Set([...prev.editModeCells, newId])
    }));
  };

  const deleteCell = (cellId: string) => {
    if (!currentModel) return;

    const newCells = currentModel.cells.filter(cell => cell.id !== cellId);
    setModel({ ...currentModel, cells: newCells });
    setDirty(true);

    // Clear selection if deleted cell was selected
    setEditingState(prev => {
      const newEditModeCells = new Set(prev.editModeCells);
      newEditModeCells.delete(cellId);
      
      return {
        ...prev,
        selectedCellId: prev.selectedCellId === cellId ? null : prev.selectedCellId,
        editModeCells: newEditModeCells,
        focusedCellId: prev.focusedCellId === cellId ? null : prev.focusedCellId
      };
    });
  };

  const moveCell = (cellId: string, direction: 'up' | 'down') => {
    if (!currentModel) return;

    const cellIndex = currentModel.cells.findIndex(cell => cell.id === cellId);
    if (cellIndex === -1) return;

    const newIndex = direction === 'up' ? cellIndex - 1 : cellIndex + 1;
    if (newIndex < 0 || newIndex >= currentModel.cells.length) return;

    const newCells = [...currentModel.cells];
    const [movedCell] = newCells.splice(cellIndex, 1);
    newCells.splice(newIndex, 0, movedCell);

    setModel({ ...currentModel, cells: newCells });
    setDirty(true);
  };

  const selectCell = (cellId: string) => {
    setEditingState(prev => ({
      ...prev,
      selectedCellId: cellId
    }));
  };

  const toggleEditMode = (cellId: string) => {
    setEditingState(prev => {
      const newEditModeCells = new Set(prev.editModeCells);
      if (newEditModeCells.has(cellId)) {
        newEditModeCells.delete(cellId);
      } else {
        newEditModeCells.add(cellId);
      }
      return {
        ...prev,
        editModeCells: newEditModeCells
      };
    });
  };

  const renderCell = (cell: CellDefinition, index: number) => {
    const isSelected = editingState.selectedCellId === cell.id;
    const isEditMode = editingState.editModeCells.has(cell.id);

    let cellComponent: React.ReactNode;
    switch (cell.type) {
      case 'input':
        cellComponent = <InputCell definition={cell} isEditMode={isEditMode} />;
        break;
      case 'markdown':
        cellComponent = <MarkdownCell definition={cell} initialized={initialized} isEditMode={isEditMode} />;
        break;
      case 'formula':
        cellComponent = <FormulaCell definition={cell} initialized={initialized} isEditMode={isEditMode} />;
        break;
      case 'code':
        cellComponent = <CodeCell definition={cell} initialized={initialized} isEditMode={isEditMode} />;
        break;
      default:
        log.warn(`Unknown cell type: ${(cell as any).type}`);
        return null;
    }

    return (
      <CellContainer
        key={cell.id}
        definition={cell}
        cellIndex={index}
        totalCells={model.cells.length}
        isSelected={isSelected}
        isEditMode={isEditMode}
        onSelect={() => selectCell(cell.id)}
        onToggleEditMode={() => toggleEditMode(cell.id)}
        onDelete={() => deleteCell(cell.id)}
        onMoveUp={() => moveCell(cell.id, 'up')}
        onMoveDown={() => moveCell(cell.id, 'down')}
        initialized={initialized}
      >
        {cellComponent}
      </CellContainer>
    );
  };

  return (
    <div className="dynamic-notebook max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{model.title || 'Untitled Notebook'}</h1>
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

        {/* Add Cell Button */}
        <div className="mb-6">
          <AddCellButton onAddCell={addCell} />
        </div>
      </header>

      <div className="notebook-cells space-y-4">
        {model.cells.length === 0 ? (
          <div className="empty-notebook text-center py-12 text-secondary-foreground">
            <div className="text-lg mb-4">Your notebook is empty</div>
            <AddCellButton onAddCell={addCell} />
          </div>
        ) : (
          model.cells.map(renderCell)
        )}

        {/* Add cell at the end */}
        {model.cells.length > 0 && (
          <div className="add-cell-bottom pt-4">
            <AddCellButton onAddCell={addCell} />
          </div>
        )}
      </div>
    </div>
  );
}


