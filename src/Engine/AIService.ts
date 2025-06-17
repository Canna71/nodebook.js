import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import anylogger from 'anylogger';
import { notebookGenerationSystemPrompt, codeCellGenerationSystemPrompt } from '../prompts/index-raw';
import { CellDefinition, validateCellDefinition } from '../Types/NotebookModel';

const log = anylogger('AIService');

export type LLMProvider = 'openai' | 'anthropic';

export interface AIConfiguration {
    provider: LLMProvider;
    model: string;
    maxTokens?: number;
    temperature?: number;
}

export interface APIKeys {
    openai?: string;
    anthropic?: string;
}

export interface NotebookContext {
    variables: string[];
    modules: string[];
    cellContents: Array<{type: string, content: string}>;
    notebookType?: 'new' | 'existing';
    notebookModel?: any; // Complete notebook model for full context
}

/**
 * AI Service for LLM integration with secure API key management
 */
export class AIService {
    private static instance: AIService;
    private apiKeys: APIKeys = {};
    private defaultConfig: AIConfiguration = {
        provider: 'openai',
        model: 'gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.7
    };

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    /**
     * Initialize API keys from secure storage or environment variables
     */
    public async initializeAPIKeys(): Promise<void> {
        try {
            // Try to load from secure storage first
            await this.loadAPIKeysFromSecureStorage();
            
            // If no keys in secure storage, try environment variables (for development)
            if (!this.apiKeys.openai && !this.apiKeys.anthropic) {
                await this.loadAPIKeysFromEnvironment();
            }
            
            log.info('API keys initialized successfully');
        } catch (error) {
            log.error('Failed to initialize API keys:', error);
        }
    }

    /**
     * Load API keys from Electron's secure storage
     */
    private async loadAPIKeysFromSecureStorage(): Promise<void> {
        try {
            // Use Electron's userData directory for storage
            const storedKeys = await window.api.getStoredAPIKeys();
            if (storedKeys) {
                this.apiKeys = storedKeys;
                log.info('API keys loaded from secure storage:', {
                    hasOpenAI: !!storedKeys.openai,
                    hasAnthropic: !!storedKeys.anthropic
                });
            } else {
                log.debug('No stored API keys found');
            }
        } catch (error) {
            log.warn('Failed to load API keys from secure storage:', error);
        }
    }

    /**
     * Load API keys from environment variables (for development)
     */
    private async loadAPIKeysFromEnvironment(): Promise<void> {
        // Note: In Electron renderer process, we need to get env vars from main process
        try {
            const envKeys = await window.api.getEnvironmentVariables(['OPENAI_API_KEY', 'ANTHROPIC_API_KEY']);
            if (envKeys.OPENAI_API_KEY) {
                this.apiKeys.openai = envKeys.OPENAI_API_KEY;
            }
            if (envKeys.ANTHROPIC_API_KEY) {
                this.apiKeys.anthropic = envKeys.ANTHROPIC_API_KEY;
            }
            log.debug('API keys loaded from environment variables');
        } catch (error) {
            log.warn('Failed to load API keys from environment:', error);
        }
    }

    /**
     * Save API keys to secure storage
     */
    public async saveAPIKeys(keys: APIKeys): Promise<void> {
        try {
            // Store in memory
            this.apiKeys = { ...keys };
            
            // Also store persistently using Electron API
            await window.api.saveAPIKeys(keys);
            
            log.info('API keys saved to secure storage:', {
                hasOpenAI: !!keys.openai,
                hasAnthropic: !!keys.anthropic
            });
        } catch (error) {
            log.error('Failed to save API keys:', error);
            throw error;
        }
    }

    /**
     * Check if API keys are configured
     */
    public hasAPIKeys(): boolean {
        const hasKeys = !!(this.apiKeys.openai || this.apiKeys.anthropic);
        log.debug('Checking API keys:', { 
            hasOpenAI: !!this.apiKeys.openai, 
            hasAnthropic: !!this.apiKeys.anthropic,
            hasKeys 
        });
        return hasKeys;
    }

