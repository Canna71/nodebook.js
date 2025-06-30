import React, { useEffect, useState } from 'react';
import { NotebookModel, CellDefinition, InputCellDefinition, FormulaCellDefinition, CodeCellDefinition, NotebookEditingState } from '../Types/NotebookModel';
import { useReactiveSystem, useCodeCellModules } from '../Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import anylogger from 'anylogger';
import { InputCell } from './InputCell';
import { MarkdownCell } from './MarkdownCell';
import { CodeCell } from './CodeCell';
import { FormulaCell } from './FormulaCell';
import { CellContainer } from './CellContainer';
import { CellSeparator } from './CellSeparator';
import useMutationObserver from '@/lib/plotlyDark';
export const log = anylogger("DynamicNotebook");

interface DynamicNotebookProps {
  model: NotebookModel;
  readingMode?: boolean; // NEW: Reading mode flag - hides editing UI elements
}

export function DynamicNotebook({ model, readingMode = false }: DynamicNotebookProps) {
  const { reactiveStore, formulaEngine, enhancedFormulaEngine, codeCellEngine } = useReactiveSystem();
  const { 
    addCell: addCellToNotebook, 
    deleteCell: deleteCellFromNotebook, 
    moveCell: moveCellInNotebook, 
    duplicateCell: duplicateCellInNotebook,
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
  useMutationObserver({}); // Initialize mutation observer for dynamic updates

  // Initialize reactive values and formulas from cells - ONLY ONCE on mount
  useEffect(() => {
    const initializeNotebook = async () => {
      // Load storage from notebook model first
      if (model.storage) {
        codeCellEngine.loadStorageFromNotebook(model.storage);
        log.debug(`Loaded storage from notebook:`, Object.keys(model.storage));
      }
      
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
          const codeCell = cell as CodeCellDefinition;
          
          // Skip initialization execution for static cells
          if (codeCell.isStatic) {
            log.debug(`Skipping initialization execution for static code cell: ${cell.id}`);
          } else {
            // Try to find existing DOM container by ID
            const outputContainer = document.getElementById(`${cell.id}-outEl`) as HTMLDivElement | null;
            
            try {
              const exports = await codeCellEngine.executeCodeCell(cell.id, codeCell.code, outputContainer || undefined, false);
              log.debug(`Executed code cell during initialization: ${cell.id}, exports:`, exports, `container: ${outputContainer ? 'found' : 'not found'}`);
            } catch (error) {
              log.error(`Error executing code cell ${cell.id} during initialization:`, error);
            }
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

  const duplicateCell = (cellId: string) => {
    // Use state manager's duplicateCell method
    const newCellId = duplicateCellInNotebook(cellId, 'Duplicate cell');
    
    if (newCellId) {
      // Select the new duplicated cell
      setSelectedCellId(newCellId);
      log.debug(`Cell duplicated successfully: ${cellId} -> ${newCellId}`);
    }
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
    // In reading mode, disable selection and edit mode
    const isSelected = readingMode ? false : selectedCellId === cell.id;
    const isEditMode = readingMode ? false : editingState.editModeCells.has(cell.id);

    // Get exports for code cells
    const exports = cell.type === 'code' ? codeCellEngine.getCellExports(cell.id) : undefined;

    // Create execute callback for code cells (still available in reading mode for reactive updates)
    const handleExecuteCode = cell.type === 'code' ? async () => {
      const codeCell = cell as CodeCellDefinition;
      const currentCode = codeCellEngine.getCurrentCode(cell.id) || codeCell.code;
      try {
        await codeCellEngine.executeCodeCell(cell.id, currentCode, undefined, codeCell.isStatic || false);
        log.debug(`Code cell ${cell.id} executed from header button (static: ${codeCell.isStatic || false})`);
      } catch (error) {
        log.error(`Error executing code cell ${cell.id} from header button:`, error);
      }
    } : undefined;

    let cellComponent: React.ReactNode;
    switch (cell.type) {
      case 'input':
        // Remove readingMode prop - handle via CSS
        cellComponent = <InputCell definition={cell} isEditMode={isEditMode} />;
        break;
      case 'markdown':
        // Remove readingMode prop - handle via CSS
        cellComponent = <MarkdownCell definition={cell} initialized={initialized} isEditMode={isEditMode} />;
        break;
      case 'formula':
        // Remove readingMode prop - handle via CSS
        cellComponent = <FormulaCell definition={cell} initialized={initialized} isEditMode={isEditMode} />;
        break;
      case 'code':
        // Remove readingMode prop - handle via CSS
        cellComponent = <CodeCell definition={cell} initialized={initialized} isEditMode={isEditMode} />;
        break;
      default:
        log.warn(`Unknown cell type: ${(cell as any).type}`);
        return null;
    }

    // Always render the same structure - use CSS to control reading mode appearance
    return (
      <CellContainer
        key={cell.id}
        definition={cell}
        cellIndex={index}
        totalCells={model.cells.length}
        isSelected={isSelected}
        isEditMode={isEditMode}
        exports={exports}
        onExecuteCode={handleExecuteCode}
        onSelect={() => selectCell(cell.id)}
        onToggleEditMode={() => toggleEditMode(cell.id)}
        onDelete={() => deleteCell(cell.id)}
        onDuplicate={() => duplicateCell(cell.id)}
        onMoveUp={() => moveCell(cell.id, 'up')}
        onMoveDown={() => moveCell(cell.id, 'down')}
        initialized={initialized}
      >
        {cellComponent}
      </CellContainer>
    );
  };

  return (
    <div className={`dynamic-notebook max-w-4xl mx-auto p-2 pt-6 pb-[500px] ${readingMode ? 'reading-mode' : ''}`}>
      <div className="notebook-cells">
        {model.cells.length === 0 ? (
          <div className="empty-notebook text-center py-12 text-secondary-foreground">
            <div className="text-lg mb-4">Your notebook is empty</div>
            <div className="text-sm mb-6 reading-mode-hide">Hover over the line below to add your first cell</div>
            <div className="reading-mode-hide">
              <CellSeparator onAddCell={addCell} insertIndex={0} isFirst isLast />
            </div>
          </div>
        ) : (
          <div className="cells-container">
            {/* Cell separator at the top - hidden in reading mode */}
            <div className="reading-mode-hide">
              <CellSeparator onAddCell={addCell} insertIndex={0} isFirst />
            </div>
            
            {model.cells.map((cell, index) => (
              <React.Fragment key={cell.id}>
                {/* Render the cell */}
                <div className="cell-wrapper">
                  {renderCell(cell, index)}
                </div>
                
                {/* Add separator after each cell - hidden in reading mode */}
                <div className="reading-mode-hide">
                  <CellSeparator 
                    onAddCell={addCell} 
                    insertIndex={index + 1}
                    isLast={index === model.cells.length - 1}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


