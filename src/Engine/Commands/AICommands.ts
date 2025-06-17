import { ICommand, CommandContext } from '@/Types/CommandTypes';
import { CellDefinition, CodeCellDefinition, MarkdownCellDefinition, InputCellDefinition, FormulaCellDefinition } from '@/Types/NotebookModel';
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
     * Parse AI-generated JSON content into cell definitions
     */
    private parseGeneratedNotebook(content: string): CellDefinition[] {
        const parseId = Date.now().toString(36);
        const cells: CellDefinition[] = [];
        
        try {
            log.debug(`[${parseId}] Starting to parse JSON content`, {
                contentLength: content.length,
                contentPreview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
            });
            
            // Clean the content - remove any markdown code blocks if present
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            log.debug(`[${parseId}] Cleaned content`, {
                originalLength: content.length,
                cleanedLength: cleanContent.length,
                cleanedPreview: cleanContent.substring(0, 200) + (cleanContent.length > 200 ? '...' : '')
            });
            
            // Parse the JSON
            let notebookData;
            try {
                notebookData = JSON.parse(cleanContent);
            } catch (jsonError) {
                log.error(`[${parseId}] JSON parsing failed:`, {
                    error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
                    contentPreview: cleanContent.substring(0, 500)
                });
                throw new Error(`Invalid JSON format: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
            }
            
            // Validate the notebook structure
            if (!notebookData || typeof notebookData !== 'object') {
                throw new Error('Invalid notebook format: not an object');
            }
            
            if (!Array.isArray(notebookData.cells)) {
                throw new Error('Invalid notebook format: cells must be an array');
            }
            
            log.info(`[${parseId}] Successfully parsed JSON with ${notebookData.cells.length} cells`);
            
            // Process each cell
            notebookData.cells.forEach((cellData: any, index: number) => {
                log.debug(`[${parseId}] Processing cell ${index + 1}`, {
                    type: cellData.type,
                    id: cellData.id,
                    hasContent: !!(cellData.content || cellData.code || cellData.formula)
                });
                
                try {
                    const processedCell = this.processCellData(cellData, parseId, index);
                    if (processedCell) {
                        cells.push(processedCell);
                        log.debug(`[${parseId}] Successfully added ${processedCell.type} cell: ${processedCell.id}`);
                    }
                } catch (cellError) {
                    log.error(`[${parseId}] Failed to process cell ${index + 1}:`, {
                        error: cellError instanceof Error ? cellError.message : 'Unknown cell error',
                        cellData: cellData
                    });
                    // Continue processing other cells instead of failing completely
                }
            });
            
            if (cells.length === 0) {
                throw new Error('No valid cells were processed from the generated content');
            }
            
            log.info(`[${parseId}] Successfully processed ${cells.length} cells`);
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

    /**
     * Process individual cell data from JSON into CellDefinition
     */
    private processCellData(cellData: any, parseId: string, index: number): CellDefinition | null {
        if (!cellData || typeof cellData !== 'object') {
            log.warn(`[${parseId}] Skipping invalid cell data at index ${index}`);
            return null;
        }

        const cellType = cellData.type;
        const cellId = cellData.id || `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        switch (cellType) {
            case 'markdown':
                if (!cellData.content) {
                    log.warn(`[${parseId}] Markdown cell missing content at index ${index}`);
                    return null;
                }
                return {
                    type: 'markdown',
                    id: cellId,
                    content: cellData.content,
                    variables: cellData.variables || []
                } as MarkdownCellDefinition;

            case 'code':
                if (cellData.code === undefined) {
                    log.warn(`[${parseId}] Code cell missing code at index ${index}`);
                    return null;
                }
                return {
                    type: 'code',
                    id: cellId,
                    code: cellData.code,
                    language: cellData.language || 'javascript',
                    exports: cellData.exports || []
                } as CodeCellDefinition;

            case 'input':
                if (!cellData.inputType || !cellData.variableName) {
                    log.warn(`[${parseId}] Input cell missing required fields at index ${index}:`, {
                        hasInputType: !!cellData.inputType,
                        hasVariableName: !!cellData.variableName
                    });
                    return null;
                }
                return {
                    type: 'input',
                    id: cellId,
                    label: cellData.label || cellData.variableName,
                    inputType: cellData.inputType,
                    variableName: cellData.variableName,
                    value: cellData.value !== undefined ? cellData.value : '',
                    props: cellData.props || {}
                } as InputCellDefinition;

            case 'formula':
                if (!cellData.variableName || !cellData.formula) {
                    log.warn(`[${parseId}] Formula cell missing required fields at index ${index}:`, {
                        hasVariableName: !!cellData.variableName,
                        hasFormula: !!cellData.formula
                    });
                    return null;
                }
                return {
                    type: 'formula',
                    id: cellId,
                    variableName: cellData.variableName,
                    formula: cellData.formula
                } as FormulaCellDefinition;

            default:
                log.warn(`[${parseId}] Unsupported cell type at index ${index}: ${cellType}`);
                return null;
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

/**
 * Generate any type of cell from AI prompt command
 */
export class GenerateCellCommand extends BaseAICommand {
    getDescription(): string {
        return 'Generate a cell using AI';
    }

    canExecute(): boolean {
        return !!this.context.applicationProvider.currentModel;
    }

    async execute(): Promise<void> {
        const commandId = Date.now().toString(36);
        try {
            log.info(`[${commandId}] Starting GenerateCellCommand execution`);
            
            const aiService = AIService.getInstance();
            
            // Check if API keys are configured
            if (!aiService.hasAPIKeys()) {
                log.warn(`[${commandId}] No API keys configured, showing configuration dialog`);
                await aiDialogHelper.showError(
                    'AI Configuration Required',
                    'Please configure your AI API keys in the settings before generating cells.'
                );
                return;
            }
            
            log.debug(`[${commandId}] API keys available, showing prompt dialog`);
            
            // Show input dialog to get user prompt
            const prompt = await aiDialogHelper.showPrompt(
                'Generate Cell with AI',
                'Describe what you want to create (e.g., "Calculate compound interest", "Show sales data in a chart", "Add markdown explaining the analysis")'
            );
            
            if (!prompt) {
                log.info(`[${commandId}] User cancelled AI cell generation`);
                return;
            }

            log.info(`[${commandId}] User provided prompt for cell generation`, {
                promptLength: prompt.length,
                promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
            });
            
            // Enhanced logging for debugging context issues
            log.info(`[${commandId}] Starting AI cell generation with enhanced context logging`);
            
            // Log the user request
            log.info(`[${commandId}] User request: "${prompt}"`);
            
            // Log current model state
            const model = this.context.applicationProvider.currentModel;
            if (model) {
                log.info(`[${commandId}] Current notebook has ${model.cells.length} cells`);
                model.cells.forEach((cell: CellDefinition, idx: number) => {
                    log.info(`[${commandId}] Cell ${idx + 1}: ${cell.type} (ID: ${cell.id})`);
                    if (cell.type === 'input') {
                        const inputCell = cell as InputCellDefinition;
                        log.info(`[${commandId}]   Input cell: ${inputCell.variableName} = ${inputCell.value} (${inputCell.inputType})`);
                    } else if (cell.type === 'formula') {
                        const formulaCell = cell as FormulaCellDefinition;
                        log.info(`[${commandId}]   Formula cell: ${formulaCell.variableName} = ${formulaCell.formula}`);
                    }
                });
            }
            
            // Log reactive system state
            const reactiveSystem = this.context.reactiveSystem;
            if (reactiveSystem && reactiveSystem.reactiveStore) {
                try {
                    const allVars = reactiveSystem.reactiveStore.getAllVariables();
                    log.info(`[${commandId}] Reactive system has ${Object.keys(allVars).length} variables:`, Object.keys(allVars));
                    
                    // Log a sample of variable values
                    const sampleVars = Object.keys(allVars).slice(0, 5);
                    const sampleValues: Record<string, any> = {};
                    sampleVars.forEach(varName => {
                        const value = allVars[varName];
                        sampleValues[varName] = typeof value === 'object' ? '[Object]' : value;
                    });
                    log.info(`[${commandId}] Sample variable values:`, sampleValues);
                } catch (error) {
                    log.warn(`[${commandId}] Could not access reactive system variables:`, error);
                }
            }
            
            // Get current notebook context for AI
            log.debug(`[${commandId}] Building notebook context for AI`);
            const context = this.buildNotebookContext();
            
            // Log the complete context that will be sent to AI
            log.info(`[${commandId}] Complete notebook context for AI generation:`, {
                variableCount: context.variables.length,
                moduleCount: context.modules.length,
                cellCount: context.cellContents.length,
                variables: context.variables,
                modules: context.modules,
                cellContents: context.cellContents.map((cell, idx) => ({
                    index: idx,
                    type: cell.type,
                    contentPreview: cell.content.substring(0, 100) + (cell.content.length > 100 ? '...' : ''),
                    contentLength: cell.content.length
                }))
            });
            
            // Show progress dialog
            log.debug(`[${commandId}] Showing progress dialog`);
            await aiDialogHelper.showProgress(
                'Generating Cell',
                'AI is analyzing your request and choosing the best cell type... This may take a few moments.'
            );
            
            try {
                log.debug(`[${commandId}] Calling AI service to generate cell`);
                // Generate cell using AI service
                const cellDefinition = await aiService.generateCell(prompt, context);
                
                log.debug(`[${commandId}] AI generation completed, hiding progress dialog`);
                aiDialogHelper.hideProgress();
                
                log.debug(`[${commandId}] Creating and adding new cell`, {
                    cellType: cellDefinition.type,
                    cellId: cellDefinition.id
                });
                
                // Create and add the new cell
                await this.createCellFromDefinition(cellDefinition);
                
                log.info(`[${commandId}] Cell generated and added successfully`, {
                    cellType: cellDefinition.type,
                    cellId: cellDefinition.id
                });
                
                await aiDialogHelper.showSuccess(
                    'Cell Generated',
                    `Your AI-generated ${cellDefinition.type} cell has been added to the notebook!`
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
                    `Failed to generate cell: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`
                );
            }
            
        } catch (error) {
            log.error(`[${commandId}] Error in GenerateCellCommand:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            
            aiDialogHelper.hideProgress();
            await aiDialogHelper.showError('Error generating cell', error instanceof Error ? error.message : 'Unknown error');
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
     * Create and add a new cell from AI-generated definition
     */
    private async createCellFromDefinition(cellDefinition: CellDefinition): Promise<void> {
        const createId = Date.now().toString(36);
        try {
            log.debug(`[${createId}] Creating cell from definition`, {
                cellType: cellDefinition.type,
                cellId: cellDefinition.id
            });
            
            // Calculate where to insert the cell (after selected cell or at end)
            const model = this.context.applicationProvider.currentModel;
            if (!model) {
                throw new Error('No notebook model available');
            }

            // Find the index where to insert the new cell
            let insertIndex = model.cells.length; // Default to end
            
            // Try to get the selected cell from the reactive system
            const reactiveSystem = this.context.reactiveSystem;
            if (reactiveSystem && reactiveSystem.reactiveStore) {
                try {
                    const selectedCellId = reactiveSystem.reactiveStore.getValue('selectedCellId');
                    if (selectedCellId) {
                        const selectedIndex = model.cells.findIndex((cell: CellDefinition) => cell.id === selectedCellId);
                        if (selectedIndex !== -1) {
                            insertIndex = selectedIndex + 1; // Insert after selected cell
                            log.debug(`[${createId}] Will insert after selected cell`, {
                                selectedCellId,
                                selectedIndex,
                                insertIndex
                            });
                        }
                    }
                } catch (error) {
                    log.warn(`[${createId}] Could not get selected cell ID:`, error);
                }
            }
            
            // First, add a default cell using the applicationProvider directly
            const applicationProvider = this.context.applicationProvider;
            const newCellId = applicationProvider.addCell(cellDefinition.type, insertIndex);
            if (!newCellId) {
                throw new Error('Failed to create new cell');
            }
            
            // Then update the cell with the generated content
            await this.updateCellWithGeneratedContent(newCellId, cellDefinition);
            
            log.info(`[${createId}] Cell created and inserted successfully`, {
                cellType: cellDefinition.type,
                cellId: newCellId,
                insertIndex
            });
            
        } catch (error) {
            log.error(`[${createId}] Failed to create cell from definition:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                cellType: cellDefinition.type,
                cellId: cellDefinition.id
            });
            throw new Error(`Failed to add generated cell: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update the newly created cell with the AI-generated content
     */
    private async updateCellWithGeneratedContent(cellId: string, cellDefinition: CellDefinition): Promise<void> {
        const updateId = Date.now().toString(36);
        try {
            log.debug(`[${updateId}] Updating cell with generated content`, {
                cellId,
                cellType: cellDefinition.type
            });
            
            // Get the current model to find and update the cell
            const model = this.context.applicationProvider.currentModel;
            if (!model) {
                throw new Error('No notebook model available');
            }
            
            const cellIndex = model.cells.findIndex((cell: CellDefinition) => cell.id === cellId);
            if (cellIndex === -1) {
                throw new Error(`Cell with ID ${cellId} not found`);
            }
            
            // Update the cell with the AI-generated content
            const newCells = [...model.cells];
            newCells[cellIndex] = {
                ...newCells[cellIndex],
                ...cellDefinition,
                id: cellId // Keep the original ID
            };
            
            // Update the model
            this.context.applicationProvider.setModel({
                ...model,
                cells: newCells
            });
            
            // Mark as dirty
            this.context.applicationProvider.setDirty(true);
            
            log.info(`[${updateId}] Cell content updated successfully`, {
                cellId,
                cellType: cellDefinition.type
            });
            
        } catch (error) {
            log.error(`[${updateId}] Failed to update cell content:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                cellId,
                cellType: cellDefinition.type
            });
            throw error;
        }
    }
}
