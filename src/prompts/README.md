# AI Service Improvements

This document describes the improvements made to the Nodebook.js AI service.

## Changes Made

### 1. Externalized and Bundled System Prompts

**Before**: System prompts were hardcoded strings in the `AIService.ts` file.

**After**: System prompts are now stored in separate TypeScript files in `/src/prompts/` and imported for bundling:
- `notebook-generation-system.ts` - System prompt for generating complete notebooks
- `code-cell-generation-system.ts` - System prompt for generating individual code cells
- `index.ts` - Convenient exports for all prompts

**Benefits**:
- Easier to edit and maintain prompts
- Version control for prompt changes
- Cleaner separation of concerns
- Prompts are bundled with the application (no runtime file access needed)
- Better performance - no file I/O at runtime
- Works in all environments (browser, Electron, etc.)

### 2. Changed Output Format from XML to JSON

**Before**: AI service requested XML format with `<VSCode.Cell>` tags.

**After**: AI service now requests JSON format compatible with `NotebookModel.ts`.

**Benefits**:
- JSON is more structured and easier to parse
- Direct compatibility with existing NotebookModel interfaces
- Reduced parsing complexity and error potential
- Better validation capabilities

### 3. Improved Parsing Logic

**Before**: Simple regex-based XML parsing that only supported markdown and code cells.

**After**: Comprehensive JSON parsing that supports all cell types:
- `markdown` cells
- `code` cells  
- `input` cells (sliders, inputs, checkboxes)
- `formula` cells

**Benefits**:
- Support for all Nodebook.js cell types
- Better error handling and validation
- Cleaner, more maintainable parsing code
- More robust against malformed input

### 4. Enhanced Prompt Knowledge

**Before**: Basic system prompts with limited Nodebook.js knowledge.

**After**: Comprehensive system prompts with detailed information about:
- Available globals and functions
- DOM output helpers
- Scientific libraries (danfojs, tensorflow)
- Storage system
- Best practices and patterns
- Proper JSON output format

**Benefits**:
- More accurate and useful AI-generated content
- Better understanding of Nodebook.js capabilities
- Consistent output format
- Educational value in generated notebooks

## File Structure

```
src/
├── prompts/
│   ├── notebook-generation-system.ts
│   ├── code-cell-generation-system.ts
│   ├── index.ts (exports all prompts)
│   ├── test-improvements.ts (tests)
│   └── README.md (this file)
├── Engine/
│   ├── AIService.ts (updated)
│   ├── PromptLoader.ts (updated - now uses imports)
│   └── Commands/
│       └── AICommands.ts (updated)
```

## Usage

The AI service now generates JSON-compatible notebooks like the examples in the `/examples` folder:

```json
{
  "cells": [
    {
      "type": "markdown",
      "id": "intro-md",
      "content": "# My Notebook\n\nThis is an introduction."
    },
    {
      "type": "input",
      "id": "value-input",
      "label": "Input Value",
      "inputType": "number",
      "variableName": "inputValue",
      "value": 10,
      "props": {
        "min": 0,
        "max": 100
      }
    },
    {
      "type": "code",
      "id": "calculation-code",
      "code": "const result = inputValue * 2;\nexports.calculatedResult = result;\noutput(`Result: ${result}`);"
    }
  ],
  "metadata": {
    "title": "My Notebook",
    "description": "A sample notebook",
    "tags": ["example"],
    "version": "1.0"
  }
}
```

## Backwards Compatibility

The changes maintain backwards compatibility:
- Existing notebooks continue to work unchanged
- The AI service gracefully falls back to minimal prompts if import issues occur
- Error handling ensures the system continues to function even with parsing issues
- No runtime file system dependencies - all prompts are bundled

## Testing

To test the improvements:
1. Configure AI API keys in the application
2. Use the "Generate Notebook" command
3. Verify the generated notebook includes all cell types
4. Check that the JSON structure matches examples in `/examples`

## Future Improvements

- Add more sophisticated prompt templates
- Support for custom prompt modifications
- Better error recovery and user feedback
- Integration with example notebooks for learning
