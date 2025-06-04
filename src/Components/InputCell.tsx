import React from 'react';
import { useReactiveValue } from '@/Engine/ReactiveProvider';
import { InputCellDefinition } from '@/Types/NotebookModel';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface InputCellProps {
  definition: InputCellDefinition;
  isEditMode?: boolean;
}

export function InputCell({ definition, isEditMode = false }: InputCellProps) {
  const [value, setValue] = useReactiveValue(definition.variableName, definition.defaultValue);

  // Use label if provided, otherwise fallback to variableName
  const displayLabel = definition.label || definition.variableName;

  const renderInput = () => {
    switch (definition.inputType) {
      case 'number':
        return (
          <Input
            type="number"
            value={value ?? definition.defaultValue}
            onChange={(e) => setValue(Number(e.target.value))}
            min={definition.props?.min}
            max={definition.props?.max}
            step={definition.props?.step}
            className="input-max-width"
          />
        );
        
      case 'range':
        return (
          <div className="space-y-2 input-max-width">
            <Slider
              value={[value ?? definition.defaultValue]}
              onValueChange={(values) => setValue(values[0])}
              min={definition.props?.min ?? 0}
              max={definition.props?.max ?? 100}
              step={definition.props?.step ?? 1}
              className="w-full"
            />
            <div className="text-sm text-secondary-foreground text-center">
              {value ?? definition.defaultValue}
            </div>
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value ?? definition.defaultValue}
              onCheckedChange={(checked) => setValue(checked)}
              id={`checkbox-${definition.id}`}
            />
            <Label 
              htmlFor={`checkbox-${definition.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {displayLabel}
            </Label>
          </div>
        );
        
      case 'select':
        return (
          <Select
            value={String(value ?? definition.defaultValue)}
            onValueChange={(selectedValue) => {
              // Convert back to appropriate type based on the option value type
              const option = definition.props?.options?.find(opt => String(opt.value) === selectedValue);
              setValue(option ? option.value : selectedValue);
            }}
          >
            <SelectTrigger className="input-max-width">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {definition.props?.options?.map(option => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'text':
      default:
        return (
          <Input
            type="text"
            value={value ?? definition.defaultValue}
            onChange={(e) => setValue(e.target.value)}
            placeholder={definition.props?.placeholder}
            className="input-max-width"
          />
        );
    }
  };

  return (
    <div className="cell input-cell p-4 space-y-3">
      {/* Only show label for non-checkbox inputs (checkbox renders its own label) */}
      {definition.inputType !== 'checkbox' && (
        <Label 
          htmlFor={`input-${definition.id}`}
          className="text-sm font-medium text-foreground"
        >
          {displayLabel}
        </Label>
      )}
      
      <div id={`input-${definition.id}`}>
        {renderInput()}
      </div>
      
      {/* Debug info in edit mode */}
      {isEditMode && (
        <div className="text-xs text-secondary-foreground mt-2 p-2 bg-muted rounded">
          <div><strong>Variable:</strong> {definition.variableName}</div>
          <div><strong>Type:</strong> {definition.inputType}</div>
          <div><strong>Current Value:</strong> {JSON.stringify(value)}</div>
          <div><strong>Default Value:</strong> {JSON.stringify(definition.defaultValue)}</div>
          {definition.label && (
            <div><strong>Custom Label:</strong> {definition.label}</div>
          )}
        </div>
      )}
    </div>
  );
}
