import React, { useState } from 'react';
import { CellDefinition } from '@/Types/NotebookModel';
import { 
    PlusIcon,
    DocumentTextIcon,
    CodeBracketIcon,
    CalculatorIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';
import { Button } from './ui/button';

interface CellSeparatorProps {
    onAddCell: (cellType: CellDefinition['type'], insertIndex: number) => void;
    insertIndex: number;
    isFirst?: boolean;
    isLast?: boolean;
}

export function CellSeparator({ onAddCell, insertIndex, isFirst = false, isLast = false }: CellSeparatorProps) {
    const [isHovered, setIsHovered] = useState(false);

    const cellTypes = [
        {
            type: 'input' as const,
            label: 'Input',
            icon: PencilSquareIcon,
            description: 'Add an input field'
        },
        {
            type: 'code' as const,
            label: 'Code',
            icon: CodeBracketIcon,
            description: 'Add a code cell'
        },
        {
            type: 'formula' as const,
            label: 'Formula',
            icon: CalculatorIcon,
            description: 'Add a formula cell'
        },
        {
            type: 'markdown' as const,
            label: 'Markdown',
            icon: DocumentTextIcon,
            description: 'Add markdown content'
        }
    ];

    return (
        <div 
            className={`cell-separator relative ${isFirst ? 'pt-4' : 'py-4'} ${isLast ? 'pb-8' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(true)}
        >
            {/* Separator line */}
            <div className={`w-full h-px bg-border transition-all duration-200 ${
                isHovered ? 'bg-accent/50' : ''
            }`} />
            
            {/* Add buttons - appear on hover */}
            {isHovered && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1 shadow-lg">
                        <PlusIcon className="w-4 h-4 text-muted-foreground mr-1" />
                        {cellTypes.map((cellType) => {
                            const IconComponent = cellType.icon;
                            return (
                                <Button
                                    key={cellType.type}
                                    onClick={() => onAddCell(cellType.type, insertIndex)}
                                    variant="ghost" 
                                    size="sm"
                                    // className="h-auto px-2 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                                    title={cellType.description}
                                >
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    {cellType.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Invisible hover area to make it easier to trigger */}
            <div className="absolute inset-0 h-8 -mt-2" />
        </div>
    );
}
