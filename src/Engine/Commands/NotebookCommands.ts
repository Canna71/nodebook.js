
import { ICommand, CommandContext } from '@/Types/CommandTypes';
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
            await this.context.applicationProvider.saveNotebook();
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
 * Add cell command
 */
export class AddCellCommand extends BaseCommand {
    constructor(
        getContext: () => CommandContext | null,
        private cellType: CellDefinition['type'] = 'code',
        private insertIndex?: number
    ) {
        super(getContext);
    }

    getDescription(): string {
        return `Add ${this.cellType} cell`;
    }

    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }

    execute(): void {
        try {
            this.context.notebookOperations.addCell(this.cellType, this.insertIndex);
            log.debug(`Add ${this.cellType} cell command executed`);
        } catch (error) {
            log.error(`Error adding ${this.cellType} cell:`, error);
            throw error;
        }
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
