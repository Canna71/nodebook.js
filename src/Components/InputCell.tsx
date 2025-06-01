import React from 'react';
import { useReactiveValue } from '@/Engine/ReactiveProvider';
import { InputCellDefinition } from '@/Types/NotebookModel';

export function InputCell({ definition }: { definition: InputCellDefinition; }) {
  const [value, setValue] = useReactiveValue(definition.variableName, definition.defaultValue);

  const renderInput = () => {
    const commonProps = {
      value: value ?? definition.defaultValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const newValue = definition.inputType === 'number' || definition.inputType === 'range'
          ? Number(e.target.value)
          : definition.inputType === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;
        setValue(newValue);
      }
    };

    switch (definition.inputType) {
      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            min={definition.props?.min}
            max={definition.props?.max}
            step={definition.props?.step} />
        );
      case 'range':
        return (
          <div>
            <input
              type="range"
              {...commonProps}
              min={definition.props?.min}
              max={definition.props?.max}
              step={definition.props?.step} />
            <span>{value}</span>
          </div>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value ?? definition.defaultValue}
            onChange={(e) => setValue(e.target.checked)} />
        );
      case 'select':
        return (
          <select {...commonProps}>
            {definition.props?.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            {...commonProps}
            placeholder={definition.props?.placeholder} />
        );
    }
  };

  return (
    <div className="cell input-cell">
      <label>{definition.label}:</label>
      {renderInput()}
    </div>
  );
}
