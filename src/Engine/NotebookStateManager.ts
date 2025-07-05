import { ApplicationState } from '@/Types/ApplicationTypes';
import { 
    NotebookModel, 
    CellDefinition, 
    CodeCellDefinition, 
    MarkdownCellDefinition,
    FormulaCellDefinition, 
    InputCellDefinition 
} from '@/Types/NotebookModel';
import anylogger from 'anylogger';

const log = anylogger('NotebookStateManager');

export interface HistoryEntry {
    state: ApplicationState;
    timestamp: Date;
    description: string;
}

export interface StateManagerOptions {
    maxHistorySize?: number;
    enableHistory?: boolean;
}

/**
 * Centralized state manager for all notebook modifications
 * Handles undo/redo, state validation, and provides a clean API
 */
export class NotebookStateManager {
    private undoStack: HistoryEntry[] = [];
    private redoStack: HistoryEntry[] = [];
    private maxHistorySize: number;
    private enableHistory: boolean;
    private currentState: ApplicationState;
    private stateChangeCallbacks: ((state: ApplicationState) => void)[] = [];

    constructor(
        initialState: ApplicationState,
        options: StateManagerOptions = {}
    ) {
        this.maxHistorySize = options.maxHistorySize ?? 50;
        this.enableHistory = options.enableHistory ?? true;
        this.currentState = { ...initialState };
    }

    // State access
    getCurrentState(): ApplicationState {
        return { ...this.currentState };
    }

    // State change subscription
    onStateChange(callback: (state: ApplicationState) => void): () => void {
        this.stateChangeCallbacks.push(callback);
        return () => {
            const index = this.stateChangeCallbacks.indexOf(callback);
            if (index > -1) {
                this.stateChangeCallbacks.splice(index, 1);
            }
        };
    }

    private notifyStateChange(): void {
        const stateCopy = { ...this.currentState };
        this.stateChangeCallbacks.forEach(callback => {
            try {
                callback(stateCopy);
            } catch (error) {
                log.error('Error in state change callback:', error);
            }
        });
    }

    private saveToHistory(description: string): void {
        if (!this.enableHistory) return;

        // Create a deep copy of the relevant state for history
        const historyState: ApplicationState = {
            currentFilePath: this.currentState.currentFilePath,
            currentModel: this.currentState.currentModel ? {
                ...this.currentState.currentModel,
                cells: [...this.currentState.currentModel.cells]
            } : null,
            isDirty: this.currentState.isDirty,
            isLoading: this.currentState.isLoading, // Include but won't be restored
            error: this.currentState.error, // Include but won't be restored
            selectedCellId: this.currentState.selectedCellId,
            readingMode: this.currentState.readingMode // Preserve reading mode in history
        };

        this.undoStack.push({
            state: historyState,
            timestamp: new Date(),
            description
        });

        // Limit history size
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }

        // Clear redo stack when new action is performed
        this.redoStack.length = 0;

