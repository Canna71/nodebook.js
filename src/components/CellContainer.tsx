import React, { JSX, useState, useEffect, useRef } from 'react';
import { CellDefinition } from '@/Types/NotebookModel';
import { 
    PencilIcon, 
    EyeIcon, 
    TrashIcon, 
    ChevronUpIcon, 
    ChevronDownIcon,
    DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { CodeIcon, GripVertical, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlayIcon } from '@heroicons/react/24/solid';
import { Button } from './ui/button';
import { CellTypeIcon } from './CellTypeIcon';
import { useReactiveValue } from '@/Engine/ReactiveProvider';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CellContainerProps {
    definition: CellDefinition;
    cellIndex: number;
    totalCells: number;
    isSelected: boolean;
    isEditMode: boolean;
    onSelect: () => void;
    onToggleEditMode: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
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
    exports,
    onExecuteCode,
    onSelect,
    onToggleEditMode,
    onDelete,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    initialized,
    children
}: CellContainerProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
    
    // Track execution state for code cells
    const [executionState] = useReactiveValue(`__cell_${definition.id}_state`, 'idle');
    const isExecuting = definition.type === 'code' && executionState === 'running';
    
    // Drag and drop functionality
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: definition.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    // Refs for tracking play button position
    const cellContainerRef = useRef<HTMLDivElement>(null);
    const playButtonRef = useRef<HTMLButtonElement>(null);
    const [playButtonTop, setPlayButtonTop] = useState<number | null>(null);
    const [playButtonLeft, setPlayButtonLeft] = useState<number | null>(null);
    const [showFloatingButton, setShowFloatingButton] = useState(false);// VSCode-style floating play button logic
    useEffect(() => {
        if (definition.type !== 'code' || !onExecuteCode) return;        const handleScroll = () => {
            if (!cellContainerRef.current) return;

            const cellRect = cellContainerRef.current.getBoundingClientRect();
            const toolbarHeight = 48; // h-12 = 48px
            const buttonHeight = 24; // w-6 h-6 = 24px
            const minTop = toolbarHeight + 8; // 8px margin below toolbar
            
            // Check if cell is partially visible and scrolled
            const cellTop = cellRect.top;
            const cellBottom = cellRect.bottom;
            const cellLeft = cellRect.left;
            
            // Show floating button when:
            // 1. Cell top is above the toolbar (scrolled up)
            // 2. Cell bottom is still below the minimum position (cell is tall enough)
            const shouldShowFloating = cellTop < minTop && cellBottom > minTop + buttonHeight + 20;            if (shouldShowFloating) {
                // Calculate the optimal position within the cell bounds
                const maxTop = Math.min(cellBottom - buttonHeight - 8, window.innerHeight - buttonHeight - 8);
                
                // Account for cell type indicator height when positioning at the top
                // Cell type indicator has: py-1.5 (6px) + badge height (~20px) + py-1.5 (6px) = ~32px
                const typeIndicatorHeight = 32;
                const minTopWithIndicator = minTop + typeIndicatorHeight + 4; // 4px additional margin
                
                const calculatedTop = Math.max(minTopWithIndicator, Math.min(minTop, maxTop));
                
                // Calculate left position to align with the cell type indicator center
                // Position it within the cell type indicator area, similar to the normal button
                const calculatedLeft = cellLeft + 8; // 8px from cell edge, inside the type indicator
                
                setPlayButtonTop(calculatedTop);
                setPlayButtonLeft(calculatedLeft);
                setShowFloatingButton(true);
            } else {
                setShowFloatingButton(false);
                setPlayButtonTop(null);
                setPlayButtonLeft(null);
            }
        };

        // Initial check
        handleScroll();

        // Add scroll listener
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [definition.type, onExecuteCode]);

    // Add escape key listener for edit mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle escape if this cell is in edit mode
            if (isEditMode && e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                onToggleEditMode(); // Exit edit mode
            }
        };

        // Add event listener when in edit mode
        if (isEditMode) {
            document.addEventListener('keydown', handleKeyDown);
        }

        // Cleanup event listener
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isEditMode, onToggleEditMode]);

    // Cleanup click timeout on unmount
    useEffect(() => {
        return () => {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
            }
        };
    }, [clickTimeout]);

    const handleClick = (e: React.MouseEvent) => {
        // Only select cell if clicking on the container itself, not on interactive elements
        const target = e.target as HTMLElement;
        const isInteractiveElement = target.closest('.json-view-container, .cm-editor, input, button, select, textarea, [role="button"]');
        
        if (!isInteractiveElement) {
            // Clear any existing timeout
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                setClickTimeout(null);
            }
            
            // Set a timeout to handle the click
            const timeout = setTimeout(() => {
                onSelect();
                setClickTimeout(null);
            }, 200); // 200ms delay to allow for double-click detection
            
            setClickTimeout(timeout);
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        // Clear the single click timeout
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            setClickTimeout(null);
        }
        
        // Double-click to enter edit mode (if not already in edit mode)
        const target = e.target as HTMLElement;
        const isInteractiveElement = target.closest('.json-view-container, .cm-editor, input, button, select, textarea, [role="button"]');
        
        if (!isInteractiveElement && !isEditMode) {
            e.preventDefault();
            e.stopPropagation();
            onToggleEditMode(); // Enter edit mode
        }
    };

    const getCellTypeColor = (type: string): string => {
        switch (type) {
            case 'markdown': return 'bg-primary text-primary-foreground';
            case 'code': return 'bg-primary text-primary-foreground';
            case 'formula': return 'bg-primary text-primary-foreground';
            case 'input': return 'bg-primary text-primary-foreground';
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
                    tooltip: exports && exports.length > 0 
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
            ref={setNodeRef}
            style={style}
            className={`cell-container-wrapper relative ${isDragging ? 'opacity-50' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Floating Action Buttons - moved left to avoid overlap with grip */}
            {(isSelected || isHovered) && (
                <div className="absolute -top-2 right-10 z-10 flex items-center gap-1 bg-background border border-border rounded-lg px-2 py-1 shadow-lg">
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

                    {/* Duplicate */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate();
                        }}
                        className="action-button p-1 rounded hover:bg-accent/20 text-foreground"
                        title="Duplicate cell"
                    >
                        <DocumentDuplicateIcon className="w-4 h-4" />
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
            )}            <div
                ref={cellContainerRef}
                className={`cell-container relative flex border rounded-lg transition-all duration-200 ml-1 border-l-4 ${
                    isSelected 
                        ? 'border-accent shadow-lg bg-accent/10 selected !border-l-primary' 
                        : isHovered 
                            ? 'border-accent/50 shadow-md border-l-transparent' 
                            : 'border-border border-l-transparent'
                } ${isEditMode ? 'edit-mode' : ''}`}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
            >                {/* Left Cell Type Indicator - always takes up space, visibility controlled by opacity */}
                <div className={`cell-type-indicator flex flex-col items-center justify-start px-1 py-1.5 bg-background-secondary border-r border-border rounded-l-lg transition-opacity duration-200 ${
                    isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                }`}>                    {/* Cell Type Badge with Tooltip */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={`cell-type-badge text-xs font-medium px-0.5 py-0.5 rounded cursor-help ${getCellTypeColor(definition.type)}`}>
                                    <CellTypeIcon type={definition.type} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                                <div className="text-sm">
                                    <div className="font-medium">{cellTypeInfo.label} Cell</div>
                                    <div className="text-xs mt-1 whitespace-pre-line">
                                        {cellTypeInfo.tooltip}
                                    </div>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    
                    {/* Smart Execute Button for Code Cells */}
                    {definition.type === 'code' && onExecuteCode && (
                        <>
                            {/* Normal position button (hidden when floating) */}
                            {!showFloatingButton && (
                                <Button
                                    ref={playButtonRef}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isExecuting) {
                                            onExecuteCode();
                                        }
                                    }}
                                    variant="secondary" 
                                    size="sm" 
                                    className="w-6 h-6 execute-button p-1 mt-1.5 rounded bg-background border border-border hover:bg-accent/20 text-foreground transition-colors"
                                    title={isExecuting ? "Executing..." : "Execute cell"}
                                    disabled={isExecuting}
                                >
                                    {isExecuting ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                        <PlayIcon className="w-2.5 h-2.5" />
                                    )}
                                </Button>
                            )}
                            
                            {/* Placeholder to maintain layout when floating */}
                            {showFloatingButton && (
                                <div className="w-6 h-6 p-1 mt-1.5 rounded opacity-0 pointer-events-none" />
                            )}
                            
                            {/* Floating position button (portal to fixed position) */}
                            {showFloatingButton && playButtonTop !== null && playButtonLeft !== null && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isExecuting) {
                                            onExecuteCode();
                                        }
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    className="fixed z-50 shadow-lg border-2 backdrop-blur-sm bg-background/95 hover:bg-accent/20 transition-all duration-200"
                                    style={{
                                        top: `${playButtonTop}px`,
                                        left: `${playButtonLeft}px`,
                                        width: '24px',
                                        height: '24px',
                                        minWidth: '24px',
                                        minHeight: '24px',
                                        padding: '4px'
                                    }}
                                    title={isExecuting ? "Executing..." : "Execute cell"}
                                    disabled={isExecuting}
                                >
                                    {isExecuting ? (
                                        <Loader2 className="w-2.5 h-2.5 flex-shrink-0 animate-spin" />
                                    ) : (
                                        <PlayIcon className="w-2.5 h-2.5 flex-shrink-0" />
                                    )}
                                </Button>
                            )}
                        </>
                    )}
                </div>

                {/* Main cell content area - flex-1 to take remaining space */}
                <div className="cell-content flex-1">
                    {children}
                </div>

                {/* Right grip container - always takes up space, visibility controlled by opacity */}
                <div className={`cell-grip-indicator flex items-center justify-center px-1 py-2 bg-background-secondary border-l border-border rounded-r-lg transition-opacity duration-200 ${
                    isSelected || isHovered ? 'opacity-100' : 'opacity-0'
                }`}>
                    <Button
                        {...attributes}
                        {...listeners}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                    >
                        <GripVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Invisible hover extension area to cover the floating toolbar - adjusted position */}
            {(isSelected || isHovered) && (
                <div 
                    className="absolute -top-4 right-8 w-64 h-8 z-0"
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </div>
    );
}
