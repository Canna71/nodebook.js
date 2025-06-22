
/**
 * Command interface for implementing the Command Pattern
 */
export interface ICommand {
    execute(): Promise<void> | void;
    canExecute?(): boolean;
    undo?(): Promise<void> | void;
    canUndo?(): boolean;
    getDescription(): string;
}

/**
 * Parameterized command interface that can receive runtime parameters
 */
export interface IParameterizedCommand extends ICommand {
    executeWithParams(params: any): Promise<void> | void;
}

/**
 * Type guard to check if a command is parameterized
 */
export function isParameterizedCommand(command: ICommand): command is IParameterizedCommand {
    return 'executeWithParams' in command;
}

/**
 * Command execution context providing access to application services
 */
export interface CommandContext {
    // Application services
    applicationProvider: {
        saveNotebook: (filePath?: string) => Promise<void>;
        showSaveAsDialog: () => Promise<void>;
        newNotebook: () => void;
        clearNotebook: () => void;
        loadNotebook: (filePath: string) => Promise<void>;
        currentModel: any;
        currentFilePath: string | null;
        setModel: (model: any) => void;
        setDirty: (dirty: boolean) => void;
        isDirty: boolean;
        readingMode: boolean; // NEW: Reading mode state
        setReadingMode: (readingMode: boolean) => void; // NEW: Reading mode setter
        // Undo/Redo operations
        canUndo: () => boolean;
        canRedo: () => boolean;
        undo: () => boolean;
        redo: () => boolean;
        getUndoDescription: () => string | null;
        getRedoDescription: () => string | null;
        // Cell operations through state manager
        updateCell: (cellId: string, updates: any, description?: string) => void;
        addCell: (cellType: string, insertIndex?: number, description?: string) => string | null;
        deleteCell: (cellId: string, description?: string) => void;
        moveCell: (cellId: string, direction: 'up' | 'down', description?: string) => void;
    };
    
    // Reactive system
    reactiveSystem: {
        codeCellEngine: any;
        reactiveStore: any;
        formulaEngine: any;
    };
    
    // Notebook operations
    notebookOperations: {
        addCell: (cellType: string, insertIndex?: number) => void;
        executeAllCells: () => Promise<void>;
    };
    
    // UI operations
    uiOperations: {
        toggleSidebar?: () => void;
    };
    
    // UI state
    uiState: {
        selectedCellId: string | null;
    };
}

/**
 * Command registration info
 */
export interface CommandInfo {
    id: string;
    command: ICommand;
    shortcut?: string;
    icon?: React.ComponentType<any>;
    tooltip?: string;
}

/**
 * Command manager interface
 */
export interface ICommandManager {
    registerCommand(info: CommandInfo): void;
    unregisterCommand(commandId: string): void;
    executeCommand(commandId: string, params?: any): Promise<void>;
    canExecuteCommand(commandId: string): boolean;
    getCommand(commandId: string): ICommand | undefined;
    getAllCommands(): CommandInfo[];
    setContext(context: CommandContext): void;
    getContext(): CommandContext | null;
}
