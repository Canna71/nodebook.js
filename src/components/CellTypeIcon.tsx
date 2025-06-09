import React from 'react';
import { MarkdownIcon } from './icons/MarkdownIcon';
import { JavascriptIcon } from './icons/JavascriptIcon';
import { VariableIcon } from '@heroicons/react/24/outline';

interface CellTypeIconProps {
  type: string;
  className?: string;
}

export function CellTypeIcon({ type, className = "w-4 h-4" }: CellTypeIconProps) {
  switch (type) {
    case 'markdown':
      return <MarkdownIcon className={className} />;
    case 'code':
      return <JavascriptIcon className={className} />;
    case 'formula':
      return <span className={`font-bold text-current ${className.includes('w-') ? '' : 'text-base'}`}>𝒇𝑥</span>;
    case 'input':
      return <VariableIcon className={className} />;
    default:
      return <span className="font-semibold text-current">{type.toUpperCase()}</span>;
  }
}
