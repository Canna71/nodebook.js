import React from 'react'
import { PricingCalculator } from './PricingCalculator';
import { ReactiveProvider } from '../Engine/ReactiveProvider';
import anylogger from "anylogger";
const log = anylogger("App");
log.debug("Initializing App");

import pricingModel from "../Data/pricingModel.json";
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
