import { useState, useEffect, useRef } from 'react';
import anylogger from 'anylogger';

const log = anylogger('useConsoleCapture');

interface ConsoleEntry {
    id: number;
    timestamp: Date;
    level: 'log' | 'warn' | 'error' | 'info' | 'debug';
    args: any[];
}

const MAX_CONSOLE_ENTRIES = 100;

export function useConsoleCapture() {
    const [entries, setEntries] = useState<ConsoleEntry[]>([]);
    const entryIdRef = useRef(0);
    const originalMethodsRef = useRef<{
        log: typeof console.log;
        warn: typeof console.warn;
        error: typeof console.error;
        info: typeof console.info;
        debug: typeof console.debug;
    } | null>(null);

    useEffect(() => {
        log.debug('Setting up console capture...');

        // DON'T override global console methods - we only want to capture from code cells
        // Store original methods for potential future use
        originalMethodsRef.current = {
            log: console.log.bind(console),
            warn: console.warn.bind(console),
            error: console.error.bind(console),
            info: console.info.bind(console),
            debug: console.debug.bind(console)
        };

        // Expose global capture function for ReactiveSystem
        (window as any).__globalConsoleCapture = (level: ConsoleEntry['level'], args: any[]) => {
            log.info(`Global console capture called for ${level}:`, args);
            addEntry(level, args);
        };

        log.debug('Console capture initialized successfully');

        // Cleanup on unmount
        return () => {
            // Clean up global capture function
            delete (window as any).__globalConsoleCapture;
            log.debug('Console capture cleaned up');
        };
    }, []);

    const addEntry = (level: ConsoleEntry['level'], args: any[]) => {
        setEntries(prevEntries => {
            const newEntry: ConsoleEntry = {
                id: ++entryIdRef.current,
                timestamp: new Date(),
                level,
                args: [...args] // Create a copy to avoid reference issues
            };

            const newEntries = [...prevEntries, newEntry];

            // Keep only the last MAX_CONSOLE_ENTRIES
            if (newEntries.length > MAX_CONSOLE_ENTRIES) {
                return newEntries.slice(-MAX_CONSOLE_ENTRIES);
            }

            return newEntries;
        });
    };

    const clearEntries = () => {
        setEntries([]);
        entryIdRef.current = 0;
    };

    return {
        entries,
        clearEntries,
        maxEntries: MAX_CONSOLE_ENTRIES
    };
}
