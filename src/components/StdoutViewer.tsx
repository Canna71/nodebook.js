import React, { useState, useEffect, useRef } from 'react';
import anylogger from 'anylogger';

const log = anylogger('StdoutViewer');

interface StdoutLine {
    id: number;
    timestamp: Date;
    type: 'stdout' | 'stderr';
    content: string;
}

interface StdoutViewerProps {
    isVisible: boolean;
    onToggle: () => void;
    lines: StdoutLine[];
    onClear: () => void;
}

export function StdoutViewer({ isVisible, onToggle, lines, onClear }: StdoutViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Auto-scroll to bottom when new lines are added
    useEffect(() => {
        if (autoScroll && containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [lines, autoScroll]);

    // Handle scroll to detect if user scrolled up (disable auto-scroll)
    const handleScroll = () => {
        if (containerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
            setAutoScroll(isAtBottom);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-100 border-t border-gray-700 z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-medium text-gray-200">Output</h3>
                    <span className="text-xs text-gray-400">
                        {lines.length} lines
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
                        title="Clear output"
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
                        title="Close (Ctrl+`)"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                className="h-64 overflow-y-auto px-4 py-2 font-mono text-sm bg-gray-900"
                onScroll={handleScroll}
            >
                {lines.length === 0 ? (
                    <div className="text-gray-500 italic">No output yet...</div>
                ) : (
                    lines.map((line) => (
                        <div key={line.id} className="py-0.5">
                            <span className="text-gray-500 text-xs mr-2">
                                {line.timestamp.toLocaleTimeString()}
                            </span>
                            <span className={`text-xs mr-2 ${
                                line.type === 'stderr' ? 'text-red-400' : 'text-blue-400'
                            }`}>
                                [{line.type}]
                            </span>
                            <span className={line.type === 'stderr' ? 'text-red-300' : 'text-gray-100'}>
                                {line.content}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
