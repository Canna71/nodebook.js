import React, { useEffect, useState } from 'react';
import { useReactiveValue, useReactiveSystem } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { FormulaCellDefinition } from '@/Types/NotebookModel';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Editor from './Editor';
import { oneDark } from '@codemirror/theme-one-dark';
import { log } from './DynamicNotebook';
import { formatValue } from '@/lib/formatters';
import { useFormulaCompletions } from '@/hooks/useFormulaCompletions';
import { useCodeCompletions, useModuleCompletions } from '@/hooks/useCodeCompletions';
import { useFormulaRuntimeCompletions } from '@/hooks/useFormulaRuntimeCompletions';

interface FormulaCellProps {
  definition: FormulaCellDefinition;
  initialized: boolean;
  isEditMode?: boolean;
}

export function FormulaCell({ definition, initialized, isEditMode = false }: FormulaCellProps) {
  const { reactiveStore } = useReactiveSystem();
  const { currentModel, setModel, setDirty } = useApplication();
  const [value, setValue] = useReactiveValue(definition.variableName, null);
  const [error, setError] = useState<string | null>(null);

  // Get completions for formula editor (same as code cells)
  const formulaCompletions = useFormulaCompletions();
  const codeCompletions = useCodeCompletions();
  const moduleCompletions = useModuleCompletions();
  const runtimeCompletions = useFormulaRuntimeCompletions();

  // Edit mode state
  const [editConfig, setEditConfig] = useState({
    variableName: definition.variableName,
    formula: definition.formula,
    label: definition.label || '',
    description: definition.description || '',
    outputFormat: definition.outputFormat || 'number',
    decimals: definition.decimals?.toString() || '2'
  });

  // Update edit config when definition changes
  useEffect(() => {
    setEditConfig({
      variableName: definition.variableName,
      formula: definition.formula,
      label: definition.label || '',
      description: definition.description || '',
      outputFormat: definition.outputFormat || 'number',
      decimals: definition.decimals?.toString() || '2'
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
    if (!currentModel) return;

    // Only require non-empty variable name - allow incomplete formulas
    if (!config.variableName.trim()) {
      return; // Skip update only if variable name is empty
    }

    // Create updated cell definition - allow any formula content
    const updatedCell: FormulaCellDefinition = {
      ...definition,
      variableName: config.variableName.trim(),
      formula: config.formula, // Don't trim or validate - allow any content
      label: config.label.trim() || undefined,
      description: config.description.trim() || undefined,
      outputFormat: config.outputFormat as FormulaCellDefinition['outputFormat'],
      decimals: config.decimals ? parseInt(config.decimals) : undefined
    };

    // Update the model
    const updatedModel = {
      ...currentModel,
      cells: currentModel.cells.map(cell => 
        cell.id === definition.id ? updatedCell : cell
      )
    };

    setModel(updatedModel);
    setDirty(true);
  };

  const formatCellValue = (val: any): string => {
    return formatValue(val, definition.outputFormat || 'number', {
      decimals: definition.decimals
    });
  };

  const renderEditMode = () => {
    return (
      <div className="formula-cell-edit-mode space-y-4 p-2 bg-muted/50 rounded border">
        {/* Variable Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Variable Name</Label>
          <Input
            value={editConfig.variableName}
            onChange={(e) => handleConfigChange({ variableName: e.target.value })}
            placeholder="result"
            className="input-max-width"
          />
        </div>

        {/* Formula Editor */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Formula</Label>
          <div className="formula-editor border border-border rounded">
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
                width: '100%', // Explicitly constrain to container width
                minHeight: '60px',
                autoHeight: true,
                maxHeight: '200px' // Keep existing max height for formula editor
              }}
            />
          </div>
        </div>

        {/* Label (optional) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Label <span className="text-xs text-secondary-foreground">(optional)</span>
          </Label>
          <Input
            value={editConfig.label}
            onChange={(e) => handleConfigChange({ label: e.target.value })}
            placeholder={`Defaults to: ${editConfig.variableName || 'Variable Name'}`}
            className="input-max-width"
          />
        </div>

        {/* Description (optional) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Description <span className="text-xs text-secondary-foreground">(optional)</span>
          </Label>
          <Input
            value={editConfig.description}
            onChange={(e) => handleConfigChange({ description: e.target.value })}
            placeholder="Brief description of what this formula calculates"
            className="input-max-width"
          />
        </div>

        {/* Format Parameters */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground">Format Parameters</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Output Format */}
            <div className="space-y-1">
              <Label className="text-xs text-secondary-foreground">Output Format</Label>
              <Select
                value={editConfig.outputFormat}
                onValueChange={(value) => handleConfigChange({ outputFormat: value as FormulaCellDefinition['outputFormat'] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Decimals */}
            {(editConfig.outputFormat === 'number' || editConfig.outputFormat === 'currency' || editConfig.outputFormat === 'percentage') && (
              <div className="space-y-1">
                <Label className="text-xs text-secondary-foreground">Decimal Places</Label>
                <Input
                  type="number"
                  value={editConfig.decimals}
                  onChange={(e) => handleConfigChange({ decimals: e.target.value })}
                  placeholder="2"
                  min="0"
                  max="10"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  // Render view mode (compact single line)
  if (!isEditMode) {
    const displayLabel = definition.label || definition.variableName;
    
    return (
      <div className="cell formula-cell p-2">
        <div className="flex items-center gap-2 text-sm">
          {/* Label/Variable */}
          <span className="font-medium text-foreground flex-shrink-0">
            {displayLabel}:
          </span>
          
          {/* Formula */}
          <code className="text-xs bg-muted text-secondary-foreground px-2 py-1 rounded flex-shrink-0">
            {definition.formula}
          </code>
          
          {/* Equals sign */}
          <span className="text-secondary-foreground flex-shrink-0">=</span>
          
          {/* Result */}
          {error ? (
            <span className="text-destructive text-xs">Error: {error}</span>
          ) : (
            <span className="font-mono text-accent-foreground">
              {formatCellValue(value)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render edit mode
  return (
    <div className="cell formula-cell p-2">
      {/* Compact view in edit mode header */}
      <div className="flex items-center gap-2 text-sm mb-3 pb-2 border-b border-border">
        <span className="font-medium text-foreground">
          {definition.label || definition.variableName}:
        </span>
        <code className="text-xs bg-muted text-secondary-foreground px-2 py-1 rounded">
          {definition.formula}
        </code>
        <span className="text-secondary-foreground">=</span>
        {error ? (
          <span className="text-destructive text-xs">Error</span>
        ) : (
          <span className="font-mono text-accent-foreground">
            {formatCellValue(value)}
          </span>
        )}
      </div>

      {/* Edit interface */}
      {renderEditMode()}
    </div>
  );
}
