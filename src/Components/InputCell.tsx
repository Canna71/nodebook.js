import React, { useState, useEffect } from 'react';
import { useReactiveValue } from '@/Engine/ReactiveProvider';
import { useApplication } from '@/Engine/ApplicationProvider';
import { InputCellDefinition, InputType } from '@/Types/NotebookModel';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface InputCellProps {
  definition: InputCellDefinition;
  isEditMode?: boolean;
}

export function InputCell({ definition, isEditMode = false }: InputCellProps) {
  // Helper function to generate auto variable name from cell type and ID
  const generateAutoVariableName = (cellId: string): string => {
    return `input-${cellId}`;
  };

  // Determine the effective variable name - use automatic naming if empty
  const effectiveVariableName = definition.variableName.trim() || generateAutoVariableName(definition.id);
  
  const [value, setValue] = useReactiveValue(effectiveVariableName, definition.value);
  const { currentModel, setModel, setDirty } = useApplication();

  // Calculate edit config from definition (no state needed!)
  const getEditConfig = () => ({
    variableName: definition.variableName,
    inputType: definition.inputType,
    label: definition.label || '',
    min: definition.props?.min?.toString() || '',
    max: definition.props?.max?.toString() || '',
    step: definition.props?.step?.toString() || '',
    placeholder: definition.props?.placeholder || ''
  });

  // Add local state for number input to handle decimal typing
  const [numberInputValue, setNumberInputValue] = useState<string>('');

  // Add local state for numeric constraint inputs to handle decimal typing
  const [constraintInputValues, setConstraintInputValues] = useState({
    min: '',
    max: '',
    step: ''
  });

  // Update number input value when definition or reactive value changes
  useEffect(() => {
    const currentValue = value ?? definition.value;
    setNumberInputValue(String(currentValue));
  }, [value, definition.value]);

  // Update constraint input values when definition changes
  useEffect(() => {
    setConstraintInputValues({
      min: definition.props?.min?.toString() || '',
      max: definition.props?.max?.toString() || '',
      step: definition.props?.step?.toString() || ''
    });
  }, [definition.props?.min, definition.props?.max, definition.props?.step]);

  // NEW: Save value back to definition whenever it changes
  useEffect(() => {
    if (!currentModel || value === undefined || value === definition.value) return;

    // Update the definition with the current value
    const updatedModel = {
      ...currentModel,
      cells: currentModel.cells.map(cell => 
        cell.id === definition.id && cell.type === 'input'
          ? { ...cell, value: value }
          : cell
      )
    };

    setModel(updatedModel);
    setDirty(true);
  }, [value, currentModel, setModel, setDirty, definition.id, definition.value]);

  // Use label if provided, otherwise fallback to variableName (or auto name if empty)
  const displayLabel = definition.label || 
    (definition.variableName.trim() || `Input ${definition.id.slice(-4)}`);

  // Helper function to handle config changes and auto-update
  const handleConfigChange = (updates: Partial<ReturnType<typeof getEditConfig>>) => {
    const currentConfig = getEditConfig();
    const newConfig = { ...currentConfig, ...updates };
    
    // Update the cell definition immediately
    updateCellDefinitionWithConfig(newConfig);
  };

  // Function to update cell definition with specific config
  const updateCellDefinitionWithConfig = (config: ReturnType<typeof getEditConfig>) => {
    if (!currentModel) return;

    // Allow empty variable names - they will get auto-generated names for reactivity
    
    // Build props object
    const props: InputCellDefinition['props'] = {};
    
    if (config.inputType === 'number' || config.inputType === 'range') {
      if (config.min !== '') {
        const minVal = parseFloat(config.min);
        if (!isNaN(minVal)) props.min = minVal;
      }
      if (config.max !== '') {
        const maxVal = parseFloat(config.max);
        if (!isNaN(maxVal)) props.max = maxVal;
      }
      if (config.step !== '') {
        const stepVal = parseFloat(config.step);
        if (!isNaN(stepVal)) props.step = stepVal;
      }
    }
    
    if (config.inputType === 'text' && config.placeholder) {
      props.placeholder = config.placeholder;
    }

    // Create updated cell definition - store the raw variable name (even if empty)
    const updatedCell: InputCellDefinition = {
      ...definition,
      variableName: config.variableName, // Store exactly what user typed (including empty)
      inputType: config.inputType,
      label: config.label || undefined,
      props: Object.keys(props).length > 0 ? props : undefined
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

  // Helper function for numeric constraint changes
  const handleConstraintChange = (field: 'min' | 'max' | 'step', inputValue: string) => {
    // Update local display state immediately for responsive typing
    setConstraintInputValues(prev => ({
      ...prev,
      [field]: inputValue
    }));

    // Update config with new value
    const currentConfig = getEditConfig();
    const newConfig = { ...currentConfig, [field]: inputValue };
    
    // Update the cell definition with the new value
    updateCellDefinitionWithConfig(newConfig);
  };

  const renderInput = () => {
    switch (definition.inputType) {
      case 'number':
        return (
          <Input
            type="number" // Use actual number input type
            value={numberInputValue}
            onChange={(e) => {
              const inputValue = e.target.value;
              setNumberInputValue(inputValue);
              
              // Convert to number and validate
              if (inputValue === '') {
                setValue(definition.value);
              } else {
                const numValue = parseFloat(inputValue);
                if (!isNaN(numValue) && isFinite(numValue)) {
                  // Apply min/max constraints if defined
                  let constrainedValue = numValue;
                  if (definition.props?.min !== undefined && constrainedValue < definition.props.min) {
                    constrainedValue = definition.props.min;
                    setNumberInputValue(constrainedValue.toString());
                  }
                  if (definition.props?.max !== undefined && constrainedValue > definition.props.max) {
                    constrainedValue = definition.props.max;
                    setNumberInputValue(constrainedValue.toString());
                  }
                  setValue(constrainedValue);
                }
              }
            }}
            onBlur={(e) => {
              // On blur, ensure the display value matches the reactive value
              const currentValue = value ?? definition.value;
              setNumberInputValue(String(currentValue));
            }}
            min={definition.props?.min}
            max={definition.props?.max}
            step={definition.props?.step || 1}
            className="input-max-width"
          />
        );
        
      case 'range':
        return (
          <div className="flex items-center gap-2 input-max-width">
            <Slider
              value={[value ?? definition.value]}
              onValueChange={(values) => setValue(values[0])} // This will trigger the useEffect above
              min={definition.props?.min ?? 0}
              max={definition.props?.max ?? 100}
              step={definition.props?.step ?? 1}
              className="flex-1"
            />
            <div className="text-sm text-secondary-foreground min-w-0 flex-shrink-0 font-mono">
              {value ?? definition.value}
            </div>
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value ?? definition.value}
              onCheckedChange={(checked) => setValue(checked)} // This will trigger the useEffect above
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
            value={String(value ?? definition.value)}
            onValueChange={(selectedValue) => {
              // Convert back to appropriate type based on the option value type
              const option = definition.props?.options?.find(opt => String(opt.value) === selectedValue);
              setValue(option ? option.value : selectedValue); // This will trigger the useEffect above
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
            value={value ?? definition.value}
            onChange={(e) => setValue(e.target.value)} // This will trigger the useEffect above
            placeholder={definition.props?.placeholder}
            className="input-max-width"
          />
        );
    }
  };

  const renderEditMode = () => {
    const autoVariableName = generateAutoVariableName(definition.id);
    const editConfig = getEditConfig(); // Calculate fresh each render
    
    return (
      <div className="input-cell-edit-mode p-2 bg-muted/50 rounded border">
        {/* Main configuration in responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-2 items-end mb-3">
          {/* Variable Name */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-foreground whitespace-nowrap">Variable:</Label>
              <Input
                value={editConfig.variableName}
                onChange={(e) => handleConfigChange({ variableName: e.target.value })}
                placeholder={`Auto: ${autoVariableName}`}
                className="text-sm h-8 flex-1"
              />
            </div>
            {!editConfig.variableName.trim() && (
              <div className="text-xs text-secondary-foreground mt-1">
                Auto: <code>{autoVariableName}</code>
              </div>
            )}
          </div>

          {/* Input Type */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-foreground whitespace-nowrap">Type:</Label>
              <Select
                value={editConfig.inputType}
                onValueChange={(value) => handleConfigChange({ inputType: value as InputType })}
              >
                <SelectTrigger className="text-sm h-8 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Label */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-foreground whitespace-nowrap">Label:</Label>
              <Input
                value={editConfig.label}
                onChange={(e) => handleConfigChange({ label: e.target.value })}
                placeholder={editConfig.variableName.trim() 
                  ? editConfig.variableName 
                  : `Input ${definition.id.slice(-4)}`}
                className="text-sm h-8 flex-1"
              />
            </div>
          </div>
        </div>

        {/* Numeric constraints for number and range inputs */}
        {(editConfig.inputType === 'number' || editConfig.inputType === 'range') && (
          <div className="border-t border-border pt-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-secondary-foreground mb-1 block">Min</Label>
                <Input
                  type="number"
                  value={constraintInputValues.min}
                  onChange={(e) => handleConstraintChange('min', e.target.value)}
                  placeholder="No limit"
                  className="text-xs h-7 w-full"
                />
              </div>
              
              <div>
                <Label className="text-xs text-secondary-foreground mb-1 block">Max</Label>
                <Input
                  type="number"
                  value={constraintInputValues.max}
                  onChange={(e) => handleConstraintChange('max', e.target.value)}
                  placeholder="No limit"
                  className="text-xs h-7 w-full"
                />
              </div>
              
              <div>
                <Label className="text-xs text-secondary-foreground mb-1 block">Step</Label>
                <Input
                  type="number"
                  value={constraintInputValues.step}
                  onChange={(e) => handleConstraintChange('step', e.target.value)}
                  placeholder="1"
                  className="text-xs h-7 w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for text inputs */}
        {editConfig.inputType === 'text' && (
          <div className="border-t border-border pt-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium text-foreground whitespace-nowrap">Placeholder:</Label>
              <Input
                value={editConfig.placeholder}
                onChange={(e) => handleConfigChange({ placeholder: e.target.value })}
                placeholder="Enter placeholder text"
                className="text-sm h-8 flex-1"
              />
            </div>
          </div>
        )}

        
      </div>
    );
  };

  return (
    <div className="cell input-cell p-2">
      {/* Horizontal layout for label and input */}
      <div className="flex items-center gap-2 mb-2">
        {/* Label - show for all input types except checkbox (which handles its own label) */}
        {definition.inputType !== 'checkbox' && (
          <Label 
            htmlFor={`input-${definition.id}`}
            className="text-sm font-medium text-foreground min-w-0 flex-shrink-0"
          >
            {displayLabel}:
          </Label>
        )}
        
        {/* Input container */}
        <div id={`input-${definition.id}`} className="flex-1 min-w-0">
          {renderInput()}
        </div>
      </div>

      {/* Only show configuration interface in edit mode */}
      {isEditMode && (
        <div className="edit-mode-container">
          {renderEditMode()}
        </div>
      )}
    </div>
  );
}
