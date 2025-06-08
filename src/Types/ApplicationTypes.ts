import { NotebookModel } from './NotebookModel';
import { ICommandManager } from './CommandTypes';

export interface ApplicationState {
    currentFilePath: string | null;
    currentModel: NotebookModel | null;
    isDirty: boolean;
    isLoading: boolean;
    error: string | null;
    selectedCellId: string | null;
}

export interface ApplicationContextType extends ApplicationState {
    loadNotebook: (filePath: string) => Promise<void>;
    saveNotebook: (filePath?: string) => Promise<void>;
    showSaveAsDialog: () => Promise<void>;
    newNotebook: () => void;
    setModel: (model: NotebookModel) => void;
    setDirty: (dirty: boolean) => void;
    clearError: () => void;
    setSelectedCellId: (cellId: string | null) => void;
}

export interface ApplicationProviderProps {
    children: React.ReactNode;
    commandManager?: ICommandManager;
}
