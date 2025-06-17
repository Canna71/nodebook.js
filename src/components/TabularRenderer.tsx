import React from 'react';
import { ObjectDisplay } from './ObjectDisplay';

interface TabularRendererProps {
  data: any[];
  name?: string | false;
  className?: string;
  mode?: 'table' | 'array'; // table = multi-column table, array = single-column array display
}

export function TabularRenderer({ data, name = false, className, mode = 'table' }: TabularRendererProps) {
  // Early return if data is not an array or is empty
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="tabular-renderer p-4 text-center text-muted-foreground">
        {name !== false && <div className="text-sm font-medium mb-2">{name}</div>}
        <div>No data to display</div>
      </div>
    );
  }

  // Array mode: single column display for each array item
  if (mode === 'array') {
    return (
      <div className={`tabular-renderer ${className || ''}`}>
        {name !== false && (
          <div className="table-header p-2 bg-muted/30 border-b border-border">
            <div className="text-sm font-medium text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">
              {data.length} item{data.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
        
        <div className="table-container overflow-auto max-h-96 border border-border rounded bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border sticky top-0">
              <tr>
                {/* Index column */}
                <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground border-r border-border w-16">
                  #
                </th>
                {/* Value column */}
                <th className="px-3 py-2 text-left text-xs font-medium text-foreground">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {data.map((item, index) => (
                <tr 
                  key={index} 
                  className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  {/* Index */}
                  <td className="px-2 py-2 text-xs text-muted-foreground font-mono border-r border-border">
                    {index}
                  </td>
                  {/* Value */}
                  <td className="px-3 py-2 align-top">
                    <div className="max-w-2xl overflow-hidden">
                      <ObjectDisplay
                        data={item}
                        name={false}
                        collapsed={true}
                        displayDataTypes={false}
                        displayObjectSize={false}
                        enableClipboard={false}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Table mode: multi-column table for objects

  // Extract all unique field names from all objects
  const allFields = new Set<string>();
  data.forEach(item => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach(key => allFields.add(key));
    }
  });

  const fields = Array.from(allFields);

  // If no fields found, show error
  if (fields.length === 0) {
    return (
      <div className="tabular-renderer p-4 text-center text-muted-foreground">
        {name !== false && <div className="text-sm font-medium mb-2">{name}</div>}
        <div>No object properties to display</div>
      </div>
    );
  }

  return (
    <div className={`tabular-renderer ${className || ''}`}>
      {name !== false && (
        <div className="table-header p-2 bg-muted/30 border-b border-border">
          <div className="text-sm font-medium text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">
            {data.length} row{data.length !== 1 ? 's' : ''} × {fields.length} column{fields.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
      
      <div className="table-container overflow-auto max-h-96 border border-border rounded bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border sticky top-0">
            <tr>
              {/* Row index column */}
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground border-r border-border w-16">
                #
              </th>
              {/* Field columns */}
              {fields.map(field => (
                <th
                  key={field}
                  className="px-3 py-2 text-left text-xs font-medium text-foreground border-r border-border last:border-r-0 min-w-32"
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className={`hover:bg-muted/50 ${rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
              >
                {/* Row index */}
                <td className="px-2 py-2 text-xs text-muted-foreground font-mono border-r border-border">
                  {rowIndex}
                </td>
                {/* Field values */}
                {fields.map(field => {
                  const value = row && typeof row === 'object' ? row[field] : undefined;
                  return (
                    <td
                      key={field}
                      className="px-3 py-2 border-r border-border last:border-r-0 align-top"
                    >
                      <div className="max-w-xs overflow-hidden">
                        {value !== undefined ? (
                          <ObjectDisplay
                            data={value}
                            name={false}
                            collapsed={true}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            enableClipboard={false}
                          />
                        ) : (
                          <span className="text-muted-foreground italic text-xs">undefined</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
