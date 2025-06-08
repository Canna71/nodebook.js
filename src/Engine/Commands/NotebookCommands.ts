import { ICommand, IParameterizedCommand, CommandContext } from '@/Types/CommandTypes';
import { CellDefinition } from '@/Types/NotebookModel';
import anylogger from 'anylogger';

const log = anylogger('NotebookCommands');

/**
 * Base command class with access to context
 */
abstract class BaseCommand implements ICommand {
    constructor(protected getContext: () => CommandContext | null) {}

    protected get context(): CommandContext {
        const ctx = this.getContext();
        if (!ctx) {
            throw new Error('Command context not available');
        }
        return ctx;
    }

    abstract execute(): Promise<void> | void;
    abstract getDescription(): string;

    canExecute?(): boolean;
    undo?(): Promise<void> | void;
    canUndo?(): boolean;
}

/**
 * Save notebook command
 */
export class SaveNotebookCommand extends BaseCommand {
    getDescription(): string {
        return 'Save the current notebook';
    }

    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }

    async execute(): Promise<void> {
        try {
            // Check if we have a current file path
            const currentFilePath = this.context.applicationProvider.currentFilePath;
            
            if (currentFilePath) {
                // Save to existing file
                await this.context.applicationProvider.saveNotebook();
            } else {
                // No file path, show Save As dialog
                await this.context.applicationProvider.showSaveAsDialog();
            }
            
            log.debug('Save notebook command executed');
        } catch (error) {
            log.error('Error saving notebook:', error);
            throw error;
        }
    }
}

/**
 * New notebook command
 */
export class NewNotebookCommand extends BaseCommand {
    getDescription(): string {
        return 'Create a new notebook';
    }

    execute(): void {
        try {
            this.context.applicationProvider.newNotebook();
            log.debug('New notebook command executed');
        } catch (error) {
            log.error('Error creating new notebook:', error);
            throw error;
        }
    }
}

/**
 * Enhanced Add cell command with support for multiple cell types and intelligent insertion
 */
export class AddCellCommand extends BaseCommand {
    constructor(
        getContext: () => CommandContext | null,
        private cellType: CellDefinition['type'] = 'code',
        private insertStrategy: 'end' | 'after-selected' | 'specific-index' = 'after-selected',
        private specificIndex?: number
    ) {
        super(getContext);
    }

    getDescription(): string {
        const strategyDesc = this.insertStrategy === 'end' ? 'at end' :
                           this.insertStrategy === 'after-selected' ? 'after selected cell' :
                           `at index ${this.specificIndex}`;
        return `Add ${this.cellType} cell ${strategyDesc}`;
    }

    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }

    private calculateInsertIndex(): number | undefined {
        const model = this.context.applicationProvider.currentModel;
        if (!model) return undefined;

        switch (this.insertStrategy) {
            case 'end':
                return model.cells.length;
            
            case 'specific-index':
                return this.specificIndex;
            
            case 'after-selected':
                // Try to get selected cell from editing state
                const selectedCellId = this.getSelectedCellId();
                if (selectedCellId) {
                    const selectedIndex = model.cells.findIndex((cell: CellDefinition) => cell.id === selectedCellId);
                    if (selectedIndex !== -1) {
                        return selectedIndex + 1; // Insert after selected cell
                    }
                }
                // Fallback to end if no selection
                return model.cells.length;
            
            default:
                return model.cells.length;
        }
    }

    private getSelectedCellId(): string | null {
        // Get selected cell ID from the context
        return this.context.uiState.selectedCellId;
    }

    execute(): void {
        try {
            const insertIndex = this.calculateInsertIndex();
            this.context.notebookOperations.addCell(this.cellType, insertIndex);
            log.debug(`Add ${this.cellType} cell command executed with strategy '${this.insertStrategy}' at index ${insertIndex}`);
        } catch (error) {
            log.error(`Error adding ${this.cellType} cell:`, error);
            throw error;
        }
    }

    // Static factory methods for common use cases
    static createForCellType(
        getContext: () => CommandContext | null,
        cellType: CellDefinition['type'],
        insertStrategy: 'end' | 'after-selected' | 'specific-index' = 'after-selected',
        specificIndex?: number
    ): AddCellCommand {
        return new AddCellCommand(getContext, cellType, insertStrategy, specificIndex);
    }

    static createForInsertAfterCell(
        getContext: () => CommandContext | null,
        cellType: CellDefinition['type'],
        afterCellIndex: number
    ): AddCellCommand {
        return new AddCellCommand(getContext, cellType, 'specific-index', afterCellIndex + 1);
    }
}

