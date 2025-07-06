import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { NotebookModel, CellDefinition, NotebookStorage } from '@/Types/NotebookModel';
import { ApplicationState, ApplicationContextType, ApplicationProviderProps } from '@/Types/ApplicationTypes';
import { getFileSystemHelpers } from '@/lib/fileSystemHelpers';
import { RecentNotebooksManager } from '@/lib/recentNotebooks';
import { toast } from 'sonner';
import anylogger from 'anylogger';
import { commandManagerSingleton } from '@/Engine/CommandManagerSingleton';
import { NotebookStateManager } from './NotebookStateManager';
import { appDialogHelper } from '@/lib/AppDialogHelper';
import NotebookCellsStack from '@/components/icons/NotebookCellsStack';
import { AboutDialog } from '@/components/AboutDialog';
import { moduleRegistry } from '@/Engine/ModuleRegistry';

// State interface

const log = anylogger('ApplicationProvider');

/**
 * Ensures all cells in a notebook model have IDs, assigning them if missing
 * Uses the same ID generation logic as for new cells
 */
function ensureAllCellsHaveIds(model: NotebookModel): NotebookModel {
    // Collect existing IDs from cells that already have them
    const existingIds = new Set<string>();
    model.cells.forEach(cell => {
        if (cell.id) {
            existingIds.add(cell.id);
        }
    });

    // Track assigned IDs during processing to avoid duplicates
    const assignedIds = new Set<string>(existingIds);

    const cellsWithIds = model.cells.map(cell => {
        if (!cell.id) {
            // Generate ID that doesn't conflict with existing or already assigned IDs
            const cellId = generateCellIdWithExistingIds(cell.type, assignedIds);
            assignedIds.add(cellId);
            log.debug(`Assigned missing cell ID: ${cellId} for ${cell.type} cell`);
            return { ...cell, id: cellId };
        }
        return cell;
    });

    // Return new model with cells that all have IDs
    return {
        ...model,
        cells: cellsWithIds
    };
}

/**
 * Generate a cell ID that doesn't conflict with the provided set of existing IDs
 */
function generateCellIdWithExistingIds(cellType: CellDefinition['type'], existingIds: Set<string>): string {
    const prefix = getTypePrefix(cellType);
    
    // Find the first available number
    for (let i = 1; i <= 999; i++) {
        const paddedNumber = i.toString().padStart(2, '0');
        const candidateId = `${prefix}_${paddedNumber}`;
        
        if (!existingIds.has(candidateId)) {
            return candidateId;
        }
    }
    
    // Fallback if somehow we reach 999 cells of the same type
    const timestamp = Date.now().toString(36);
    return `${prefix}_${timestamp}`;
}

/**
 * Get type prefix for cell ID generation
 */
