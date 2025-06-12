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
  const { reactiveStore, formulaEngine, enhancedFormulaEngine, codeCellEngine } = useReactiveSystem();
  const { 
    addCell: addCellToNotebook, 
    deleteCell: deleteCellFromNotebook, 
    moveCell: moveCellInNotebook, 
    selectedCellId, 
    setSelectedCellId 
  } = useApplication();
  const { getAvailableModules } = useCodeCellModules();
  const [initialized, setInitialized] = React.useState(false);

  // Editing state - only track local state, selectedCellId comes from application context
  const [editingState, setEditingState] = useState<Pick<NotebookEditingState, 'editModeCells' | 'focusedCellId'>>({
    editModeCells: new Set(),
    focusedCellId: null
  });

  // Track previous cells to detect newly added cells
  const [previousCellIds, setPreviousCellIds] = useState<Set<string>>(new Set());

  // Initialize reactive values and formulas from cells - ONLY ONCE on mount
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
          // Execute code cells during initialization
          // Try to find existing DOM container by ID
          const outputContainer = document.getElementById(`${cell.id}-outEl`) as HTMLDivElement | null;
          
          try {
            const exports = await codeCellEngine.executeCodeCell(cell.id, cell.code, outputContainer || undefined);
            log.debug(`Executed code cell during initialization: ${cell.id}, exports:`, exports, `container: ${outputContainer ? 'found' : 'not found'}`);
          } catch (error) {
            log.error(`Error executing code cell ${cell.id} during initialization:`, error);
          }
        } else if (cell.type === 'formula') {
          const formulaCell = cell as FormulaCellDefinition;
          // Use enhanced formula engine that supports natural JavaScript expressions
          // without requiring $ syntax
          try {
            await enhancedFormulaEngine.createFormula(formulaCell.variableName, formulaCell.formula);
            log.debug(`Initialized enhanced formula from formula cell: ${formulaCell.variableName} = ${formulaCell.formula}`);
          } catch (error) {
            log.error(`Error initializing formula ${formulaCell.variableName}:`, error);
          }
        }
        // Note: Markdown cells don't need initialization
      }

      // Track initial cell IDs
      const initialCellIds = new Set(model.cells.map(cell => cell.id));
      setPreviousCellIds(initialCellIds);

      log.debug('Notebook initialized with reactive values and formulas from cells.');

      // Mark as initialized to trigger component rendering
      setInitialized(true);
    };

    initializeNotebook();
  }, [reactiveStore, formulaEngine, enhancedFormulaEngine, codeCellEngine]); // Removed 'model' from dependencies!

  // Detect newly added cells and put them in edit mode
  useEffect(() => {
    if (!initialized) return;

    const currentCellIds = new Set(model.cells.map(cell => cell.id));
    const newCellIds = new Set([...currentCellIds].filter(id => !previousCellIds.has(id)));

    if (newCellIds.size > 0) {
      setEditingState(prev => {
        const newEditModeCells = new Set([...prev.editModeCells, ...newCellIds]);
        return {
          ...prev,
          editModeCells: newEditModeCells
        };
      });
      
      log.debug('New cells detected and added to edit mode:', Array.from(newCellIds));
    }

    // Update our tracking state
    setPreviousCellIds(currentCellIds);
  }, [initialized, model.cells]); // Removed previousCellIds from dependencies to prevent infinite loop

  // Track previous formula states to detect changes
  const [previousFormulas, setPreviousFormulas] = React.useState<Map<string, string>>(new Map());

  // Watch for formula cell changes and update the enhanced formula engine
  useEffect(() => {
    if (!initialized || !model) return;

    const currentFormulas = new Map<string, string>();
    let hasChanges = false;

    // Check each formula cell for changes
    model.cells.forEach(cell => {
      if (cell.type === 'formula') {
        const formulaCell = cell as FormulaCellDefinition;
        const currentFormula = formulaCell.formula;
        const previousFormula = previousFormulas.get(formulaCell.variableName);
        
        currentFormulas.set(formulaCell.variableName, currentFormula);
        
        // Only update if the formula has actually changed
        if (previousFormula !== currentFormula) {
          enhancedFormulaEngine.updateFormula(formulaCell.variableName, formulaCell.formula);
          log.debug(`Updated enhanced formula: ${formulaCell.variableName} = ${formulaCell.formula} (was: ${previousFormula || 'new'})`);
          hasChanges = true;
        }
      }
    });

    // Update our tracking state only if there were changes
    if (hasChanges || previousFormulas.size !== currentFormulas.size) {
      setPreviousFormulas(currentFormulas);
    }
  }, [initialized, model?.cells, enhancedFormulaEngine]); // Removed previousFormulas from dependencies to avoid loops

  // Cell management functions
  const generateCellId = (): string => {
    return `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addCell = (cellType: CellDefinition['type'], insertIndex?: number) => {
    console.log(`DynamicNotebook.addCell called with:`, { cellType, insertIndex });
    
    // Use state manager's addCell method
    const newCellId = addCellToNotebook(cellType, insertIndex, `Add ${cellType} cell`);
    
    if (newCellId) {
      // Select the new cell - edit mode will be handled automatically by the effect above
      setSelectedCellId(newCellId);
      console.log(`Cell added successfully. New cell ID: ${newCellId}`);
    }
  };

  const deleteCell = (cellId: string) => {
    // Use state manager's deleteCell method
    deleteCellFromNotebook(cellId, 'Delete cell');

    // Clear selection if deleted cell was selected
    if (selectedCellId === cellId) {
      setSelectedCellId(null);
    }
    
    setEditingState(prev => {
      const newEditModeCells = new Set(prev.editModeCells);
      newEditModeCells.delete(cellId);
      
      return {
        ...prev,
        editModeCells: newEditModeCells,
        focusedCellId: prev.focusedCellId === cellId ? null : prev.focusedCellId
      };
    });
  };

  const moveCell = (cellId: string, direction: 'up' | 'down') => {
    // Use state manager's moveCell method
    moveCellInNotebook(cellId, direction, `Move cell ${direction}`);
  };

  const selectCell = (cellId: string) => {
    const newSelectedId = selectedCellId === cellId ? null : cellId;
    setSelectedCellId(newSelectedId);
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
    const isSelected = selectedCellId === cell.id;
    const isEditMode = editingState.editModeCells.has(cell.id);

    // Get exports for code cells
    const exports = cell.type === 'code' ? codeCellEngine.getCellExports(cell.id) : undefined;

    // Create execute callback for code cells
    const handleExecuteCode = cell.type === 'code' ? async () => {
      const currentCode = codeCellEngine.getCurrentCode(cell.id) || cell.code;
      try {
        await codeCellEngine.executeCodeCell(cell.id, currentCode);
        log.debug(`Code cell ${cell.id} executed from header button`);
      } catch (error) {
        log.error(`Error executing code cell ${cell.id} from header button:`, error);
      }
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


