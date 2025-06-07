import React, { useEffect } from 'react'

import { ReactiveProvider } from '../Engine/ReactiveProvider';
import { ApplicationProvider, useApplication } from '@/Engine/ApplicationProvider';
import anylogger from "anylogger";
import { moduleRegistry } from '../Engine/ModuleRegistry';

const log = anylogger("App");
log.debug("Initializing App");

import danfojsPlottingExample from "../../examples/danfojs-plotting-example.json";
import { NotebookViewer } from './NotebookViewer';
import { NotebookModel } from 'src/Types/NotebookModel';
import Layout from '@/app/layout';
import { getFileSystemHelpers } from '@/lib/fileSystemHelpers';

function AppContent() {
    const { currentModel, loadNotebook, isLoading, error, currentFilePath } = useApplication();

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
            loadNotebook("/Users/gcannata/Projects/notebookjs/examples/runtime-completions-test.json");
            
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
                <ApplicationProvider>
                    <AppContent />
                </ApplicationProvider>
            </div>
        </Layout>
    );
}
