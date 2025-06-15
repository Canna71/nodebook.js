import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import anylogger from 'anylogger';

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
            // TODO: Implement secure storage when safeStorage is available
            // For now, skip secure storage
            log.debug('Secure storage not implemented yet');
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
            // TODO: Implement secure storage when safeStorage is available
            // For now, just store in memory
            this.apiKeys = { ...keys };
            log.info('API keys saved (in memory - not persistent)');
        } catch (error) {
            log.error('Failed to save API keys:', error);
            throw error;
        }
    }

    /**
     * Check if API keys are configured
     */
    public hasAPIKeys(): boolean {
        return !!(this.apiKeys.openai || this.apiKeys.anthropic);
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
        
        if (!this.hasAPIKeys()) {
            throw new Error('No API keys configured. Please configure API keys in settings.');
        }

        const systemPrompt = this.buildNotebookSystemPrompt();
        const userPrompt = this.buildNotebookUserPrompt(prompt);

        try {
            const result = await this.generateText(systemPrompt, userPrompt, finalConfig);
            log.info('Notebook generated successfully');
            return result;
        } catch (error) {
            log.error('Failed to generate notebook:', error);
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
        
        if (!this.hasAPIKeys()) {
            throw new Error('No API keys configured. Please configure API keys in settings.');
        }

        const systemPrompt = this.buildCodeCellSystemPrompt();
        const userPrompt = this.buildCodeCellUserPrompt(prompt, context);

        try {
            const result = await this.generateText(systemPrompt, userPrompt, finalConfig);
            log.info('Code cell generated successfully');
            return result;
        } catch (error) {
            log.error('Failed to generate code cell:', error);
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
        const apiKey = this.apiKeys[config.provider];
        if (!apiKey) {
            throw new Error(`No API key configured for provider: ${config.provider}`);
        }

        let model;
        try {
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
                    throw new Error(`Unsupported provider: ${config.provider}`);
            }

            const result = await generateText({
                model,
                system: systemPrompt,
                prompt: userPrompt,
                maxTokens: config.maxTokens,
                temperature: config.temperature
            });

            return result.text;
        } catch (error) {
            log.error('LLM generation failed:', error);
            throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Build system prompt for notebook generation
     */
    private buildNotebookSystemPrompt(): string {
        return `You are an AI assistant that generates interactive notebooks for NotebookJS, a reactive notebook application built with React, TypeScript, and Electron.

NotebookJS Features:
- Reactive system where variables automatically update when dependencies change
- Code cells execute JavaScript with access to Math, lodash, moment, d3, plotly, tf (TensorFlow.js)
- Formula cells use reactive variables: $variableName or direct JavaScript syntax
- Input cells create interactive controls (sliders, inputs, checkboxes)
- Markdown cells support {{variable}} interpolation for dynamic content

Output Format:
Generate a complete notebook as XML with <VSCode.Cell> elements:
- Each cell must have a 'language' attribute ('javascript' for code, 'markdown' for text)
- New cells don't need 'id' attributes
- Use 'exports.variableName = value' to create reactive variables in code cells
- Don't XML encode content within cells

Available Modules:
- Math: Built-in JavaScript Math object
- tf: TensorFlow.js for machine learning
- d3: D3.js for data visualization
- plotly: Plotly.js for interactive charts
- lodash: Utility library (via _)
- moment: Date/time handling

Best Practices:
- Create reactive variables with meaningful names
- Use descriptive markdown cells to explain concepts
- Include data visualizations when appropriate
- Make notebooks interactive with input cells
- Export variables for use in subsequent cells`;
    }

    /**
     * Build system prompt for code cell generation
     */
    private buildCodeCellSystemPrompt(): string {
        return `You are an AI assistant that generates JavaScript code cells for NotebookJS, a reactive notebook application.

Code Cell Guidelines:
- Write JavaScript code that executes in a browser environment
- Use 'exports.variableName = value' to create reactive variables
- Available modules: Math, tf (TensorFlow.js), d3, plotly, lodash (_), moment
- Handle async operations with async/await when needed
- Include console.log() statements for debugging
- Use meaningful variable names
- Add comments to explain complex logic

Output Format:
Generate only the JavaScript code content for a single code cell. Don't include cell XML tags or other formatting.

Available Functions:
- createDiv(): Create styled div containers
- output(): Display structured output data
- All standard JavaScript functions and objects`;
    }

    /**
     * Build user prompt for notebook generation
     */
    private buildNotebookUserPrompt(userPrompt: string): string {
        return `Create a complete interactive notebook based on this request:

"${userPrompt}"

Generate a notebook with:
1. A clear title and introduction in markdown
2. Interactive input cells for key parameters
3. Code cells that process data and create visualizations
4. Formula cells for calculations
5. Markdown cells explaining results and insights

Make it educational and interactive, showing the power of reactive programming.`;
    }

    /**
     * Build user prompt for code cell generation
     */
    private buildCodeCellUserPrompt(userPrompt: string, context: NotebookContext): string {
        const contextInfo = `
Current Context:
- Available variables: ${context.variables.length > 0 ? context.variables.join(', ') : 'none'}
- Available modules: ${context.modules.join(', ')}
- Existing cells: ${context.cellContents.length} cells
`;

        return `${contextInfo}

Generate a JavaScript code cell for this request:
"${userPrompt}"

The code should:
- Use available variables when relevant
- Export new variables with meaningful names
- Include appropriate visualizations or outputs
- Be well-commented and educational`;
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
}