    /**
     * Get available providers based on configured API keys
     */
    public getAvailableProviders(): LLMProvider[] {
        const providers: LLMProvider[] = [];
        if (this.apiKeys.openai) providers.push('openai');
        if (this.apiKeys.anthropic) providers.push('anthropic');
        return providers;
    }

    /**
     * Generate notebook from prompt
     */
    public async generateNotebook(prompt: string, config?: Partial<AIConfiguration>): Promise<string> {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        log.info('Starting notebook generation', {
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
            provider: finalConfig.provider,
            model: finalConfig.model
        });
        
        if (!this.hasAPIKeys()) {
            log.error('Notebook generation failed: No API keys configured');
            throw new Error('No API keys configured. Please configure API keys in settings.');
        }

        const systemPrompt = this.buildNotebookSystemPrompt();
        const userPrompt = this.buildNotebookUserPrompt(prompt);

        try {
            const result = await this.generateText(systemPrompt, userPrompt, finalConfig);
            log.info('Notebook generated successfully', {
                responseLength: result.length,
                promptLength: prompt.length
            });
            return result;
        } catch (error) {
            log.error('Failed to generate notebook:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                prompt: prompt.substring(0, 100) + '...',
                config: finalConfig
            });
            throw error;
        }
    }

    /**
     * Generate code cell from prompt with context
     */
    public async generateCodeCell(
        prompt: string, 
        context: NotebookContext, 
        config?: Partial<AIConfiguration>
    ): Promise<string> {
        const finalConfig = { ...this.defaultConfig, ...config };
        
        log.info('Starting code cell generation', {
            prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
            provider: finalConfig.provider,
            model: finalConfig.model,
            contextVariables: context.variables.length,
            contextModules: context.modules.length,
            contextCells: context.cellContents.length
        });
        
        if (!this.hasAPIKeys()) {
            log.error('Code cell generation failed: No API keys configured');
            throw new Error('No API keys configured. Please configure API keys in settings.');
        }

        const systemPrompt = this.buildCodeCellSystemPrompt();
        const userPrompt = this.buildCodeCellUserPrompt(prompt, context);

        try {
            const result = await this.generateText(systemPrompt, userPrompt, finalConfig);
            log.info('Code cell generated successfully', {
                responseLength: result.length,
                promptLength: prompt.length,
                contextSize: context.variables.length + context.modules.length + context.cellContents.length
            });
            return result;
        } catch (error) {
            log.error('Failed to generate code cell:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                prompt: prompt.substring(0, 100) + '...',
                config: finalConfig,
                context: {
                    variables: context.variables.length,
                    modules: context.modules.length,
                    cells: context.cellContents.length
                }
            });
            throw error;
        }
    }

    /**
     * Generate any type of cell from prompt with context
     */
    public async generateCell(
        prompt: string, 
        context: NotebookContext, 
        config?: Partial<AIConfiguration>
    ): Promise<CellDefinition> {
        const requestId = Date.now().toString(36);
        
        try {
            log.info(`[${requestId}] Generating cell with AI`, {
                promptLength: prompt.length,
                promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
                contextVariables: context.variables.length,
                contextModules: context.modules.length,
                contextCells: context.cellContents.length
            });

            const finalConfig = { ...this.defaultConfig, ...config };
            
            // Load the single cell generation system prompt
            const systemPrompt = await this.loadSystemPrompt('single-cell-generation-system.md');
            
            // Build user prompt with context
            const userPrompt = this.buildSingleCellUserPrompt(prompt, context);
            
            log.debug(`[${requestId}] Calling AI with single cell generation prompt`);
            const result = await this.generateText(systemPrompt, userPrompt, finalConfig);
            log.info('Cell generated successfully', {
                resultLength: result.length,
                resultPreview: result.substring(0, 200) + (result.length > 200 ? '...' : ''),
                fullResult: result.length < 500 ? result : result.substring(0, 500) + '...'
            });
            
            // Parse the result as JSON to get the cell definition
            const cellDefinition = this.parseSingleCellResponse(result);
            
            return cellDefinition;
            
        } catch (error) {
            log.error('Failed to generate cell:', {
                requestId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                prompt: prompt.substring(0, 100) + '...'
            });
            throw error;
        }
    }

    /**
     * Generate text using the configured LLM (public method for testing)
     */
    public async generateText(
        systemPrompt: string, 
        userPrompt: string, 
        config: AIConfiguration
    ): Promise<string> {
        return await this.generateTextInternal(systemPrompt, userPrompt, config);
    }

    /**
     * Generate text using the configured LLM
     */
    private async generateTextInternal(
        systemPrompt: string, 
        userPrompt: string, 
        config: AIConfiguration
    ): Promise<string> {
        const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const startTime = Date.now();
        
        log.info(`[${requestId}] Starting LLM request`, {
            provider: config.provider,
            model: config.model,
            maxTokens: config.maxTokens,
            temperature: config.temperature,
            systemPromptLength: systemPrompt.length,
            userPromptLength: userPrompt.length
        });
        
        log.debug(`[${requestId}] System prompt:`, systemPrompt.substring(0, 200) + '...');
        log.debug(`[${requestId}] User prompt:`, userPrompt);

        const apiKey = this.apiKeys[config.provider];
        if (!apiKey) {
            log.error(`[${requestId}] No API key configured for provider: ${config.provider}`);
            throw new Error(`No API key configured for provider: ${config.provider}`);
        }

        let model;
        try {
            log.debug(`[${requestId}] Creating provider instance for ${config.provider}`);
            
            switch (config.provider) {
                case 'openai':
                    // Create OpenAI provider with API key
                    const openaiProvider = createOpenAI({
                        apiKey: apiKey
                    });
                    model = openaiProvider(config.model);
                    break;
                case 'anthropic':
                    // Create Anthropic provider with API key  
                    const anthropicProvider = createAnthropic({
                        apiKey: apiKey
                    });
                    model = anthropicProvider(config.model);
                    break;
                default:
                    log.error(`[${requestId}] Unsupported provider: ${config.provider}`);
                    throw new Error(`Unsupported provider: ${config.provider}`);
            }

            log.debug(`[${requestId}] Sending request to ${config.provider} API`);
            
            const result = await generateText({
                model,
                system: systemPrompt,
                prompt: userPrompt,
                maxTokens: config.maxTokens,
                temperature: config.temperature
            });

            const duration = Date.now() - startTime;
            
            log.info(`[${requestId}] LLM request completed successfully`, {
                duration: `${duration}ms`,
                responseLength: result.text.length,
                usage: result.usage ? {
                    promptTokens: result.usage.promptTokens,
                    completionTokens: result.usage.completionTokens,
                    totalTokens: result.usage.totalTokens
                } : 'not available'
            });
            
            log.debug(`[${requestId}] Response text:`, result.text.substring(0, 500) + (result.text.length > 500 ? '...' : ''));

            return result.text;
        } catch (error) {
            const duration = Date.now() - startTime;
            log.error(`[${requestId}] LLM generation failed after ${duration}ms:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                provider: config.provider,
                model: config.model
            });
            throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Build system prompt for notebook generation
     */
    private buildNotebookSystemPrompt(): string {
        return notebookGenerationSystemPrompt;
    }

    /**
     * Build system prompt for code cell generation
     */
    private buildCodeCellSystemPrompt(): string {
        return codeCellGenerationSystemPrompt;
    }

    /**
     * Build user prompt for notebook generation
     */
    private buildNotebookUserPrompt(userPrompt: string): string {
        return `Create a complete interactive notebook based on this request:

"${userPrompt}"

## Output Format

**CRITICAL**: You must return ONLY a valid JSON object representing the notebook. Do not include any additional text, explanation, or markdown formatting outside the JSON.

The JSON should follow this exact structure:
\`\`\`json
{
  "cells": [
    {
      "type": "markdown",
      "id": "intro-md",
      "content": "# Your notebook title\\n\\nYour introduction content here"
    },
    {
      "type": "input",
      "id": "parameter-input",
      "label": "Parameter Label",
      "inputType": "number",
      "variableName": "parameterName",
      "value": 10,
      "props": {
        "min": 0,
        "max": 100,
        "step": 1
      }
    },
    {
      "type": "code",
      "id": "processing-code",
      "code": "// Your JavaScript code\\nconst result = parameterName * 2;\\nexports.processedResult = result;"
    }
  ],
  "metadata": {
    "title": "Brief notebook title",
    "description": "Brief description",
    "tags": ["relevant", "tags"],
    "version": "1.0"
  }
}
\`\`\`

## Notebook Requirements

### Structure
1. **Title & Introduction**: Start with a markdown cell with clear title and overview
2. **Interactive Parameters**: Use input cells for key parameters users can adjust
3. **Progressive Build**: Start simple, then add complexity through multiple cells
4. **Rich Visualizations**: Use DOM helpers in code cells to create appealing visual output
5. **Clear Explanations**: Markdown cells between code sections explaining what's happening
6. **Meaningful Exports**: Export variables with descriptive names for reactive updates

### Technical Guidelines
- Use the reactive system: \`exports.variableName = value\` in code cells
- Leverage available globals: \`dfd\`, \`tf\`, \`fs\`, \`crypto\`, DOM helpers
- Create interactive elements: sliders, inputs, buttons in input cells
- Build rich visual outputs using \`createTable\`, \`createContainer\`, etc. in code cells
- Handle data processing with danfojs DataFrames when appropriate
- Use \`storage\` for persistent data between sessions
- Include error handling and validation

### Educational Value
- Demonstrate reactive programming concepts
- Show real-world data processing patterns
- Include interactive exploration elements
- Provide insights and interpretations
- Make it engaging and informative

Generate a complete JSON notebook that showcases NotebookJS's capabilities while solving the user's specific need.`;
    }

    /**
     * Build user prompt for code cell generation
     */
    private buildCodeCellUserPrompt(userPrompt: string, context: NotebookContext): string {
        const contextInfo = `
## Current Context:
- **Available Variables**: ${context.variables.length > 0 ? context.variables.join(', ') : 'none'}
- **Available Modules**: ${context.modules.join(', ')}
- **Existing Cells**: ${context.cellContents.length} cells in notebook
- **Notebook Type**: ${context.notebookType || 'existing'} notebook
`;

        return `${contextInfo}

## Task:
Generate a JavaScript code cell for this request:
"${userPrompt}"

## Requirements:

### Code Quality
- Write clean, well-commented JavaScript code
- Use descriptive variable names
- Handle errors appropriately with try-catch blocks
- Include helpful console.log statements for debugging

### Reactive Integration
- Use available variables from context when relevant: ${context.variables.length > 0 ? context.variables.join(', ') : 'none'}
- Export new variables with meaningful names: \`exports.variableName = value\`
- Consider dependencies and update patterns

### Output & Visualization
- Use DOM helpers for rich visual output: \`createTable\`, \`createContainer\`, etc.
- Leverage \`output()\` function to display results
- Create interactive elements when appropriate
- Use available scientific libraries: \`dfd\` for data, \`tf\` for ML

### Technical Patterns
- Prefer global modules over require when available (e.g., use \`fs\` directly)
- Use \`storage\` for persistent data if needed
- Handle asynchronous operations with async/await
- Validate inputs and provide meaningful error messages

### Data Processing
- Use danfojs DataFrames (\`dfd\`) for structured data manipulation
- Apply appropriate data transformations and analysis
- Create summaries and insights from data
- Export processed results for use in other cells

Generate only the JavaScript code content - no XML tags or additional formatting.`;
    }

    /**
     * Load a system prompt from a markdown file
     */
    private async loadSystemPrompt(filename: string): Promise<string> {
        try {
            // In the browser environment, we need to load these as static assets
            // For now, let's use the hardcoded prompt and later make this dynamic
            if (filename === 'single-cell-generation-system.md') {
                return this.getSingleCellSystemPrompt();
            }
            throw new Error(`Unknown system prompt: ${filename}`);
        } catch (error) {
            log.error(`Failed to load system prompt ${filename}:`, error);
            throw new Error(`Failed to load system prompt: ${filename}`);
        }
    }

    /**
     * Build user prompt for single cell generation
     */
    private buildSingleCellUserPrompt(prompt: string, context: NotebookContext): string {
        const promptId = Date.now().toString(36);
        log.debug(`[${promptId}] Building single cell user prompt`, {
            userPrompt: prompt,
            contextVariables: context.variables.length,
            contextModules: context.modules.length,
            contextCells: context.cellContents.length
        });

        let contextInfo = '';
        
        // Include the complete notebook structure as JSON for precise context
        if (context.notebookModel) {
            contextInfo += `## Current Notebook Structure\n`;
            contextInfo += `Here is the complete current notebook as JSON:\n\n`;
            contextInfo += `\`\`\`json\n${JSON.stringify(context.notebookModel, null, 2)}\n\`\`\`\n\n`;
            
            // Also provide a summary for quick reference
            if (context.variables.length > 0) {
                contextInfo += `## Quick Variable Reference\n`;
                contextInfo += `Variables available from the notebook above:\n`;
                context.variables.forEach(varName => {
                    contextInfo += `- \`${varName}\`\n`;
                });
                contextInfo += `\n**IMPORTANT**: Use these exact variable names (case-sensitive) when creating formulas.\n\n`;
            }
        } else {
            // Fallback to old method if notebook model not available
            if (context.variables.length > 0) {
                contextInfo += `## Available Variables\n`;
                contextInfo += `The following variables are currently available in the notebook:\n`;
                context.variables.forEach(varName => {
                    contextInfo += `- ${varName}\n`;
                });
                contextInfo += `\nWhen creating formulas, use these exact variable names.\n\n`;
            } else {
                contextInfo += `## Available Variables\nNo variables are currently defined in the notebook.\n\n`;
            }
            
            if (context.cellContents.length > 0) {
                contextInfo += `## Existing Notebook Content\n`;
                contextInfo += `The notebook currently contains ${context.cellContents.length} cell(s):\n\n`;
                context.cellContents.forEach((cell, index) => {
                    contextInfo += `### Cell ${index + 1} (${cell.type})\n`;
                    contextInfo += `\`\`\`\n${cell.content.substring(0, 300)}${cell.content.length > 300 ? '...' : ''}\n\`\`\`\n\n`;
                });
            } else {
                contextInfo += `## Existing Notebook Content\nThis is a new notebook with no existing cells.\n\n`;
            }
        }
        
        if (context.modules.length > 0) {
            contextInfo += `## Available Modules\n`;
            contextInfo += `The following modules/libraries are available for use:\n`;
            context.modules.forEach(moduleName => {
                contextInfo += `- ${moduleName}\n`;
            });
            contextInfo += `\n`;
        }
        
        const fullPrompt = `${contextInfo}## User Request\n${prompt}\n\nBased on the notebook structure above, generate the most appropriate cell type. If creating a formula that uses existing variables, reference them by their exact names as shown in the notebook JSON.`;
        
        log.info(`[${promptId}] Final user prompt for AI:`, {
            promptLength: fullPrompt.length,
            contextVariablesIncluded: context.variables,
            contextModulesIncluded: context.modules,
            hasNotebookModel: !!context.notebookModel,
            fullPrompt: fullPrompt.length < 1000 ? fullPrompt : fullPrompt.substring(0, 1000) + '...'
        });
        
        return fullPrompt;
    }

    /**
     * Parse single cell response from AI
     */
    private parseSingleCellResponse(response: string): CellDefinition {
        const parseId = Date.now().toString(36);
        
        try {
            log.debug(`[${parseId}] Parsing single cell response`, {
                responseLength: response.length,
                responsePreview: response.substring(0, 200) + (response.length > 200 ? '...' : '')
            });
            
            // Clean the response - remove any markdown code blocks if present
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            log.debug(`[${parseId}] Cleaned response`, {
                originalLength: response.length,
                cleanedLength: cleanResponse.length,
                cleanedPreview: cleanResponse.substring(0, 200) + (cleanResponse.length > 200 ? '...' : '')
            });
            
            // Parse as JSON
            let cellData;
            try {
                cellData = JSON.parse(cleanResponse);
            } catch (jsonError) {
                log.error(`[${parseId}] JSON parsing failed:`, {
                    error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
                    responsePreview: cleanResponse.substring(0, 500)
                });
                throw new Error(`AI returned invalid JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
            }
            
            // Generate an ID if not provided
            if (!cellData.id) {
                cellData.id = `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            
            // Validate the cell definition
            if (!validateCellDefinition(cellData)) {
                log.error(`[${parseId}] Invalid cell definition:`, {
                    cellData,
                    missingFields: this.getMissingFields(cellData)
                });
                throw new Error('AI returned invalid cell definition');
            }
            
            log.info(`[${parseId}] Successfully parsed ${cellData.type} cell`, {
                cellId: cellData.id,
                cellType: cellData.type
            });
            
            return cellData as CellDefinition;
            
        } catch (error) {
            log.error(`[${parseId}] Failed to parse single cell response:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                responseLength: response.length,
                responsePreview: response.substring(0, 500)
            });
            throw error;
        }
    }

    /**
     * Get missing fields for debugging cell validation
     */
    private getMissingFields(cellData: any): string[] {
        const missing: string[] = [];
        
        if (!cellData.type) missing.push('type');
        if (!cellData.id) missing.push('id');
        
        switch (cellData.type) {
            case 'input':
                if (!cellData.inputType) missing.push('inputType');
                if (!cellData.variableName) missing.push('variableName');
                break;
            case 'markdown':
                if (!cellData.content) missing.push('content');
                break;
            case 'formula':
                if (!cellData.variableName) missing.push('variableName');
                if (!cellData.formula) missing.push('formula');
                break;
            case 'code':
                if (cellData.code === undefined) missing.push('code');
                break;
        }
        
        return missing;
    }

    /**
     * Get the single cell generation system prompt
     */
    private getSingleCellSystemPrompt(): string {
        return `# Single Cell Generation System

You are an intelligent assistant that generates individual notebook cells based on user requests. Your job is to analyze the user's intent and create the most appropriate cell type with proper content.

## Cell Type Decision Logic

Choose the cell type based on these guidelines:

### Formula Cells (PREFERRED for simple calculations)
- **Use for**: Basic math, simple calculations, variable assignments
- **Examples**: "Calculate 15% tip", "Find the area of a circle", "Convert units"
- **Pattern**: When user wants a single mathematical result

### Input Cells
- **Use for**: Interactive controls, user parameters, settings
- **Examples**: "Add a slider for interest rate", "Create a dropdown for categories"
- **Pattern**: When user needs to provide input or control parameters

### Code Cells
- **Use for**: Complex logic, data processing, visualizations, API calls
- **Examples**: "Create a chart", "Process this data", "Make API call"
- **Pattern**: When user needs advanced programming functionality

### Markdown Cells
- **Use for**: Documentation, explanations, formatted text
- **Examples**: "Explain the analysis", "Add documentation", "Create a heading"
- **Pattern**: When user wants to document or explain something

## Critical Rules

1. **Output ONLY valid JSON** - No markdown code blocks, no explanations
2. **Always include required properties** for the chosen cell type
3. **Generate unique IDs** using timestamp + random string
4. **Consider existing context** - reference available variables and data
5. **Prefer formula cells** for simple math over code cells
6. **Use descriptive labels** for input cells and meaningful content for markdown

## Output Format

Return ONLY a JSON object matching one of these structures:

**Formula Cell:**
\`\`\`json
{
  "type": "formula",
  "id": "cell_12345_abc",
  "variableName": "result",
  "formula": "price * 1.15"
}
\`\`\`

**Input Cell:**
\`\`\`json
{
  "type": "input",
  "id": "cell_12345_abc", 
  "label": "Interest Rate",
  "inputType": "range",
  "variableName": "interestRate",
  "value": 0.05,
  "props": {"min": 0, "max": 1, "step": 0.01}
}
\`\`\`

**Code Cell:**
\`\`\`json
{
  "type": "code",
  "id": "cell_12345_abc",
  "code": "const data = [1,2,3];\nconsole.log(data);"
}
\`\`\`

**Markdown Cell:**
\`\`\`json
{
  "type": "markdown",
  "id": "cell_12345_abc",
  "content": "# Analysis Results\n\nThis section explains..."
}
\`\`\`

Analyze the user's request, choose the appropriate cell type, and return the JSON definition.`;
    }

    /**
     * Get stored encrypted keys (placeholder - implement with actual storage)
     */
    private async getStoredEncryptedKeys(): Promise<Buffer | null> {
        try {
            // This would read from a secure location in the user's data directory
            // For now, return null to indicate no stored keys
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Store encrypted keys (placeholder - implement with actual storage)
     */
    private async storeEncryptedKeys(encryptedData: Buffer): Promise<void> {
        try {
            // This would write to a secure location in the user's data directory
            // Implementation would use Electron's app.getPath('userData')
            log.debug('Encrypted keys stored successfully');
        } catch (error) {
            log.error('Failed to store encrypted keys:', error);
            throw error;
        }
    }

    /**
     * Get API key for a specific provider
     */
    public getApiKey(provider: 'openai' | 'claude'): string | undefined {
        const providerKey = provider === 'claude' ? 'anthropic' : provider;
        return this.apiKeys[providerKey as keyof APIKeys];
    }

    /**
     * Set API key for a specific provider
     */
    public setApiKey(provider: 'openai' | 'claude', key: string): void {
        const providerKey = provider === 'claude' ? 'anthropic' : provider;
        this.apiKeys[providerKey as keyof APIKeys] = key;
    }

    /**
     * Get current provider
     */
    public getProvider(): LLMProvider {
        return this.defaultConfig.provider;
    }

    /**
     * Set current provider
     */
    public setProvider(provider: LLMProvider): void {
        this.defaultConfig.provider = provider;
    }

    /**
     * Get current model
     */
    public getModel(): string {
        return this.defaultConfig.model;
    }

    /**
     * Set current model
     */
    public setModel(model: string): void {
        this.defaultConfig.model = model;
    }

    /**
     * Test connection with current configuration
     */
    public async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            if (!this.hasAPIKeys()) {
                return { success: false, message: 'No API keys configured' };
            }

            // Test with a simple prompt
            const result = await this.generateTextInternal(
                'You are a helpful assistant.',
                'Respond with exactly: "Connection test successful"',
                this.defaultConfig
            );

            if (result.includes('Connection test successful')) {
                return { success: true, message: 'Connection test successful' };
            } else {
                return { success: true, message: 'Connection established but unexpected response' };
            }
        } catch (error) {
            log.error('Connection test failed:', error);
            return { 
                success: false, 
                message: error instanceof Error ? error.message : 'Unknown error occurred' 
            };
        }
    }
}
