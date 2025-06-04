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
  const [value, setValue] = useReactiveValue(definition.variableName, definition.defaultValue);
  const { currentModel, setModel, setDirty } = useApplication();

  // Edit mode state
  const [editConfig, setEditConfig] = useState({
    variableName: definition.variableName,
    inputType: definition.inputType,
    label: definition.label || '',
    min: definition.props?.min?.toString() || '',
    max: definition.props?.max?.toString() || '',
    step: definition.props?.step?.toString() || '',
    placeholder: definition.props?.placeholder || ''
  });

  // Update edit config when definition changes
  useEffect(() => {
    setEditConfig({
      variableName: definition.variableName,
      inputType: definition.inputType,
      label: definition.label || '',
      min: definition.props?.min?.toString() || '',
      max: definition.props?.max?.toString() || '',
      step: definition.props?.step?.toString() || '',
      placeholder: definition.props?.placeholder || ''
    });
  }, [definition]);

  // Use label if provided, otherwise fallback to variableName
  const displayLabel = definition.label || definition.variableName;

  const updateCellDefinition = () => {
    if (!currentModel) return;

    // Validate variable name
    if (!editConfig.variableName.trim()) {
      return; // Skip update if invalid
    }

    // Build props object
    const props: InputCellDefinition['props'] = {};
    
    if (editConfig.inputType === 'number' || editConfig.inputType === 'range') {
      if (editConfig.min !== '') {
        const minVal = parseFloat(editConfig.min);
        if (!isNaN(minVal)) props.min = minVal;
      }
      if (editConfig.max !== '') {
        const maxVal = parseFloat(editConfig.max);
        if (!isNaN(maxVal)) props.max = maxVal;
      }
      if (editConfig.step !== '') {
        const stepVal = parseFloat(editConfig.step);
        if (!isNaN(stepVal)) props.step = stepVal;
      }
    }
    
    if (editConfig.inputType === 'text' && editConfig.placeholder) {
      props.placeholder = editConfig.placeholder;
    }

    // Create updated cell definition
    const updatedCell: InputCellDefinition = {
      ...definition,
      variableName: editConfig.variableName.trim(),
      inputType: editConfig.inputType,
      label: editConfig.label.trim() || undefined, // Use undefined if empty
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

  // Helper function to handle config changes and auto-update
  const handleConfigChange = (updates: Partial<typeof editConfig>) => {
    const newConfig = { ...editConfig, ...updates };
    setEditConfig(newConfig);
    
    // Auto-update the definition if variable name is valid
    if (newConfig.variableName.trim()) {
      // Update immediately instead of using timeout
      updateCellDefinitionWithConfig(newConfig);
    }
  };

  // New function to update with specific config
  const updateCellDefinitionWithConfig = (config: typeof editConfig) => {
    if (!currentModel) return;

    // Validate variable name
    if (!config.variableName.trim()) {
      return; // Skip update if invalid
    }

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

    // Create updated cell definition
    const updatedCell: InputCellDefinition = {
      ...definition,
      variableName: config.variableName.trim(),
      inputType: config.inputType,
      label: config.label || undefined, // Remove trim() to allow spaces in labels
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

  const renderEditMode = () => {
    return (
      <div className="input-cell-edit-mode space-y-4 p-4 bg-muted/50 rounded border">
        {/* Variable Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Variable Name *</Label>
          <Input
            value={editConfig.variableName}
            onChange={(e) => handleConfigChange({ variableName: e.target.value })}
            placeholder="Enter variable name"
            className="input-max-width"
          />
        </div>

        {/* Input Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Input Type</Label>
          <Select
            value={editConfig.inputType}
            onValueChange={(value) => handleConfigChange({ inputType: value as InputType })}
          >
            <SelectTrigger className="input-max-width">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="range">Range (Slider)</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="select">Select</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Label */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Label <span className="text-xs text-secondary-foreground">(optional, defaults to variable name)</span>
          </Label>
          <Input
            value={editConfig.label}
            onChange={(e) => handleConfigChange({ label: e.target.value })}
            placeholder={`Defaults to: ${editConfig.variableName}`}
            className="input-max-width"
          />
        </div>

        {/* Numeric constraints for number and range inputs */}
        {(editConfig.inputType === 'number' || editConfig.inputType === 'range') && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Numeric Constraints</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-secondary-foreground">Min</Label>
                <Input
                  type="number"
                  value={editConfig.min}
                  onChange={(e) => handleConfigChange({ min: e.target.value })}
                  placeholder="No limit"
                  className="text-xs w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-secondary-foreground">Max</Label>
                <Input
                  type="number"
                  value={editConfig.max}
                  onChange={(e) => handleConfigChange({ max: e.target.value })}
                  placeholder="No limit"
                  className="text-xs w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
              
              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs text-secondary-foreground">Step</Label>
                <Input
                  type="number"
                  value={editConfig.step}
                  onChange={(e) => handleConfigChange({ step: e.target.value })}
                  placeholder="1"
                  className="text-xs w-full [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for text inputs */}
        {editConfig.inputType === 'text' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Placeholder <span className="text-xs text-secondary-foreground">(optional)</span>
            </Label>
            <Input
              value={editConfig.placeholder}
              onChange={(e) => handleConfigChange({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
              className="input-max-width"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="cell input-cell p-4 space-y-3">
      {isEditMode ? (
        <div className="edit-mode-container space-y-4">
          {/* Live Input Preview */}
          <div className="live-input-preview">
            <div className="p-3 bg-background border border-border rounded">
              {/* Only show label for non-checkbox inputs (checkbox renders its own label) */}
              {definition.inputType !== 'checkbox' && (
                <Label 
                  htmlFor={`input-preview-${definition.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  {displayLabel}
                </Label>
              )}
              
              <div id={`input-preview-${definition.id}`} className="mt-2">
                {renderInput()}
              </div>
            </div>
          </div>

          {/* Configuration Interface */}
          {renderEditMode()}
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
