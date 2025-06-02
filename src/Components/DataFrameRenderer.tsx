import { createColumnHelper, ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { useState, useMemo } from "react";
import ReactJson from "react-json-view";

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
            <div className="text-xs text-primary-foreground font-mono text-right px-2">
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
      <div className="dataframe-error border border-border rounded p-3 bg-background-error">
        <div className="text-sm font-medium text-error mb-2">
          {name && <span>{String(name)}: </span>}DataFrame Rendering Error
        </div>
        <div className="text-xs text-error">{error}</div>
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
    <div className="dataframe-display border border-border rounded-lg p-3 bg-background">
      <div className="dataframe-header mb-3">
        <div className="text-sm font-medium text-primary-foreground mb-1">
          {name && <span>{String(name)}: </span>}DataFrame
        </div>
        {info && (
          <div className="text-xs text-primary-foreground">
            Shape: {info.shape?.join('×')} | Columns: {info.columns?.length || 0}
          </div>
        )}
      </div>
      
      <div className="dataframe-table-container overflow-auto max-h-96 border border-border rounded bg-background">
        <table className="w-full text-sm">
          <thead className="bg-background-secondary border-b border-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-primary-foreground uppercase tracking-wider border-r border-border last:border-r-0"
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
            {table.getRowModel().rows.slice(0, 100).map((row, index) => (
              <tr 
                key={row.id} 
                className={`hover:bg-background-hover ${index % 2 === 0 ? 'bg-background' : 'bg-background-secondary'}`}
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
        
        {tableData.length > 100 && (
          <div className="bg-background-secondary border-t border-border px-3 py-2 text-center text-xs text-primary-foreground">
            Showing first 100 of {tableData.length} rows
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFrameRenderer;