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

/**
 * View Documentation command
 */
export class ViewDocumentationCommand extends BaseCommand {
    getDescription(): string {
        return 'View Documentation';
    }

    canExecute(): boolean {
        return true;
    }

    execute(): void {
        // Dispatch custom event to show documentation
        window.dispatchEvent(new CustomEvent('showDocumentation'));
        log.debug('View documentation command executed');
    }
}

/**
 * Toggle Reading Mode command
 */
export class ToggleReadingModeCommand extends BaseCommand {
    getDescription(): string {
        const { applicationProvider } = this.context;
        const isReadingMode = applicationProvider?.readingMode || false;
        return isReadingMode ? 'Switch to Edit Mode' : 'Switch to Reading Mode';
    }

    canExecute(): boolean {
        const { applicationProvider } = this.context;
        // Only available when a notebook is loaded
        return applicationProvider?.currentModel !== null;
    }

    execute(): void {
        const { applicationProvider } = this.context;
        if (applicationProvider) {
            const newReadingMode = !applicationProvider.readingMode;
            applicationProvider.setReadingMode(newReadingMode);
            log.debug(`Reading mode toggled to: ${newReadingMode}`);
        }
    }
}

/**
 * Enter Reading Mode command
 */
export class EnterReadingModeCommand extends BaseCommand {
    getDescription(): string {
        return 'Enter Reading Mode';
    }

    canExecute(): boolean {
        const { applicationProvider } = this.context;
        // Only available when a notebook is loaded and not in reading mode
        return applicationProvider?.currentModel !== null && !applicationProvider.readingMode;
    }

    execute(): void {
        const { applicationProvider } = this.context;
        if (applicationProvider) {
            applicationProvider.setReadingMode(true);
            log.debug('Entered reading mode');
        }
    }
}

/**
 * Exit Reading Mode command
 */
export class ExitReadingModeCommand extends BaseCommand {
    getDescription(): string {
        return 'Exit Reading Mode';
    }

    canExecute(): boolean {
        const { applicationProvider } = this.context;
        // Only available when a notebook is loaded and in reading mode
        return applicationProvider?.currentModel !== null && applicationProvider.readingMode === true;
    }

    execute(): void {
        const { applicationProvider } = this.context;
        if (applicationProvider) {
            applicationProvider.setReadingMode(false);
            log.debug('Exited reading mode');
        }
    }
}
