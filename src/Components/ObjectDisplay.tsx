import React, { JSX } from 'react';
import ReactJson, { ThemeKeys, ThemeObject } from 'react-json-view';

interface ObjectDisplayProps {
  data: any;
  name?: string | false;
  theme?: ThemeKeys |  ThemeObject;
  collapsed?: boolean;
  displayDataTypes?: boolean;
  displayObjectSize?: boolean;
}

export const ObjectDisplay: React.FC<ObjectDisplayProps> = ({
  data,
  name = false as string | false,
  theme = 'rjv-default',
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

  // For objects and arrays, use react-json-view
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
