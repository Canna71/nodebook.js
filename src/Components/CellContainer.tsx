import React, { useState } from 'react';
import { CellDefinition } from '@/Types/NotebookModel';
import { 
    PencilIcon, 
    EyeIcon, 
    TrashIcon, 
    ChevronUpIcon, 
    ChevronDownIcon, 
} from '@heroicons/react/24/outline';
import { GripVerticalIcon } from 'lucide-react';

interface CellContainerProps {
    definition: CellDefinition;
    cellIndex: number;
    totalCells: number;
    isSelected: boolean;
    isEditMode: boolean;
    onSelect: () => void;
    onToggleEditMode: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    children: React.ReactNode;
    initialized: boolean;
}

export function CellContainer({
    definition,
    cellIndex,
    totalCells,
    isSelected,
    isEditMode,
    onSelect,
    onToggleEditMode,
    onDelete,
    onMoveUp,
    onMoveDown,
    children,
    initialized
}: CellContainerProps) {
    const [isHovered, setIsHovered] = useState(false);

    const getCellTypeLabel = (type: string): string => {
        switch (type) {
            case 'markdown': return 'MD';
            case 'code': return 'JS';
            case 'formula': return 'FX';
            case 'input': return 'IN';
            default: return type.toUpperCase();
        }
    };

    const getCellTypeColor = (type: string): string => {
        switch (type) {
            case 'markdown': return 'bg-accent text-accent-foreground';
            case 'code': return 'bg-primary text-primary-foreground';
            case 'formula': return 'bg-secondary text-secondary-foreground';
            case 'input': return 'bg-muted text-muted-foreground';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="cell-container-wrapper relative">
            {/* Floating Action Buttons - appear above the cell when focused/hovered */}
            {(isSelected || isHovered) && (
                <div className="absolute -top-2 right-0 z-10 flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1 shadow-lg">
                    {/* Move Up */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveUp();
                        }}
                        disabled={cellIndex === 0}
                        className="action-button p-1 rounded hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                        title="Move up"
                    >
                        <ChevronUpIcon className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveDown();
                        }}
                        disabled={cellIndex === totalCells - 1}
                        className="action-button p-1 rounded hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed text-foreground"
                        title="Move down"
                    >
                        <ChevronDownIcon className="w-4 h-4" />
                    </button>

                    {/* Drag Handle */}
                    <div className="drag-handle p-1 cursor-grab hover:bg-accent/20 rounded text-foreground" title="Drag to reorder">
                        <GripVerticalIcon className="w-4 h-4" />
                    </div>

                    {/* Edit/View Toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleEditMode();
                        }}
                        className="action-button p-1 rounded hover:bg-accent/20 text-foreground"
                        title={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}
                    >
                        {isEditMode ? (
                            <EyeIcon className="w-4 h-4" />
                        ) : (
                            <PencilIcon className="w-4 h-4" />
                        )}
                    </button>

                    {/* Delete */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="action-button p-1 rounded hover:bg-destructive/20 hover:text-destructive text-foreground"
                        title="Delete cell"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div
                className={`cell-container relative flex border rounded-lg transition-all duration-200 ${
                    isSelected 
                        ? 'border-accent shadow-lg bg-accent/10' 
                        : 'border-border hover:border-accent/50'
                } ${isHovered ? 'shadow-md' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onSelect}
            >
                {/* Left Cell Type Indicator */}
                <div className="cell-type-indicator flex flex-col items-center justify-center px-2 py-2 bg-background-secondary border-r border-border rounded-l-lg">
                    <div className={`cell-type-badge text-xs font-medium px-2 py-1 rounded ${getCellTypeColor(definition.type)}`}>
                        {getCellTypeLabel(definition.type)}
                    </div>
                    <div className="cell-number text-xs text-secondary-foreground font-mono mt-1">
                        {cellIndex + 1}
                    </div>
                    {isEditMode && (
                        <div className="edit-indicator text-xs bg-accent text-accent-foreground px-1 py-0.5 rounded mt-1">
                            ✏
                        </div>
                    )}
                </div>

                {/* Cell Content */}
                <div className="cell-content flex-1">
                    {children}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-lg" />
                )}
            </div>
        </div>
    );
}
