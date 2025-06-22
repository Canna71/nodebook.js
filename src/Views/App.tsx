import React, { useEffect, useState, useCallback } from 'react'

import { ReactiveProvider } from '../Engine/ReactiveProvider';
import { ApplicationProvider, useApplication } from '@/Engine/ApplicationProvider';
import { CommandProvider } from '@/Engine/CommandProvider';
import { ViewProvider, useView } from '@/Engine/ViewProvider';
import { commandManagerSingleton } from '@/Engine/CommandManagerSingleton';
import anylogger from "anylogger";
import { moduleRegistry } from '../Engine/ModuleRegistry';
import { AIService } from '@/Engine/AIService';

const log = anylogger("App");
log.debug("Initializing App");

import danfojsPlottingExample from "../../examples/danfojs-plotting-example.json";
import { NotebookViewer } from './NotebookViewer';
import { SettingsView } from './SettingsView';
import { HomePage } from './HomePage';
import { NotebookModel, CellDefinition } from 'src/Types/NotebookModel';
import Layout from '@/app/layout';
import { getFileSystemHelpers } from '@/lib/fileSystemHelpers';
import { MathJaxContext } from 'better-react-mathjax';
import { Toolbar } from '@/components/Toolbar';
import { AIDialogProvider } from '@/components/AIDialogProvider';
import { AppDialogProvider } from '@/components/AppDialogProvider';
import { StdoutViewer } from '@/components/StdoutViewer';
import { useStdoutCapture } from '@/hooks/useStdoutCapture';
import { ConsoleViewer } from '@/components/ConsoleViewer';
import { useConsoleCapture } from '@/hooks/useConsoleCapture';
import { DocumentationViewer } from '@/components/DocumentationViewer';
import { KeyboardShortcutsView } from './KeyboardShortcutsView';
import { updateCloseMenuLabel, updateApplicationContext, buildApplicationContext } from '@/lib/electronHelpers';

