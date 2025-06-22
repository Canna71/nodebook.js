import React, { createContext, useContext, useEffect } from 'react';
import { CommandManager } from './CommandManager';
import { ICommandManager, CommandContext } from '@/Types/CommandTypes';
import { CodeCellDefinition } from '@/Types/NotebookModel';
import { useApplication } from './ApplicationProvider';
import { useReactiveSystem } from './ReactiveProvider';
import { commandManagerSingleton } from './CommandManagerSingleton';
import {
    SaveNotebookCommand,
    SaveAsNotebookCommand,
    NewNotebookCommand,
    OpenNotebookCommand,
    CloseNotebookCommand,
    AddCellCommand,
    ParameterizedAddCellCommand,
    ExecuteAllCellsCommand,
    ToggleSidebarCommand,
    UndoCommand,
    RedoCommand
} from './Commands/NotebookCommands';
import { 
    GenerateNotebookCommand, 
    GenerateCodeCellCommand,
    GenerateCellCommand 
} from '@/Engine/Commands/AICommands';
import {
    ToggleConsoleViewerCommand,
    ToggleOutputPanelCommand,
    ViewDocumentationCommand,
    ViewSettingsCommand,
    CloseViewCommand,
    ToggleReadingModeCommand,
    EnterReadingModeCommand,
    ExitReadingModeCommand
} from './Commands/ViewCommands';
import {
    DocumentArrowDownIcon as SaveIcon,
    DocumentArrowDownIcon as SaveAsIcon,
    DocumentPlusIcon,
    FolderOpenIcon,
    PlusIcon,
    PlayIcon,
    Bars3Icon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    SparklesIcon, // Add AI icon
    CommandLineIcon,
    DocumentTextIcon,
    XMarkIcon,
    BookOpenIcon,
    EyeIcon, // NEW: Reading mode icon
    CogIcon // NEW: Settings icon
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
    
    // Use the singleton command manager instance
    const commandManager = commandManagerSingleton;

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
                const codeCell = cell as CodeCellDefinition;
                try {
                    log.debug(`Executing code cell: ${cell.id} (static: ${codeCell.isStatic || false})`);
                    await codeCellEngine.executeCodeCell(cell.id, codeCell.code, undefined, codeCell.isStatic || false);
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

    // Register commands once when component mounts
    useEffect(() => {
        // Get context function for commands
        const getContext = () => commandManager.getContext();

        // Register all commands only once
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
            id: 'notebook.open',
            command: new OpenNotebookCommand(getContext),
            shortcut: 'Cmd+O',
            icon: FolderOpenIcon,
            tooltip: 'Open notebook (Cmd+O)'
        });

        commandManager.registerCommand({
            id: 'notebook.close',
            command: new CloseNotebookCommand(getContext),
            shortcut: 'Cmd+W',
            icon: XMarkIcon,
            tooltip: 'Close notebook (Cmd+W)'
        });

        commandManager.registerCommand({
            id: 'notebook.saveAs',
            command: new SaveAsNotebookCommand(getContext),
            shortcut: 'Shift+Cmd+S',
            icon: SaveAsIcon,
            tooltip: 'Save notebook as (Shift+Cmd+S)'
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
            command: new ParameterizedAddCellCommand(getContext),
            shortcut: 'Cmd+Enter',
            icon: PlusIcon,
            tooltip: 'Add code cell (Cmd+Enter)'
        });

        // Register specific cell type commands
        commandManager.registerCommand({
            id: 'cell.add.code',
            command: new ParameterizedAddCellCommand(getContext),
            shortcut: 'Cmd+Enter',
            icon: PlusIcon,
            tooltip: 'Add code cell (Cmd+Enter)'
        });

        commandManager.registerCommand({
            id: 'cell.add.markdown',
            command: new ParameterizedAddCellCommand(getContext),
            shortcut: 'Cmd+M',
            icon: PlusIcon,
            tooltip: 'Add markdown cell (Cmd+M)'
        });

        commandManager.registerCommand({
            id: 'cell.add.formula',
            command: new ParameterizedAddCellCommand(getContext),
            shortcut: 'Cmd+F',
            icon: PlusIcon,
            tooltip: 'Add formula cell (Cmd+F)'
        });

        commandManager.registerCommand({
            id: 'cell.add.input',
            command: new ParameterizedAddCellCommand(getContext),
            shortcut: 'Cmd+I',
            icon: PlusIcon,
            tooltip: 'Add input cell (Cmd+I)'
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

        // AI Commands
        commandManager.registerCommand({
            id: 'ai.generateNotebook',
            command: new GenerateNotebookCommand(getContext),
            shortcut: 'Cmd+Alt+G',
            icon: SparklesIcon,
            tooltip: 'Generate notebook with AI (Cmd+Alt+G)'
        });

        commandManager.registerCommand({
            id: 'ai.generateCodeCell',
            command: new GenerateCodeCellCommand(getContext),
            shortcut: 'Cmd+Alt+C',
            icon: SparklesIcon,
            tooltip: 'Generate code cell with AI (Cmd+Alt+C)'
        });

        commandManager.registerCommand({
            id: 'cell.add.ai',
            command: new GenerateCellCommand(getContext),
            icon: SparklesIcon,
            tooltip: 'Generate cell with AI'
        });

        // View Commands (swapped shortcuts - console is more frequently used)
        commandManager.registerCommand({
            id: 'view.toggleConsole',
            command: new ToggleConsoleViewerCommand(getContext),
            shortcut: 'Ctrl+`',
            icon: CommandLineIcon,
            tooltip: 'Toggle Console Viewer (Ctrl+`)'
        });

        commandManager.registerCommand({
            id: 'view.toggleOutput',
            command: new ToggleOutputPanelCommand(getContext),
            shortcut: 'Ctrl+Shift+`',
            icon: DocumentTextIcon,
            tooltip: 'Toggle Output Panel (Ctrl+Shift+`)'
        });

        commandManager.registerCommand({
            id: 'help.documentation',
            command: new ViewDocumentationCommand(getContext),
            shortcut: 'F1',
            icon: BookOpenIcon,
            tooltip: 'View Documentation (F1)'
        });

        commandManager.registerCommand({
            id: 'view.settings',
            command: new ViewSettingsCommand(getContext),
            icon: CogIcon,
            tooltip: 'Open Settings'
        });

        commandManager.registerCommand({
            id: 'view.close',
            command: new CloseViewCommand(getContext),
            shortcut: 'Escape',
            icon: XMarkIcon,
            tooltip: 'Close (Escape)'
        });

        // Reading mode commands
        commandManager.registerCommand({
            id: 'view.toggleReadingMode',
            command: new ToggleReadingModeCommand(getContext),
            shortcut: 'Ctrl+R',
            icon: EyeIcon,
            tooltip: 'Toggle Reading Mode (Ctrl+R)'
        });

        log.debug('Commands registered successfully');

        // Cleanup function to unregister commands when component unmounts
        return () => {
            const commandIds = [
                'notebook.save', 
                'notebook.new', 
                'notebook.open',
                'notebook.close',
                'notebook.saveAs',
                'notebook.executeAll', 
                'cell.add', 
                'cell.add.code',
                'cell.add.markdown',
                'cell.add.formula',
                'cell.add.input',
                'cell.add.ai',
                'ui.toggleSidebar', 
                'edit.undo', 
                'edit.redo',
                'ai.generateNotebook',
                'ai.generateCodeCell'
            ];
            commandIds.forEach(id => {
                if (commandManager.unregisterCommand) {
                    commandManager.unregisterCommand(id);
                }
            });
            log.debug('Commands unregistered');
        };
    }, [commandManager]); // Only depend on commandManager instance

    // Update command context when dependencies change
    useEffect(() => {
        const context: CommandContext = {
            applicationProvider: {
                saveNotebook: applicationProvider.saveNotebook,
                showSaveAsDialog: applicationProvider.showSaveAsDialog,
                newNotebook: applicationProvider.newNotebook,
                clearNotebook: applicationProvider.clearNotebook,
                loadNotebook: applicationProvider.loadNotebook,
                currentModel: applicationProvider.currentModel,
                currentFilePath: applicationProvider.currentFilePath,
                setModel: applicationProvider.setModel,
                setDirty: applicationProvider.setDirty,
                isDirty: applicationProvider.isDirty,
                readingMode: applicationProvider.readingMode, // NEW: Reading mode state
                setReadingMode: applicationProvider.setReadingMode, // NEW: Reading mode setter
                // Add undo/redo operations
                canUndo: applicationProvider.canUndo,
                canRedo: applicationProvider.canRedo,
                undo: applicationProvider.undo,
                redo: applicationProvider.redo,
                getUndoDescription: applicationProvider.getUndoDescription,
                getRedoDescription: applicationProvider.getRedoDescription,
                // Cell operations through state manager
                updateCell: applicationProvider.updateCell,
                addCell: applicationProvider.addCell,
                deleteCell: applicationProvider.deleteCell,
                moveCell: applicationProvider.moveCell
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
            },
            uiState: {
                selectedCellId: applicationProvider.selectedCellId
            }
        };

        commandManager.setContext(context);
        log.debug('Command context updated');

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
