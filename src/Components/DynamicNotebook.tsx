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
import { CellSeparator } from './CellSeparator';
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
      // Initialize cells in the order they appear in the notebook
      for (const cell of model.cells) {
        if (cell.type === 'input') {
          const inputCell = cell as InputCellDefinition;
          if (!reactiveStore.get(inputCell.variableName)) {
            reactiveStore.define(inputCell.variableName, inputCell.value);
            log.debug(`Initialized reactive value from input cell: ${inputCell.variableName} = ${inputCell.value}`);
          }
        } else if (cell.type === 'code') {
          // Execute code cells during initialization to ensure their exports are available
          // for subsequent formula cells
          try {
            const exports = codeCellEngine.executeCodeCell(cell.id, cell.code);
            log.debug(`Executed code cell during initialization: ${cell.id}, exports:`, exports);
          } catch (error) {
            log.error(`Error executing code cell ${cell.id} during initialization:`, error);
          }
        } else if (cell.type === 'formula') {
          const formulaCell = cell as FormulaCellDefinition;
          formulaEngine.createFormula(formulaCell.variableName, formulaCell.formula);
          log.debug(`Initialized formula from formula cell: ${formulaCell.variableName} = ${formulaCell.formula}`);
        }
        // Note: Markdown cells don't need initialization
      }

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
    console.log(`DynamicNotebook.addCell called with:`, { cellType, insertIndex, hasCurrentModel: !!currentModel });
    
    if (!currentModel) {
      console.error('No current model available');
      return;
    }

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
          inputType: 'number',
          variableName: `input_${Date.now()}`,
          value: 0
        };
        break;
      default:
        console.error(`Unknown cell type: ${cellType}`);
        return;
    }

    const newCells = [...currentModel.cells];
    const targetIndex = insertIndex ?? newCells.length;
    newCells.splice(targetIndex, 0, newCell);

    console.log(`Adding cell at index ${targetIndex}:`, newCell);

    const updatedModel = { ...currentModel, cells: newCells };
    setModel(updatedModel);
    setDirty(true);

    // Select and edit the new cell
    setEditingState(prev => ({
      ...prev,
      selectedCellId: newId,
      editModeCells: new Set([...prev.editModeCells, newId])
    }));

    console.log(`Cell added successfully. New model has ${updatedModel.cells.length} cells`);
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
      selectedCellId: prev.selectedCellId === cellId ? null : cellId
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

    // Get exports for code cells
    const exports = cell.type === 'code' ? codeCellEngine.getCellExports(cell.id) : undefined;

    // Create execute callback for code cells
    const handleExecuteCode = cell.type === 'code' ? () => {
      const currentCode = codeCellEngine.getCurrentCode(cell.id) || cell.code;
      codeCellEngine.executeCodeCell(cell.id, currentCode);
      log.debug(`Code cell ${cell.id} executed from header button`);
    } : undefined;

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
        exports={exports}
        onExecuteCode={handleExecuteCode} // NEW: Pass execute callback
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
    <div className="dynamic-notebook max-w-4xl mx-auto p-2 pt-6">
      <div className="notebook-cells">
        {model.cells.length === 0 ? (
          <div className="empty-notebook text-center py-12 text-secondary-foreground">
            <div className="text-lg mb-4">Your notebook is empty</div>
            <div className="text-sm mb-6">Hover over the line below to add your first cell</div>
            <CellSeparator onAddCell={addCell} insertIndex={0} isFirst isLast />
          </div>
        ) : (
          <div className="cells-with-separators">
            {/* Add cell separator at the beginning */}
            <CellSeparator onAddCell={addCell} insertIndex={0} isFirst />
            
            {model.cells.map((cell, index) => (
              <React.Fragment key={cell.id}>
                {/* Render the cell */}
                <div className="cell-wrapper">
                  {renderCell(cell, index)}
                </div>
                
                {/* Add separator after each cell (except the last one gets a special separator) */}
                <CellSeparator 
                  onAddCell={addCell} 
                  insertIndex={index + 1}
                  isLast={index === model.cells.length - 1}
                />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


