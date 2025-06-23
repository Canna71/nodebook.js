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
        <div className="fixed bottom-0 left-0 right-0 bg-console-background text-console-foreground border-t border-console-border z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-console-background border-b border-console-border">
                <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-medium text-console-foreground">Output</h3>
                    <span className="text-xs text-console-muted">
                        {lines.length} lines
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
                        title="Clear output"
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
                        title="Close (Ctrl+`)"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                className="h-64 overflow-y-auto px-4 py-2 font-mono text-sm bg-console-background"
                onScroll={handleScroll}
            >
                {lines.length === 0 ? (
                    <div className="text-console-muted italic">No output yet...</div>
                ) : (
                    lines.map((line) => (
                        <div key={line.id} className="py-0.5">
                            <span className="text-console-muted text-xs mr-2">
                                {line.timestamp.toLocaleTimeString()}
                            </span>
                            <span className={`text-xs mr-2 ${
                                line.type === 'stderr' ? 'text-error' : 'text-info'
                            }`}>
                                [{line.type}]
                            </span>
                            <span className={line.type === 'stderr' ? 'text-error' : 'text-console-foreground'}>
                                {line.content}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