function AppContent() {
    const { currentModel, loadNotebook, isLoading, error, currentFilePath, addCell: addCellToNotebook, clearNotebook } = useApplication();
    const { currentView, setCurrentView } = useView();
    const { lines, clearLines, isSupported } = useStdoutCapture();
    const { entries, clearEntries, maxEntries } = useConsoleCapture();
    const [stdoutVisible, setStdoutVisible] = useState(false);
    const [consoleVisible, setConsoleVisible] = useState(false);

    // Update application context for menu system when state changes
    useEffect(() => {
        const context = buildApplicationContext(
            currentView,
            !!currentModel,
            false, // TODO: Get actual dirty state
            false, // TODO: Get actual undo state  
            false, // TODO: Get actual redo state
            false, // TODO: Get actual reading mode state
            null,  // TODO: Get actual selected cell ID
            currentModel?.cells?.length || 0
        );
        
        updateApplicationContext(context);
        log.debug('Updated application context for menu:', context);
    }, [currentView, currentModel]);

    // Close view event handler (needs to be defined outside useEffect to avoid stale closure)
    const handleCloseViewEvent = useCallback(() => {
        log.debug('handleCloseViewEvent: Event received. Current view:', currentView, 'Current model:', !!currentModel);
        log.debug('handleCloseViewEvent: All views - current:', currentView, 'expected in settings: "settings"');
        
        // Smart close logic based on current view
        if (currentView === 'notebook' && currentModel) {
            // If we're in notebook view with a notebook loaded, close the notebook
            clearNotebook();
            log.debug('Closed notebook, returned to home');
        } else if (currentView !== 'notebook') {
            // If we're in any other view (settings, docs, shortcuts), go back to notebook/home
            if (currentModel) {
                setCurrentView('notebook');
                log.debug('Closed view, returning to notebook with model');
            } else {
                setCurrentView('notebook');
                log.debug('Closed view, returning to home without model');
            }
        } else {
            log.debug('handleCloseViewEvent: No action taken - already in notebook without model');
        }
        // If we're in notebook view with no notebook loaded, do nothing (already at home)
    }, [currentView, currentModel, clearNotebook, setCurrentView]);

    // Keyboard shortcut handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+` (backtick) to toggle stdout viewer
            if (event.ctrlKey && event.key === '`' && !event.shiftKey) {
                event.preventDefault();
                setStdoutVisible(prev => {
                    log.debug('Toggling stdout viewer via keyboard:', !prev);
                    return !prev;
                });
            }
            
            // Ctrl+Shift+` (backtick) to toggle console viewer
            if (event.ctrlKey && event.shiftKey && event.key === '`') {
                event.preventDefault();
                setConsoleVisible(prev => {
                    log.debug('Toggling console viewer via keyboard:', !prev);
                    return !prev;
                });
            }
        };

        const handleToggleEvent = () => {
            setStdoutVisible(prev => {
                log.debug('Toggling stdout viewer via toolbar button:', !prev);
                return !prev;
            });
        };

        const handleToggleConsoleEvent = () => {
            setConsoleVisible(prev => {
                log.debug('Toggling console viewer via toolbar button:', !prev);
                return !prev;
            });
        };

        const handleShowDocumentationEvent = () => {
            setCurrentView('documentation');
            log.debug('Switching to documentation view');
        };

        const handleShowShortcutsEvent = () => {
            setCurrentView('shortcuts');
            log.debug('Switching to shortcuts view');
        };

        const handleShowSettingsEvent = () => {
            setCurrentView('settings');
            log.debug('Switching to settings view');
        };

        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('toggleOutputPanel', handleToggleEvent);
        window.addEventListener('toggleConsolePanel', handleToggleConsoleEvent);
        window.addEventListener('showDocumentation', handleShowDocumentationEvent);
        window.addEventListener('showShortcuts', handleShowShortcutsEvent);
        window.addEventListener('showSettings', handleShowSettingsEvent);
        window.addEventListener('closeView', handleCloseViewEvent);
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('toggleOutputPanel', handleToggleEvent);
            window.removeEventListener('toggleConsolePanel', handleToggleConsoleEvent);
            window.removeEventListener('showDocumentation', handleShowDocumentationEvent);
            window.removeEventListener('showShortcuts', handleShowShortcutsEvent);
            window.removeEventListener('showSettings', handleShowSettingsEvent);
            window.removeEventListener('closeView', handleCloseViewEvent);
        };
    }, [handleCloseViewEvent]);

    useEffect(() => {
        log.debug("Is this effect needed?:", currentModel);
        // Load default example on startup
        if (!currentModel) {
            const fs = getFileSystemHelpers();
        }
    }, [currentModel, loadNotebook]);

    // Update close menu label when view or notebook state changes
    useEffect(() => {
        updateCloseMenuLabel(currentView, !!currentModel);
    }, [currentView, currentModel]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div>Loading notebook...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-red-500">
                    <div className="text-xl mb-4">Error</div>
                    <div>{error}</div>
                </div>
            </div>
        );
    }

    // Cell management function - generates IDs with type-based prefixes and progressive numbering
    const generateCellId = (cellType: CellDefinition['type']): string => {
        if (!currentModel?.cells) {
            return `${getTypePrefix(cellType)}_01`;
        }

        const prefix = getTypePrefix(cellType);
        const existingIds = new Set(currentModel.cells.map(cell => cell.id));
        
        let counter = 1;
        let candidateId: string;
        
        do {
            const paddedNumber = counter.toString().padStart(2, '0');
            candidateId = `${prefix}_${paddedNumber}`;
            counter++;
        } while (existingIds.has(candidateId));
        
        return candidateId;
    };

    const getTypePrefix = (cellType: CellDefinition['type']): string => {
        switch (cellType) {
            case 'markdown': return 'md';
            case 'code': return 'code';
            case 'formula': return 'fx';
            case 'input': return 'var';
            default: return 'cell';
        }
    };

    const addCell = (cellType: CellDefinition['type'], insertIndex?: number) => {
        // Use state manager's addCell method
        addCellToNotebook(cellType, insertIndex, `Add ${cellType} cell`);
    };

    return (
        <ReactiveProvider>
            <CommandProvider onAddCell={addCell}>
                <MathJaxContext>
                    {currentView === 'settings' ? (
                        <SettingsView />
                    ) : currentView === 'documentation' ? (
                        <DocumentationViewer onClose={() => setCurrentView('notebook')} />
                    ) : currentView === 'shortcuts' ? (
                        <KeyboardShortcutsView onClose={() => setCurrentView('notebook')} />
                    ) : (
                        <>
                            <Toolbar />
                            {currentModel ? (
                                <NotebookViewer model={currentModel} />
                            ) : (
                                <HomePage />
                            )}
                        </>
                    )}
                    
                    {/* Global stdout viewer */}
                    {isSupported && (
                        <StdoutViewer
                            isVisible={stdoutVisible}
                            onToggle={() => setStdoutVisible(!stdoutVisible)}
                            lines={lines}
                            onClear={clearLines}
                        />
                    )}
                    
                    {/* Global console viewer */}
                    <ConsoleViewer
                        isVisible={consoleVisible}
                        onToggle={() => setConsoleVisible(!consoleVisible)}
                        entries={entries}
                        onClear={clearEntries}
                        maxEntries={maxEntries}
                    />
                </MathJaxContext>
            </CommandProvider>
        </ReactiveProvider>
    );
}

export default function App() {
    const [appReady, setAppReady] = React.useState(false);

    React.useEffect(() => {
        const initializeApp = async () => {
            try {
                const initialize = await moduleRegistry.initialize();
                const fs = getFileSystemHelpers();
                
                // Initialize AI Service
                const aiService = AIService.getInstance();
                await aiService.initializeAPIKeys();
                log.info('AIService initialized');

                setAppReady(true);
            } catch (error) {
                log.error('Error initializing app:', error);
                setAppReady(true); // Continue anyway
            }
        };

        initializeApp();
    }, []);

    if (!appReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <div>Initializing Nodebook.js...</div>
                </div>
            </div>
        );
    }    return (
        <Layout>
            <ApplicationProvider commandManager={commandManagerSingleton}>
                <AppDialogProvider>
                    <AIDialogProvider>
                        <AppContent />
                    </AIDialogProvider>
                </AppDialogProvider>
            </ApplicationProvider>
        </Layout>
    );
}
