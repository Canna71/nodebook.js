import React, { useEffect, useState } from 'react';
import { renderMarkdownWithValues } from '@/Engine/markdown';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { MarkdownCellDefinition } from '@/Types/NotebookModel';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';

interface MarkdownCellProps {
  definition: MarkdownCellDefinition;
  initialized: boolean;
  isEditMode?: boolean;
}

export function MarkdownCell({ definition, initialized, isEditMode = false }: MarkdownCellProps) {
  const { reactiveStore } = useReactiveSystem();
  const { currentModel, setModel, setDirty } = useApplication();
  const [renderedContent, setRenderedContent] = React.useState(definition.content);
  
  // Local state for content being edited
  const [currentContent, setCurrentContent] = useState(definition.content);

  // Update local state when definition changes
  useEffect(() => {
    setCurrentContent(definition.content);
  }, [definition.content]);

  // Utility to extract variable names from {{var}} in markdown content
  function extractVariablesFromContent(content: string): string[] {
    const regex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(\|[^}]*)?\}\}/g;
    const vars = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      vars.add(match[1]);
    }
    return Array.from(vars);
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
        const rendered = renderMarkdownWithValues(definition.content, calculatedValues);
        setRenderedContent(rendered);
      } else {
        const rendered = renderMarkdownWithValues(definition.content, {});
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
            language="text" // Use text mode for markdown since codemirror doesn't have built-in markdown
            theme={oneDark}
            onChange={onContentChange}
            showLineNumbers={false}
            placeholder="# Write your markdown here...\n\nYou can use {{variableName}} to embed reactive values."
            dimensions={{
              autoHeight: true,
              minHeight: '120px',
              maxHeight: '400px'
            }}
          />
        </div>
      </div>
    );
  }

  // View mode: show rendered markdown
  return (
    <div className="cell markdown-cell p-2">
      <div 
        className="markdown-content prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderedContent }} 
      />
    </div>
  );
}
