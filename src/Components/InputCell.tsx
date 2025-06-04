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
      alert('Variable name is required');
      return;
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
        <div className="text-sm font-medium text-foreground mb-3">Configure Input Cell</div>
        
        {/* Variable Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Variable Name *</Label>
          <Input
            value={editConfig.variableName}
            onChange={(e) => setEditConfig(prev => ({ ...prev, variableName: e.target.value }))}
            placeholder="Enter variable name"
            className="input-max-width"
          />
        </div>

        {/* Input Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Input Type</Label>
          <Select
            value={editConfig.inputType}
            onValueChange={(value) => setEditConfig(prev => ({ ...prev, inputType: value as InputType }))}
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
            onChange={(e) => setEditConfig(prev => ({ ...prev, label: e.target.value }))}
            placeholder={`Defaults to: ${editConfig.variableName}`}
            className="input-max-width"
          />
        </div>

        {/* Numeric constraints for number and range inputs */}
        {(editConfig.inputType === 'number' || editConfig.inputType === 'range') && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">Numeric Constraints</div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-secondary-foreground">Min</Label>
                <Input
                  type="number"
                  value={editConfig.min}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, min: e.target.value }))}
                  placeholder="No limit"
                  className="text-xs"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-secondary-foreground">Max</Label>
                <Input
                  type="number"
                  value={editConfig.max}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, max: e.target.value }))}
                  placeholder="No limit"
                  className="text-xs"
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-secondary-foreground">Step</Label>
                <Input
                  type="number"
                  value={editConfig.step}
                  onChange={(e) => setEditConfig(prev => ({ ...prev, step: e.target.value }))}
                  placeholder="1"
                  className="text-xs"
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
              onChange={(e) => setEditConfig(prev => ({ ...prev, placeholder: e.target.value }))}
              placeholder="Enter placeholder text"
              className="input-max-width"
            />
          </div>
        )}

        {/* Apply button */}
        <div className="flex justify-end pt-2">
          <Button onClick={updateCellDefinition} size="sm">
            Apply Changes
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="cell input-cell p-4 space-y-3">
      {isEditMode ? (
        <div className="edit-mode-container space-y-4">
          {/* Live Input Preview */}
          <div className="live-input-preview">
            <div className="text-sm font-medium text-foreground mb-2">Live Preview:</div>
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
      
      {/* Debug info in edit mode */}
      {isEditMode && (
        <div className="text-xs text-secondary-foreground mt-4 p-2 bg-background rounded border">
          <div className="font-medium mb-2">Current State:</div>
          <div><strong>Variable:</strong> {definition.variableName}</div>
          <div><strong>Type:</strong> {definition.inputType}</div>
          <div><strong>Current Value:</strong> {JSON.stringify(value)}</div>
          <div><strong>Default Value:</strong> {JSON.stringify(definition.defaultValue)}</div>
          {definition.label && (
            <div><strong>Custom Label:</strong> {definition.label}</div>
          )}
          {definition.props && (
            <div><strong>Props:</strong> {JSON.stringify(definition.props, null, 2)}</div>
          )}
        </div>
      )}
    </div>
  );
}
