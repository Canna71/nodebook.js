import React, { useState } from 'react';
import { CellDefinition } from '@/Types/NotebookModel';
import { useApplication } from '@/Engine/ApplicationProvider';
import { 
    PencilIcon, 
    EyeIcon, 
    TrashIcon, 
    ChevronUpIcon, 
    ChevronDownIcon 
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
        <div
            className={`cell-container relative border rounded-lg transition-all duration-200 ${
                isSelected 
                    ? 'border-accent shadow-lg bg-accent/10' 
                    : 'border-border hover:border-accent/50'
            } ${isHovered ? 'shadow-md' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onSelect}
        >
            {/* Cell Header */}
            <div className={`cell-header flex items-center justify-between px-3 py-2 border-b border-border bg-background-secondary rounded-t-lg ${
                isSelected ? 'bg-accent/20' : ''
            }`}>
                <div className="flex items-center gap-3">
                    {/* Cell Type Badge */}
                    <span className={`cell-type-badge text-xs font-medium px-2 py-1 rounded ${getCellTypeColor(definition.type)}`}>
                        {getCellTypeLabel(definition.type)}
                    </span>
                    
                    {/* Cell Number */}
                    <span className="cell-number text-sm text-secondary-foreground font-mono">
                        [{cellIndex + 1}]
                    </span>
                    
                    {/* Cell ID (if selected) */}
                    {isSelected && (
                        <span className="cell-id text-xs text-secondary-foreground font-mono bg-background px-2 py-1 rounded">
                            {definition.id}
                        </span>
                    )}

                    {/* Edit Mode Indicator */}
                    {isEditMode && (
                        <span className="edit-indicator text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                            EDIT
                        </span>
                    )}
                </div>

                {/* Cell Actions */}
                <div className={`cell-actions flex items-center gap-1 transition-opacity ${
                    isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
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
            </div>

            {/* Cell Content */}
            <div className="cell-content">
                {children}
            </div>

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-lg" />
            )}
        </div>
    );
}
