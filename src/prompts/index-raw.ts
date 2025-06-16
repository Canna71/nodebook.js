/**
 * Export all AI system prompts using Vite's raw imports
 */
// @ts-ignore
import notebookGenerationSystemPrompt from './notebook-generation-system.md?raw';
// @ts-ignore
import codeCellGenerationSystemPrompt from './code-cell-generation-system.md?raw';

// Export individual prompts
export { notebookGenerationSystemPrompt, codeCellGenerationSystemPrompt };

// Re-export for convenience
export const prompts = {
  notebookGeneration: notebookGenerationSystemPrompt,
  codeCellGeneration: codeCellGenerationSystemPrompt,
} as const;

export type PromptKey = keyof typeof prompts;
