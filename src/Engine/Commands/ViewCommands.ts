import { ICommand, CommandContext } from '@/Types/CommandTypes';
import anylogger from 'anylogger';

const log = anylogger('ViewCommands');

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
 * Toggle Console Viewer command
 */
export class ToggleConsoleViewerCommand extends BaseCommand {
    getDescription(): string {
        return 'Toggle Console Viewer';
    }

    canExecute(): boolean {
        return true;
    }

    execute(): void {
        // Dispatch custom event that the App component listens for
        window.dispatchEvent(new CustomEvent('toggleConsolePanel'));
        log.debug('Console viewer toggle command executed');
    }
}

/**
 * Toggle Output Panel command  
 */
export class ToggleOutputPanelCommand extends BaseCommand {
    getDescription(): string {
        return 'Toggle Output Panel';
    }

    canExecute(): boolean {
        return true;
    }

    execute(): void {
        // Dispatch custom event that the App component listens for
        window.dispatchEvent(new CustomEvent('toggleOutputPanel'));
        log.debug('Output panel toggle command executed');
    }
}
