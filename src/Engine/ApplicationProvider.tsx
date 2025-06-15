import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { NotebookModel, CellDefinition, NotebookStorage } from '@/Types/NotebookModel';
import { ApplicationState, ApplicationContextType, ApplicationProviderProps } from '@/Types/ApplicationTypes';
import { getFileSystemHelpers } from '@/lib/fileSystemHelpers';
import { toast } from 'sonner';
import anylogger from 'anylogger';
import { commandManagerSingleton } from './CommandManagerSingleton';
import { NotebookStateManager } from './NotebookStateManager';

const log = anylogger('ApplicationProvider');

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children, commandManager }: ApplicationProviderProps) {
    const [state, setState] = useState<ApplicationState>({
        currentFilePath: null,
        currentModel: null,
        isDirty: false,
        isLoading: false,
        error: null,
        selectedCellId: null,
    });

    // Storage exporter function from ReactiveProvider
    const [storageExporter, setStorageExporter] = useState<(() => NotebookStorage) | null>(null);

    // Initialize state manager
    const stateManagerRef = useRef<NotebookStateManager | null>(null);
    
    // Initialize state manager on first render
    if (!stateManagerRef.current) {
        stateManagerRef.current = new NotebookStateManager(state, {
            maxHistorySize: 50,
            enableHistory: true
        });
        
        // Subscribe to state manager changes
        stateManagerRef.current.onStateChange((newState) => {
            setState(newState);
        });
    }

    const stateManager = stateManagerRef.current;

    const setLoading = useCallback((loading: boolean) => {
        setState((prev:ApplicationState) => ({ ...prev, isLoading: loading }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState((prev:ApplicationState) => ({ ...prev, error }));
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);

    const loadNotebook = useCallback(async (filePath: string) => {
        setLoading(true);
        setError(null);
        
        try {
            const fs = getFileSystemHelpers();
            const content = await fs.loadNotebook(filePath);
            if (content.success) {
                const model = content.data;
            
                // Use state manager for loading notebook
                stateManager.loadNotebook(filePath, model, `Load notebook: ${filePath.split('/').pop()}`);
                
                // Update window title with file name
                const fileName = filePath.split('/').pop() || 'Untitled';
                await window.api.setWindowTitle(`${fileName} - NotebookJS`);
                
                log.info('Notebook loaded successfully:', filePath);
            } else {
                log.error('Failed to load notebook:', content.error);
                setError(`Failed to load notebook: ${content.error}`);
                setLoading(false);
            }
        } catch (error) {
            log.error('Error loading notebook:', error);
            setError(`Failed to load notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setLoading(false);
        }
    }, [stateManager]);    
    
    const saveNotebook = useCallback(async (filePath?: string) => {
        if (!state.currentModel) {
            setError('No notebook to save');
            toast.error('No notebook to save');
            return;
        }

        const targetPath = filePath || state.currentFilePath;
        if (!targetPath) {
            setError('No file path specified');
            toast.error('No file path specified');
            return;
        }

        setError(null);

        try {
            // Export storage if available
            let modelToSave = state.currentModel;
            log.debug('Save: storageExporter type:', typeof storageExporter);
            log.debug('Save: storageExporter value:', !!storageExporter);
            
            if (storageExporter && typeof storageExporter === 'function') {
                try {
                    const exportedStorage = storageExporter();
                    modelToSave = {
                        ...state.currentModel,
                        storage: exportedStorage
                    };
                    log.debug('Storage exported for save:', exportedStorage);
                } catch (exportError) {
                    log.error('Error calling storage exporter:', exportError);
                    // Don't throw here, continue with save without storage
                    log.warn('Continuing save without storage export');
                }
            } else {
                log.debug('No storage exporter available or not a function');
            }

            const fs = getFileSystemHelpers();
            await fs.saveNotebook(modelToSave, targetPath);
            
            // Use state manager for saving
            stateManager.saveNotebook(targetPath, `Save notebook: ${targetPath.split('/').pop()}`);
            
            // Update window title when file path changes or dirty state clears
            const fileName = targetPath.split('/').pop() || 'Untitled';
            await window.api.setWindowTitle(`${fileName} - NotebookJS`);
            
            log.info('Notebook saved successfully:', targetPath);
            
            // Show success toast with file name
            toast.success(`Notebook saved: ${fileName}`, {
                description: targetPath,
                duration: 3000,
            });
            
        } catch (error) {
            log.error('Error saving notebook:', error);
            const errorMessage = `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`;
            setError(errorMessage);
            toast.error('Failed to save notebook', {
                description: error instanceof Error ? error.message : 'Unknown error',
                duration: 5000,
            });
        }
    }, [state.currentModel, state.currentFilePath, stateManager, storageExporter]);

    const newNotebook = useCallback(() => {
        // Use state manager for creating new notebook
        stateManager.newNotebook('Create new notebook');
        
        // Update window title for new notebook
        window.api.setWindowTitle('Untitled - NotebookJS');
        
        log.info('New notebook created');
    }, [stateManager]);

    const setModel = useCallback((model: NotebookModel) => {
        // Use state manager for model updates
        stateManager.setNotebookModel(model, 'Update notebook model');
    }, [stateManager]);

    const setDirty = useCallback((dirty: boolean) => {
        // Use state manager for dirty state updates
        stateManager.setDirtyState(dirty, dirty ? 'Mark as dirty' : 'Mark as clean');
    }, [stateManager]);

    const setSelectedCellId = useCallback((cellId: string | null) => {
        // Use state manager for selection changes
        stateManager.setSelectedCell(cellId, cellId ? `Select cell: ${cellId}` : 'Clear selection');
    }, [stateManager]);

    // Add menu event handlers
    useEffect(() => {
        if (!window.api) return;

        // Capture commandManager in the closure explicitly
        const currentCommandManager = commandManager;

        const handleMenuEvent = {
            'menu-new-notebook': async () => {
                if (currentCommandManager && currentCommandManager.getCommand('notebook.new')) {
                    try {
                        await currentCommandManager.executeCommand('notebook.new');
                    } catch (error) {
                        log.error('Error executing new notebook command:', error);
                        await window.api.showErrorBox('New Notebook Failed', 
                            `Failed to create new notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                } else {
                    // Fallback to direct call if no command manager or command not found
                    newNotebook();
                }
            },
            'menu-open-notebook': async () => {
                if (currentCommandManager && currentCommandManager.getCommand('notebook.open')) {
                    try {
                        await currentCommandManager.executeCommand('notebook.open');
                    } catch (error) {
                        log.error('Error executing open notebook command:', error);
                        await window.api.showErrorBox('Open Failed', 
                            `Failed to open notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                } else {
                    // Fallback to direct implementation if no command manager or command not found
                    try {
                        const result = await window.api.openFileDialog({
                            title: 'Open Notebook',
                            filters: [
                                { name: 'Notebook Files', extensions: ['nbjs', 'json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]
                        });

                        if (!result.canceled && result.filePaths.length > 0) {
                            await loadNotebook(result.filePaths[0]);
                        }
                    } catch (error) {
                        console.error('Error opening notebook:', error);
                        await window.api.showErrorBox('Open Failed', 
                            `Failed to open notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            },
            'menu-save-notebook': async () => {
                if (currentCommandManager && currentCommandManager.getCommand('notebook.save')) {
                    try {
                        await currentCommandManager.executeCommand('notebook.save');
                    } catch (error) {
                        log.error('Error executing save notebook command:', error);
                        // If save command fails and no current path, show save dialog
                        if (!state.currentFilePath) {
                            await showSaveAsDialog();
                        } else {
                            await window.api.showErrorBox('Save Failed', 
                                `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    }
                } else {
                    // Fallback to direct call if no command manager or command not found
                    try {
                        if (state.currentFilePath) {
                            await saveNotebook();
                        } else {
                            await showSaveAsDialog();
                        }
                    } catch (error) {
                        console.error('Save failed:', error);
                        await window.api.showErrorBox('Save Failed', 
                            `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            },
            'menu-save-notebook-as': async () => {
                if (currentCommandManager && currentCommandManager.getCommand('notebook.saveAs')) {
                    try {
                        await currentCommandManager.executeCommand('notebook.saveAs');
                    } catch (error) {
                        log.error('Error executing save as notebook command:', error);
                        await window.api.showErrorBox('Save As Failed', 
                            `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                } else {
                    // Fallback to direct implementation if no command manager or command not found
                    try {
                        await showSaveAsDialog();
                    } catch (error) {
                        console.error('Save As failed:', error);
                        await window.api.showErrorBox('Save Failed', 
                            `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            },
            'menu-export-json': () => {
                exportAsJson();
            },
            'menu-about': () => {
                showAboutDialog();
            },
            'menu-welcome': () => {
                showWelcomeDialog();
            },
            'menu-shortcuts': () => {
                showShortcutsDialog();
            },
            'menu-documentation': () => {
                showDocumentationDialog();
            },
            'menu-insert-cell': async (cellType: string) => {
                if (currentCommandManager) {
                    try {
                        // Use the specific cell type command with proper parameters
                        const commandId = `cell.add.${cellType}`;
                        await currentCommandManager.executeCommand(commandId, {
                            cellType: cellType as CellDefinition['type'],
                            insertStrategy: 'after-selected'
                        });
                    } catch (error) {
                        log.error('Error executing add cell command:', error);
                        // Fallback to custom event
                        window.dispatchEvent(new CustomEvent('insert-cell', { detail: { cellType } }));
                    }
                } else {
                    // Fallback to custom event
                    window.dispatchEvent(new CustomEvent('insert-cell', { detail: { cellType } }));
                }
            },
            'menu-run-cell': () => {
                window.dispatchEvent(new CustomEvent('run-cell'));
            },
            'menu-run-all-cells': async () => {
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('notebook.executeAll');
                    } catch (error) {
                        log.error('Error executing run all cells command:', error);
                        // Fallback to custom event
                        window.dispatchEvent(new CustomEvent('run-all-cells'));
                    }
                } else {
                    // Fallback to custom event
                    window.dispatchEvent(new CustomEvent('run-all-cells'));
                }
            },
            'menu-clear-cell-output': () => {
                window.dispatchEvent(new CustomEvent('clear-cell-output'));
            },
            'menu-clear-all-outputs': () => {
                window.dispatchEvent(new CustomEvent('clear-all-outputs'));
            },
            'menu-delete-cell': () => {
                window.dispatchEvent(new CustomEvent('delete-cell'));
            },
            'menu-find': () => {
                // Implement find functionality
                window.dispatchEvent(new CustomEvent('find-in-notebook'));
            },
            'menu-undo': async () => {
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('edit.undo');
                    } catch (error) {
                        log.error('Error executing undo command:', error);
                    }
                } else {
                    // Fallback to application provider undo
                    stateManager.undo();
                }
            },
            'menu-redo': async () => {
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('edit.redo');
                    } catch (error) {
                        log.error('Error executing redo command:', error);
                    }
                } else {
                    // Fallback to application provider redo
                    stateManager.redo();
                }
            }
        };

        // Register all menu event listeners
        Object.entries(handleMenuEvent).forEach(([event, handler]) => {
            window.api.onMenuAction(event, handler);
        });

        // Cleanup function
        return () => {
            Object.keys(handleMenuEvent).forEach(event => {
                window.api.removeMenuListener(event);
            });
        };
    }, [loadNotebook, saveNotebook, newNotebook, commandManager, state.currentFilePath]); // Include commandManager and currentFilePath

    // Helper function for Save As dialog
    const showSaveAsDialog = async () => {
        if (!state.currentModel) return;
        
        try {
            const result = await window.api.saveFileDialog({
                title: 'Save Notebook As',
                defaultPath: 'notebook.nbjs',
                filters: [
                    { name: 'Notebook Files', extensions: ['nbjs'] },
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                await saveNotebook(result.filePath);
            }
        } catch (error) {
            console.error('Save As failed:', error);
            await window.api.showErrorBox('Save Failed', 
                `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Menu dialog functions
    const showAboutDialog = async () => {
        const version = await window.api.getAppVersion();
        await window.api.showMessageBox({
            type: 'info',
            title: 'About NotebookJS',
            message: 'NotebookJS',
            detail: `Version: ${version}\n\nA reactive notebook application for interactive computing and data analysis.`
        });
    };

    const showWelcomeDialog = () => {
        // Helper function to generate ID
        const generateId = () => `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create a welcome tutorial notebook
        const welcomeNotebook: NotebookModel = {
            cells: [
                {
                    type: 'markdown',
                    id: generateId(),
                    content: '# Welcome to NotebookJS!\n\nThis is a reactive notebook that lets you create interactive documents with code, formulas, and rich content.'
                },
                {
                    type: 'input',
                    id: generateId(),
                    inputType: 'number',
                    variableName: 'x',
                    value: 10,
                    label: 'Input Value'
                },
                {
                    type: 'formula',
                    id: generateId(),
                    variableName: 'doubled',
                    formula: '$x * 2',
                },
                {
                    type: 'markdown',
                    id: generateId(),
                    content: 'The result is: **{{doubled}}**\n\nTry changing the input value above and watch the result update automatically!'
                }
            ]
        };
        
        setModel(welcomeNotebook);
        setState(prev => ({ ...prev, currentFilePath: null, isDirty: false }));
    };

    const showShortcutsDialog = async () => {
        await window.api.showMessageBox({
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: 'NotebookJS Shortcuts',
            detail: `File Operations:
• Ctrl/Cmd+N - New Notebook
• Ctrl/Cmd+O - Open Notebook
• Ctrl/Cmd+S - Save
• Ctrl/Cmd+Shift+S - Save As

Cell Operations:
• Ctrl/Cmd+Shift+C - Insert Code Cell
• Ctrl/Cmd+Shift+M - Insert Markdown Cell
• Ctrl/Cmd+Shift+F - Insert Formula Cell
• Ctrl/Cmd+Shift+I - Insert Input Cell
• Shift+Enter - Run Cell
• Ctrl/Cmd+Shift+Enter - Run All Cells
• Ctrl/Cmd+Shift+D - Delete Cell

View:
• Ctrl/Cmd+R - Reload
• F11/Ctrl+Cmd+F - Toggle Fullscreen
• Ctrl/Cmd+0 - Reset Zoom`
        });
    };

    const showDocumentationDialog = async () => {
        await window.api.showMessageBox({
            type: 'info',
            title: 'Documentation',
            message: 'NotebookJS Documentation',
            detail: `Cell Types:
• Code Cells: Write JavaScript code with reactive variables
• Formula Cells: Create calculated values using $variable syntax
• Input Cells: Interactive controls (sliders, inputs, checkboxes)
• Markdown Cells: Rich text with {{variable}} interpolation

Reactive System:
Variables automatically update when their dependencies change, creating a live, interactive document.`
        });
    };

    const exportAsJson = async () => {
        if (!state.currentModel) return;
        
        try {
            const result = await window.api.saveFileDialog({
                title: 'Export as JSON',
                defaultPath: 'notebook.json',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (!result.canceled && result.filePath) {
                const jsonData = JSON.stringify(state.currentModel, null, 2);
                
                // Use the proper file system helpers instead of direct fs access
                try {
                    const fs = getFileSystemHelpers();
                    const saveResult = await fs.saveNotebook(state.currentModel, result.filePath);
                    
                    if (saveResult.success) {
                        const fileName = result.filePath.split('/').pop() || 'export.json';
                        toast.success(`Notebook exported: ${fileName}`, {
                            description: result.filePath,
                            duration: 3000,
                        });
                        
                        await window.api.showMessageBox({
                            type: 'info',
                            title: 'Export Successful',
                            message: 'Notebook exported successfully!',
                            detail: `Saved to: ${result.filePath}`
                        });
                    } else {
                        toast.error('Export failed', {
                            description: saveResult.error,
                            duration: 5000,
                        });
                        await window.api.showErrorBox('Export Failed', 
                            `Failed to export notebook: ${saveResult.error}`);
                    }
                } catch (writeError) {
                    console.error('Export failed:', writeError);
                    const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown error';
                    toast.error('Export failed', {
                        description: errorMessage,
                        duration: 5000,
                    });
                    await window.api.showErrorBox('Export Failed', 
                        `Failed to export notebook: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('Export failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Export failed', {
                description: errorMessage,
                duration: 5000,
            });
            await window.api.showErrorBox('Export Failed', 
                `Failed to export notebook: ${errorMessage}`);
        }
    };

    const contextValue: ApplicationContextType = {
        ...state,
        loadNotebook,
        saveNotebook,
        showSaveAsDialog,
        newNotebook,
        setModel,
        setDirty,
        clearError,
        setSelectedCellId,
        setStorageExporter,
        
        // State manager for centralized operations
        stateManager,
        
        // Undo/Redo operations
        canUndo: () => stateManager.canUndo(),
        canRedo: () => stateManager.canRedo(),
        undo: () => stateManager.undo(),
        redo: () => stateManager.redo(),
        getUndoDescription: () => stateManager.getUndoDescription(),
        getRedoDescription: () => stateManager.getRedoDescription(),
        
        // Cell operations through state manager
        updateCell: (cellId: string, updates: Partial<CellDefinition>, description?: string) => 
            stateManager.updateCell(cellId, updates, description),
        addCell: (cellType: CellDefinition['type'], insertIndex?: number, description?: string) => 
            stateManager.addCell(cellType, insertIndex, description),
        deleteCell: (cellId: string, description?: string) => 
            stateManager.deleteCell(cellId, description),
        moveCell: (cellId: string, direction: 'up' | 'down', description?: string) => 
            stateManager.moveCell(cellId, direction, description),
    };

    return (
        <ApplicationContext.Provider value={contextValue}>
            {children}
        </ApplicationContext.Provider>
    );
}

export function useApplication() {
    const context = useContext(ApplicationContext);
    if (context === undefined) {
        throw new Error('useApplication must be used within an ApplicationProvider');
    }
    return context;
}