/**
 * Execute all cells command
 */
export class ExecuteAllCellsCommand extends BaseCommand {
    getDescription(): string {
        return 'Execute all code cells in the notebook';
    }

    canExecute(): boolean {
        const model = this.context.applicationProvider.currentModel;
        return !!(model && model.cells && model.cells.some((cell: CellDefinition) => cell.type === 'code'));
    }

    async execute(): Promise<void> {
        try {
            await this.context.notebookOperations.executeAllCells();
            log.debug('Execute all cells command executed');
        } catch (error) {
            log.error('Error executing all cells:', error);
            throw error;
        }
    }
}

/**
 * Toggle sidebar command
 */
export class ToggleSidebarCommand extends BaseCommand {
    getDescription(): string {
        return 'Toggle the sidebar';
    }

    execute(): void {
        try {
            if (this.context.uiOperations.toggleSidebar) {
                this.context.uiOperations.toggleSidebar();
                log.debug('Toggle sidebar command executed');
            }
        } catch (error) {
            log.error('Error toggling sidebar:', error);
            throw error;
        }
    }
}

/**
 * Placeholder undo command (for future implementation)
 */
export class UndoCommand extends BaseCommand {
    getDescription(): string {
        return 'Undo the last action';
    }

    canExecute(): boolean {
        // TODO: Implement undo stack
        return false;
    }

    execute(): void {
        // TODO: Implement undo functionality
        log.warn('Undo command not yet implemented');
    }
}

/**
 * Placeholder redo command (for future implementation)
 */
export class RedoCommand extends BaseCommand {
    getDescription(): string {
        return 'Redo the last undone action';
    }

    canExecute(): boolean {
        // TODO: Implement redo stack
        return false;
    }

    execute(): void {
        // TODO: Implement redo functionality
        log.warn('Redo command not yet implemented');
    }
}

/**
 * Enhanced parameterized Add cell command
 * Supports runtime parameters for cell type and insertion strategy
 */
export class ParameterizedAddCellCommand extends BaseCommand implements IParameterizedCommand {
    constructor(getContext: () => CommandContext | null) {
        super(getContext);
    }

    getDescription(): string {
        return 'Add cell with runtime parameters';
    }

    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }

    // Default execute for backward compatibility
    execute(): void {
        // Default behavior: add code cell after selected cell
        this.executeWithParams({ cellType: 'code', insertStrategy: 'after-selected' });
    }

    executeWithParams(params: {
        cellType?: CellDefinition['type'];
        insertStrategy?: 'end' | 'after-selected' | 'specific-index';
        specificIndex?: number;
        afterCellId?: string;
    }): void {
        const {
            cellType = 'code',
            insertStrategy = 'after-selected',
            specificIndex,
            afterCellId
        } = params;

        try {
            const insertIndex = this.calculateInsertIndex(insertStrategy, specificIndex, afterCellId);
            this.context.notebookOperations.addCell(cellType, insertIndex);
            log.debug(`Parameterized add cell command executed: ${cellType} at index ${insertIndex}`);
        } catch (error) {
            log.error(`Error adding ${cellType} cell:`, error);
            throw error;
        }
    }

    private calculateInsertIndex(
        strategy: 'end' | 'after-selected' | 'specific-index',
        specificIndex?: number,
        afterCellId?: string
    ): number | undefined {
        const model = this.context.applicationProvider.currentModel;
        if (!model) return undefined;

        switch (strategy) {
            case 'end':
                return model.cells.length;
            
            case 'specific-index':
                return specificIndex;
            
            case 'after-selected':
                // First try the provided afterCellId
                if (afterCellId) {
                    const afterIndex = model.cells.findIndex((cell: CellDefinition) => cell.id === afterCellId);
                    if (afterIndex !== -1) {
                        return afterIndex + 1;
                    }
                }
                
                // Try to get selected cell from DOM (fallback method)
                const selectedCellId = this.getSelectedCellId();
                if (selectedCellId) {
                    const selectedIndex = model.cells.findIndex((cell: CellDefinition) => cell.id === selectedCellId);
                    if (selectedIndex !== -1) {
                        return selectedIndex + 1;
                    }
                }
                
                // Fallback to end if no selection
                return model.cells.length;
            
            default:
                return model.cells.length;
        }
    }

    private getSelectedCellId(): string | null {
        // Get selected cell ID from the context
        return this.context.uiState.selectedCellId;
    }
}
