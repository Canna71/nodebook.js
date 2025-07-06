import { NotebookModel, CellDefinition, NotebookStorage } from './NotebookModel';
import { ICommandManager } from './CommandTypes';
import { NotebookStateManager } from '@/Engine/NotebookStateManager';

export interface ApplicationState {
    currentFilePath: string | null;
    currentModel: NotebookModel | null;
    isDirty: boolean;
    isLoading: boolean;
    error: string | null;
    selectedCellId: string | null;
    readingMode: boolean; // NEW: Reading mode state
}

export interface ApplicationContextType extends ApplicationState {
    loadNotebook: (filePath: string) => Promise<void>;
    saveNotebook: (filePath?: string) => Promise<void>;
    showSaveAsDialog: () => Promise<void>;
    newNotebook: () => void;
    createNewNotebook: () => void; // Alias for consistency
    clearNotebook: () => void;
    setModel: (model: NotebookModel) => void;
    setDirty: (dirty: boolean) => void;
    clearError: () => void;
    setSelectedCellId: (cellId: string | null) => void;
    setStorageExporter: (exporter: (() => NotebookStorage) | null) => void;
    setReadingMode: (readingMode: boolean) => void; // NEW: Reading mode setter
    
    // State manager for centralized operations
    stateManager: NotebookStateManager;
    
    // Undo/Redo operations
    canUndo: () => boolean;
    canRedo: () => boolean;
    undo: () => boolean;
    redo: () => boolean;
    getUndoDescription: () => string | null;
    getRedoDescription: () => string | null;
    
    // Cell operations through state manager
    updateCell: (cellId: string, updates: Partial<CellDefinition>, description?: string) => void;
    addCell: (cellType: CellDefinition['type'], insertIndex?: number, description?: string) => string | null;
    deleteCell: (cellId: string, description?: string) => void;
    moveCell: (cellId: string, direction: 'up' | 'down', description?: string) => void;
    moveCellToPosition: (cellId: string, newPosition: number, description?: string) => void;
    duplicateCell: (cellId: string, description?: string) => string | null;
}

export interface ApplicationProviderProps {
    children: React.ReactNode;
    commandManager?: ICommandManager;
}