function getTypePrefix(cellType: CellDefinition['type']): string {
    switch (cellType) {
        case 'markdown': return 'md';
        case 'code': return 'code';
        case 'formula': return 'fx';
        case 'input': return 'var';
        default: return 'cell';
    }
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children, commandManager }: ApplicationProviderProps) {
    const [state, setState] = useState<ApplicationState>({
        currentFilePath: null,
        currentModel: null,
        isDirty: false,
        isLoading: false,
        error: null,
        selectedCellId: null,
        readingMode: false, // Will be updated from settings
    });

    // Storage exporter function from ReactiveProvider
    const [storageExporter, setStorageExporter] = useState<(() => NotebookStorage) | null>(null);

    // About dialog state
    const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
    const [aboutDialogData, setAboutDialogData] = useState({
        appName: 'Nodebook.js',
        version: '0.8.0',
        author: 'Nodebook.js Project',
        license: 'MIT'
    });

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
        // Use state manager for loading state to avoid race conditions
        stateManager.setLoadingState(loading, loading ? 'Start loading' : 'Stop loading');
    }, [stateManager]);

    const setError = useCallback((error: string | null) => {
        // Use state manager for error state to avoid race conditions
        stateManager.setErrorState(error, error ? 'Set error' : 'Clear error');
        
        // Auto-clear errors after 10 seconds to prevent stale error states
        if (error) {
            setTimeout(() => {
                stateManager.setErrorState(null, 'Auto-clear error');
            }, 10000);
        }
    }, [stateManager]);

    const clearError = useCallback(() => {
        setError(null);
    }, [setError]);

    const loadNotebook = useCallback(async (filePath: string) => {
        setLoading(true);
        setError(null);
        
        try {
            // Clear any existing notebook module paths first (in case switching notebooks)
            try {
                moduleRegistry.clearNotebookModulePaths();
                log.debug('Cleared existing notebook module paths before loading new notebook');
            } catch (error) {
                log.warn('Failed to clear existing notebook module paths:', error);
            }
            
            const fs = getFileSystemHelpers();
            const content = await fs.loadNotebook(filePath);
            if (content.success) {
                let model = content.data;
            
                // Process model to ensure all cells have IDs BEFORE setting it into state
                model = ensureAllCellsHaveIds(model);
            
                // Use state manager for loading notebook
                stateManager.loadNotebook(filePath, model, `Load notebook: ${filePath.split('/').pop()}`);
                
                // Add notebook-specific module path for per-notebook node_modules resolution
                try {
                    moduleRegistry.addNotebookModulePath(filePath);
                    log.debug('Added notebook module path for:', filePath);
                } catch (error) {
                    log.warn('Failed to add notebook module path:', error);
                }
                
                // Add to recent notebooks
                await RecentNotebooksManager.addRecentNotebook(filePath);
                
                // Set global notebook path for working directory fallback (timing issue fix)
                if (typeof window !== 'undefined') {
                    (window as any).__notebookCurrentPath = filePath;
                    log.debug('Set global notebook path:', filePath);
                }
                
                log.info('Notebook loaded successfully:', filePath);
                
                // Clear any previous error state on successful load
                setError(null);
                
                // Mark loading as complete after successful load
                setLoading(false);
            } else {
                const errorMessage = `Failed to load notebook: ${content.error}`;
                log.error('Failed to load notebook:', content.error);
                setError(errorMessage);
                
                // Show toast notification for immediate user feedback
                toast.error('Failed to Load Notebook', {
                    description: content.error,
                    duration: 5000,
                });
                
                setLoading(false);
            }
        } catch (error) {
            const errorMessage = `Failed to load notebook: ${error instanceof Error ? error.message : 'Unknown error'}`;
            log.error('Error loading notebook:', error);
            setError(errorMessage);
            
            // Show toast notification for immediate user feedback
            toast.error('Error Loading Notebook', {
                description: error instanceof Error ? error.message : 'An unknown error occurred',
                duration: 5000,
            });
            
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
            
            // Add to recent notebooks if this is a new file path
            if (filePath && filePath !== state.currentFilePath) {
                await RecentNotebooksManager.addRecentNotebook(targetPath);
            }
            
            log.info('Notebook saved successfully:', targetPath);
            
            // Show success toast with file name
            const fileName = targetPath.split('/').pop() || 'notebook';
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
        // Clear notebook-specific module paths before creating new notebook
        try {
            moduleRegistry.clearNotebookModulePaths();
            log.debug('Cleared notebook module paths for new notebook');
        } catch (error) {
            log.warn('Failed to clear notebook module paths:', error);
        }
        
        // Use state manager for creating new notebook
        stateManager.newNotebook('Create new notebook');
        
        // Clear global notebook path for new notebooks
        if (typeof window !== 'undefined') {
            (window as any).__notebookCurrentPath = null;
            log.debug('Cleared global notebook path for new notebook');
        }
        
        log.info('New notebook created');
    }, [stateManager]);

    const clearNotebook = useCallback(() => {
        // Clear notebook-specific module paths before clearing notebook
        try {
            moduleRegistry.clearNotebookModulePaths();
            log.debug('Cleared notebook module paths');
        } catch (error) {
            log.warn('Failed to clear notebook module paths:', error);
        }
        
        // Clear the current notebook model to return to homepage
        stateManager.clearNotebook('Clear notebook');
        
        // Clear global notebook path
        if (typeof window !== 'undefined') {
            (window as any).__notebookCurrentPath = null;
            log.debug('Cleared global notebook path');
        }
        
        log.info('Notebook cleared, returning to homepage');
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

    const setReadingMode = useCallback((readingMode: boolean) => {
        // Use state manager for reading mode updates
        stateManager.setReadingMode(readingMode, readingMode ? 'Enter reading mode' : 'Exit reading mode');
    }, [stateManager]);

    // Update window title when dirty state, file path, or model changes
    useEffect(() => {
        const updateWindowTitle = () => {
            if (!state.currentModel) {
                // No notebook loaded - show just the app name (HomePage)
                window.api.setWindowTitle('Nodebook.js');
            } else if (state.currentFilePath) {
                // Saved notebook - show filename
                const fileName = state.currentFilePath.split('/').pop() || 'Untitled';
                const dirtyIndicator = state.isDirty ? '● ' : '';
                window.api.setWindowTitle(`${dirtyIndicator}${fileName} - Nodebook.js`);
            } else {
                // New unsaved notebook - show "untitled"
                const dirtyIndicator = state.isDirty ? '● ' : '';
                window.api.setWindowTitle(`${dirtyIndicator}untitled - Nodebook.js`);
            }
        };

        updateWindowTitle();
    }, [state.currentFilePath, state.isDirty, state.currentModel]);

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
                        log.error('Error executing new notebook command:', error);                        await appDialogHelper.showError('New Notebook Failed', 
                            `Failed to create new notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
                    }
                } else {
                    // Fallback to direct call if no command manager or command not found
                    newNotebook();
                }
            },
            'menu-open-notebook': async () => {
                if (currentCommandManager && currentCommandManager.getCommand('notebook.open')) {
                    try {
                        await currentCommandManager.executeCommand('notebook.open');                    } catch (error) {
                        log.error('Error executing open notebook command:', error);
                        await appDialogHelper.showError('Open Failed', 
                            `Failed to open notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
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
                        }                    } catch (error) {
                        console.error('Error opening notebook:', error);
                        await appDialogHelper.showError('Open Failed', 
                            `Failed to open notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
                    }
                }
            },
            'menu-save-notebook': async () => {
                if (currentCommandManager && currentCommandManager.getCommand('notebook.save')) {
                    try {
                        await currentCommandManager.executeCommand('notebook.save');
                    } catch (error) {
                        log.error('Error executing save notebook command:', error);                        // If save command fails and no current path, show save dialog
                        if (!state.currentFilePath) {
                            await showSaveAsDialog();
                        } else {
                            await appDialogHelper.showError('Save Failed', 
                                `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                error instanceof Error ? error.stack : undefined);
                        }
                    }
                } else {
                    // Fallback to direct call if no command manager or command not found
                    try {
                        if (state.currentFilePath) {
                            await saveNotebook();
                        } else {
                            await showSaveAsDialog();
                        }                    } catch (error) {
                        console.error('Save failed:', error);
                        await appDialogHelper.showError('Save Failed', 
                            `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
                    }
                }
            },
            'menu-save-notebook-as': async () => {
                if (currentCommandManager && currentCommandManager.getCommand('notebook.saveAs')) {
                    try {
                        await currentCommandManager.executeCommand('notebook.saveAs');
                    } catch (error) {
                        log.error('Error executing save as notebook command:', error);                        await appDialogHelper.showError('Save As Failed', 
                            `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
                    }
                } else {
                    // Fallback to direct implementation if no command manager or command not found
                    try {                        await showSaveAsDialog();
                    } catch (error) {
                        console.error('Save As failed:', error);
                        await appDialogHelper.showError('Save Failed', 
                            `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
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
                // Dispatch the global event to show shortcuts
                window.dispatchEvent(new CustomEvent('showShortcuts'));
            },
            'menu-documentation': () => {
                // Dispatch the global event to show documentation
                window.dispatchEvent(new CustomEvent('showDocumentation'));
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
            'menu-duplicate-cell': async () => {
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('cell.duplicate');
                    } catch (error) {
                        log.error('Error executing duplicate cell command:', error);
                        // Fallback to custom event
                        window.dispatchEvent(new CustomEvent('duplicate-cell'));
                    }
                } else {
                    // Fallback to custom event
                    window.dispatchEvent(new CustomEvent('duplicate-cell'));
                }
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
            },
            'menu-ai-generate-notebook': async () => {
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('ai.generateNotebook');                    } catch (error) {
                        log.error('Error executing AI generate notebook command:', error);
                        await appDialogHelper.showError('AI Generation Failed', 
                            `Failed to generate notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
                    }
                } else {
                    // Fallback to direct dialog
                    await window.api.showMessageDialog({
                        type: 'info',
                        title: 'AI Assistant',
                        message: 'AI notebook generation is not available. Please try again later.'
                    });
                }
            },
            'menu-ai-generate-code-cell': async () => {
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('ai.generateCodeCell');                    } catch (error) {
                        log.error('Error executing AI generate code cell command:', error);
                        await appDialogHelper.showError('AI Generation Failed', 
                            `Failed to generate code cell: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            error instanceof Error ? error.stack : undefined);
                    }
                } else {
                    // Fallback to direct dialog
                    await window.api.showMessageDialog({
                        type: 'info',
                        title: 'AI Assistant',
                        message: 'AI code cell generation is not available. Please try again later.'
                    });
                }
            },
            'menu-toggle-console-viewer': async () => {
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('view.toggleConsole');
                    } catch (error) {
                        log.error('Error executing toggle console viewer command:', error);
                    }
                } else {
                    // Fallback to direct event dispatch
                    window.dispatchEvent(new CustomEvent('toggleConsolePanel'));
                }
            },
            'menu-toggle-reading-mode': async () => { // NEW: Reading mode menu handler
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('view.toggleReadingMode');
                    } catch (error) {
                        log.error('Error executing toggle reading mode command:', error);
                    }
                } else {
                    // Fallback to direct state change
                    setReadingMode(!state.readingMode);
                }
            },
            'menu-settings': async () => { // NEW: Settings menu handler
                if (currentCommandManager) {
                    try {
                        await currentCommandManager.executeCommand('view.settings');
                    } catch (error) {
                        log.error('Error executing settings command:', error);
                    }
                } else {
                    // Fallback to direct event dispatch
                    window.dispatchEvent(new CustomEvent('showSettings'));
                }
            },
            'menu-close-notebook': async () => { // Close notebook menu handler
                if (currentCommandManager) {
                    try {
                        // Check if we can close a notebook, otherwise use view.close
                        if (await currentCommandManager.canExecuteCommand('notebook.close')) {
                            await currentCommandManager.executeCommand('notebook.close');
                        } else {
                            await currentCommandManager.executeCommand('view.close');
                        }
                    } catch (error) {
                        log.error('Error executing close command:', error);
                    }
                } else {
                    // Fallback to direct close
                    if (state.currentModel) {
                        clearNotebook();
                    } else {
                        // Dispatch close view event
                        window.dispatchEvent(new CustomEvent('closeView'));
                    }
                }
            },
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

    // Load default reading mode setting on startup
    useEffect(() => {
        const loadDefaultReadingMode = async () => {
            try {
                const defaultReadingMode = await window.api.getAppSetting('defaultReadingMode', false);
                if (defaultReadingMode) {
                    stateManager.setReadingMode(true, 'Initialize with default reading mode');
                    log.info('Application started with default reading mode enabled');
                }
            } catch (error) {
                log.warn('Failed to load default reading mode setting:', error);
            }
        };
        
        loadDefaultReadingMode();
    }, [stateManager]);

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
            }        } catch (error) {
            console.error('Save As failed:', error);
            await appDialogHelper.showError('Save Failed', 
                `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error instanceof Error ? error.stack : undefined);
        }
    };    // Menu dialog functions
    const showAboutDialog = async () => {
        try {
            const appInfo = await window.api.getAppInfo();
            setAboutDialogData({
                appName: appInfo.name,
                version: appInfo.version,
                author: appInfo.author,
                license: appInfo.license
            });
        } catch (error) {
            // Fallback if getAppInfo fails
            const version = await window.api.getAppVersion();
            setAboutDialogData({
                appName: 'Nodebook.js',
                version,
                author: 'Nodebook.js Project',
                license: 'MIT'
            });
        }
        setAboutDialogOpen(true);
    };

    const showWelcomeDialog = async () => {
        try {
            // Load the welcome tutorial from the examples folder using FileSystemHelpers
            const fs = getFileSystemHelpers();
            
            log.debug('Attempting to load welcome tutorial from examples folder');
            
            // Try to load the welcome tutorial using FileSystemHelpers
            const content = await fs.loadExample('welcome-tutorial.json');
            if (content.success && content.data) {
                let model = content.data;
                
                // Process model to ensure all cells have IDs
                model = ensureAllCellsHaveIds(model);
                
                setModel(model);
                // Use state manager to preserve reading mode when showing welcome notebook
                stateManager.saveNotebook(null, 'Load welcome tutorial');
                
                log.info('Welcome tutorial loaded successfully from examples folder');
            } else {
                log.error('Could not load welcome tutorial from examples folder. Error:', content.error);
                throw new Error(`Failed to load welcome tutorial: ${content.error}`);
            }
        } catch (error) {
            log.error('Error loading welcome tutorial:', error);
            
            // Show error dialog to user instead of using fallback
            await appDialogHelper.showError(
                'Welcome Tutorial Not Found',
                'Could not load the welcome tutorial from the examples folder.',
                error instanceof Error ? error.stack : undefined
            );
        }
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
                          await appDialogHelper.showInfo(
                            'Export Successful',
                            'Notebook exported successfully!',
                            `Saved to: ${result.filePath}`
                        );
                    } else {
                        toast.error('Export failed', {
                            description: saveResult.error,
                            duration: 5000,
                        });                        await appDialogHelper.showError('Export Failed', 
                            `Failed to export notebook: ${saveResult.error}`);
                    }
                } catch (writeError) {
                    console.error('Export failed:', writeError);                    const errorMessage = writeError instanceof Error ? writeError.message : 'Unknown error';
                    toast.error('Export failed', {
                        description: errorMessage,
                        duration: 5000,
                    });
                    await appDialogHelper.showError('Export Failed', 
                        `Failed to export notebook: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('Export failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Export failed', {
                description: errorMessage,
                duration: 5000,
            });            await appDialogHelper.showError('Export Failed', 
                `Failed to export notebook: ${errorMessage}`);
        }
    };

    // Add file association handling
    useEffect(() => {
        if (!window.api) return;

        const handleFileFromSystem = async (filePath: string) => {
            log.info('Opening file from system file association:', filePath);
            
            try {
                // Validate file extension
                if (!filePath.endsWith('.nbjs') && !filePath.endsWith('.json')) {
                    throw new Error('Invalid file type. Only .nbjs and .json files are supported.');
                }
                
                // Load the notebook
                await loadNotebook(filePath);
                
                // Show success message
                const fileName = filePath.split('/').pop() || 'notebook';
                toast.success(`Opened: ${fileName}`, {
                    description: filePath,
                    duration: 3000,
                });
                
            } catch (error) {
                log.error('Error opening file from system:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                toast.error('Failed to open file', {
                    description: errorMessage,
                    duration: 5000,
                });
                
                await appDialogHelper.showError('Open Failed', 
                    `Failed to open file: ${errorMessage}`,
                    error instanceof Error ? error.stack : undefined);
            }
        };

        // Set up file association listener
        window.api.onOpenFileFromSystem(handleFileFromSystem);

        // Cleanup
        return () => {
            window.api.removeOpenFileListener();
        };
    }, [loadNotebook]);

    const contextValue: ApplicationContextType = {
        ...state,
        loadNotebook,
        saveNotebook,
        showSaveAsDialog,
        newNotebook,
        createNewNotebook: newNotebook, // Alias for consistency
        clearNotebook,
        setModel,
        setDirty,
        clearError,
        setSelectedCellId,
        setStorageExporter,
        setReadingMode, // NEW: Add reading mode setter
        
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
        moveCellToPosition: (cellId: string, newPosition: number, description?: string) => 
            stateManager.moveCellToPosition(cellId, newPosition, description),
        duplicateCell: (cellId: string, description?: string) => 
            stateManager.duplicateCell(cellId, description),
    };

    return (
        <ApplicationContext.Provider value={contextValue}>
            {children}
            <AboutDialog
                open={aboutDialogOpen}
                onOpenChange={setAboutDialogOpen}
                appName={aboutDialogData.appName}
                version={aboutDialogData.version}
                author={aboutDialogData.author}
                license={aboutDialogData.license}
            />
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