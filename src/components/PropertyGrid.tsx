import React, { useState, useCallback, useMemo } from 'react';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit3, Check, X, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/themeHelpers';

interface PropertyValue {
  value: any;
  type: string;
  isEditable: boolean;
  path: string[];
}

interface PropertyGridProps {
  data: any;
  name?: string;
  editable?: boolean;
  collapsed?: boolean;
  maxDepth?: number;
  onValueChange?: (path: string[], newValue: any) => void;
}

interface EditableCellProps {
  property: PropertyValue;
  onValueChange: (path: string[], value: any) => void;
  onCancel?: () => void;
}

const EditableCell: React.FC<EditableCellProps> = ({ property, onValueChange, onCancel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(formatValueForEdit(property.value));

  const handleSave = useCallback(() => {
    let parsedValue: any = editValue;
    
    // Try to parse the value based on the original type
    if (property.type === 'number') {
      const numValue = Number(editValue);
      if (!isNaN(numValue)) {
        parsedValue = numValue;
      }
    } else if (property.type === 'boolean') {
      parsedValue = editValue.toLowerCase() === 'true';
    } else if (editValue === 'null' || editValue === 'undefined') {
      parsedValue = editValue === 'null' ? null : undefined;
    } else if (property.type === 'string') {
      parsedValue = editValue;
    } else {
      // Try to parse as JSON for objects/arrays
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        parsedValue = editValue; // Fallback to string
      }
    }
    
    onValueChange(property.path, parsedValue);
    setIsEditing(false);
  }, [editValue, property.path, property.type, onValueChange]);

  const handleCancel = useCallback(() => {
    setEditValue(formatValueForEdit(property.value));
    setIsEditing(false);
    onCancel?.();
  }, [property.value, onCancel]);

  const displayValue = formatValueForDisplay(property.value, property.type);

  if (!property.isEditable || !isEditing) {
    return (
      <div className="flex items-center justify-between group">
        <span className="text-sm font-mono flex-1 pr-2">{displayValue}</span>
        {property.isEditable && (
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-50 hover:opacity-100"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="text-xs font-mono h-6 flex-1"
        autoFocus
        onBlur={handleSave}
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-5 w-5 p-0"
        onClick={handleSave}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-5 w-5 p-0"
        onClick={handleCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

function formatValueForEdit(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

function formatValueForDisplay(value: any, type: string): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    return value.length > 50 ? `"${value.substring(0, 47)}..."` : `"${value}"`;
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(3);
  }
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `Object(${keys.length} keys)`;
  }
  return String(value);
}

function getValueType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function isEditableType(type: string): boolean {
  return ['string', 'number', 'boolean', 'null', 'undefined'].includes(type);
}

function flattenObject(obj: any, path: string[] = [], maxDepth: number = 3): PropertyValue[] {
  const properties: PropertyValue[] = [];
  
  if (path.length >= maxDepth) {
    return properties;
  }

  if (obj === null || obj === undefined) {
    return [{
      value: obj,
      type: getValueType(obj),
      isEditable: true,
      path: path
    }];
  }

  if (typeof obj !== 'object') {
    return [{
      value: obj,
      type: getValueType(obj),
      isEditable: isEditableType(getValueType(obj)),
      path: path
    }];
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = [...path, String(index)];
      const itemType = getValueType(item);
      
      if (typeof item === 'object' && item !== null && path.length < maxDepth - 1) {
        properties.push(...flattenObject(item, itemPath, maxDepth));
      } else {
        properties.push({
          value: item,
          type: itemType,
          isEditable: isEditableType(itemType),
          path: itemPath
        });
      }
    });
  } else {
    // Handle objects
    Object.entries(obj).forEach(([key, value]) => {
      const itemPath = [...path, key];
      const itemType = getValueType(value);
      
      if (typeof value === 'object' && value !== null && path.length < maxDepth - 1) {
        properties.push(...flattenObject(value, itemPath, maxDepth));
      } else {
        properties.push({
          value: value,
          type: itemType,
          isEditable: isEditableType(itemType),
          path: itemPath
        });
      }
    });
  }

  return properties;
}

function PropertyRow({ property, onValueChange, isReactiveEditable }: {
  property: PropertyValue;
  onValueChange: (path: string[], value: any) => void;
  isReactiveEditable: boolean;
}) {
  const propertyName = property.path[property.path.length - 1];
  const fullPath = property.path.join('.');
  const isEditable = property.isEditable && isReactiveEditable;

  return (
    <div className="flex items-center hover:bg-muted/30 border-b border-border/30">
      {/* Property Name Column */}
      <div className="flex-1 min-w-0 py-2 px-3 bg-muted/10">
        <div className="text-sm font-medium text-foreground truncate">
          {propertyName}
        </div>
        {property.path.length > 1 && (
          <div className="text-xs text-muted-foreground truncate">
            {property.path.slice(0, -1).join('.')}
          </div>
        )}
      </div>
      
      {/* Value Column */}
      <div className="flex-1 min-w-0 py-2 px-3">
        <EditableCell
          property={{ ...property, isEditable }}
          onValueChange={onValueChange}
        />
      </div>
    </div>
  );
}

export function PropertyGrid({ 
  data, 
  name, 
  editable = false, 
  collapsed = false, 
  maxDepth = 3,
  onValueChange 
}: PropertyGridProps) {
  const reactiveContext = useReactiveSystem();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  // Determine if this object is a reactive value that can be edited
  const isReactiveEditable = useMemo(() => {
    if (!editable || !name || !reactiveContext?.reactiveStore) {
      console.log('PropertyGrid: Not editable because:', { editable, name, hasStore: !!reactiveContext?.reactiveStore });
      return false;
    }
    
    try {
      // Check if this variable exists in the reactive store
      const variableNames = reactiveContext.reactiveStore.getAllVariableNames();
      const isEditable = variableNames.includes(name);
      console.log('PropertyGrid: Checking if editable:', { name, variableNames, isEditable });
      return isEditable;
    } catch (error) {
      console.error('PropertyGrid: Error checking reactive editable:', error);
      return false;
    }
  }, [editable, name, reactiveContext]);

  // Flatten the object into properties
  const properties = useMemo(() => {
    return flattenObject(data, [], maxDepth);
  }, [data, maxDepth]);

  const handleValueChange = useCallback((path: string[], newValue: any) => {
    if (onValueChange) {
      onValueChange(path, newValue);
      return;
    }

    // Default behavior: update reactive store if this is a reactive variable
    if (isReactiveEditable && name && reactiveContext?.reactiveStore) {
      try {
        // Deep clone the current data to avoid mutations
        const currentData = JSON.parse(JSON.stringify(data));
        
        // Navigate to the property and update it
        let current = currentData;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        current[path[path.length - 1]] = newValue;
        
        // Update the reactive store with the modified object
        reactiveContext.reactiveStore.define(name, currentData);
        
        console.log(`PropertyGrid: Updated ${name}.${path.join('.')} to`, newValue);
      } catch (error) {
        console.error('Failed to update reactive value:', error);
      }
    }
  }, [onValueChange, isReactiveEditable, name, reactiveContext, data]);

  if (properties.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic p-4">
        No editable properties found
      </div>
    );
  }

  return (
    <div className="property-grid border border-border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <span className="font-medium text-sm">
            {name ? `${name} Properties` : 'Object Properties'}
          </span>
          <Badge variant="secondary" className="text-xs">
            {properties.length} properties
          </Badge>
        </div>
        {isReactiveEditable && (
          <Badge variant="default" className="text-xs">
            Editable
          </Badge>
        )}
      </div>

      {/* Properties */}        {!isCollapsed && (
        <div className="max-h-96 overflow-y-auto">
          {/* Column Headers */}
          <div className="flex items-center py-2 border-b border-border text-sm font-semibold text-muted-foreground">
            <div className="flex-1 px-3 bg-muted/10">Property</div>
            <div className="flex-1 px-3">Value</div>
          </div>
          
          {/* Property Rows */}
          <div>
            {properties.map((property, index) => (
              <PropertyRow
                key={`${property.path.join('.')}-${index}`}
                property={property}
                onValueChange={handleValueChange}
                isReactiveEditable={isReactiveEditable}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyGrid;
