import React, { JSX, useEffect, useRef, useState } from 'react';
import ReactJson, { ThemeKeys, ThemeObject } from 'react-json-view';

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
         (obj.constructor.name === 'DataFrame' || 
          obj.constructor.name === 'Series') &&
         typeof obj.plot === 'function' &&
         typeof obj.shape !== 'undefined';
};

const isDanfoSeries = (obj: any): boolean => {
  return obj && 
         typeof obj === 'object' && 
         obj.constructor && 
         obj.constructor.name === 'Series' &&
         typeof obj.values !== 'undefined';
};

// DataFrame renderer component
const DataFrameRenderer: React.FC<{ data: any; name?: string | false }> = ({ data, name }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Get DataFrame info
      const shape = data.shape;
      const columns = data.columns;
      const dtypes = data.dtypes;
      
      setInfo({
        shape: shape,
        columns: columns,
        dtypes: dtypes
      });

      // Create table plot
      if (typeof data.plot === 'function') {
        // Use Danfo.js plot method to create table
        data.plot(containerRef.current).table();
      } else {
        // Fallback: try to display basic info
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
          <div class="dataframe-info">
            <h4>DataFrame Info</h4>
            <p>Shape: ${shape}</p>
            <p>Columns: ${columns.join(', ')}</p>
          </div>
        `;
        containerRef.current.appendChild(infoDiv);
      }
    } catch (err) {
      console.error('Error rendering DataFrame:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [data]);

  if (error) {
    return (
      <div className="dataframe-error border border-red-200 rounded p-3 bg-red-50">
        <div className="text-sm font-medium text-red-800 mb-2">
          {name && <span>{String(name)}: </span>}DataFrame Rendering Error
        </div>
        <div className="text-xs text-red-600">{error}</div>
        <div className="mt-2">
          <ReactJson
            src={data}
            name={name}
            collapsed={true}
            displayDataTypes={false}
            displayObjectSize={false}
            theme="rjv-default"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dataframe-display border border-blue-200 rounded p-3 bg-blue-50">
      <div className="dataframe-header mb-2">
        <div className="text-sm font-medium text-blue-800">
          {name && <span>{String(name)}: </span>}DataFrame
        </div>
        {info && (
          <div className="text-xs text-blue-600">
            Shape: {info.shape?.join('×')} | Columns: {info.columns?.length || 0}
          </div>
        )}
      </div>
      <div 
        ref={containerRef}
        className="dataframe-content"
        style={{
          maxWidth: '100%',
          overflow: 'auto'
        }}
      />
    </div>
  );
};

// Series renderer component
const SeriesRenderer: React.FC<{ data: any; name?: string | false }> = ({ data, name }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Get Series info
      const shape = data.shape;
      const values = data.values;
      const dtype = data.dtype;
      
      setInfo({
        shape: shape,
        length: values?.length || 0,
        dtype: dtype
      });

      // Create a simple table for Series
      if (values && Array.isArray(values)) {
        const table = document.createElement('table');
        table.className = 'series-table';
        table.style.cssText = 'border-collapse: collapse; width: 100%; font-size: 12px;';
        
        // Header
        const headerRow = table.insertRow();
        headerRow.style.backgroundColor = '#f8f9fa';
        const indexHeader = headerRow.insertCell();
        indexHeader.textContent = 'Index';
        indexHeader.style.cssText = 'border: 1px solid #ddd; padding: 4px 8px; font-weight: bold;';
        const valueHeader = headerRow.insertCell();
        valueHeader.textContent = 'Value';
        valueHeader.style.cssText = 'border: 1px solid #ddd; padding: 4px 8px; font-weight: bold;';
        
        // Data rows (limit to first 10 for display)
        const displayValues = values.slice(0, 10);
        displayValues.forEach((value: any, index: number) => {
          const row = table.insertRow();
          const indexCell = row.insertCell();
          indexCell.textContent = String(index);
          indexCell.style.cssText = 'border: 1px solid #ddd; padding: 4px 8px; text-align: right;';
          const valueCell = row.insertCell();
          valueCell.textContent = String(value);
          valueCell.style.cssText = 'border: 1px solid #ddd; padding: 4px 8px;';
        });
        
        if (values.length > 10) {
          const row = table.insertRow();
          const cell = row.insertCell();
          cell.colSpan = 2;
          cell.textContent = `... and ${values.length - 10} more rows`;
          cell.style.cssText = 'border: 1px solid #ddd; padding: 4px 8px; text-align: center; font-style: italic;';
        }
        
        containerRef.current.appendChild(table);
      }
    } catch (err) {
      console.error('Error rendering Series:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [data]);

  if (error) {
    return (
      <div className="series-error border border-red-200 rounded p-3 bg-red-50">
        <div className="text-sm font-medium text-red-800 mb-2">
          {name && <span>{String(name)}: </span>}Series Rendering Error
        </div>
        <div className="text-xs text-red-600">{error}</div>
        <div className="mt-2">
          <ReactJson
            src={data}
            name={name}
            collapsed={true}
            displayDataTypes={false}
            displayObjectSize={false}
            theme="rjv-default"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="series-display border border-green-200 rounded p-3 bg-green-50">
      <div className="series-header mb-2">
        <div className="text-sm font-medium text-green-800">
          {name && <span>{String(name)}: </span>}Series
        </div>
        {info && (
          <div className="text-xs text-green-600">
            Length: {info.length} | Type: {info.dtype || 'unknown'}
          </div>
        )}
      </div>
      <div 
        ref={containerRef}
        className="series-content"
        style={{
          maxWidth: '100%',
          overflow: 'auto'
        }}
      />
    </div>
  );
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
    return <span className="text-gray-500 italic">null</span>;
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
    <div className="object-display border border-gray-200 rounded p-2 bg-gray-50">
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
