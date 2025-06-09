import React, { useEffect, useState } from 'react';
import { useReactiveValue, useReactiveSystem } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { FormulaCellDefinition } from '@/Types/NotebookModel';
import { Input } from './ui/input';
import { Label } from './ui/label';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import { log } from './DynamicNotebook';
import { useFormulaCompletions } from '@/hooks/useFormulaCompletions';
import { useModuleCompletions } from '@/hooks/useCodeCompletions';
import { useFormulaRuntimeCompletions } from '@/hooks/useFormulaRuntimeCompletions';

interface FormulaCellProps {
  definition: FormulaCellDefinition;
  initialized: boolean;
  isEditMode?: boolean;
}

export function FormulaCell({ definition, initialized, isEditMode = false }: FormulaCellProps) {
  const { reactiveStore } = useReactiveSystem();
  const { updateCell } = useApplication();
  const [value, setValue] = useReactiveValue(definition.variableName, null);
  const [error, setError] = useState<string | null>(null);

  // Get completions for formula editor
  const formulaCompletions = useFormulaCompletions();
  const moduleCompletions = useModuleCompletions();
  const runtimeCompletions = useFormulaRuntimeCompletions();

  // Edit mode state (simplified)
  const [editConfig, setEditConfig] = useState({
    variableName: definition.variableName,
    formula: definition.formula
  });

  // Update edit config when definition changes
  useEffect(() => {
    setEditConfig({
      variableName: definition.variableName,
      formula: definition.formula
    });
  }, [definition]);

  useEffect(() => {
    if (!initialized) return;

    try {
      setError(null);
      
      // Force computation of the formula by accessing the reactive value
      const reactiveValue = reactiveStore.get(definition.variableName);
      if (reactiveValue) {
        const computedValue = reactiveValue.get();
        log.debug(`Formula cell ${definition.id} (${definition.variableName}) computed:`, computedValue);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      log.error(`Error in formula cell ${definition.id}:`, err);
    }
  }, [initialized, definition.id, definition.variableName, reactiveStore]);

  // Also trigger computation when value changes
  useEffect(() => {
    if (initialized && value !== null) {
      log.debug(`Formula cell ${definition.id} (${definition.variableName}) value updated:`, value);
    }
  }, [value, initialized, definition.id, definition.variableName]);

  // Helper function to handle config changes and auto-update
  const handleConfigChange = (updates: Partial<typeof editConfig>) => {
    const newConfig = { ...editConfig, ...updates };
    setEditConfig(newConfig);
    
    // Update the cell definition immediately without validation
    updateCellDefinitionWithConfig(newConfig);
  };

  // Update cell definition with specific config
  const updateCellDefinitionWithConfig = (config: typeof editConfig) => {
    // Only require non-empty variable name - allow incomplete formulas
    if (!config.variableName.trim()) {
      return; // Skip update only if variable name is empty
    }

    // Create updated cell definition - allow any formula content
    const updatedCell: FormulaCellDefinition = {
      ...definition,
      variableName: config.variableName.trim(),
      formula: config.formula // Don't trim or validate - allow any content
    };

    // Update through state manager
    updateCell(definition.id, updatedCell, 'Update formula cell');
  };

  const renderEditMode = () => {
    return (
      <div className="formula-cell-edit-mode p-2 bg-muted/50 rounded border">
        {/* Horizontal layout for compact editing */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
          {/* Variable Name - smaller column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-foreground whitespace-nowrap">Variable:</Label>
              <Input
                value={editConfig.variableName}
                onChange={(e) => handleConfigChange({ variableName: e.target.value })}
                placeholder="result"
                className="text-sm h-8 flex-1"
              />
            </div>
          </div>

          {/* Formula Editor - larger column */}
          <div className="lg:col-span-3">
            <div className="flex items-start gap-2">
              {/* Small indicator instead of label */}
              <div className="text-xs text-secondary-foreground mt-2 font-mono">=</div>
              <div className="formula-editor border border-border rounded flex-1">
                <Editor
                  value={editConfig.formula}
                  onChange={(value) => handleConfigChange({ formula: value })}
                  language="javascript"
                  theme={oneDark}
                  showLineNumbers={false}
                  placeholder="Examples: finalPrice, $basePrice * 1.08, Math.round(price * quantity)"
                  customCompletions={formulaCompletions}
                  objectCompletions={moduleCompletions}
                  runtimeCompletions={runtimeCompletions}
                  dimensions={{
                    width: '100%',
                    minHeight: '40px',
                    autoHeight: true,
                    maxHeight: '120px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render view mode (simple pseudo-code format)
  if (!isEditMode) {
    return (
      <div className="cell formula-cell p-2">
        <div className="flex items-center gap-2 text-sm">
          {/* Simple pseudo-code format: variableName = <expression> */}
          <span className="font-mono text-foreground">
            {definition.variableName}
          </span>
          <span className="text-secondary-foreground">=</span>
          <code className="text-sm bg-muted text-secondary-foreground px-2 py-1 rounded">
            {definition.formula}
          </code>
          
          {/* Show error if any */}
          {error && (
            <>
              <span className="text-secondary-foreground">→</span>
              <span className="text-destructive text-xs">Error: {error}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render edit mode
  return (
    <div className="cell formula-cell p-2">
      {/* Compact view in edit mode header */}
      <div className="flex items-center gap-2 text-xs mb-2 pb-1 border-b border-border">
        <span className="font-mono text-foreground">
          {definition.variableName}
        </span>
        <span className="text-secondary-foreground">=</span>
        <code className="text-xs bg-muted text-secondary-foreground px-1 py-0.5 rounded">
          {definition.formula}
        </code>
        {error && (
          <>
            <span className="text-secondary-foreground">→</span>
            <span className="text-destructive text-xs">Error</span>
          </>
        )}
      </div>

      {/* Edit interface */}
      {renderEditMode()}
    </div>
  );
}
