
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { CommandManager } from './CommandManager';
import { ICommandManager, CommandContext } from '@/Types/CommandTypes';
import { useApplication } from './ApplicationProvider';
import { useReactiveSystem } from './ReactiveProvider';
import { commandManagerSingleton } from './CommandManagerSingleton';
import {
    SaveNotebookCommand,
    NewNotebookCommand,
    AddCellCommand,
    ExecuteAllCellsCommand,
    ToggleSidebarCommand,
    UndoCommand,
    RedoCommand
} from './Commands/NotebookCommands';
import {
    DocumentArrowDownIcon as SaveIcon,
    DocumentPlusIcon,
    PlusIcon,
    PlayIcon,
    Bars3Icon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon
} from '@heroicons/react/24/outline';
import { CellDefinition } from '@/Types/NotebookModel';
import anylogger from 'anylogger';

const log = anylogger('CommandProvider');

interface CommandProviderContextType {
    commandManager: ICommandManager;
    executeAllCells: () => Promise<void>;
    addCell: (cellType: CellDefinition['type'], insertIndex?: number) => void;
    toggleSidebar?: () => void;
}

const CommandProviderContext = createContext<CommandProviderContextType | undefined>(undefined);

interface CommandProviderProps {
    children: React.ReactNode;
    onAddCell: (cellType: CellDefinition['type'], insertIndex?: number) => void;
    onToggleSidebar?: () => void;
}

export function CommandProvider({ children, onAddCell, onToggleSidebar }: CommandProviderProps) {
    const applicationProvider = useApplication();
    const reactiveSystem = useReactiveSystem();
    
    // Create command manager instance
    const commandManager = useMemo(() => new CommandManager(), []);

    // Execute all cells implementation
    const executeAllCells = async (): Promise<void> => {
        const { currentModel } = applicationProvider;
        const { codeCellEngine } = reactiveSystem;
        
        if (!currentModel || !currentModel.cells) {
            log.warn('No notebook model available for executing all cells');
            return;
        }

        const codeCells = currentModel.cells.filter((cell: CellDefinition) => cell.type === 'code');
        
        if (codeCells.length === 0) {
            log.info('No code cells to execute');
            return;
        }

        log.info(`Executing ${codeCells.length} code cells`);
        
        try {
            // Execute all code cells in order
            for (const cell of codeCells) {
                const codeCell = cell as any; // CodeCellDefinition
                try {
                    log.debug(`Executing code cell: ${cell.id}`);
                    codeCellEngine.executeCodeCell(cell.id, codeCell.code);
                } catch (cellError) {
                    log.error(`Error executing code cell ${cell.id}:`, cellError);
                    // Continue with other cells even if one fails
                }
            }
            
            log.info('All code cells execution completed');
        } catch (error) {
            log.error('Error during execute all cells:', error);
            throw error;
        }
    };

    // Setup command context
    useEffect(() => {
        const context: CommandContext = {
            applicationProvider: {
                saveNotebook: applicationProvider.saveNotebook,
                newNotebook: applicationProvider.newNotebook,
                loadNotebook: applicationProvider.loadNotebook,
                currentModel: applicationProvider.currentModel,
                setModel: applicationProvider.setModel,
                setDirty: applicationProvider.setDirty,
                isDirty: applicationProvider.isDirty
            },
            reactiveSystem: {
                codeCellEngine: reactiveSystem.codeCellEngine,
                reactiveStore: reactiveSystem.reactiveStore,
                formulaEngine: reactiveSystem.formulaEngine
            },
            notebookOperations: {
                addCell: onAddCell,
                executeAllCells
            },
            uiOperations: {
                toggleSidebar: onToggleSidebar
            }
        };

        commandManager.setContext(context);

        // Get context function for commands
        const getContext = () => commandManager.getContext();

        // Register all commands
        commandManager.registerCommand({
            id: 'notebook.save',
            command: new SaveNotebookCommand(getContext),
            shortcut: 'Cmd+S',
            icon: SaveIcon,
            tooltip: 'Save notebook (Cmd+S)'
        });

        commandManager.registerCommand({
            id: 'notebook.new',
            command: new NewNotebookCommand(getContext),
            shortcut: 'Cmd+N',
            icon: DocumentPlusIcon,
            tooltip: 'New notebook (Cmd+N)'
        });

        commandManager.registerCommand({
            id: 'notebook.executeAll',
            command: new ExecuteAllCellsCommand(getContext),
            shortcut: 'Shift+Cmd+Enter',
            icon: PlayIcon,
            tooltip: 'Run all cells (Shift+Cmd+Enter)'
        });

        commandManager.registerCommand({
            id: 'cell.add',
            command: new AddCellCommand(getContext, 'code'),
            shortcut: 'Cmd+Enter',
            icon: PlusIcon,
            tooltip: 'Add cell (Cmd+Enter)'
        });

        commandManager.registerCommand({
            id: 'ui.toggleSidebar',
            command: new ToggleSidebarCommand(getContext),
            shortcut: 'Cmd+B',
            icon: Bars3Icon,
            tooltip: 'Toggle sidebar (Cmd+B)'
        });

        commandManager.registerCommand({
            id: 'edit.undo',
            command: new UndoCommand(getContext),
            shortcut: 'Cmd+Z',
            icon: ArrowUturnLeftIcon,
            tooltip: 'Undo (Cmd+Z)'
        });

        commandManager.registerCommand({
            id: 'edit.redo',
            command: new RedoCommand(getContext),
            shortcut: 'Shift+Cmd+Z',
            icon: ArrowUturnRightIcon,
            tooltip: 'Redo (Shift+Cmd+Z)'
        });

        log.debug('Commands registered successfully');

    }, [commandManager, applicationProvider, reactiveSystem, onAddCell, onToggleSidebar, executeAllCells]);

    const contextValue: CommandProviderContextType = {
        commandManager,
        executeAllCells,
        addCell: onAddCell,
        toggleSidebar: onToggleSidebar
    };

    return (
        <CommandProviderContext.Provider value={contextValue}>
            {children}
        </CommandProviderContext.Provider>
    );
}

export function useCommands(): CommandProviderContextType {
    const context = useContext(CommandProviderContext);
    if (context === undefined) {
        throw new Error('useCommands must be used within a CommandProvider');
    }
    return context;
}
