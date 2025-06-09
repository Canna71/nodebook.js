import React, { useState } from 'react';
import { CellDefinition } from '@/Types/NotebookModel';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import { CellTypeIcon } from './CellTypeIcon';
import { useCommands } from '@/Engine/CommandProvider';
import anylogger from 'anylogger';

const log = anylogger('CellSeparator');

interface CellSeparatorProps {
    insertIndex: number;
    isFirst?: boolean;
    isLast?: boolean;
    // Keep onAddCell as fallback for backward compatibility
    onAddCell?: (cellType: CellDefinition['type'], insertIndex: number) => void;
}

export function CellSeparator({ insertIndex, isFirst = false, isLast = false, onAddCell }: CellSeparatorProps) {
    const [isHovered, setIsHovered] = useState(false);
    const { commandManager } = useCommands();

    const cellTypes = [
        {
            type: 'input' as const,
            label: 'Input',
            description: 'Add an input field',
            commandId: 'cell.add.input'
        },
        {
            type: 'code' as const,
            label: 'Code',
            description: 'Add a code cell',
            commandId: 'cell.add.code'
        },
        {
            type: 'formula' as const,
            label: 'Formula',
            description: 'Add a formula cell',
            commandId: 'cell.add.formula'
        },
        {
            type: 'markdown' as const,
            label: 'Markdown',
            description: 'Add markdown content',
            commandId: 'cell.add.markdown'
        }
    ];

    const handleAddCell = async (cellType: CellDefinition['type'], commandId: string) => {
        log.debug(`CellSeparator: Adding ${cellType} cell at index ${insertIndex}`);
        try {
            // Use command system first
            await commandManager.executeCommand(commandId, {
                cellType,
                insertStrategy: 'specific-index',
                specificIndex: insertIndex
            });
            log.debug(`Successfully added ${cellType} cell via command system`);
        } catch (error) {
            log.error(`Error adding cell via command system:`, error);
            
            // Fallback to direct function call if provided
            if (onAddCell) {
                log.debug(`Falling back to direct function call for ${cellType} cell`);
                try {
                    onAddCell(cellType, insertIndex);
                } catch (fallbackError) {
                    log.error('Error in fallback cell addition:', fallbackError);
                }
            }
        }
    };

    return (
        <div 
            className={`cell-separator relative ${isFirst ? 'pt-2' : 'py-2'} ${isLast ? 'pb-4' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Invisible hover area to make it easier to trigger */}
            <div className="absolute inset-0 h-6 -mt-1 pointer-events-none" />
            
            {/* Add buttons - appear on hover */}
            {isHovered && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex items-center gap-1 bg-background rounded-lg px-2 py-1 shadow-lg">
                        <PlusIcon className="w-4 h-4 text-muted-foreground mr-1" />
                        {cellTypes.map((cellType) => {
                            return (
                                <Button
                                    key={cellType.type}
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        log.debug(`Button clicked: ${cellType.type}`);
                                        await handleAddCell(cellType.type, cellType.commandId);
                                    }}
                                    variant="ghost" 
                                    size="sm"
                                    title={cellType.description}
                                    className="text-xs"
                                >
                                    <CellTypeIcon type={cellType.type} className="w-3 h-3 mr-1" />
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
