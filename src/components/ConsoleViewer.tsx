import React, { useState, useEffect, useRef } from 'react';
import anylogger from 'anylogger';
import { ObjectDisplay } from './ObjectDisplay';

const log = anylogger('ConsoleViewer');

interface ConsoleEntry {
    id: number;
    timestamp: Date;
    level: 'log' | 'warn' | 'error' | 'info' | 'debug';
    args: any[];
}

interface ConsoleViewerProps {
    isVisible: boolean;
    onToggle: () => void;
    entries: ConsoleEntry[];
    onClear: () => void;
    maxEntries: number;
}

export function ConsoleViewer({ isVisible, onToggle, entries, onClear, maxEntries }: ConsoleViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Auto-scroll to bottom when new entries are added
    useEffect(() => {
        if (autoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [entries, autoScroll]);

    // Handle scroll to detect if user scrolled up (disable auto-scroll)
    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
            setAutoScroll(isAtBottom);
        }
    };

    const getLevelColor = (level: ConsoleEntry['level']) => {
        switch (level) {
            case 'error':
                return 'text-error';
            case 'warn':
                return 'text-warning';
            case 'info':
                return 'text-info';
            case 'debug':
                return 'text-debug';
            case 'log':
            default:
                return 'text-success';
        }
    };

    const getLevelBadge = (level: ConsoleEntry['level']) => {
        switch (level) {
            case 'error':
                return 'ERR';
            case 'warn':
                return 'WARN';
            case 'info':
                return 'INFO';
            case 'debug':
                return 'DEBUG';
            case 'log':
            default:
                return 'LOG';
        }
    };

    const renderArgs = (args: any[]) => {
        if (args.length === 0) {
            return <span className="text-console-muted italic">empty</span>;
        }

        return (
            <div className="console-args flex flex-col space-y-1">
                {args.map((arg, index) => (
                    <div key={index} className="console-arg">
                        {typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' ? (
                            <span className="text-foreground">{String(arg)}</span>
                        ) : arg instanceof Error ? (
                            // Special handling for Error objects
                            <div className="error-display bg-error/10 border border-error/30 rounded p-2 mt-1">
                                <div className="text-foreground font-medium text-sm mb-1">
                                    <span className="text-error">{arg.name}:</span> {arg.message}
                                </div>
                                {arg.stack && (
                                    <details className="mt-2">
                                        <summary className="text-muted-foreground text-xs cursor-pointer hover:text-foreground">
                                            Stack trace
                                        </summary>
                                        <pre className="text-muted-foreground text-xs font-mono mt-1 overflow-x-auto whitespace-pre-wrap bg-error/5 p-2 rounded">
                                            {arg.stack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        ) : (
                            <div className="ml-2">
                                <ObjectDisplay 
                                    data={arg} 
                                    name={false}
                                    collapsed={true}
                                    displayDataTypes={false}
                                    displayObjectSize={false}
                                    theme="codeschool"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-console-background text-console-foreground border-t border-console-border z-40"
             style={{ zIndex: 40 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-console-background border-b border-console-border">
                <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-medium text-console-foreground">Console</h3>
                    <span className="text-xs text-console-muted">
                        {entries.length} / {maxEntries} entries
                    </span>
                    {!autoScroll && (
                        <span className="text-xs text-warning">
                            Auto-scroll disabled
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onClear}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear console"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setAutoScroll(true)}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Auto-scroll to bottom"
                        disabled={autoScroll}
                    >
                        ↓
                    </button>
                    <button
                        onClick={onToggle}
                        className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Close (Ctrl+Shift+`)"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                className="h-64 overflow-y-auto px-4 py-2 bg-console-background"
                onScroll={handleScroll}
            >
                {entries.length === 0 ? (
                    <div className="text-console-muted italic">No console output yet...</div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className={`py-1 border-b border-console-border/50 last:border-b-0 ${
                            entry.level === 'error' ? 'bg-error/5 border-error/20' : ''
                        }`}>
                            <div className="flex items-start space-x-2 mb-1">
                                <span className="text-console-muted text-xs font-mono">
                                    {entry.timestamp.toLocaleTimeString()}
                                </span>
                                <span className={`text-xs font-mono font-bold ${getLevelColor(entry.level)}`}>
                                    [{getLevelBadge(entry.level)}]
                                </span>
                            </div>
                            <div className="ml-4">
                                {renderArgs(entry.args)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
