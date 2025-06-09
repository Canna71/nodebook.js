import React, { useEffect } from 'react';
import { useApplication } from './ApplicationProvider';
import { useCommands } from './CommandProvider';
import anylogger from 'anylogger';

const log = anylogger('CommandBridge');

/**
 * Bridge component that connects ApplicationProvider's addCell function
 * to CommandProvider's command system. This allows commands to be registered
 * early while still connecting to the actual notebook operations when available.
 */
export function CommandBridge(): null {
    const { addCell: addCellToNotebook } = useApplication();
    const { updateAddCellCallback } = useCommands();

    useEffect(() => {
        if (addCellToNotebook && updateAddCellCallback) {
            log.debug('Connecting addCell function to command system');
            // Create a wrapper function that matches the expected signature
            const wrappedAddCell = (cellType: string, insertIndex?: number) => {
                addCellToNotebook(cellType as any, insertIndex, `Add ${cellType} cell`);
            };
            updateAddCellCallback(wrappedAddCell);
        }
    }, [addCellToNotebook, updateAddCellCallback]);

    return null; // This component doesn't render anything
}
