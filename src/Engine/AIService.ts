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

## NotebookJS Architecture

### Reactive System
- **Automatic Updates**: Variables automatically propagate changes to dependent cells
- **Manual Execution**: Code cells require manual execution (▶️ button or Shift+Enter) after editing
- **Dependency Tracking**: System automatically tracks which cells depend on which variables
- **Export Pattern**: Use \`exports.variableName = value\` to create reactive variables

### Cell Types Available
1. **Code Cells**: Execute JavaScript with full ES6+ support
2. **Formula Cells**: Use reactive variables with \`$variableName\` syntax
3. **Input Cells**: Create interactive UI controls (sliders, inputs, checkboxes)
4. **Markdown Cells**: Support {{variable}} interpolation for dynamic content

## Available Globals & Functions

### Built-in JavaScript
- **Math**: Full Math object (\`Math.PI\`, \`Math.sqrt()\`, \`Math.random()\`, etc.)
- **Console**: Captured console output (\`console.log\`, \`console.warn\`, \`console.error\`)
- **Standard JS**: All ES6+ features, async/await, Promises, etc.

### Node.js Built-ins (Injected as Globals)
- **fs**: File system operations (\`fs.readdirSync()\`, \`fs.readFileSync()\`)
- **path**: Path utilities (\`path.join()\`, \`path.resolve()\`)
- **os**: Operating system info (\`os.platform()\`, \`os.cpus()\`)
- **crypto**: Cryptography (\`crypto.createHash()\`, \`crypto.randomBytes()\`)
- **util**: Utilities (\`util.inspect()\`, \`util.promisify()\`)
- **url**: URL parsing (\`url.parse()\`, \`new URL()\`)
- **querystring**: Query string utilities (\`querystring.parse()\`)
- **zlib**: Compression (\`zlib.gzip()\`, \`zlib.deflate()\`)
- **stream**: Stream utilities (\`stream.Readable\`, \`stream.Transform\`)
- **events**: Event system (\`EventEmitter\` constructor available)
- **buffer**: Buffer manipulation (\`Buffer\` constructor available)
- **process**: Process information (\`process.cwd()\`, \`process.env\`)
- **require**: Module loading function for additional packages

### Pre-bundled Scientific Libraries (Injected as Globals)
- **dfd**: Danfo.js DataFrame library for data manipulation
  \`\`\`javascript
  const df = new dfd.DataFrame(data);
  exports.mean = df['column'].mean();
  exports.filtered = df.query(df['age'].gt(25));
  \`\`\`
- **tf**: TensorFlow.js for machine learning (from danfojs bundle)
  \`\`\`javascript
  const model = tf.sequential({
    layers: [tf.layers.dense({inputShape: [1], units: 1})]
  });
  \`\`\`

### DOM Output & Visualization Functions
- **output(...values)**: Output any combination of DOM elements and data values
- **outEl**: Direct access to the cell's output container element
- **createElement(tag, options)**: Create HTML elements with styling
- **createDiv(options)**: Create div containers with automatic styling
- **createTitle(text, level, options)**: Create styled headings (h1-h6)
- **createTable(headers, rows, options)**: Create responsive data tables
- **createButton(text, onClick, options)**: Create interactive buttons
- **createList(items, options)**: Create ul/ol lists with styling
- **createKeyValueGrid(data, options)**: Create responsive metric grids
- **createContainer(options)**: Create styled containers (auto-outputs to DOM)
- **createGradientContainer(title, options)**: Create styled containers with titles

### Storage System
- **storage**: Notebook-level persistent storage
  \`\`\`javascript
  storage.set('key', value);
  const value = storage.get('key');
  storage.clear(); // Clear all storage
  \`\`\`

## Best Practices for Generated Notebooks

### Structure Guidelines
1. **Start with markdown introduction**: Clear title and explanation
2. **Use input cells for parameters**: Make notebooks interactive
3. **Progress logically**: Simple concepts first, then build complexity
4. **Add explanatory markdown**: Between code sections
5. **Export meaningful variables**: Use descriptive names
6. **Include visualizations**: Use DOM helpers for rich output

### Code Cell Patterns
\`\`\`javascript
// Import or access data
const data = [1, 2, 3, 4, 5];

// Process data with available libraries
const df = new dfd.DataFrame({values: data});
const processed = df['values'].map(x => x * 2);

// Create visualizations
const container = createContainer({
  style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'
});

const table = createTable(
  ['Original', 'Doubled'],
  data.map((val, i) => [val, processed[i]])
);

// Output to DOM
output(container, table);

// Export for other cells
exports.originalData = data;
exports.processedData = processed;
exports.summary = {
  count: data.length,
  sum: processed.reduce((a, b) => a + b, 0)
};
\`\`\`

### Formula Cell Examples
\`\`\`javascript
// Reference variables from other cells
$baseValue * 1.2 + $taxRate
\`\`\`

### Error Handling
- Wrap potentially failing operations in try-catch
- Provide meaningful error messages
- Handle missing dependencies gracefully
- Use console.warn() for non-critical issues

## Output Format Requirements
Generate a complete notebook as XML with <VSCode.Cell> elements:
- Use \`language="javascript"\` for code cells
- Use \`language="markdown"\` for markdown cells
- Use \`language="input"\` for input cells (sliders, text inputs, etc.)
- Use \`language="formula"\` for formula cells
- New cells don't need \`id\` attributes
- Don't XML encode content within cells
- Ensure proper cell progression and dependencies

Make notebooks educational, interactive, and demonstrate the power of reactive programming with rich visualizations and clear explanations.`;
    }

    /**
     * Build system prompt for code cell generation
     */
    private buildCodeCellSystemPrompt(): string {
        return `You are an AI assistant that generates JavaScript code cells for NotebookJS, a reactive notebook application.

## Code Cell Environment

### JavaScript Execution
- Full ES6+ support with async/await
- Browser-based execution with Node.js modules available
- Manual execution required after editing (▶️ button or Shift+Enter)
- Automatic dependency tracking and reactive updates

### Available Globals

#### Core JavaScript
- **Math**: Full Math object (\`Math.PI\`, \`Math.sqrt()\`, \`Math.random()\`)
- **console**: Captured output (\`console.log\`, \`console.warn\`, \`console.error\`)
- **exports**: Object for creating reactive variables (\`exports.varName = value\`)

#### Node.js Built-ins (Global Access)
- **fs**: File operations (\`fs.readdirSync('.')\`, \`fs.readFileSync()\`)
- **path**: Path utilities (\`path.join()\`, \`path.resolve()\`)
- **os**: System info (\`os.platform()\`, \`os.cpus().length\`)
- **crypto**: Cryptography (\`crypto.createHash('sha256')\`)
- **util**: Utilities (\`util.inspect()\`, \`util.promisify()\`)
- **url**, **querystring**, **zlib**, **stream**, **events**, **buffer**
- **process**: Process info (\`process.cwd()\`, \`process.env\`)
- **Buffer**: Buffer constructor (\`Buffer.from()\`)
- **EventEmitter**: Event emitter constructor
- **require**: Module loading (\`require('package-name')\`)

#### Scientific Libraries (Global Access)
- **dfd**: Danfo.js DataFrames
  \`\`\`javascript
  const df = new dfd.DataFrame(data);
  const mean = df['column'].mean();
  \`\`\`
- **tf**: TensorFlow.js machine learning
  \`\`\`javascript
  const model = tf.sequential({layers: [...]});
  \`\`\`

#### DOM & Output Functions
- **output(...values)**: Output DOM elements or data to cell
- **outEl**: Direct access to output container element
- **createElement(tag, options)**: Create styled HTML elements
- **createDiv(options)**: Create div containers
- **createTitle(text, level)**: Create headings (h1-h6)
- **createTable(headers, rows)**: Create data tables
- **createButton(text, onClick)**: Create interactive buttons
- **createList(items, options)**: Create ul/ol lists
- **createKeyValueGrid(data)**: Create metric displays
- **createContainer()**: Auto-outputting styled container
- **createGradientContainer(title)**: Auto-outputting gradient container

#### Storage
- **storage**: Persistent notebook storage
  \`\`\`javascript
  storage.set('key', value);
  const value = storage.get('key');
  \`\`\`

### Reactive Variable Access
Access any exported variable from other cells by name:
\`\`\`javascript
// Access variables from other cells
const result = baseValue * multiplier + offset;
const filtered = userData.filter(u => u.age > minAge);
\`\`\`

### Best Practices
1. **Export meaningful variables**: \`exports.processedData = result\`
2. **Use descriptive names**: \`userAnalytics\` not \`data\`
3. **Handle errors gracefully**: Wrap risky operations in try-catch
4. **Create rich outputs**: Use DOM helpers for visualizations
5. **Add helpful comments**: Explain complex logic
6. **Use async/await**: For asynchronous operations
7. **Leverage available globals**: Prefer \`fs\` over \`require('fs')\`

### Output Patterns
\`\`\`javascript
// Data processing
const df = new dfd.DataFrame(rawData);
const summary = df.describe();

// Visualization
const container = createContainer();
const table = createTable(['Metric', 'Value'], 
  Object.entries(summary).map(([k, v]) => [k, v]));

// Output to cell
output(container, table);

// Export for other cells
exports.dataFrame = df;
exports.summaryStats = summary;
\`\`\`

Generate only the JavaScript code content for a single code cell. Don't include cell XML tags or formatting.`;
    }

    /**
     * Build user prompt for notebook generation
     */
    private buildNotebookUserPrompt(userPrompt: string): string {
        return `Create a complete interactive notebook based on this request:

"${userPrompt}"

## Notebook Requirements

### Structure
1. **Title & Introduction**: Start with a clear markdown title and overview
2. **Interactive Parameters**: Use input cells for key parameters users can adjust
3. **Progressive Build**: Start simple, then add complexity
4. **Rich Visualizations**: Use DOM helpers to create appealing visual output
5. **Clear Explanations**: Markdown cells between code sections explaining what's happening
6. **Meaningful Exports**: Export variables with descriptive names for reactive updates

### Technical Guidelines
- Use the reactive system: \`exports.variableName = value\` in code cells
- Leverage available globals: \`dfd\`, \`tf\`, \`fs\`, \`crypto\`, DOM helpers
- Create interactive elements: sliders, inputs, buttons
- Build rich visual outputs using \`createTable\`, \`createContainer\`, etc.
- Handle data processing with danfojs DataFrames when appropriate
- Use \`storage\` for persistent data between sessions
- Include error handling and validation

### Educational Value
- Demonstrate reactive programming concepts
- Show real-world data processing patterns
- Include interactive exploration elements
- Provide insights and interpretations
- Make it engaging and informative

Generate a notebook that showcases NotebookJS's capabilities while solving the user's specific need.`;
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
