import { createColumnHelper, ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import ReactJson from "react-json-view";

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
          <tbody className="bg-background divide-y divide-border">
            {table.getRowModel().rows.slice(0, 50).map((row, index) => (
              <tr 
                key={row.id} 
                className={`hover:bg-background-secondary ${index % 2 === 0 ? 'bg-background' : 'bg-background-secondary'}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="py-1 border-r border-border last:border-r-0"
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
          <div className="bg-background border-t border-border px-3 py-2 text-center text-xs text-primary">
            Showing first 50 of {tableData.length} rows
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesRenderer;