import React, { useEffect, useState } from 'react';
import { useReactiveValue, useReactiveSystem } from '@/Engine/ReactiveProvider';
import { FormulaCellDefinition } from '@/Types/NotebookModel';
import { log } from './DynamicNotebook';

interface FormulaCellProps {
  definition: FormulaCellDefinition;
  initialized: boolean;
  isEditMode?: boolean; // NEW: Add isEditMode prop
}

export function FormulaCell({ definition, initialized, isEditMode = false }: FormulaCellProps) {
  const { reactiveStore } = useReactiveSystem();
  const [value, setValue] = useReactiveValue(definition.variableName, null);
  const [error, setError] = useState<string | null>(null);

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

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return 'Not calculated';
    
    switch (definition.outputFormat) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: definition.decimals ?? 2,
          maximumFractionDigits: definition.decimals ?? 2
        }).format(Number(val));
      
      case 'percentage':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: definition.decimals ?? 2,
          maximumFractionDigits: definition.decimals ?? 2
        }).format(Number(val) / 100);
      
      case 'number':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: definition.decimals ?? 2,
          maximumFractionDigits: definition.decimals ?? 2
        }).format(Number(val));
      
      case 'text':
      default:
        return String(val);
    }
  };

  return (
    <div className="cell formula-cell border border-border rounded-lg mb-4 bg-background">
      <div className="formula-header bg-background-secondary px-4 py-2 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">
              {definition.label || `Formula: ${definition.variableName}`}
            </span>
            <code className="text-xs bg-background text-secondary-foreground px-2 py-1 rounded">
              {definition.formula}
            </code>
          </div>
        </div>
        {definition.description && (
          <div className="mt-1 text-xs text-secondary-foreground">
            {definition.description}
          </div>
        )}
      </div>

      <div className="formula-content px-4 py-3">
        {error ? (
          <div className="formula-error text-red-500">
            <div className="text-xs font-medium mb-1">Formula Error:</div>
            <div className="text-sm">{error}</div>
          </div>
        ) : (
          <div className="formula-result">
            <span className="text-sm text-secondary-foreground mr-2">
              {definition.variableName} =
            </span>
            <span className="text-lg font-mono text-accent-foreground">
              {formatValue(value)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
