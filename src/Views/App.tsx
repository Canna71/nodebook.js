import React, { useEffect, useState } from 'react'

import { ReactiveProvider } from '../Engine/ReactiveProvider';
import { ApplicationProvider, useApplication } from '@/Engine/ApplicationProvider';
import { CommandProvider } from '@/Engine/CommandProvider';
import { commandManagerSingleton } from '@/Engine/CommandManagerSingleton';
import anylogger from "anylogger";
import { moduleRegistry } from '../Engine/ModuleRegistry';

const log = anylogger("App");
log.debug("Initializing App");

import danfojsPlottingExample from "../../examples/danfojs-plotting-example.json";
import { NotebookViewer } from './NotebookViewer';
import { NotebookModel, CellDefinition } from 'src/Types/NotebookModel';
import Layout from '@/app/layout';
import { getFileSystemHelpers } from '@/lib/fileSystemHelpers';

function AppContent() {
    const { currentModel, loadNotebook, isLoading, error, currentFilePath, setModel, setDirty } = useApplication();

    useEffect(() => {
        log.debug("AppContent mounted, currentModel:", currentModel);
        // Load default example on startup
        if (!currentModel) {
            const fs = getFileSystemHelpers();
            // fs.loadNotebook("../../examples/danfojs-plotting-example.json")
            // loadNotebook("/Users/gcannata/Projects/notebookjs/examples/danfojs-plotting-example.json");
            // loadNotebook("/Users/gcannata/Projects/notebookjs/examples/danfojs-example.json");
            // loadNotebook("/Users/gcannata/Projects/notebookjs/examples/d3-visualization-example.json");
            // loadNotebook("/Users/gcannata/Projects/notebookjs/examples/pricingModel.json");
            loadNotebook("/Users/gcannata/Projects/notebookjs/examples/reactive-system-test.json");
            
        }
    }, [currentModel, loadNotebook]);

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

    if (!currentModel) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div>No notebook loaded</div>
                </div>
            </div>
        );
    }

    // Cell management function
    const generateCellId = (): string => {
        return `cell_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    const addCell = (cellType: CellDefinition['type'], insertIndex?: number) => {
        if (!currentModel) {
            console.error('No current model available');
            return;
        }

        const newId = generateCellId();
        let newCell: CellDefinition;

        switch (cellType) {
            case 'markdown':
                newCell = {
                    type: 'markdown',
                    id: newId,
                    content: '# New Section\n\nAdd your content here...'
                };
                break;
            case 'code':
                newCell = {
                    type: 'code',
                    id: newId,
                    code: '// Write your code here\nconsole.log("Hello, world!");'
                };
                break;
            case 'formula':
                newCell = {
                    type: 'formula',
                    id: newId,
                    variableName: `result_${Date.now()}`,
                    formula: '$variable1 + $variable2',
                };
                break;
            case 'input':
                newCell = {
                    type: 'input',
                    id: newId,
                    inputType: 'number',
                    variableName: `input_${Date.now()}`,
                    value: 0
                };
                break;
            default:
                console.error(`Unknown cell type: ${cellType}`);
                return;
        }

        const newCells = [...currentModel.cells];
        const targetIndex = insertIndex ?? newCells.length;
        newCells.splice(targetIndex, 0, newCell);

        const updatedModel = { ...currentModel, cells: newCells };
        setModel(updatedModel); // Update the model through the application provider
        setDirty(true);
    };

    return (
        <ReactiveProvider>
            <CommandProvider onAddCell={addCell}>
                <NotebookViewer model={currentModel} />
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
                    <div>Initializing NotebookJS...</div>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <ApplicationProvider commandManager={commandManagerSingleton}>
                <AppContent />
            </ApplicationProvider>
        </Layout>
    );
}
