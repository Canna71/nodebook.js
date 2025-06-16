import anylogger from 'anylogger';
import { notebookGenerationSystemPrompt } from '../prompts/notebook-generation-system';
import { codeCellGenerationSystemPrompt } from '../prompts/code-cell-generation-system';

const log = anylogger('PromptLoader');

/**
 * Utility class to load system prompts from imported modules
 */
export class PromptLoader {
    private static cache = new Map<string, string>();

    /**
     * Load notebook generation system prompt
     */
    public static loadNotebookGenerationPrompt(): string {
        const cacheKey = 'notebook-generation';
        
        // Return cached version if available
        if (this.cache.has(cacheKey)) {
            log.debug(`Returning cached prompt for: ${cacheKey}`);
            return this.cache.get(cacheKey)!;
        }

        try {
            const content = notebookGenerationSystemPrompt;
            
            // Cache the content
            this.cache.set(cacheKey, content);
            
            log.info(`Successfully loaded notebook generation prompt (${content.length} characters)`);
            return content;
            
        } catch (error) {
            log.error(`Failed to load notebook generation prompt:`, error);
            throw new Error(`Failed to load notebook generation system prompt`);
        }
    }

    /**
     * Load code cell generation system prompt
     */
    public static loadCodeCellGenerationPrompt(): string {
        const cacheKey = 'code-cell-generation';
        
        // Return cached version if available
        if (this.cache.has(cacheKey)) {
            log.debug(`Returning cached prompt for: ${cacheKey}`);
            return this.cache.get(cacheKey)!;
        }

        try {
            const content = codeCellGenerationSystemPrompt;
            
            // Cache the content
            this.cache.set(cacheKey, content);
            
            log.info(`Successfully loaded code cell generation prompt (${content.length} characters)`);
            return content;
            
        } catch (error) {
            log.error(`Failed to load code cell generation prompt:`, error);
            throw new Error(`Failed to load code cell generation system prompt`);
        }
    }

    /**
     * Clear the prompt cache (useful for development)
     */
    public static clearCache(): void {
        this.cache.clear();
        log.info('Prompt cache cleared');
    }

    /**
     * Get cache statistics
     */
    public static getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
