import React, { useEffect } from 'react'

import { ReactiveProvider } from '../Engine/ReactiveProvider';
import { ApplicationProvider, useApplication } from '../Engine/ApplicationProvider';
import anylogger from "anylogger";
import { moduleRegistry } from '../Engine/ModuleRegistry';

const log = anylogger("App");
log.debug("Initializing App");

import danfojsPlottingExample from "../../examples/danfojs-plotting-example.json";
import { NotebookViewer } from './NotebookViewer';
import { NotebookModel } from 'src/Types/NotebookModel';
import Layout from '@/app/layout';
import { getFileSystemHelpers } from '@/Utils/fileSystemHelpers';

function AppContent() {
    const { currentModel, setModel, isLoading, error } = useApplication();

    useEffect(() => {
        // Load default example on startup
        if (!currentModel) {
            setModel(danfojsPlottingExample as NotebookModel);
        }
    }, [currentModel, setModel]);

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

    return (
        <ReactiveProvider>
            <NotebookViewer model={currentModel} />
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

                const examples = await fs.listExamples();
                log.debug('Available examples:', examples);

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
            <div>
                <h2>NotebookJS</h2>
                <ApplicationProvider>
                    <AppContent />
                </ApplicationProvider>
            </div>
        </Layout>
    );
}
