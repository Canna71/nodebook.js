import React, { useState, useCallback, useMemo } from 'react';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit3, Check, X, Plus, Trash2, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import { useTheme } from '@/lib/themeHelpers';

interface PropertyGridProps {
  data: any;
  name?: string;
  editable?: boolean;
  collapsed?: boolean;
  maxDepth?: number;
  level?: number;
  onValueChange?: (path: string[], newValue: any) => void;
}

interface EditableCellProps {
  value: any;
  path: string[];
  onValueChange: (path: string[], value: any) => void;
  onCancel?: () => void;
  isEditable?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, path, onValueChange, onCancel, isEditable = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(formatValueForEdit(value));

  const handleSave = useCallback(() => {
    if (!isEditable) return;
    
    let parsedValue: any = editValue;
    
    // Try to parse the value based on the original type
    const originalType = getValueType(value);
    if (originalType === 'number') {
      const numValue = Number(editValue);
      if (!isNaN(numValue)) {
        parsedValue = numValue;
      }
    } else if (originalType === 'boolean') {
      parsedValue = editValue.toLowerCase() === 'true';
    } else if (editValue === 'null' || editValue === 'undefined') {
      parsedValue = editValue === 'null' ? null : undefined;
    } else if (originalType === 'string') {
      parsedValue = editValue;
    } else {
      // Try to parse as JSON for objects/arrays
      try {
        parsedValue = JSON.parse(editValue);
      } catch {
        parsedValue = editValue; // Fallback to string
      }
    }
    
    onValueChange(path, parsedValue);
    setIsEditing(false);
  }, [editValue, path, value, onValueChange, isEditable]);

  const handleCancel = useCallback(() => {
    setEditValue(formatValueForEdit(value));
    setIsEditing(false);
    onCancel?.();
  }, [value, onCancel]);

