import { createColumnHelper, ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { useState, useMemo, useCallback, useEffect } from "react";
import ReactJson from "react-json-view";
import { useReactiveSystem } from "@/Engine/ReactiveProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";

interface EditableCellProps {
  value: any;
  rowIndex: number;
  columnId: string;
  onValueChange: (rowIndex: number, columnId: string, value: any) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, rowIndex, columnId, onValueChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value ?? ''));

  const handleSave = () => {
    let parsedValue: any = editValue;
    
    // Try to parse as number if it looks like one
    if (editValue !== '' && !isNaN(Number(editValue))) {
      parsedValue = Number(editValue);
    }
    // Handle boolean values
    else if (editValue.toLowerCase() === 'true') {
      parsedValue = true;
    } else if (editValue.toLowerCase() === 'false') {
      parsedValue = false;
    } else if (editValue.toLowerCase() === 'null') {
      parsedValue = null;
    }
    
    onValueChange(rowIndex, columnId, parsedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(String(value ?? ''));
    setIsEditing(false);
  };

  const displayValue = value === null || value === undefined ? 
    'null' : 
    typeof value === 'number' ? 
      Number.isInteger(value) ? value.toString() : value.toFixed(3) :
      String(value);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="text-sm font-mono h-6 px-1"
          autoFocus
          onBlur={handleSave}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-4 p-0"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-4 p-0"
          onClick={handleCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="text-sm font-mono px-2 text-right cursor-pointer hover:bg-muted group flex items-center justify-between"
      onClick={() => setIsEditing(true)}
    >
      <span>{displayValue}</span>
      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
    </div>
  );
};

interface DataFrameData {
  shape: [number, number];
  columns: string[];
  values: any[][];
  dtypes: any;
}

