import React from 'react';
import { useReactiveFormula } from 'src/Engine/ReactiveProvider';
import { FormulaCellDefinition } from 'src/Types/NotebookModel';

function FormulaCell({ definition }: { definition: FormulaCellDefinition; }) {
  const value = useReactiveFormula(definition.variableName, definition.formula);

  const formatValue = (val: any) => {
    if (val == null) return '';

    switch (definition.outputFormat) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: definition.decimals ?? 2
        }).format(val);
      case 'percentage':
        return `${val.toFixed(definition.decimals ?? 1)}%`;
      case 'number':
        return val.toFixed(definition.decimals ?? 2);
      default:
        return val.toString();
    }
  };

  return (
    <div className="cell formula-cell">
      <div className="formula-output">
        {formatValue(value)}
      </div>
    </div>
  );
}
