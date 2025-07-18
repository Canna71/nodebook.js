import React, { useEffect, useState, useCallback, useRef } from 'react';
import { renderMarkdownWithValues } from '@/Engine/markdown';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { MarkdownCellDefinition } from '@/Types/NotebookModel';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import MarkdownIt from 'markdown-it';
import mathjax3 from 'markdown-it-mathjax3';
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css'; // Import highlight.js theme
import { useMarkdownCompletions } from '@/hooks/useMarkdownCompletions';
import { useTheme } from '@/lib/themeHelpers';

interface MarkdownCellProps {
  definition: MarkdownCellDefinition;
  initialized: boolean;
  isEditMode?: boolean;
  readingMode?: boolean; // NEW: Reading mode flag
}

// Initialize markdown-it instance
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str, true).value;
      } catch (__) {
        console.warn(`Failed to highlight code block with language "${lang}":`, __);
      }
    }

    return ''; // use external default escaping
  }
});
md.use(mathjax3, {
//   tex: {
//     inlineMath: [['$', '$'], ['\\(', '\\)']],
//     displayMath: [['$$', '$$'], ['\\[', '\\]']],
//     processEscapes: true,
//     processEnvironments: true
//   },
//   html: true,
//   svg: {
//     fontCache: 'global'
//   }
});
export function MarkdownCell({ definition, initialized, isEditMode = false, readingMode = false }: MarkdownCellProps) {
  const { reactiveStore, codeCellEngine } = useReactiveSystem();
  const { updateCell } = useApplication();
  const [renderedContent, setRenderedContent] = React.useState('');
  
  // Get current theme for CodeMirror
  const currentTheme = useTheme();
  const editorTheme = currentTheme === 'dark' ? oneDark : undefined; // undefined for light mode (default)
  
  // Local state for content being edited
  const [currentContent, setCurrentContent] = useState(definition.content);
  
  // Debounce timeout ref
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get markdown completion source for reactive variables
  const markdownCompletionSource = useMarkdownCompletions();

  // Update local state when definition changes
  useEffect(() => {
    setCurrentContent(definition.content);
  }, [definition.content]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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
        
        // Add storage API to the evaluation context
        if (codeCellEngine) {
          calculatedValues.storage = {
            get: (key: string) => codeCellEngine.getStorageValue(key),
            has: (key: string) => codeCellEngine.hasStorageKey(key),
            keys: () => codeCellEngine.getStorageKeys()
          };
        }
        
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

  const onContentChange = useCallback((newContent: string) => {
    // Update local state immediately for responsive editing
    setCurrentContent(newContent);
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the model update to avoid excessive state changes
    debounceTimeoutRef.current = setTimeout(() => {
      // Only update if content actually changed from the definition
      if (newContent !== definition.content) {
        updateCell(definition.id, { content: newContent }, 'Update markdown cell');
      }
    }, 300); // 300ms debounce
  }, [definition.id, definition.content, updateCell]);

  // Force save any pending changes when switching out of edit mode
  useEffect(() => {
    if (!isEditMode && debounceTimeoutRef.current) {
      // Clear the timeout and immediately save any pending changes
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
      
      if (currentContent !== definition.content) {
        updateCell(definition.id, { content: currentContent }, 'Update markdown cell');
      }
    }
  }, [isEditMode, currentContent, definition.content, definition.id, updateCell]);

  // In reading mode, always show view mode (never edit mode)
  if (isEditMode && !readingMode) {
    // Edit mode: show markdown editor
    return (
      <div className="cell markdown-cell p-2">
        <div className="markdown-editor">
          <Editor
            value={currentContent}
            language="markdown"
            theme={editorTheme}
            onChange={onContentChange}
            showLineNumbers={false}
            markdownCompletions={markdownCompletionSource}
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

  // View mode: show rendered markdown (always used in reading mode)
  return (
    <div className={readingMode ? "cell markdown-cell-reading" : "cell markdown-cell p-2"}>
      <div 
        className="markdown-content markdown-rendered-content prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
        onDoubleClick={readingMode ? undefined : (e) => {
          // Prevent text selection on double-click and let the event bubble to CellContainer
          // Only active in edit mode, not reading mode
          e.preventDefault();
        }}
        style={{ userSelect: 'text' }} // Keep text selectable for single clicks and drag selections
      />
    </div>
  );
}
