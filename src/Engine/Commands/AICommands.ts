import { ICommand, CommandContext } from '@/Types/CommandTypes';
import { CellDefinition, CodeCellDefinition, MarkdownCellDefinition } from '@/Types/NotebookModel';
import anylogger from 'anylogger';

const log = anylogger('AICommands');

/**
 * Base command class with access to context
 */
abstract class BaseAICommand implements ICommand {
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
 * Generate notebook from AI prompt command
 */
export class GenerateNotebookCommand extends BaseAICommand {
    getDescription(): string {
        return 'Generate a new notebook using AI';
    }

    canExecute(): boolean {
        return true; // Always available
    }

    async execute(): Promise<void> {
        try {
            log.debug('Executing GenerateNotebookCommand');
            
            // Show input dialog to get user prompt
            const prompt = await this.showPromptDialog(
                'Generate Notebook with AI',
                'Describe the notebook you want to create (e.g., "A data analysis notebook for sales data with charts")'
            );
            
            if (!prompt) {
                log.debug('User cancelled AI notebook generation');
                return;
            }

            log.info('Generating notebook with AI prompt:', prompt);
            
            // TODO: This will be implemented in Step 3
            // For now, show a placeholder message
            await this.showInfoDialog(
                'AI Notebook Generation',
                `AI integration not yet implemented.\n\nYour prompt: "${prompt}"\n\nComing soon!`
            );
            
        } catch (error) {
            log.error('Error in GenerateNotebookCommand:', error);
            await this.showErrorDialog('Error generating notebook', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private async showPromptDialog(title: string, message: string): Promise<string | null> {
        // Use electron dialog API
        const result = await window.api.showInputDialog({
            title,
            message,
            placeholder: 'Enter your prompt here...'
        });
        
        return result.cancelled ? null : result.value;
    }

    private async showInfoDialog(title: string, message: string): Promise<void> {
        await window.api.showMessageDialog({
            type: 'info',
            title,
            message
        });
    }

    private async showErrorDialog(title: string, message: string): Promise<void> {
        await window.api.showMessageDialog({
            type: 'error',
            title,
            message
        });
    }
}

/**
 * Generate code cell from AI prompt command
 */
export class GenerateCodeCellCommand extends BaseAICommand {
    getDescription(): string {
        return 'Generate a code cell using AI';
    }

    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }

    async execute(): Promise<void> {
        try {
            log.debug('Executing GenerateCodeCellCommand');
            
            // Show input dialog to get user prompt
            const prompt = await this.showPromptDialog(
                'Generate Code Cell with AI',
                'Describe the code you want to generate (e.g., "Create a scatter plot using the sales data")'
            );
            
            if (!prompt) {
                log.debug('User cancelled AI code cell generation');
                return;
            }

            log.info('Generating code cell with AI prompt:', prompt);
            
            // Get current notebook context for AI
            const context = this.buildNotebookContext();
            log.debug('Notebook context for AI:', context);
            
            // TODO: This will be implemented in Step 3
            // For now, show a placeholder message
            await this.showInfoDialog(
                'AI Code Cell Generation',
                `AI integration not yet implemented.\n\nYour prompt: "${prompt}"\n\nAvailable context:\n- Variables: ${context.variables.join(', ') || 'none'}\n- Modules: ${context.modules.join(', ') || 'none'}\n\nComing soon!`
            );
            
        } catch (error) {
            log.error('Error in GenerateCodeCellCommand:', error);
            await this.showErrorDialog('Error generating code cell', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private buildNotebookContext() {
        const model = this.context.applicationProvider.currentModel;
        const context = {
            variables: [] as string[],
            modules: [] as string[],
            cellContents: [] as Array<{type: string, content: string}>
        };

        if (!model) {
            return context;
        }

        // Extract variables from reactive system
        const reactiveSystem = this.context.reactiveSystem;
        if (reactiveSystem && reactiveSystem.reactiveStore) {
            try {
                const allVariables = reactiveSystem.reactiveStore.getAllVariables();
                context.variables = Object.keys(allVariables);
            } catch (error) {
                log.warn('Error getting reactive variables:', error);
            }
        }

        // Extract content from existing cells for context
        model.cells.forEach((cell: CellDefinition) => {
            switch (cell.type) {
                case 'code':
                    context.cellContents.push({
                        type: 'code',
                        content: (cell as CodeCellDefinition).code
                    });
                    break;
                case 'markdown':
                    context.cellContents.push({
                        type: 'markdown',
                        content: (cell as MarkdownCellDefinition).content
                    });
                    break;
                case 'formula':
                    context.variables.push(cell.variableName);
                    break;
                case 'input':
                    context.variables.push(cell.variableName);
                    break;
            }
        });

        // TODO: Add available modules from module registry
        // This will be implemented when we have access to the module registry
        context.modules = ['tf', 'd3', 'plotly', 'Math', 'lodash', 'moment']; // Common modules

        return context;
    }

    private async showPromptDialog(title: string, message: string): Promise<string | null> {
        // Use electron dialog API
        const result = await window.api.showInputDialog({
            title,
            message,
            placeholder: 'Enter your prompt here...'
        });
        
        return result.cancelled ? null : result.value;
    }

    private async showInfoDialog(title: string, message: string): Promise<void> {
        await window.api.showMessageDialog({
            type: 'info',
            title,
            message
        });
    }

    private async showErrorDialog(title: string, message: string): Promise<void> {
        await window.api.showMessageDialog({
            type: 'error',
            title,
            message
        });
    }
}
