import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NotebookModel } from '@/Types/NotebookModel';
import { ApplicationState, ApplicationContextType, ApplicationProviderProps } from '@/Types/ApplicationTypes';
import { getFileSystemHelpers } from '@/lib/fileSystemHelpers';
import { toast } from 'sonner';
import anylogger from 'anylogger';

const log = anylogger('ApplicationProvider');

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined);

export function ApplicationProvider({ children }: ApplicationProviderProps) {
    const [state, setState] = useState<ApplicationState>({
        currentFilePath: null,
        currentModel: null,
        isDirty: false,
        isLoading: false,
        error: null,
    });

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
            
                setState((prev:ApplicationState) => ({
                    ...prev,
                    currentFilePath: filePath,
                    currentModel: model,
                    isDirty: false,
                    isLoading: false,
                }));
                
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
    }, []);

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
            const fs = getFileSystemHelpers();
            await fs.saveNotebook(state.currentModel, targetPath);
            
            setState((prev: ApplicationState) => ({
                ...prev,
                currentFilePath: targetPath,
                isDirty: false,
            }));
            
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
    }, [state.currentModel, state.currentFilePath]);

    const newNotebook = useCallback(() => {
        const emptyNotebook: NotebookModel = {
            cells: []
        };

        setState((prev:ApplicationState) => ({
            ...prev,
            currentFilePath: null,
            currentModel: emptyNotebook,
            isDirty: false,
            error: null,
        }));
        
        // Update window title for new notebook
        window.api.setWindowTitle('Untitled - NotebookJS');
        
        log.info('New notebook created');
    }, []);

    const setModel = useCallback((model: NotebookModel) => {
        setState((prev: ApplicationState) => ({
            ...prev,
            currentModel: model,
            isDirty: true, // Only mark dirty when model content changes
        }));
    }, []);

    const setDirty = useCallback((dirty: boolean) => {
        setState((prev:ApplicationState) => ({ ...prev, isDirty: dirty }));
    }, []);

    // Add menu event handlers
    useEffect(() => {
        if (!window.api) return;

        const handleMenuEvent = {
            'menu-new-notebook': () => {
                newNotebook(); // Call the local function
            },
            'menu-open-notebook': async () => {
                // Use window.api to show file dialog, then call local loadNotebook
                try {
                    const result = await window.api.openFileDialog({
                        title: 'Open Notebook',
                        filters: [
                            { name: 'Notebook Files', extensions: ['notebook', 'json'] },
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
            },
            'menu-save-notebook': async () => {
                try {
                    if (state.currentFilePath) {
                        await saveNotebook(); // Call local function with existing path
                    } else {
                        // No current path, show save dialog
                        await showSaveAsDialog();
                    }
                } catch (error) {
                    console.error('Save failed:', error);
                    await window.api.showErrorBox('Save Failed', 
                        `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            },
            'menu-save-notebook-as': async () => {
                try {
                    await showSaveAsDialog();
                } catch (error) {
                    console.error('Save As failed:', error);
                    await window.api.showErrorBox('Save Failed', 
                        `Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            'menu-insert-cell': (cellType: string) => {
                // This will be handled by DynamicNotebook
                window.dispatchEvent(new CustomEvent('insert-cell', { detail: { cellType } }));
            },
            'menu-run-cell': () => {
                window.dispatchEvent(new CustomEvent('run-cell'));
            },
            'menu-run-all-cells': () => {
                window.dispatchEvent(new CustomEvent('run-all-cells'));
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
    }, [loadNotebook, saveNotebook, newNotebook]); // Include stable callback functions

    // Helper function for Save As dialog
    const showSaveAsDialog = async () => {
        if (!state.currentModel) return;
        
        try {
            const result = await window.api.saveFileDialog({
                title: 'Save Notebook As',
                defaultPath: 'notebook.notebook',
                filters: [
                    { name: 'Notebook Files', extensions: ['notebook'] },
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
                    label: 'Double the input'
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
        newNotebook,
        setModel,
        setDirty,
        clearError,
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