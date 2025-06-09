import React, { useEffect, useState } from 'react';
import { renderMarkdownWithValues } from '@/Engine/markdown';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { MarkdownCellDefinition } from '@/Types/NotebookModel';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import MarkdownIt from 'markdown-it';

interface MarkdownCellProps {
  definition: MarkdownCellDefinition;
  initialized: boolean;
  isEditMode?: boolean;
}

// Initialize markdown-it instance
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

export function MarkdownCell({ definition, initialized, isEditMode = false }: MarkdownCellProps) {
  const { reactiveStore } = useReactiveSystem();
  const { currentModel, setModel, setDirty } = useApplication();
  const [renderedContent, setRenderedContent] = React.useState('');
  
  // Local state for content being edited
  const [currentContent, setCurrentContent] = useState(definition.content);

  // Update local state when definition changes
  useEffect(() => {
    setCurrentContent(definition.content);
  }, [definition.content]);

  // Utility to extract variable names from {{expressions}} in markdown content
  function extractVariablesFromContent(content: string): string[] {
    const regex = /\{\{\s*([^}]+)\s*\}\}/g;
    const vars = new Set<string>();
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const expression = match[1].trim();
      
      // Extract variable names from the expression
      const variableNames = extractVariableNamesFromExpression(expression);
      variableNames.forEach(varName => vars.add(varName));
    }
    
    return Array.from(vars);
  }

  // Extract variable names from a JavaScript expression
  function extractVariableNamesFromExpression(expression: string): string[] {
    // Handle filter expressions (e.g., "variable | filter")
    if (expression.includes('|')) {
      const [varExpression] = expression.split('|').map(s => s.trim());
      return extractVariableNamesFromExpression(varExpression);
    }
    
    // Extract JavaScript identifiers that could be variables
    // This regex matches valid JavaScript identifiers
    const identifierRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
    const identifiers = new Set<string>();
    let match;
    
    while ((match = identifierRegex.exec(expression)) !== null) {
      const identifier = match[1];
      
      // Filter out JavaScript keywords, built-ins, and common globals
      if (!isBuiltInOrKeyword(identifier)) {
        identifiers.add(identifier);
      }
    }
    
    return Array.from(identifiers);
  }

  // Check if an identifier is a built-in or keyword that shouldn't be treated as a variable
  function isBuiltInOrKeyword(identifier: string): boolean {
    const builtIns = new Set([
      // JavaScript keywords
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'class', 'extends', 'import', 'export', 'default',
      // Built-in objects and functions
      'Math', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'JSON', 'console', 'window', 'document', 'global', 'globalThis',
      // Common methods
      'toFixed', 'toString', 'valueOf', 'length', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'indexOf', 'includes',
      // Literals
      'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
    ]);
    
    return builtIns.has(identifier);
  }

  useEffect(() => {
    if (!initialized) return; // Wait for initialization

    // Automatically extract variables from content if not explicitly provided
    const variables = definition.variables && definition.variables.length > 0
      ? definition.variables
      : extractVariablesFromContent(definition.content);

    const updateContent = () => {
      if (variables.length > 0) {
        const calculatedValues: { [key: string]: any; } = {};
        variables.forEach(varName => {
          const value = reactiveStore.getValue(varName);
          calculatedValues[varName] = value;
        });
        // First apply variable interpolation, then render with markdown-it
        const interpolatedContent = renderMarkdownWithValues(definition.content, calculatedValues);
        const rendered = md.render(interpolatedContent);
        setRenderedContent(rendered);
      } else {
        // No variables, just render with markdown-it
        const rendered = md.render(definition.content);
        setRenderedContent(rendered);
      }
    };

    if (variables.length > 0) {
      const unsubscribers = variables.map(varName => {
        return reactiveStore.subscribe(varName, () => {
          updateContent();
        });
      });

      updateContent();

      return () => {
        unsubscribers.forEach(unsub => unsub?.());
      };
    } else {
      updateContent();
    }
  }, [definition.content, definition.variables, reactiveStore, initialized]);

  const onContentChange = (newContent: string) => {
    // Update local state immediately for responsive editing
    setCurrentContent(newContent);
    
    // Update the notebook model to persist changes
    if (currentModel) {
      const updatedModel = {
        ...currentModel,
        cells: currentModel.cells.map(cell => 
          cell.id === definition.id 
            ? { ...cell, content: newContent }
            : cell
        )
      };
      setModel(updatedModel);
      setDirty(true);
    }
  };

  if (isEditMode) {
    // Edit mode: show markdown editor
    return (
      <div className="cell markdown-cell p-2">
        <div className="markdown-editor">
          <Editor
            value={currentContent}
            language="markdown"
            theme={oneDark}
            onChange={onContentChange}
            showLineNumbers={false}
            placeholder="# Write your markdown here...\n\nYou can use {{variableName}} to embed reactive values."
            dimensions={{
              width: '100%', // Explicitly constrain to container width
              minHeight: '120px',
              autoHeight: true,
              maxHeight: '500px' // Add reasonable max height to prevent excessive growth
            }}
          />
        </div>
      </div>
    );
  }

  // View mode: show rendered markdown using markdown-it
  return (
    <div className="cell markdown-cell p-2">
      <div 
        className="markdown-content prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderedContent }} 
      />
    </div>
  );
}
