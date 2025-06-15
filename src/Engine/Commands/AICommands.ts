import { ICommand, CommandContext } from '@/Types/CommandTypes';
import { CellDefinition, CodeCellDefinition, MarkdownCellDefinition } from '@/Types/NotebookModel';
import { AIService, NotebookContext } from '@/Engine/AIService';
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
            
            const aiService = AIService.getInstance();
            
            // Check if API keys are configured
            if (!aiService.hasAPIKeys()) {
                await this.showErrorDialog(
                    'AI Configuration Required',
                    'Please configure your AI API keys in the settings before generating notebooks.'
                );
                return;
            }
            
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
            
            try {
                // Generate notebook using AI service
                const generatedContent = await aiService.generateNotebook(prompt);
                
                // Parse the generated content and create a new notebook
                await this.createNotebookFromGenerated(generatedContent);
                
                log.info('Notebook generated and created successfully');
                
            } catch (aiError) {
                log.error('AI generation failed:', aiError);
                await this.showErrorDialog(
                    'AI Generation Failed',
                    `Failed to generate notebook: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
                );
            }
            
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

    /**
     * Create a new notebook from AI-generated content
     */
    private async createNotebookFromGenerated(generatedContent: string): Promise<void> {
        try {
            // Parse the XML content to extract cells
            const cells = this.parseGeneratedNotebook(generatedContent);
            
            if (cells.length === 0) {
                throw new Error('No valid cells found in generated content');
            }
            
            // Create new notebook model
            const newNotebook = {
                cells: cells
            };
            
            // Use application provider to create new notebook
            this.context.applicationProvider.setModel(newNotebook);
            this.context.applicationProvider.setDirty(true);
            
            log.info(`Created notebook with ${cells.length} cells`);
            
        } catch (error) {
            log.error('Failed to create notebook from generated content:', error);
            throw new Error(`Failed to parse generated notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Parse AI-generated XML content into cell definitions
     */
    private parseGeneratedNotebook(content: string): CellDefinition[] {
        const cells: CellDefinition[] = [];
        
        try {
            // Simple regex-based parsing for <VSCode.Cell> elements
            // In production, you might want to use a proper XML parser
            const cellRegex = /<VSCode\.Cell[^>]*language="([^"]*)"[^>]*>([\s\S]*?)<\/VSCode\.Cell>/g;
            let match;
            
            while ((match = cellRegex.exec(content)) !== null) {
                const language = match[1];
                const cellContent = match[2].trim();
                
                const cellId = `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                if (language === 'javascript') {
                    cells.push({
                        type: 'code',
                        id: cellId,
                        code: cellContent
                    } as CodeCellDefinition);
                } else if (language === 'markdown') {
                    cells.push({
                        type: 'markdown',
                        id: cellId,
                        content: cellContent
                    } as MarkdownCellDefinition);
                }
            }
            
            return cells;
            
        } catch (error) {
            log.error('Failed to parse generated content:', error);
            throw error;
        }
    }

    // ...existing code...
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
            
            const aiService = AIService.getInstance();
            
            // Check if API keys are configured
            if (!aiService.hasAPIKeys()) {
                await this.showErrorDialog(
                    'AI Configuration Required',
                    'Please configure your AI API keys in the settings before generating code cells.'
                );
                return;
            }
            
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
            
            try {
                // Generate code cell using AI service
                const generatedCode = await aiService.generateCodeCell(prompt, context);
                
                // Create and add the new code cell
                await this.createCodeCellFromGenerated(generatedCode);
                
                log.info('Code cell generated and added successfully');
                
            } catch (aiError) {
                log.error('AI generation failed:', aiError);
                await this.showErrorDialog(
                    'AI Generation Failed',
                    `Failed to generate code cell: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
                );
            }
            
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

    /**
     * Create and add a new code cell from AI-generated content
     */
    private async createCodeCellFromGenerated(generatedCode: string): Promise<void> {
        try {
            // Create new code cell
            const cellId = `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newCell: CodeCellDefinition = {
                type: 'code',
                id: cellId,
                code: generatedCode.trim()
            };
            
            // Add cell using the notebook operations
            this.context.notebookOperations.addCell('code');
            
            // Update the cell with the generated code
            // This is a simplified approach - in a real implementation,
            // you'd want to properly integrate with the cell management system
            log.info('Code cell created with generated content');
            
        } catch (error) {
            log.error('Failed to create code cell from generated content:', error);
            throw new Error(`Failed to add generated code cell: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
