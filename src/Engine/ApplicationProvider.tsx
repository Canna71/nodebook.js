import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotebookModel } from '@/Types/NotebookModel';
import { ApplicationState, ApplicationContextType, ApplicationProviderProps } from '@/Types/ApplicationTypes';
import { getFileSystemHelpers } from '@/lib/fileSystemHelpers';
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
            return;
        }

        const targetPath = filePath || state.currentFilePath;
        if (!targetPath) {
            setError('No file path specified');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const fs = getFileSystemHelpers();
            await fs.saveNotebook(state.currentModel, targetPath);
            
            setState((prev:ApplicationState) => ({
                ...prev,
                currentFilePath: targetPath,
                isDirty: false,
                isLoading: false,
            }));
            
            log.info('Notebook saved successfully:', targetPath);
        } catch (error) {
            log.error('Error saving notebook:', error);
            setError(`Failed to save notebook: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setLoading(false);
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
        
        log.info('New notebook created');
    }, []);

    const setModel = useCallback((model: NotebookModel) => {
        setState((prev:ApplicationState) => ({
            ...prev,
            currentModel: model,
            isDirty: true,
        }));
    }, []);

    const setDirty = useCallback((dirty: boolean) => {
        setState((prev:ApplicationState) => ({ ...prev, isDirty: dirty }));
    }, []);

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
