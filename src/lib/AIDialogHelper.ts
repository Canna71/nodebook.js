import anylogger from 'anylogger';

const log = anylogger('AIDialogHelper');

/**
 * Helper class for AI dialog operations that can be used outside React components
 * This class provides a bridge between the command system and the React dialog context
 */
export class AIDialogHelper {
    private static instance: AIDialogHelper;
    private dialogHandlers: {
        showPrompt?: (title: string, message: string, placeholder?: string) => Promise<string | null>;
        showError?: (title: string, message: string) => Promise<void>;
        showSuccess?: (title: string, message: string) => Promise<void>;
        showProgress?: (title: string, message: string) => Promise<void>;
        hideProgress?: () => void;
    } = {};

    private constructor() {}

    static getInstance(): AIDialogHelper {
        if (!AIDialogHelper.instance) {
            AIDialogHelper.instance = new AIDialogHelper();
        }
        return AIDialogHelper.instance;
    }

    /**
     * Register dialog handlers from the React context
     */
    registerHandlers(handlers: {
        showPrompt: (title: string, message: string, placeholder?: string) => Promise<string | null>;
        showError: (title: string, message: string) => Promise<void>;
        showSuccess: (title: string, message: string) => Promise<void>;
        showProgress: (title: string, message: string) => Promise<void>;
        hideProgress: () => void;
    }) {
        this.dialogHandlers = handlers;
        log.debug('AI dialog handlers registered');
    }

    /**
     * Show a prompt dialog and return user input
     */
    async showPrompt(title: string, message: string, placeholder?: string): Promise<string | null> {
        if (!this.dialogHandlers.showPrompt) {
            log.warn('Prompt dialog handler not registered, falling back to window.prompt');
            return window.prompt(message) || null;
        }
        return this.dialogHandlers.showPrompt(title, message, placeholder);
    }

    /**
     * Show an error dialog
     */
    async showError(title: string, message: string): Promise<void> {
        if (!this.dialogHandlers.showError) {
            log.warn('Error dialog handler not registered, falling back to alert');
            alert(`${title}: ${message}`);
            return;
        }
        return this.dialogHandlers.showError(title, message);
    }

    /**
     * Show a success dialog
     */
    async showSuccess(title: string, message: string): Promise<void> {
        if (!this.dialogHandlers.showSuccess) {
            log.warn('Success dialog handler not registered, falling back to alert');
            alert(`${title}: ${message}`);
            return;
        }
        return this.dialogHandlers.showSuccess(title, message);
    }

    /**
     * Show a progress dialog
     */
    async showProgress(title: string, message: string): Promise<void> {
        if (!this.dialogHandlers.showProgress) {
            log.warn('Progress dialog handler not registered');
            return;
        }
        return this.dialogHandlers.showProgress(title, message);
    }

    /**
     * Hide the progress dialog
     */
    hideProgress(): void {
        if (!this.dialogHandlers.hideProgress) {
            log.warn('Progress hide handler not registered');
            return;
        }
        this.dialogHandlers.hideProgress();
    }
}

export const aiDialogHelper = AIDialogHelper.getInstance();
