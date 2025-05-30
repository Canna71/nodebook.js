import React, { JSX, useEffect, useRef, useState, useMemo } from 'react';
import ReactJson, { ThemeKeys, ThemeObject } from 'react-json-view';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  createColumnHelper,
} from '@tanstack/react-table';

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

// DataFrame renderer component using @tanstack/react-table
const DataFrameRenderer: React.FC<{ data: any; name?: string | false }> = ({ data, name }) => {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);

  // Prepare table data
  const { tableData, columns } = useMemo(() => {
    try {
      const shape = data.shape;
      const columnNames = data.columns;
      const values = data.values;
      
      setInfo({
        shape: shape,
        columns: columnNames,
        dtypes: data.dtypes
      });

      // Convert DataFrame to table format
      const tableData = values.map((row: any[], rowIndex: number) => {
        const rowData: any = { __index: rowIndex };
        columnNames.forEach((colName: string, colIndex: number) => {
          rowData[colName] = row[colIndex];
        });
        return rowData;
      });

      // Create column definitions
      const columnHelper = createColumnHelper<any>();
      const columns: ColumnDef<any>[] = [
        // Index column
        columnHelper.accessor('__index', {
          id: 'index',
          header: '',
          cell: (info) => (
            <div className="text-xs text-gray-500 font-mono text-right px-2">
              {String(info.getValue())}
            </div>
          ),
          size: 60,
        }),
        // Data columns
        ...columnNames.map((colName: string) =>
          columnHelper.accessor(colName, {
            id: colName,
            header: colName,
            cell: (info) => {
              const value = info.getValue();
              const displayValue = value === null || value === undefined ? 
                'null' : 
                typeof value === 'number' ? 
                  Number.isInteger(value) ? value.toString() : value.toFixed(3) :
                  String(value);
              
              return (
                <div className="text-sm font-mono px-2 text-right">
                  {displayValue}
                </div>
              );
            },
            size: 100,
          })
        ),
      ];

      return { tableData, columns };
    } catch (err) {
      console.error('Error preparing DataFrame table data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { tableData: [], columns: [] };
    }
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
    <div className="dataframe-display border border-blue-200 rounded-lg p-3 bg-blue-50">
      <div className="dataframe-header mb-3">
        <div className="text-sm font-medium text-blue-800 mb-1">
          {name && <span>{String(name)}: </span>}DataFrame
        </div>
        {info && (
          <div className="text-xs text-blue-600">
            Shape: {info.shape?.join('×')} | Columns: {info.columns?.length || 0}
          </div>
        )}
      </div>
      
      <div className="dataframe-table-container overflow-auto max-h-96 border border-gray-300 rounded bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.slice(0, 100).map((row, index) => (
              <tr 
                key={row.id} 
                className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="py-1 border-r border-gray-100 last:border-r-0"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {tableData.length > 100 && (
          <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-center text-xs text-gray-500">
            Showing first 100 of {tableData.length} rows
          </div>
        )}
      </div>
    </div>
  );
};

// Series renderer component using @tanstack/react-table
const SeriesRenderer: React.FC<{ data: any; name?: string | false }> = ({ data, name }) => {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);

  // Prepare table data
  const { tableData, columns } = useMemo(() => {
    try {
      const shape = data.shape;
      const values = data.values;
      const dtype = data.dtype;
      
      setInfo({
        shape: shape,
        length: values?.length || 0,
        dtype: dtype
      });

      // Convert Series to table format
      const tableData = values.map((value: any, index: number) => ({
        index,
        value
      }));

      // Create column definitions
      const columnHelper = createColumnHelper<{ index: number; value: any }>();
      const columns: ColumnDef<{ index: number; value: any }>[] = [
        columnHelper.accessor('index', {
          header: 'Index',
          cell: (info) => (
            <div className="text-xs text-gray-500 font-mono text-right px-2">
              {info.getValue()}
            </div>
          ),
          size: 80,
        }),
        columnHelper.accessor('value', {
          header: 'Value',
          cell: (info) => {
            const value = info.getValue();
            const displayValue = value === null || value === undefined ? 
              'null' : 
              typeof value === 'number' ? 
                Number.isInteger(value) ? value.toString() : value.toFixed(3) :
                String(value);
            
            return (
              <div className="text-sm font-mono px-2">
                {displayValue}
              </div>
            );
          },
          size: 120,
        }),
      ];

      return { tableData, columns };
    } catch (err) {
      console.error('Error preparing Series table data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return { tableData: [], columns: [] };
    }
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
    <div className="series-display border border-green-200 rounded-lg p-3 bg-green-50">
      <div className="series-header mb-3">
        <div className="text-sm font-medium text-green-800 mb-1">
          {name && <span>{String(name)}: </span>}Series
        </div>
        {info && (
          <div className="text-xs text-green-600">
            Length: {info.length} | Type: {info.dtype || 'unknown'}
          </div>
        )}
      </div>
      
      <div className="series-table-container overflow-auto max-h-80 border border-gray-300 rounded bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.slice(0, 50).map((row, index) => (
              <tr 
                key={row.id} 
                className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="py-1 border-r border-gray-100 last:border-r-0"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {tableData.length > 50 && (
          <div className="bg-gray-50 border-t border-gray-200 px-3 py-2 text-center text-xs text-gray-500">
            Showing first 50 of {tableData.length} rows
          </div>
        )}
      </div>
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