  if (!isEditing) {
    return (
      <div 
        className={`flex items-center justify-between group w-full h-full py-0.5 ${
          isEditable ? 'cursor-pointer' : 'cursor-default'
        }`}
        onClick={() => isEditable && setIsEditing(true)}
      >
        <span className="flex-1 pr-2 text-xs">
          {formatValueWithSyntaxHighlighting(value)}
        </span>
        {isEditable && (
          <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 py-0.5">
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }}
        className="text-xs font-mono h-5 flex-1 py-0 px-1"
        autoFocus
        onBlur={handleSave}
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-4 w-4 p-0"
        onClick={handleSave}
      >
        <Check className="h-2.5 w-2.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-4 w-4 p-0"
        onClick={handleCancel}
      >
        <X className="h-2.5 w-2.5" />
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

function formatValueWithSyntaxHighlighting(value: any): React.ReactElement {
  const type = getValueType(value);
  
  if (value === null) {
    return <span className="text-violet-600 dark:text-violet-400 font-mono text-xs">null</span>;
  }
  if (value === undefined) {
    return <span className="text-gray-500 dark:text-gray-400 font-mono text-xs italic">undefined</span>;
  }
  if (type === 'string') {
    const displayValue = value.length > 50 ? `${value.substring(0, 47)}...` : value;
    return <span className="text-green-600 dark:text-green-400 font-mono text-xs">"{displayValue}"</span>;
  }
  if (type === 'number') {
    return <span className="text-blue-600 dark:text-blue-400 font-mono text-xs">{value}</span>;
  }
  if (type === 'boolean') {
    return <span className="text-orange-600 dark:text-orange-400 font-mono text-xs">{String(value)}</span>;
  }
  if (type === 'array') {
    return <span className="text-purple-600 dark:text-purple-400 font-mono text-xs">Array({value.length})</span>;
  }
  if (type === 'object') {
    const keys = Object.keys(value);
    return <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">Object({keys.length})</span>;
  }
  return <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{String(value)}</span>;
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

function isExpandableType(type: string): boolean {
  return ['object', 'array'].includes(type);
}

function PropertyRow({ 
  propertyKey, 
  value, 
  path, 
  onValueChange, 
  isReactiveEditable, 
  level = 0,
  maxDepth 
}: {
  propertyKey: string;
  value: any;
  path: string[];
  onValueChange: (path: string[], value: any) => void;
  isReactiveEditable: boolean;
  level?: number;
  maxDepth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 3); // Auto-expand first 3 levels to make "four" visible by default
  const type = getValueType(value);
  const isEditable = isEditableType(type) && isReactiveEditable;
  const isExpandable = isExpandableType(type); // Always expandable if it's an object/array
  const effectiveMaxDepth = maxDepth || 5;
  const shouldRenderChildren = level < effectiveMaxDepth; // Only render children up to maxDepth
  
  const paddingLeft = level * 12; // Reduced from 16px to 12px per level

  return (
    <>
      {/* Property Row */}
      <tr className="border-b border-border/30 hover:bg-muted/20">
        {/* Property Name Column */}
        <td 
          className="py-1.5 px-2 bg-muted/30 text-sm font-medium text-muted-foreground border-r border-border/30"
          style={{ paddingLeft: paddingLeft + 8 }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isExpandable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-3 w-3 p-0 hover:bg-muted/50"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-2.5 w-2.5" />
                ) : (
                  <ChevronRight className="h-2.5 w-2.5" />
                )}
              </Button>
            )}
            {!isExpandable && <div className="w-3" />}
            <span className="truncate text-xs">
              {propertyKey}
            </span>
          </div>
        </td>
        
        {/* Value Column */}
        <td className="py-1.5 px-2 bg-background">
          {isExpandable ? (
            <div className="py-0.5">
              {formatValueWithSyntaxHighlighting(value)}
              {isExpandable && !shouldRenderChildren && (
                <span className="text-xs text-muted-foreground italic ml-2">
                  (max depth reached)
                </span>
              )}
            </div>
          ) : (
            <EditableCell
              value={value}
              path={path}
              onValueChange={onValueChange}
              isEditable={isEditable}
            />
          )}
        </td>
      </tr>

      {/* Nested Properties */}
      {isExpandable && isExpanded && shouldRenderChildren && (
        <>
          {Array.isArray(value) ? (
            // Render array items
            value.map((item, index) => (
              <PropertyRow
                key={index}
                propertyKey={`[${index}]`}
                value={item}
                path={[...path, String(index)]}
                onValueChange={onValueChange}
                isReactiveEditable={isReactiveEditable}
                level={level + 1}
                maxDepth={effectiveMaxDepth}
              />
            ))
          ) : (
            // Render object properties
            Object.entries(value).map(([key, val]) => (
              <PropertyRow
                key={key}
                propertyKey={key}
                value={val}
                path={[...path, key]}
                onValueChange={onValueChange}
                isReactiveEditable={isReactiveEditable}
                level={level + 1}
                maxDepth={effectiveMaxDepth}
              />
            ))
          )}
        </>
      )}
    </>
  );
}

export function PropertyGrid({ 
  data, 
  name, 
  editable = false, 
  collapsed = false, 
  maxDepth = 5,
  level = 0,
  onValueChange 
}: PropertyGridProps) {
  const reactiveContext = useReactiveSystem();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  // Subscribe to reactive value changes to get current data
  const [currentData, setCurrentData] = useState(data);
  
  // Determine if this object is a reactive value that can be edited
  const isReactiveEditable = useMemo(() => {
    if (!editable || !name || !reactiveContext?.reactiveStore) {
      return false;
    }
    
    try {
      // Check if this variable exists in the reactive store
      const variableNames = reactiveContext.reactiveStore.getAllVariableNames();
      const variableExists = variableNames.includes(name);
      
      if (!variableExists) {
        return false;
      }
      
      // Additional check: verify the variable actually has the same value reference as our data
      try {
        const storedValue = reactiveContext.reactiveStore.getValue(name);
        const sameReference = storedValue === data;
        
        // If references don't match, this might be a copy or different object
        if (!sameReference) {
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn('PropertyGrid: Could not verify object reference:', error);
        return false;
      }
    } catch (error) {
      console.error('PropertyGrid: Error checking reactive editable:', error);
      return false;
    }
  }, [editable, name, reactiveContext, data]);

  // Subscribe to reactive value changes
  React.useEffect(() => {
    if (name && reactiveContext?.reactiveStore && isReactiveEditable) {
      try {
        const unsubscribe = reactiveContext.reactiveStore.subscribe(name, (newValue) => {
          setCurrentData(newValue);
        });
        
        // Get current value immediately
        const currentValue = reactiveContext.reactiveStore.getValue(name);
        if (currentValue !== undefined) {
          setCurrentData(currentValue);
        }
        
        return unsubscribe;
      } catch (error) {
        console.warn('PropertyGrid: Could not subscribe to reactive value:', error);
      }
    } else {
      // If not reactive, use the provided data
      setCurrentData(data);
    }
  }, [name, reactiveContext, isReactiveEditable, data]);

  const handleValueChange = useCallback((path: string[], newValue: any) => {
    if (onValueChange) {
      onValueChange(path, newValue);
      return;
    }

    // Default behavior: update reactive store if this is a reactive variable
    if (isReactiveEditable && name && reactiveContext?.reactiveStore) {
      try {
        // Deep clone the current data to avoid mutations
        const updatedData = JSON.parse(JSON.stringify(currentData));
        
        // Navigate to the property and update it
        let current = updatedData;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        current[path[path.length - 1]] = newValue;
        
        // Update the reactive store with the modified object
        reactiveContext.reactiveStore.define(name, updatedData);
        
      } catch (error) {
        console.error('Failed to update reactive value:', error);
      }
    }
  }, [onValueChange, isReactiveEditable, name, reactiveContext, currentData]);

  if (!currentData || (typeof currentData !== 'object') || currentData === null) {
    return (
      <div className="text-sm text-muted-foreground italic p-4">
        No properties to display
      </div>
    );
  }

  const propertyCount = Array.isArray(currentData) ? currentData.length : Object.keys(currentData).length;

  return (
    <div 
      className="property-grid border border-border rounded-lg overflow-hidden bg-background"
      onClick={(e) => {
        // Stop propagation to prevent cell selection when clicking inside PropertyGrid
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Also stop mouse down to prevent any drag operations
        e.stopPropagation();
      }}
    >
      {/* Header - only show for top level */}
      {level === 0 && (
        <div className="flex items-center justify-between py-2 px-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <span className="font-medium text-sm">
              {name ? `${name}` : 'Object'}
            </span>
            <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
              {propertyCount}
            </Badge>
            {isReactiveEditable && (
              <div title="Editable">
                <Pencil className="h-3 w-3 text-muted-foreground ml-1" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Properties Table */}
      {!isCollapsed && (
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-32" />
              <col />
            </colgroup>
            {/* Column Headers - only show for top level */}
            {level === 0 && (
              <thead>
                <tr className="border-b border-border">
                  <th className="py-1.5 px-2 bg-muted/40 text-left text-xs font-semibold text-muted-foreground border-r border-border/30">
                    Property
                  </th>
                  <th className="py-1.5 px-2 bg-muted/20 text-left text-xs font-semibold text-muted-foreground">
                    Value
                  </th>
                </tr>
              </thead>
            )}
            
            {/* Property Rows */}
            <tbody>
              {Array.isArray(currentData) ? (
                // Render array items
                currentData.map((item, index) => (
                  <PropertyRow
                    key={index}
                    propertyKey={`[${index}]`}
                    value={item}
                    path={[String(index)]}
                    onValueChange={handleValueChange}
                    isReactiveEditable={isReactiveEditable}
                    level={level}
                    maxDepth={maxDepth}
                  />
                ))
              ) : (
                // Render object properties
                Object.entries(currentData).map(([key, value]) => (
                  <PropertyRow
                    key={key}
                    propertyKey={key}
                    value={value}
                    path={[key]}
                    onValueChange={handleValueChange}
                    isReactiveEditable={isReactiveEditable}
                    level={level}
                    maxDepth={maxDepth}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PropertyGrid;
