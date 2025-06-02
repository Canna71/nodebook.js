import React, { JSX, useEffect, useRef, useState, useMemo } from 'react';
import ReactJson, { ThemeKeys, ThemeObject } from 'react-json-view';

import SeriesRenderer from './SeriesRenderer';
import DataFrameRenderer from './DataFrameRenderer';

interface ObjectDisplayProps {
  data: any;
  name?: string | false;
  theme?: ThemeKeys | ThemeObject;
  collapsed?: boolean;
  displayDataTypes?: boolean;
  displayObjectSize?: boolean;
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
export const ObjectDisplay: React.FC<ObjectDisplayProps> = ({
  data,
  name = false as string | false,
  theme = 'monokai',
  collapsed = false,
  displayDataTypes = true,
  displayObjectSize = true
}) => {
  // Handle different data types
  if (data === null || data === undefined) {
    return <span className="text-primary italic">null</span>;
  }

  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return <span>{String(data)}</span>;
  }

  // Check for specific object types and use specialized renderers
  if (isDanfoDataFrame(data)) {
    return <DataFrameRenderer data={data} name={name} />;
  }

  if (isDanfoSeries(data)) {
    return <SeriesRenderer data={data} name={name} />;
  }

  // TODO: Add more specific renderers here for other object types
  // if (isTensorFlowTensor(data)) {
  //   return <TensorRenderer data={data} name={name} />;
  // }

  // Default fallback to ReactJson for generic objects and arrays
  return (
    <div className="object-display border border-border rounded p-2 bg-background-secondary">
      <ReactJson
        src={data}
        name={name}
        theme={theme}
        collapsed={collapsed}
        displayDataTypes={displayDataTypes}
        displayObjectSize={displayObjectSize}
        enableClipboard={true}
        indentWidth={2}
        iconStyle="triangle"
        style={{
          fontSize: '12px',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace'
        }}
      />
    </div>
  );
};

// Utility function to render object inline
export const renderObjectInline = (data: any): JSX.Element => {
  return <ObjectDisplay data={data} collapsed={true} displayDataTypes={false} />;
};