// DataFrame renderer component using @tanstack/react-table with editing capabilities
const DataFrameRenderer: React.FC<{ 
  data: any; 
  name?: string | false;
  editable?: boolean;
}> = ({ data, name, editable = true }) => {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [isModified, setIsModified] = useState(false);
  const { reactiveStore } = useReactiveSystem();

  // Only allow editing if we have a valid variable name
  const canEdit = editable && name && typeof name === 'string';

  // Create a mutable copy of the data for editing
  const [localData, setLocalData] = useState<DataFrameData>(() => {
    try {
      return {
        shape: data.shape,
        columns: [...data.columns],
        values: data.values.map((row: any[]) => [...row]),
        dtypes: data.dtypes
      };
    } catch (err) {
      return data;
    }
  });

  // Handle value changes
  const handleValueChange = useCallback((rowIndex: number, columnId: string, newValue: any) => {
    setLocalData((prev: DataFrameData): DataFrameData => {
      const newData: DataFrameData = {
        ...prev,
        values: prev.values.map((row: any[], idx: number) => {
          if (idx === rowIndex) {
            const colIndex = prev.columns.indexOf(columnId);
            if (colIndex !== -1) {
              const newRow = [...row];
              newRow[colIndex] = newValue;
              return newRow;
            }
          }
          return row;
        })
      };
      
      setIsModified(true);
      return newData;
    });
  }, []);

  // Add new row
  const handleAddRow = useCallback(() => {
    setLocalData((prev: DataFrameData): DataFrameData => {
      const newRow = prev.columns.map((): any => null);
      const newData: DataFrameData = {
        ...prev,
        values: [...prev.values, newRow],
        shape: [prev.shape[0] + 1, prev.shape[1]]
      };
      setIsModified(true);
      return newData;
    });
  }, []);

  // Delete row
  const handleDeleteRow = useCallback((rowIndex: number) => {
    setLocalData((prev: DataFrameData): DataFrameData => {
      const newData: DataFrameData = {
        ...prev,
        values: prev.values.filter((_: any, idx: number) => idx !== rowIndex),
        shape: [prev.shape[0] - 1, prev.shape[1]]
      };
      setIsModified(true);
      return newData;
    });
  }, []);

  // Save changes back to reactive system
  const handleSaveChanges = useCallback(async () => {
    if (!canEdit) {
      console.warn('Cannot save DataFrame changes: editing not enabled or no variable name provided');
      return;
    }

    try {
      // Import danfojs to create new DataFrame
      const dfd = (globalThis as any).require?.('danfojs');
      if (!dfd) {
        throw new Error('danfojs not available');
      }

      // Convert back to danfojs format
      const dataObject: { [key: string]: any[] } = {};
      localData.columns.forEach((colName: string, colIndex: number) => {
        dataObject[colName] = localData.values.map((row: any[]) => row[colIndex]);
      });

      // Create new DataFrame (immutable)
      const newDataFrame = new dfd.DataFrame(dataObject);
      
      // Update the reactive value
      const reactiveValue = reactiveStore.get(name as string);
      if (reactiveValue) {
        reactiveValue.setValue(newDataFrame);
      } else {
        reactiveStore.define(name as string, newDataFrame);
      }

      setIsModified(false);
      console.log(`DataFrame "${name}" updated successfully`);
    } catch (err) {
      console.error('Error saving DataFrame changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    }
  }, [localData, name, reactiveStore, canEdit]);

  // Reset changes
  const handleResetChanges = useCallback(() => {
    setLocalData({
      shape: data.shape,
      columns: [...data.columns],
      values: data.values.map((row: any[]) => [...row]),
      dtypes: data.dtypes
    });
    setIsModified(false);
  }, [data]);

  // Prepare table data
  const { tableData, columns } = useMemo(() => {
    try {
      const shape = localData.shape;
      const columnNames = localData.columns;
      const values = localData.values;
      
      setInfo({
        shape: shape,
        columns: columnNames,
        dtypes: localData.dtypes
      });

      // Convert DataFrame to table format
      const tableData = values.map((row: any[], rowIndex: number) => {
        const rowData: any = { __index: rowIndex, __originalIndex: rowIndex };
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
            <div className="text-xs text-foreground font-mono text-right px-2 flex items-center justify-between">
              <span>{String(info.getValue())}</span>
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRow(info.getValue() as number);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ),
          size: canEdit ? 80 : 60,
        }),
        // Data columns
        ...columnNames.map((colName: string) =>
          columnHelper.accessor(colName, {
            id: colName,
            header: colName,
            cell: (info) => {
              if (!canEdit) {
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
              }

              return (
                <EditableCell
                  value={info.getValue()}
                  rowIndex={info.row.original.__originalIndex}
                  columnId={colName}
                  onValueChange={handleValueChange}
                />
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
  }, [localData, canEdit, handleValueChange, handleDeleteRow]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) {
    return (
      <div className="dataframe-error border border-border rounded p-3 bg-card">
        <div className="text-sm font-medium text-destructive mb-2">
          {name && <span>{String(name)}: </span>}DataFrame Rendering Error
        </div>
        <div className="text-xs text-destructive">{error}</div>
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
        <div className="text-sm font-medium text-foreground mb-1">
          {name && <span>{String(name)}: </span>}DataFrame
        </div>
        {info && (
          <div className="text-xs text-muted-foreground">
            Shape: {info.shape?.join('×')} | Columns: {info.columns?.length || 0}
          </div>
        )}
        
        {canEdit && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddRow}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </Button>
            
            {isModified && (
              <>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  className="text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetChanges}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </>
            )}
          </div>
        )}

        {!canEdit && editable && (
          <div className="text-xs text-muted-foreground mt-2">
            💡 Tip: Assign this DataFrame to a variable (e.g., <code className="bg-muted px-1 rounded">exports.myData = df</code>) to enable editing
          </div>
        )}
      </div>
      
      <div className="dataframe-table-container overflow-auto max-h-96 border border-border rounded bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-foreground uppercase tracking-wider border-r border-border last:border-r-0"
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
                className={`hover:bg-muted ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}`}
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
          <div className="bg-muted border-t border-border px-3 py-2 text-center text-xs text-muted-foreground">
            Showing first 100 of {tableData.length} rows
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFrameRenderer;