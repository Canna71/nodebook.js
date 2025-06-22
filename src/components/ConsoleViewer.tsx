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
                return 'text-red-400';
            case 'warn':
                return 'text-yellow-400';
            case 'info':
                return 'text-blue-400';
            case 'debug':
                return 'text-gray-400';
            case 'log':
            default:
                return 'text-green-400';
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
            return <span className="text-gray-500 italic">empty</span>;
        }

        return (
            <div className="console-args flex flex-col space-y-1">
                {args.map((arg, index) => (
                    <div key={index} className="console-arg">
                        {typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' ? (
                            <span className="text-gray-100">{String(arg)}</span>
                        ) : arg instanceof Error ? (
                            // Special handling for Error objects
                            <div className="error-display bg-red-900/20 border border-red-500/30 rounded p-2 mt-1">
                                <div className="text-red-400 font-medium text-sm mb-1">
                                    {arg.name}: {arg.message}
                                </div>
                                {arg.stack && (
                                    <details className="mt-2">
                                        <summary className="text-red-300 text-xs cursor-pointer hover:text-red-200">
                                            Stack trace
                                        </summary>
                                        <pre className="text-red-300/80 text-xs font-mono mt-1 overflow-x-auto whitespace-pre-wrap bg-red-950/30 p-2 rounded">
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
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-100 border-t border-gray-700 z-40"
             style={{ zIndex: 40 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-medium text-gray-200">Console</h3>
                    <span className="text-xs text-gray-400">
                        {entries.length} / {maxEntries} entries
                    </span>
                    {!autoScroll && (
                        <span className="text-xs text-yellow-400">
                            Auto-scroll disabled
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onClear}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                        title="Clear console"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setAutoScroll(true)}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                        title="Auto-scroll to bottom"
                        disabled={autoScroll}
                    >
                        ↓
                    </button>
                    <button
                        onClick={onToggle}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                        title="Close (Ctrl+Shift+`)"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                className="h-64 overflow-y-auto px-4 py-2 bg-gray-900"
                onScroll={handleScroll}
            >
                {entries.length === 0 ? (
                    <div className="text-gray-500 italic">No console output yet...</div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className={`py-1 border-b border-gray-800 last:border-b-0 ${
                            entry.level === 'error' ? 'bg-red-950/20 border-red-800/30' : ''
                        }`}>
                            <div className="flex items-start space-x-2 mb-1">
                                <span className="text-gray-500 text-xs font-mono">
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
