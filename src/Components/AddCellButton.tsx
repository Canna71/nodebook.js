import React, { useState } from 'react';
import { CellDefinition, CellTemplate } from '@/Types/NotebookModel';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AddCellButtonProps {
    onAddCell: (cellType: CellDefinition['type'], insertIndex?: number) => void;
    insertIndex?: number;
}

const CELL_TEMPLATES: CellTemplate[] = [
    {
        type: 'markdown',
        label: 'Markdown',
        description: 'Rich text with formatting',
        defaultDefinition: {
            content: '# New Section\n\nAdd your content here...'
        }
    },
    {
        type: 'code',
        label: 'Code',
        description: 'JavaScript code execution',
        defaultDefinition: {
            code: '// Write your code here\nconsole.log("Hello, world!");'
        }
    },
    {
        type: 'formula',
        label: 'Formula',
        description: 'Reactive calculation',
        defaultDefinition: {
            variableName: 'result',
            formula: '$variable1 + $variable2',
            outputFormat: 'number'
        }
    },
    {
        type: 'input',
        label: 'Input',
        description: 'User input control',
        defaultDefinition: {
            label: 'New Input',
            inputType: 'number',
            variableName: 'newValue',
        }
    }
];

export function AddCellButton({ onAddCell, insertIndex }: AddCellButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleAddCell = (cellType: CellDefinition['type']) => {
        onAddCell(cellType, insertIndex);
        setIsOpen(false);
    };

    return (
        <div className="add-cell-button relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
                <PlusIcon className="w-4 h-4" />
                Add Cell
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-10 min-w-64">
                    <div className="p-2">
                        <div className="text-sm font-medium text-foreground mb-2">Choose cell type:</div>
                        <div className="space-y-1">
                            {CELL_TEMPLATES.map((template) => (
                                <button
                                    key={template.type}
                                    onClick={() => handleAddCell(template.type)}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-accent/20 transition-colors"
                                >
                                    <div className="font-medium text-foreground">{template.label}</div>
                                    <div className="text-xs text-secondary-foreground">{template.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
