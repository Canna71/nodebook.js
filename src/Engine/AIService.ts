import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import anylogger from 'anylogger';
import { notebookGenerationSystemPrompt, codeCellGenerationSystemPrompt } from '../prompts/index-raw';

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
