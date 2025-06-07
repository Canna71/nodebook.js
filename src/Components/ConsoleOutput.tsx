import { ObjectDisplay } from "./ObjectDisplay";
import { DomElementDisplay } from './DomElementDisplay';

export interface ConsoleOutputProps {
    output: any[];
    initialized: boolean;
}

// Render individual console output line
const ConsoleOutput = (output: any, index: number) => {
    const timestamp = output.timestamp ? new Date(output.timestamp).toLocaleTimeString() : '';
    
    // Determine display style based on log level
    const getLogLevelPrefix = (type: string) => {
        switch (type) {
            case 'error': return '✗';
            case 'warn': return '⚠';
            case 'info': return 'ℹ';
            case 'log': default: return '';
        }
    };

    const prefix = getLogLevelPrefix(output.type);

    if (output.isObject && output.data) {
        return (
            <div key={index} className="console-line mb-3 flex gap-2 text-xs" data-log-level={output.type}>
                <span className="timestamp text-muted-foreground/60 shrink-0 font-mono">
                    {timestamp}
                </span>
                {prefix && (
                    <span className="log-prefix shrink-0">
                        {prefix}
                    </span>
                )}
                <span className="log-message font-mono break-all ml-0">
                    {Array.isArray(output.data) ? (
                        // Mixed arguments - render each one appropriately
                        <div className="space-y-2">
                            {output.data.map((arg: any, argIndex: number) => (
                                <div key={argIndex}>
                                    {arg.type === 'object' ? (
                                        // NEW: Check if the object is a DOM element
                                        arg.data instanceof HTMLElement || arg.data instanceof SVGElement ? (
                                            <DomElementDisplay
                                                element={arg.data}
                                                name={false}
                                            />
                                        ) : (
                                            <ObjectDisplay
                                                data={arg.data}
                                                name={false}
                                                collapsed={true}
                                                displayDataTypes={false}
                                                displayObjectSize={false} />
                                        )
                                    ) : (
                                        <span className="text-foreground font-mono text-sm">{arg.message}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Single object
                        <ObjectDisplay
                            data={output.data}
                            name={false}
                            collapsed={false}
                            displayDataTypes={false}
                            displayObjectSize={false} />
                    )}
                </span>
            </div>
        );
    }

    return (
        <div key={index} className="console-line flex gap-2 text-xs" data-log-level={output.type}>
            <span className="timestamp text-muted-foreground/60 shrink-0 font-mono">
                {timestamp}
            </span>
            {prefix && (
                <span className="log-prefix shrink-0">
                    {prefix}
                </span>
            )}
            <span className="log-message font-mono break-all">
                {output.message}
            </span>
        </div>
    );
};

export default ConsoleOutput;