import React, { useEffect } from 'react';
import { renderMarkdownWithValues } from '@/Engine/markdown';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';
import { MarkdownCellDefinition } from '@/Types/NotebookModel';

interface MarkdownCellProps {
  definition: MarkdownCellDefinition;
  initialized: boolean;
  isEditMode?: boolean; // NEW: Add isEditMode prop
}

export function MarkdownCell({ definition, initialized, isEditMode = false }: MarkdownCellProps) {
  const { reactiveStore } = useReactiveSystem();
  const [renderedContent, setRenderedContent] = React.useState(definition.content);

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
        setRenderedContent(definition.content);
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
  }, [definition, reactiveStore, initialized]);

  return (
    <div className="cell markdown-cell">
      <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
    </div>
  );
}
