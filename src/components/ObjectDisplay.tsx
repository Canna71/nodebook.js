import React, { JSX, useEffect, useRef, useState, useMemo } from 'react';
import ReactJson, { ThemeKeys, ThemeObject } from 'react-json-view';

import SeriesRenderer from './SeriesRenderer';
import DataFrameRenderer from './DataFrameRenderer';
import { TabularRenderer } from './TabularRenderer';
import PropertyGrid from './PropertyGrid';
import { useReactiveSystem } from '../Engine/ReactiveProvider';
import { LatexRenderer, isLatexContent, renderMixedContent } from './LatexRenderer';
import { useTheme, getReactJsonTheme } from '@/lib/themeHelpers';


interface ObjectDisplayProps {
  data: any;
  name?: string | false; // Keep the original type
  theme?: ThemeKeys | ThemeObject;
  collapsed?: boolean;
  displayDataTypes?: boolean;
  displayObjectSize?: boolean;
  enableClipboard?: boolean;
  usePropertyGrid?: boolean; // New option to use PropertyGrid instead of ReactJson
}

// Type detection functions
const isDanfoDataFrame = (obj: any): boolean => {
  return obj && 
         typeof obj === 'object' && 
         obj.constructor && 
         obj.constructor.name === 'DataFrame' &&
         typeof obj.shape !== 'undefined' &&
         typeof obj.columns !== 'undefined';
};

const isDanfoSeries = (obj: any): boolean => {
  return obj && 
         typeof obj === 'object' && 
         obj.constructor && 
         obj.constructor.name === 'Series' &&
         typeof obj.values !== 'undefined';
};

// Check if data is marked as forced tabular output
const isForcedTabularOutput = (obj: any): boolean => {
  return obj && 
         typeof obj === 'object' && 
         obj.__isTabularOutput === true &&
         Array.isArray(obj.data);
};


// Main ObjectDisplay component
export function ObjectDisplay({ 
  data, 
  name = false, // Change default to false instead of true
  collapsed = false, 
  displayDataTypes = true, 
  displayObjectSize = true,
  enableClipboard = true,
  usePropertyGrid = true, // Default to using PropertyGrid
  theme
}: ObjectDisplayProps) {
  const reactiveContext = useReactiveSystem();
  const [showPropertyGrid, setShowPropertyGrid] = useState(usePropertyGrid);
  
  // Use centralized theme detection
  const currentTheme = useTheme();
  
  // Determine theme - use provided theme or auto-detect based on current mode
  const effectiveTheme = theme || getReactJsonTheme();

  // Reverse lookup function to find variable name by object reference
  const findVariableNameByReference = useMemo(() => {
    if (name !== false || !reactiveContext?.reactiveStore) {
      return undefined;
    }

    try {
      const allVariableNames = reactiveContext.reactiveStore.getAllVariableNames();
      
      for (const variableName of allVariableNames) {
        try {
          const variableValue = reactiveContext.reactiveStore.getValue(variableName);
          // Use strict equality to check if it's the same object reference
          if (variableValue === data) {
            return variableName;
          }
        } catch (error) {
          // Skip variables that can't be accessed
          continue;
        }
      }
    } catch (error) {
      // If there's any error in the lookup process, just return undefined
      console.warn('ObjectDisplay: Error during reverse variable lookup:', error);
    }

    return undefined;
  }, [name, data, reactiveContext]);

  // Determine the effective name to pass to specialized renderers
  const effectiveName = name !== false ? name : findVariableNameByReference;

  // Handle different data types
  if (data === null || data === undefined) {
    return <span className="text-foreground italic">null</span>;
  }

  if (typeof data === 'string') {
    // Check if string contains LaTeX content
    if (isLatexContent(data)) {
      return (
        <div className="latex-string-output">
          {renderMixedContent(data)}
        </div>
      );
    }
    return <span className="whitespace-pre-wrap">{data}</span>;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return <span>{String(data)}</span>;
  }

  // Check for specific object types and use specialized renderers
  if (isDanfoDataFrame(data)) {
    return <DataFrameRenderer data={data} name={effectiveName} editable={true} />;
  }

  if (isDanfoSeries(data)) {
    return <SeriesRenderer data={data} name={effectiveName} />;
  }

  // Check for forced tabular output first (from output.table())
  if (isForcedTabularOutput(data)) {
    return <TabularRenderer data={data.data} name={effectiveName} mode="table" />;
  }

  // Check for arrays - render as single column table
  if (Array.isArray(data)) {
    return <TabularRenderer data={data} name={effectiveName} mode="array" />;
  }

  // TODO: Add more specific renderers here for other object types
  // if (isTensorFlowTensor(data)) {
  //   return <TensorRenderer data={data} name={typeof name === 'string' ? name : undefined} />;
  // }

  // Check if we should use PropertyGrid for generic objects
  if (showPropertyGrid && typeof data === 'object' && data !== null) {
    return (
      <div 
        className="object-display-wrapper"
        onClick={(e) => {
          // Stop propagation to prevent cell selection when clicking inside PropertyGrid
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Also stop mouse down to prevent any drag operations
          e.stopPropagation();
        }}
      >
        <PropertyGrid
          data={data}
          name={typeof name === 'string' ? name : effectiveName}
          editable={true}
          collapsed={collapsed}
          maxDepth={3}
        />
      </div>
    );
  }

  // Fallback to ReactJson for when PropertyGrid is disabled or for primitive values
  return (
    <div className="object-display">
      <div 
        className="json-view-container relative z-20" 
        onClick={(e) => {
          // Stop propagation to prevent cell selection when clicking inside JSON view
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          // Also stop mouse down to prevent any drag operations
          e.stopPropagation();
        }}
      >
        <ReactJson
          src={data}
          name={name} // Pass through as-is since it's already string | false
          collapsed={collapsed}
          displayDataTypes={displayDataTypes}
          displayObjectSize={displayObjectSize}
          enableClipboard={enableClipboard}
          theme={effectiveTheme}
          style={{
            backgroundColor: 'transparent',
            fontSize: '13px',
            fontFamily: 'monospace',
            // Ensure proper pointer events
            pointerEvents: 'all',
            // Add relative positioning to establish stacking context
            position: 'relative',
            zIndex: 1
          }}
          // Additional props to ensure interactivity
          iconStyle="triangle"
          indentWidth={2}
          collapseStringsAfterLength={100}
          shouldCollapse={(field) => {
            // Custom collapse logic if needed
            return false;
          }}
        />
      </div>
    </div>
  );
};

// Utility function to render object inline
export const renderObjectInline = (data: any): JSX.Element => {
  return <ObjectDisplay data={data} collapsed={true} displayDataTypes={false} name={false} usePropertyGrid={false} />;
};

// Utility function to render object with PropertyGrid
export const renderObjectAsPropertyGrid = (data: any, name?: string): JSX.Element => {
  return <ObjectDisplay data={data} name={name} usePropertyGrid={true} />;
};

// Utility function to render object with ReactJson (legacy)
export const renderObjectAsJson = (data: any, name?: string): JSX.Element => {
  return <ObjectDisplay data={data} name={name} usePropertyGrid={false} />;
};
