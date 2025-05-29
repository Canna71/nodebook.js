import React from 'react'

import { ReactiveProvider } from '../Engine/ReactiveProvider';
import anylogger from "anylogger";
const log = anylogger("App");
log.debug("Initializing App");

import pricingModel from "../../examples/pricingModel.json";
import filesystemExample from "../../examples/filesystem-example.json";
import danfojsExample from "../../examples/danfojs-example.json";
import { NotebookViewer } from './NotebookViewer';
import { NotebookModel } from 'src/Types/NotebookModel';

export default function App() {
    return (
        <div>
            <h2>NotebookJS</h2>
           
            <ReactiveProvider>
                <NotebookViewer model={pricingModel as NotebookModel} />
            </ReactiveProvider>
        </div>
    )
}
