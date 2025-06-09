import React, { JSX, useEffect, useRef, useState, useMemo } from 'react';
import ReactJson, { ThemeKeys, ThemeObject } from 'react-json-view';

import SeriesRenderer from './SeriesRenderer';
import DataFrameRenderer from './DataFrameRenderer';

interface ObjectDisplayProps {
  data: any;
  name?: string | false; // Keep the original type
  theme?: ThemeKeys | ThemeObject;
  collapsed?: boolean;
  displayDataTypes?: boolean;
  displayObjectSize?: boolean;
  enableClipboard?: boolean;
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




// Main ObjectDisplay component
export function ObjectDisplay({ 
  data, 
  name = false, // Change default to false instead of true
  collapsed = false, 
  displayDataTypes = true, 
  displayObjectSize = true,
  enableClipboard = true,
  theme = 'tomorrow'
}: ObjectDisplayProps) {
  // Handle different data types
  if (data === null || data === undefined) {
    return <span className="text-foreground italic">null</span>;
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return <span>{String(data)}</span>;
  }

  // Check for specific object types and use specialized renderers
  if (isDanfoDataFrame(data)) {
    return <DataFrameRenderer data={data} name={typeof name === 'string' ? name : undefined} />;
  }

  if (isDanfoSeries(data)) {
    return <SeriesRenderer data={data} name={typeof name === 'string' ? name : undefined} />;
  }

  // TODO: Add more specific renderers here for other object types
  // if (isTensorFlowTensor(data)) {
  //   return <TensorRenderer data={data} name={typeof name === 'string' ? name : undefined} />;
  // }

  // Default fallback to ReactJson for generic objects and arrays
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
          theme={theme}
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
  return <ObjectDisplay data={data} collapsed={true} displayDataTypes={false} name={false} />;
};
