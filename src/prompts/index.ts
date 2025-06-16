/**
 * Export all AI system prompts for bundling
 */

export { notebookGenerationSystemPrompt } from './notebook-generation-system';
export { codeCellGenerationSystemPrompt } from './code-cell-generation-system';

// Import for re-export
import { notebookGenerationSystemPrompt } from './notebook-generation-system';
import { codeCellGenerationSystemPrompt } from './code-cell-generation-system';

// Re-export for convenience
export const prompts = {
  notebookGeneration: notebookGenerationSystemPrompt,
  codeCellGeneration: codeCellGenerationSystemPrompt,
} as const;

export type PromptKey = keyof typeof prompts;
