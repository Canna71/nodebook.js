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
        log.debug('Showing prompt dialog', { title, message, placeholder });
          if (!this.dialogHandlers.showPrompt) {
            log.error('Prompt dialog handler not registered');
            throw new Error('AI dialog system not initialized - prompt handler missing');
        }
        
        const result = await this.dialogHandlers.showPrompt(title, message, placeholder);
        log.debug('Prompt dialog result:', { hasResult: !!result, length: result?.length });
        return result;
    }

    /**
     * Show an error dialog
     */
    async showError(title: string, message: string): Promise<void> {
        log.debug('Showing error dialog', { title, message });
          if (!this.dialogHandlers.showError) {
            log.error('Error dialog handler not registered');
            throw new Error('AI dialog system not initialized - error handler missing');
        }
        
        await this.dialogHandlers.showError(title, message);
        log.debug('Error dialog completed');
    }

    /**
     * Show a success dialog
     */
    async showSuccess(title: string, message: string): Promise<void> {
        log.debug('Showing success dialog', { title, message });
          if (!this.dialogHandlers.showSuccess) {
            log.error('Success dialog handler not registered');
            throw new Error('AI dialog system not initialized - success handler missing');
        }
        
        await this.dialogHandlers.showSuccess(title, message);
        log.debug('Success dialog completed');
    }

    /**
     * Show a progress dialog
     */
    async showProgress(title: string, message: string): Promise<void> {
        log.debug('Showing progress dialog', { title, message });
        
        if (!this.dialogHandlers.showProgress) {
            log.warn('Progress dialog handler not registered');
            return;
        }
        
        await this.dialogHandlers.showProgress(title, message);
        log.debug('Progress dialog shown');
    }

    /**
     * Hide the progress dialog
     */
    hideProgress(): void {
        log.debug('Hiding progress dialog');
        
        if (!this.dialogHandlers.hideProgress) {
            log.warn('Progress hide handler not registered');
            return;
        }
        
        this.dialogHandlers.hideProgress();
        log.debug('Progress dialog hidden');
    }
}

export const aiDialogHelper = AIDialogHelper.getInstance();