        log.debug(`State saved to history: ${description}`);
    }

    private updateState(updates: Partial<ApplicationState>, description: string): void {
        // Save current state to history before making changes
        this.saveToHistory(description);

        // Apply updates
        this.currentState = {
            ...this.currentState,
            ...updates
        };

        // Notify subscribers
        this.notifyStateChange();

        log.debug(`State updated: ${description}`);
    }

    /**
     * Update state without saving to history (for UI-only state changes like reading mode)
     */
    private updateStateWithoutHistory(updates: Partial<ApplicationState>): void {
        // Apply updates without saving to history
        this.currentState = {
            ...this.currentState,
            ...updates
        };

        // Notify subscribers
        this.notifyStateChange();

        log.debug(`State updated without history: ${Object.keys(updates).join(', ')}`);
    }

    // High-level operations that automatically handle history
    setNotebookModel(model: NotebookModel, description: string = 'Update notebook model'): void {
        this.updateState({
            currentModel: model,
            isDirty: true
        }, description);
    }

    setSelectedCell(cellId: string | null, description: string = 'Change cell selection'): void {
        // Only save to history if this is a meaningful selection change
        if (this.currentState.selectedCellId !== cellId) {
            this.updateState({
                selectedCellId: cellId
            }, description);
        }
    }

    setDirtyState(isDirty: boolean, description: string = 'Update dirty state'): void {
        if (this.currentState.isDirty !== isDirty) {
            this.updateState({
                isDirty
            }, description);
        }
    }

    setReadingMode(readingMode: boolean, description: string = 'Toggle reading mode'): void {
        console.log('🔍 NotebookStateManager.setReadingMode:', {
            requested: readingMode,
            current: this.currentState.readingMode,
            description
        });
        
        if (this.currentState.readingMode !== readingMode) {
            this.updateStateWithoutHistory({
                readingMode
            });
            
            console.log('🔍 NotebookStateManager.setReadingMode - UPDATED:', {
                newReadingMode: this.currentState.readingMode
            });
        } else {
            console.log('🔍 NotebookStateManager.setReadingMode - NO CHANGE');
        }
    }

    loadNotebook(filePath: string, model: NotebookModel, description: string = 'Load notebook'): void {
        // Model should already have all cell IDs assigned by ApplicationProvider
        // Only update notebook-specific state, completely avoid touching UI state
        const currentState = this.currentState;
        this.updateState({
            currentFilePath: filePath,
            currentModel: model,
            isDirty: false,
            error: null,
            selectedCellId: null,
            // Explicitly preserve ALL other state
            readingMode: currentState.readingMode,
            isLoading: currentState.isLoading
        }, description);
    }

    newNotebook(description: string = 'New notebook'): void {
        const emptyNotebook: NotebookModel = { cells: [] };
        // Preserve UI state when creating a new notebook
        const currentState = this.currentState;
        this.updateState({
            currentFilePath: null,
            currentModel: emptyNotebook,
            isDirty: false,
            error: null,
            selectedCellId: null,
            // Preserve UI state
            readingMode: currentState.readingMode,
            isLoading: currentState.isLoading
        }, description);
    }

    clearNotebook(description: string = 'Clear notebook'): void {
        // Preserve UI state (like reading mode) when clearing notebook
        const currentState = this.currentState;
        this.updateState({
            currentFilePath: null,
            currentModel: null,
            isDirty: false,
            error: null,
            selectedCellId: null,
            // Preserve reading mode and other UI state
            readingMode: currentState.readingMode,
            isLoading: currentState.isLoading
        }, description);
    }

    saveNotebook(filePath?: string, description: string = 'Save notebook'): void {
        this.updateState({
            currentFilePath: filePath || this.currentState.currentFilePath,
            isDirty: false
        }, description);
    }

    // Cell operations with automatic history tracking
    addCell(cellType: CellDefinition['type'], insertIndex?: number, description?: string): string | null {
        if (!this.currentState.currentModel) return null;

        const cellId = this.generateCellId(cellType);
        const newCell = this.createCellDefinition(cellType, cellId);
        
        const newCells = [...this.currentState.currentModel.cells];
        const targetIndex = insertIndex ?? newCells.length;
        newCells.splice(targetIndex, 0, newCell);

        this.setNotebookModel(
            { ...this.currentState.currentModel, cells: newCells },
            description || `Add ${cellType} cell`
        );

        return cellId;
    }

    deleteCell(cellId: string, description?: string): void {
        if (!this.currentState.currentModel) return;

        const newCells = this.currentState.currentModel.cells.filter(cell => cell.id !== cellId);
        
        this.setNotebookModel(
            { ...this.currentState.currentModel, cells: newCells },
            description || 'Delete cell'
        );

        // Clear selection if deleted cell was selected
        if (this.currentState.selectedCellId === cellId) {
            this.setSelectedCell(null, 'Clear selection after cell deletion');
        }
    }

    updateCell(cellId: string, updates: Partial<CellDefinition>, description?: string): void {
        if (!this.currentState.currentModel) return;

        const newCells = this.currentState.currentModel.cells.map(cell => {
            if (cell.id !== cellId) return cell;
            
            // Type-safe update: only allow updates that maintain the cell's type
            switch (cell.type) {
                case 'code':
                    return { ...cell, ...updates } as CodeCellDefinition;
                case 'markdown':
                    return { ...cell, ...updates } as MarkdownCellDefinition;
                case 'formula':
                    return { ...cell, ...updates } as FormulaCellDefinition;
                case 'input':
                    return { ...cell, ...updates } as InputCellDefinition;
                default:
                    return cell;
            }
        });

        this.setNotebookModel(
            { ...this.currentState.currentModel, cells: newCells },
            description || 'Update cell'
        );
    }

    moveCell(cellId: string, direction: 'up' | 'down', description?: string): void {
        if (!this.currentState.currentModel) return;

        const cells = this.currentState.currentModel.cells;
        const cellIndex = cells.findIndex(cell => cell.id === cellId);
        if (cellIndex === -1) return;

        const newIndex = direction === 'up' ? cellIndex - 1 : cellIndex + 1;
        if (newIndex < 0 || newIndex >= cells.length) return;

        const newCells = [...cells];
        const [movedCell] = newCells.splice(cellIndex, 1);
        newCells.splice(newIndex, 0, movedCell);

        this.setNotebookModel(
            { ...this.currentState.currentModel, cells: newCells },
            description || `Move cell ${direction}`
        );
    }

    duplicateCell(cellId: string, description?: string): string | null {
        if (!this.currentState.currentModel) return null;

        const cells = this.currentState.currentModel.cells;
        const cellIndex = cells.findIndex(cell => cell.id === cellId);
        if (cellIndex === -1) return null;

        const originalCell = cells[cellIndex];
        const newCellId = this.generateCellId(originalCell.type);
        
        // Create a deep copy of the cell with a new ID
        let duplicatedCell: CellDefinition;
        
        switch (originalCell.type) {
            case 'code':
                duplicatedCell = {
                    ...originalCell as CodeCellDefinition,
                    id: newCellId
                };
                break;
            case 'markdown':
                duplicatedCell = {
                    ...originalCell as MarkdownCellDefinition,
                    id: newCellId
                };
                break;
            case 'formula':
                const formulaCell = originalCell as FormulaCellDefinition;
                duplicatedCell = {
                    ...formulaCell,
                    id: newCellId,
                    variableName: this.generateVariableName('fx') // Generate unique variable name
                };
                break;
            case 'input':
                const inputCell = originalCell as InputCellDefinition;
                duplicatedCell = {
                    ...inputCell,
                    id: newCellId,
                    variableName: this.generateVariableName('var') // Generate unique variable name
                };
                break;
            default:
                return null;
        }

        const newCells = [...cells];
        newCells.splice(cellIndex + 1, 0, duplicatedCell);

        this.setNotebookModel(
            { ...this.currentState.currentModel, cells: newCells },
            description || 'Duplicate cell'
        );

        return newCellId;
    }

    // Undo/Redo operations
    canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    undo(): boolean {
        if (!this.canUndo()) return false;

        const currentEntry: HistoryEntry = {
            state: { ...this.currentState },
            timestamp: new Date(),
            description: 'Current state before undo'
        };

        const previousEntry = this.undoStack.pop()!;
        this.redoStack.push(currentEntry);

        // Restore state (excluding transient properties)
        this.currentState = {
            ...previousEntry.state,
            isLoading: false, // Reset transient state
            error: null // Reset transient state
        };

        this.notifyStateChange();
        log.debug(`Undo: ${previousEntry.description}`);
        return true;
    }

    redo(): boolean {
        if (!this.canRedo()) return false;

        const currentEntry: HistoryEntry = {
            state: { ...this.currentState },
            timestamp: new Date(),
            description: 'Current state before redo'
        };

        const nextEntry = this.redoStack.pop()!;
        this.undoStack.push(currentEntry);

        // Restore state (excluding transient properties)
        this.currentState = {
            ...nextEntry.state,
            isLoading: false, // Reset transient state
            error: null // Reset transient state
        };

        this.notifyStateChange();
        log.debug(`Redo: ${nextEntry.description}`);
        return true;
    }

    // History management
    clearHistory(): void {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        log.debug('History cleared');
    }

    getUndoDescription(): string | null {
        return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].description : null;
    }

    getRedoDescription(): string | null {
        return this.redoStack.length > 0 ? this.redoStack[this.redoStack.length - 1].description : null;
    }

    // Transient state updates (no history)
    setLoadingState(isLoading: boolean, description: string = 'Update loading state'): void {
        // Don't save loading state changes to history as they're transient
        this.currentState = {
            ...this.currentState,
            isLoading
        };
        this.notifyStateChange();
    }

    setErrorState(error: string | null, description: string = 'Update error state'): void {
        // Don't save error state changes to history as they're transient
        this.currentState = {
            ...this.currentState,
            error
        };
        this.notifyStateChange();
    }

    // Helper methods
    private generateCellId(cellType: CellDefinition['type']): string {
        const prefix = this.getTypePrefix(cellType);
        return this.generateSequentialId(prefix);
    }

    private generateSequentialId(prefix: string): string {
        if (!this.currentState.currentModel) {
            return `${prefix}_01`;
        }

        const existingIds = new Set(this.currentState.currentModel.cells.map(cell => cell.id));
        
        // Find the first available number
        for (let i = 1; i <= 999; i++) {
            const paddedNumber = i.toString().padStart(2, '0');
            const candidateId = `${prefix}_${paddedNumber}`;
            
            if (!existingIds.has(candidateId)) {
                return candidateId;
            }
        }
        
        // Fallback if somehow we reach 999 cells of the same type
        const timestamp = Date.now().toString(36);
        return `${prefix}_${timestamp}`;
    }

    private getTypePrefix(cellType: CellDefinition['type']): string {
        switch (cellType) {
            case 'markdown': return 'md';
            case 'code': return 'code';
            case 'formula': return 'fx';
            case 'input': return 'var';
            default: return 'cell';
        }
    }

    private createCellDefinition(cellType: CellDefinition['type'], cellId: string): CellDefinition {
        switch (cellType) {
            case 'markdown':
                return {
                    type: 'markdown',
                    id: cellId,
                    content: '# New Section\n\nAdd your content here...'
                };
            case 'code':
                return {
                    type: 'code',
                    id: cellId,
                    code: '// Write your code here\nconsole.log("Hello, world!");'
                };
            case 'formula':
                return {
                    type: 'formula',
                    id: cellId,
                    variableName: this.generateVariableName('fx'),
                    formula: '$variable1 + $variable2'
                };
            case 'input':
                return {
                    type: 'input',
                    id: cellId,
                    inputType: 'number',
                    variableName: this.generateVariableName('var'),
                    value: 0
                };
            default:
                throw new Error(`Unknown cell type: ${cellType}`);
        }
    }

    private generateVariableName(prefix: string): string {
        if (!this.currentState.currentModel) {
            return `${prefix}_01`;
        }

        // Collect all existing variable names from formula and input cells
        const existingVariableNames = new Set<string>();
        
        this.currentState.currentModel.cells.forEach(cell => {
            if (cell.type === 'formula') {
                existingVariableNames.add((cell as FormulaCellDefinition).variableName);
            } else if (cell.type === 'input') {
                existingVariableNames.add((cell as InputCellDefinition).variableName);
            }
        });
        
        // Find the first available number for this prefix
        for (let i = 1; i <= 999; i++) {
            const paddedNumber = i.toString().padStart(2, '0');
            const candidateVariable = `${prefix}_${paddedNumber}`;
            
            if (!existingVariableNames.has(candidateVariable)) {
                return candidateVariable;
            }
        }
        
        // Fallback if somehow we reach 999 variables of the same type
        const timestamp = Date.now().toString(36);
        return `${prefix}_${timestamp}`;
    }
}
