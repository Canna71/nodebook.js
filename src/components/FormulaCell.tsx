import React, { useEffect, useState, useCallback } from 'react';
import { useReactiveValue, useReactiveSystem } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { FormulaCellDefinition } from '@/Types/NotebookModel';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import { log } from './DynamicNotebook';
import { useFormulaCompletions } from '@/hooks/useFormulaCompletions';
import { useModuleCompletions } from '@/hooks/useCodeCompletions';
import { useFormulaRuntimeCompletions } from '@/hooks/useFormulaRuntimeCompletions';
import { useTheme } from '@/lib/themeHelpers';

interface FormulaCellProps {
  definition: FormulaCellDefinition;
  initialized: boolean;
  isEditMode?: boolean;
  readingMode?: boolean; // NEW: Reading mode flag
}

export function FormulaCell({ definition, initialized, isEditMode = false, readingMode = false }: FormulaCellProps) {
  const { reactiveStore } = useReactiveSystem();
  const { updateCell } = useApplication();
  const [value, setValue] = useReactiveValue(definition.variableName, null);
  const [error, setError] = useState<string | null>(null);
  
  // Get current theme for CodeMirror
  const currentTheme = useTheme();
  const editorTheme = currentTheme === 'dark' ? oneDark : undefined; // undefined for light mode (default)

  // Get completions for formula editor
  const formulaCompletions = useFormulaCompletions();
  const moduleCompletions = useModuleCompletions();
  const runtimeCompletions = useFormulaRuntimeCompletions();

  // Edit mode state with dirty tracking
  const [editConfig, setEditConfig] = useState({
    variableName: definition.variableName,
    formula: definition.formula
  });
  const [isDirty, setIsDirty] = useState(false);

  // Update edit config when definition changes
  useEffect(() => {
    setEditConfig({
      variableName: definition.variableName,
      formula: definition.formula
    });
    setIsDirty(false);
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

  // Helper function to handle config changes (no auto-commit)
  const handleConfigChange = (updates: Partial<typeof editConfig>) => {
    const newConfig = { ...editConfig, ...updates };
    setEditConfig(newConfig);
    
    // Mark as dirty if there are actual changes
    const hasChanges = newConfig.variableName !== definition.variableName || 
                      newConfig.formula !== definition.formula;
    setIsDirty(hasChanges);
  };

  // Commit changes to the cell definition
  const commitChanges = useCallback(() => {
    if (!isDirty) return;

    // Only require non-empty variable name - allow incomplete formulas
    if (!editConfig.variableName.trim()) {
      setError('Variable name is required');
      return;
    }

    // Create updated cell definition
    const updatedCell: FormulaCellDefinition = {
      ...definition,
      variableName: editConfig.variableName.trim(),
      formula: editConfig.formula
    };

    // Update through state manager
    updateCell(definition.id, updatedCell, 'Update formula cell');
    setIsDirty(false);
    setError(null);
  }, [isDirty, editConfig, definition, updateCell]);

  // Discard changes and revert to saved state
  const discardChanges = useCallback(() => {
    setEditConfig({
      variableName: definition.variableName,
      formula: definition.formula
    });
    setIsDirty(false);
    setError(null);
  }, [definition]);

  // Keyboard shortcuts for edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditMode || !isDirty) return;
      
      // Ctrl+Enter or Cmd+Enter to apply changes
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        commitChanges();
      }
      
      // Escape to cancel changes
      if (e.key === 'Escape') {
        e.preventDefault();
        discardChanges();
      }
    };

    if (isEditMode) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditMode, isDirty, commitChanges, discardChanges]);

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
                  theme={editorTheme}
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

        {/* Action buttons - only show when there are changes */}
        {isDirty && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
            <Button
              onClick={commitChanges}
              size="sm"
              className="h-7 px-3 text-xs"
              title="Apply changes (Ctrl+Enter)"
            >
              Apply Changes
            </Button>
            <Button
              onClick={discardChanges}
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              title="Cancel changes (Escape)"
            >
              Cancel
            </Button>
            <span className="text-xs text-secondary-foreground ml-2">
              <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Ctrl+Enter</kbd> to apply, <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border rounded">Esc</kbd> to cancel
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render view mode (simple pseudo-code format) - always used in reading mode
  if (!isEditMode || readingMode) {
    return (
      <div className={readingMode ? "cell formula-cell-reading" : "cell formula-cell p-2"}>
        <div className="flex items-center gap-2 text-sm">
          {/* Simple pseudo-code format: variableName = <expression> */}
          <span className="font-mono text-foreground">
            {definition.variableName}
          </span>
          <span className="text-secondary-foreground">=</span>
          <code className="text-sm bg-muted text-secondary-foreground px-2 py-1 rounded">
            {definition.formula}
          </code>
          
          {/* Show current value if available */}
          {value !== null && value !== undefined && (
            <>
              <span className="text-secondary-foreground">→</span>
              <span className="font-mono text-accent-foreground text-sm">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </>
          )}
          
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
        {isDirty && (
          <span className="text-orange-500 text-xs font-medium">
            • Unsaved changes
          </span>
        )}
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
