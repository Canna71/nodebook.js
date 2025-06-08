
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
 * Command execution context providing access to application services
 */
export interface CommandContext {
    // Application services
    applicationProvider: {
        saveNotebook: (filePath?: string) => Promise<void>;
        newNotebook: () => void;
        loadNotebook: (filePath: string) => Promise<void>;
        currentModel: any;
        setModel: (model: any) => void;
        setDirty: (dirty: boolean) => void;
        isDirty: boolean;
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
    executeCommand(commandId: string): Promise<void>;
    canExecuteCommand(commandId: string): boolean;
    getCommand(commandId: string): ICommand | undefined;
    getAllCommands(): CommandInfo[];
    setContext(context: CommandContext): void;
    getContext(): CommandContext | null;
}
