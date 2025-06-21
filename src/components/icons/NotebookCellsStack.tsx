import React from 'react';

interface NotebookCellsStackProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const NotebookCellsStack: React.FC<NotebookCellsStackProps> = ({ size = 128, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 128 128"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    {/* Four overlapping translucent notebook cells, scaled up, with reduced corner radius */}
    <rect
      x="28"
      y="28"
      width="76"
      height="60"
      rx="10.5"
      fill="#74D2FF"
      fillOpacity="0.55"
      transform="rotate(-10 66 66)"
    />
    <rect
      x="35"
      y="38"
      width="70"
      height="52"
      rx="9.8"
      fill="#43B5F4"
      fillOpacity="0.55"
      transform="rotate(-4 70 70)"
    />
    <rect
      x="41"
      y="47"
      width="64"
      height="44"
      rx="9.1"
      fill="#1D8CE6"
      fillOpacity="0.55"
      transform="rotate(6 74 74)"
    />
    <rect
      x="48"
      y="56"
      width="56"
      height="36"
      rx="8.4"
      fill="#1061A9"
      fillOpacity="0.55"
      transform="rotate(12 78 78)"
    />
  </svg>
);

export default NotebookCellsStack;