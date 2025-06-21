import { useState, useEffect, useRef } from 'react';
import anylogger from 'anylogger';

const log = anylogger('useStdoutCapture');

interface StdoutLine {
    id: number;
    timestamp: Date;
    type: 'stdout' | 'stderr';
    content: string;
}

const MAX_LINES = 1000;

export function useStdoutCapture() {
    const [lines, setLines] = useState<StdoutLine[]>([]);
    const lineIdRef = useRef(0);
    const originalStdoutRef = useRef<typeof process.stdout.write | null>(null);
    const originalStderrRef = useRef<typeof process.stderr.write | null>(null);

    useEffect(() => {
        // Only set up capture if we're in an Electron environment with process
        if (typeof process === 'undefined' || !process.stdout || !process.stderr) {
            log.warn('Process stdout/stderr not available - stdout capture disabled');
            return;
        }

        log.debug('Setting up stdout capture...');

        // Store original methods
        originalStdoutRef.current = process.stdout.write.bind(process.stdout);
        originalStderrRef.current = process.stderr.write.bind(process.stderr);

        // Override stdout.write
        process.stdout.write = function(chunk: any, encoding?: any, callback?: any): boolean {
            // Call original method first
            const result = originalStdoutRef.current!(chunk, encoding, callback);
            
            // Capture the output
            const content = typeof chunk === 'string' ? chunk : String(chunk);
            log.debug('Captured stdout:', content);
            addLine('stdout', content);
            
            return result;
        };

        // Override stderr.write  
        process.stderr.write = function(chunk: any, encoding?: any, callback?: any): boolean {
            // Call original method first
            const result = originalStderrRef.current!(chunk, encoding, callback);
            
            // Capture the output
            const content = typeof chunk === 'string' ? chunk : String(chunk);
            log.debug('Captured stderr:', content);
            addLine('stderr', content);
            
            return result;
        };

        log.debug('Stdout capture initialized successfully');

        // Cleanup on unmount
        return () => {
            if (originalStdoutRef.current && originalStderrRef.current) {
                process.stdout.write = originalStdoutRef.current;
                process.stderr.write = originalStderrRef.current;
                log.debug('Stdout capture cleaned up');
            }
        };
    }, []);

    const addLine = (type: 'stdout' | 'stderr', content: string) => {
        // Skip empty content or just newlines
        if (!content.trim()) return;

        setLines(prevLines => {
            const newLine: StdoutLine = {
                id: ++lineIdRef.current,
                timestamp: new Date(),
                type,
                content: content.replace(/\n$/, '') // Remove trailing newline
            };

            const newLines = [...prevLines, newLine];

            // Keep only the last MAX_LINES
            if (newLines.length > MAX_LINES) {
                return newLines.slice(-MAX_LINES);
            }

            return newLines;
        });
    };

    const clearLines = () => {
        setLines([]);
        lineIdRef.current = 0;
    };

    return {
        lines,
        clearLines,
        isSupported: typeof process !== 'undefined' && !!process.stdout && !!process.stderr
    };
}
