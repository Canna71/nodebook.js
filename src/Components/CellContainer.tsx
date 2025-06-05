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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayIcon } from '@heroicons/react/24/solid';
import { Button } from './ui/button';

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
    exports?: string[];
    onExecuteCode?: () => void;
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
    initialized,
    exports = [],
    onExecuteCode
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

    // Get cell type information including tooltip content
    const getCellTypeInfo = () => {
        switch (definition.type) {
            case 'input':
                const inputCell = definition;
                const effectiveVariableName = inputCell.variableName.trim() || `input-${inputCell.id}`;
                return {
                    icon: '📝',
                    label: 'Input',
                    tooltip: `Variable: ${effectiveVariableName}`
                };
            
            case 'code':
                return {
                    icon: '⚡',
                    label: 'Code',
                    tooltip: exports.length > 0 
                        ? `Exports: ${exports.join(', ')}` 
                        : 'No exports'
                };
            
            case 'formula':
                const formulaCell = definition;
                return {
                    icon: '🧮',
                    label: 'Formula',
                    tooltip: `Variable: ${formulaCell.variableName}\nFormula: ${formulaCell.formula}`
                };
            
            case 'markdown':
                return {
                    icon: '📄',
                    label: 'Markdown',
                    tooltip: 'Markdown content'
                };
            
            default:
                return {
                    icon: '❓',
                    label: 'Unknown',
                    tooltip: 'Unknown cell type'
                };
        }
    };

    const cellTypeInfo = getCellTypeInfo();
    
    return (
        <div 
            className="cell-container-wrapper relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                        : isHovered 
                            ? 'border-accent/50 shadow-md' 
                            : 'border-border'
                }`}
                onClick={onSelect}
            >
                {/* Left Cell Type Indicator */}
                <div className="cell-type-indicator flex flex-col items-center justify-start px-2 py-2 bg-background-secondary border-r border-border rounded-l-lg">
                    {/* Cell Type Badge with Tooltip */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={`cell-type-badge text-xs font-medium px-2 py-1 rounded cursor-help ${getCellTypeColor(definition.type)}`}>
                                    {getCellTypeLabel(definition.type)}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                                <div className="text-sm">
                                    <div className="font-medium">{cellTypeInfo.label} Cell</div>
                                    <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line">
                                        {cellTypeInfo.tooltip}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    
                    {/* Execute Button for Code Cells - NEW: moved here */}
                    {definition.type === 'code' && onExecuteCode && (
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onExecuteCode();
                            }}
                            variant="secondary" 
                            size="icon" 
                            className="size-8 execute-button p-1 mt-2 rounded bg-background border border-border hover:bg-accent/20 text-foreground transition-colors"
                            title="Execute cell"
                        >
                            <PlayIcon className="w-3 h-3" />
                        </Button>
                    )}
                    
                    {/* Drag Handle */}
                    <div 
                        className="drag-handle p-1 cursor-grab hover:bg-accent/20 rounded text-foreground mt-2" 
                        title="Drag to reorder"
                    >
                        <GripVerticalIcon className="w-4 h-4" />
                    </div>

                    {/* Edit Mode Indicator */}
                    {isEditMode && (
                        <div className="edit-indicator text-xs bg-accent text-accent-foreground px-1 py-0.5 rounded mt-2">
                            ✏
                        </div>
                    )}
                </div>

                {/* Cell Content */}
                <div className="cell-content flex-1 min-w-0">
                    {children}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-lg" />
                )}
            </div>

            {/* Invisible hover extension area to cover the floating toolbar */}
            {(isSelected || isHovered) && (
                <div 
                    className="absolute -top-4 right-0 w-64 h-8 z-0"
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </div>
    );
}
