import React, { useEffect } from 'react'

import { ReactiveProvider } from '../Engine/ReactiveProvider';
import anylogger from "anylogger";
import { moduleRegistry } from '../Engine/ModuleRegistry';

const log = anylogger("App");
log.debug("Initializing App");

import pricingModel from "../../examples/pricingModel.json";
import filesystemExample from "../../examples/filesystem-example.json";
import danfojsExample from "../../examples/danfojs-example.json";
import tensorFlowExample from "../../examples/tensorflow-example.json";
import simpleExample from "../../examples/simple-inputs-example.json";
import { NotebookViewer } from './NotebookViewer';
import { NotebookModel } from 'src/Types/NotebookModel';

export default function App() {
    const [appReady, setAppReady] = React.useState(false);

    React.useEffect(() => {
        const initializeApp = () => {
            try {
                // Log available modules
                const availableModules = moduleRegistry.getAvailableModules();
                log.info('Available modules:', availableModules);

                // Check for specific modules we care about
                const importantModules = ['os', 'path', 'fs', 'danfojs'];
                importantModules.forEach(moduleName => {
                    if (moduleRegistry.hasModule(moduleName)) {
                        log.info(`✓ ${moduleName} is available`);
                    } else {
                        log.warn(`✗ ${moduleName} is not available`);
                    }
                });

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
        <div>
            <h2>NotebookJS</h2>

            <ReactiveProvider>
                <NotebookViewer model={danfojsExample as NotebookModel} />
            </ReactiveProvider>
        </div>
    )
}
