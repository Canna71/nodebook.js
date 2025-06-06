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

    const handleAddCell = (cellType: CellDefinition['type']) => {
        console.log(`CellSeparator: Adding ${cellType} cell at index ${insertIndex}`);
        try {
            onAddCell(cellType, insertIndex);
        } catch (error) {
            console.error('Error adding cell:', error);
        }
    };

    return (
        <div 
            className={`cell-separator relative ${isFirst ? 'pt-4' : 'py-4'} ${isLast ? 'pb-8' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)} // Fix this back to false for production
        >
            {/* Invisible hover area to make it easier to trigger - MOVE THIS FIRST and add pointer-events-none */}
            <div className="absolute inset-0 h-8 -mt-2 pointer-events-none" />
            
            {/* Separator line */}
            <div className={`w-full h-px bg-border transition-all duration-200 ${
                isHovered ? 'bg-accent/50' : ''
            }`} />
            
            {/* Add buttons - appear on hover - HIGHER Z-INDEX */}
            {isHovered && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1 shadow-lg">
                        <PlusIcon className="w-4 h-4 text-muted-foreground mr-1" />
                        {cellTypes.map((cellType) => {
                            const IconComponent = cellType.icon;
                            return (
                                <Button
                                    key={cellType.type}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log(`Button clicked: ${cellType.type}`);
                                        handleAddCell(cellType.type);
                                    }}
                                    variant="ghost" 
                                    size="sm"
                                    title={cellType.description}
                                    className="text-xs"
                                >
                                    <IconComponent className="w-3 h-3 mr-1" />
                                    {cellType.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
