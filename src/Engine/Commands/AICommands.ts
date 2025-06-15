import { ICommand, CommandContext } from '@/Types/CommandTypes';
import { CellDefinition, CodeCellDefinition, MarkdownCellDefinition } from '@/Types/NotebookModel';
import { AIService, NotebookContext } from '@/Engine/AIService';
import { aiDialogHelper } from '@/lib/AIDialogHelper';
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
        const commandId = Date.now().toString(36);
        try {
            log.info(`[${commandId}] Starting GenerateNotebookCommand execution`);
            
            const aiService = AIService.getInstance();
            
            // Check if API keys are configured
            if (!aiService.hasAPIKeys()) {
                log.warn(`[${commandId}] No API keys configured, showing configuration dialog`);
                await aiDialogHelper.showError(
                    'AI Configuration Required',
                    'Please configure your AI API keys in the settings before generating notebooks.'
                );
                return;
            }
            
            log.debug(`[${commandId}] API keys available, showing prompt dialog`);
            
            // Show input dialog to get user prompt
            const prompt = await aiDialogHelper.showPrompt(
                'Generate Notebook with AI',
                'Describe the notebook you want to create (e.g., "A data analysis notebook for sales data with charts")'
            );
            
            if (!prompt) {
                log.info(`[${commandId}] User cancelled AI notebook generation`);
                return;
            }

            log.info(`[${commandId}] User provided prompt for notebook generation`, {
                promptLength: prompt.length,
                promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
            });
            
            // Show progress dialog
            log.debug(`[${commandId}] Showing progress dialog`);
            await aiDialogHelper.showProgress(
                'Generating Notebook',
                'AI is generating your notebook... This may take a few moments.'
            );
            
            try {
                log.debug(`[${commandId}] Calling AI service to generate notebook`);
                // Generate notebook using AI service
                const generatedContent = await aiService.generateNotebook(prompt);
                
                log.debug(`[${commandId}] AI generation completed, hiding progress dialog`);
                aiDialogHelper.hideProgress();
                
                log.debug(`[${commandId}] Parsing and creating notebook from generated content`);
                // Parse the generated content and create a new notebook
                await this.createNotebookFromGenerated(generatedContent);
                
                log.info(`[${commandId}] Notebook generated and created successfully`);
                
                await aiDialogHelper.showSuccess(
                    'Notebook Generated',
                    'Your AI-generated notebook has been created successfully!'
                );
                
            } catch (aiError) {
                log.error(`[${commandId}] AI generation failed:`, {
                    error: aiError instanceof Error ? aiError.message : 'Unknown error',
                    stack: aiError instanceof Error ? aiError.stack : undefined,
                    prompt: prompt.substring(0, 100) + '...'
                });
                
                aiDialogHelper.hideProgress();
                await aiDialogHelper.showError(
                    'AI Generation Failed',
                    `Failed to generate notebook: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
                );
            }
            
        } catch (error) {
            log.error(`[${commandId}] Error in GenerateNotebookCommand:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            
            aiDialogHelper.hideProgress();
            await aiDialogHelper.showError('Error generating notebook', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Create a new notebook from AI-generated content
     */
    private async createNotebookFromGenerated(generatedContent: string): Promise<void> {
        const parseId = Date.now().toString(36);
        try {
            log.debug(`[${parseId}] Starting to parse generated notebook content`, {
                contentLength: generatedContent.length,
                contentPreview: generatedContent.substring(0, 200) + '...'
            });
            
            // Parse the XML content to extract cells
            const cells = this.parseGeneratedNotebook(generatedContent);
            
            if (cells.length === 0) {
                log.error(`[${parseId}] No valid cells found in generated content`);
                throw new Error('No valid cells found in generated content');
            }
            
            log.info(`[${parseId}] Successfully parsed ${cells.length} cells from generated content`, {
                cellTypes: cells.map(cell => ({ id: cell.id, type: cell.type }))
            });
            
            // Create new notebook model
            const newNotebook = {
                cells: cells
            };
            
            log.debug(`[${parseId}] Setting new notebook model in application provider`);
            // Use application provider to create new notebook
            this.context.applicationProvider.setModel(newNotebook);
            this.context.applicationProvider.setDirty(true);
            
            log.info(`[${parseId}] Successfully created notebook with ${cells.length} cells`);
            
        } catch (error) {
            log.error(`[${parseId}] Failed to create notebook from generated content:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                contentLength: generatedContent.length
            });
            throw new Error(`Failed to parse generated notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Parse AI-generated XML content into cell definitions
     */
    private parseGeneratedNotebook(content: string): CellDefinition[] {
        const parseId = Date.now().toString(36);
        const cells: CellDefinition[] = [];
        
        try {
            log.debug(`[${parseId}] Starting to parse XML content`, {
                contentLength: content.length
            });
            
            // Simple regex-based parsing for <VSCode.Cell> elements
            // In production, you might want to use a proper XML parser
            const cellRegex = /<VSCode\.Cell[^>]*language="([^"]*)"[^>]*>([\s\S]*?)<\/VSCode\.Cell>/g;
            let match;
            let cellCount = 0;
            
            while ((match = cellRegex.exec(content)) !== null) {
                cellCount++;
                const language = match[1];
                const cellContent = match[2].trim();
                
                log.debug(`[${parseId}] Found cell ${cellCount}`, {
                    language,
                    contentLength: cellContent.length,
                    contentPreview: cellContent.substring(0, 100) + (cellContent.length > 100 ? '...' : '')
                });
                
                const cellId = `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                if (language === 'javascript') {
                    cells.push({
                        type: 'code',
                        id: cellId,
                        code: cellContent
                    } as CodeCellDefinition);
                    log.debug(`[${parseId}] Added code cell with id: ${cellId}`);
                } else if (language === 'markdown') {
                    cells.push({
                        type: 'markdown',
                        id: cellId,
                        content: cellContent
                    } as MarkdownCellDefinition);
                    log.debug(`[${parseId}] Added markdown cell with id: ${cellId}`);
                } else {
                    log.warn(`[${parseId}] Skipping unsupported cell language: ${language}`);
                }
            }
            
            log.info(`[${parseId}] Successfully parsed ${cells.length} cells from ${cellCount} found cell blocks`);
            return cells;
            
        } catch (error) {
            log.error(`[${parseId}] Failed to parse generated content:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                contentLength: content.length
            });
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
        const commandId = Date.now().toString(36);
        try {
            log.info(`[${commandId}] Starting GenerateCodeCellCommand execution`);
            
            const aiService = AIService.getInstance();
            
            // Check if API keys are configured
            if (!aiService.hasAPIKeys()) {
                log.warn(`[${commandId}] No API keys configured, showing configuration dialog`);
                await aiDialogHelper.showError(
                    'AI Configuration Required',
                    'Please configure your AI API keys in the settings before generating code cells.'
                );
                return;
            }
            
            log.debug(`[${commandId}] API keys available, showing prompt dialog`);
            
            // Show input dialog to get user prompt
            const prompt = await aiDialogHelper.showPrompt(
                'Generate Code Cell with AI',
                'Describe the code you want to generate (e.g., "Create a scatter plot using the sales data")'
            );
            
            if (!prompt) {
                log.info(`[${commandId}] User cancelled AI code cell generation`);
                return;
            }

            log.info(`[${commandId}] User provided prompt for code cell generation`, {
                promptLength: prompt.length,
                promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
            });
            
            // Get current notebook context for AI
            log.debug(`[${commandId}] Building notebook context for AI`);
            const context = this.buildNotebookContext();
            log.debug(`[${commandId}] Notebook context built`, {
                variableCount: context.variables.length,
                moduleCount: context.modules.length,
                cellCount: context.cellContents.length,
                variables: context.variables,
                modules: context.modules
            });
            
            // Show progress dialog
            log.debug(`[${commandId}] Showing progress dialog`);
            await aiDialogHelper.showProgress(
                'Generating Code Cell',
                'AI is generating your code cell... This may take a few moments.'
            );
            
            try {
                log.debug(`[${commandId}] Calling AI service to generate code cell`);
                // Generate code cell using AI service
                const generatedCode = await aiService.generateCodeCell(prompt, context);
                
                log.debug(`[${commandId}] AI generation completed, hiding progress dialog`);
                aiDialogHelper.hideProgress();
                
                log.debug(`[${commandId}] Creating and adding new code cell`, {
                    codeLength: generatedCode.length,
                    codePreview: generatedCode.substring(0, 200) + (generatedCode.length > 200 ? '...' : '')
                });
                
                // Create and add the new code cell
                await this.createCodeCellFromGenerated(generatedCode);
                
                log.info(`[${commandId}] Code cell generated and added successfully`);
                
                await aiDialogHelper.showSuccess(
                    'Code Cell Generated',
                    'Your AI-generated code cell has been added to the notebook!'
                );
                
            } catch (aiError) {
                log.error(`[${commandId}] AI generation failed:`, {
                    error: aiError instanceof Error ? aiError.message : 'Unknown error',
                    stack: aiError instanceof Error ? aiError.stack : undefined,
                    prompt: prompt.substring(0, 100) + '...',
                    context: {
                        variables: context.variables.length,
                        modules: context.modules.length,
                        cells: context.cellContents.length
                    }
                });
                
                aiDialogHelper.hideProgress();
                await aiDialogHelper.showError(
                    'AI Generation Failed',
                    `Failed to generate code cell: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
                );
            }
            
        } catch (error) {
            log.error(`[${commandId}] Error in GenerateCodeCellCommand:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            
            aiDialogHelper.hideProgress();
            await aiDialogHelper.showError('Error generating code cell', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private buildNotebookContext(): NotebookContext {
        const contextId = Date.now().toString(36);
        const model = this.context.applicationProvider.currentModel;
        
        log.debug(`[${contextId}] Building notebook context`, {
            hasModel: !!model,
            cellCount: model?.cells?.length || 0
        });
        
        const context: NotebookContext = {
            variables: [] as string[],
            modules: [] as string[],
            cellContents: [] as Array<{type: string, content: string}>
        };

        if (!model) {
            log.debug(`[${contextId}] No model available, returning empty context`);
            return context;
        }

        // Extract variables from reactive system
        const reactiveSystem = this.context.reactiveSystem;
        if (reactiveSystem && reactiveSystem.reactiveStore) {
            try {
                const allVariables = reactiveSystem.reactiveStore.getAllVariables();
                context.variables = Object.keys(allVariables);
                log.debug(`[${contextId}] Extracted reactive variables`, {
                    variableCount: context.variables.length,
                    variables: context.variables
                });
            } catch (error) {
                log.warn(`[${contextId}] Error getting reactive variables:`, error);
            }
        }

        // Extract content from existing cells for context
        model.cells.forEach((cell: CellDefinition, index: number) => {
            log.debug(`[${contextId}] Processing cell ${index}`, {
                type: cell.type,
                id: cell.id
            });
            
            switch (cell.type) {
                case 'code':
                    const codeCell = cell as CodeCellDefinition;
                    context.cellContents.push({
                        type: 'code',
                        content: codeCell.code
                    });
                    log.debug(`[${contextId}] Added code cell to context`, {
                        codeLength: codeCell.code.length
                    });
                    break;
                case 'markdown':
                    const markdownCell = cell as MarkdownCellDefinition;
                    context.cellContents.push({
                        type: 'markdown',
                        content: markdownCell.content
                    });
                    log.debug(`[${contextId}] Added markdown cell to context`, {
                        contentLength: markdownCell.content.length
                    });
                    break;
                case 'formula':
                    context.variables.push(cell.variableName);
                    log.debug(`[${contextId}] Added formula variable to context`, {
                        variableName: cell.variableName
                    });
                    break;
                case 'input':
                    context.variables.push(cell.variableName);
                    log.debug(`[${contextId}] Added input variable to context`, {
                        variableName: cell.variableName
                    });
                    break;
            }
        });

        // TODO: Add available modules from module registry
        // This will be implemented when we have access to the module registry
        context.modules = ['tf', 'd3', 'plotly', 'Math', 'lodash', 'moment']; // Common modules

        log.info(`[${contextId}] Notebook context built successfully`, {
            variableCount: context.variables.length,
            moduleCount: context.modules.length,
            cellContentCount: context.cellContents.length,
            variables: context.variables,
            modules: context.modules
        });

        return context;
    }

    /**
     * Create and add a new code cell from AI-generated content
     */
    private async createCodeCellFromGenerated(generatedCode: string): Promise<void> {
        const createId = Date.now().toString(36);
        try {
            log.debug(`[${createId}] Creating code cell from generated content`, {
                codeLength: generatedCode.length,
                codePreview: generatedCode.substring(0, 100) + (generatedCode.length > 100 ? '...' : '')
            });
            
            // Create new code cell
            const cellId = `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newCell: CodeCellDefinition = {
                type: 'code',
                id: cellId,
                code: generatedCode.trim()
            };
            
            log.debug(`[${createId}] Created cell definition`, {
                cellId,
                codeLength: newCell.code.length
            });
            
            // Add cell using the notebook operations
            log.debug(`[${createId}] Adding cell to notebook using operations`);
            this.context.notebookOperations.addCell('code');
            
            // Update the cell with the generated code
            // This is a simplified approach - in a real implementation,
            // you'd want to properly integrate with the cell management system
            log.info(`[${createId}] Code cell created with generated content successfully`, {
                cellId,
                codeLength: newCell.code.length
            });
            
        } catch (error) {
            log.error(`[${createId}] Failed to create code cell from generated content:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                codeLength: generatedCode.length
            });
            throw new Error(`Failed to add generated code cell: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
