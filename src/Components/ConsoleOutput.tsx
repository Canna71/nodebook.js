import { ObjectDisplay } from "./ObjectDisplay";

export interface ConsoleOutputProps {
    output: any[];
    initialized: boolean;
}

// Render individual console output line
const ConsoleOutput = (output: any, index: number) => {
    const prefix = output.type === 'log' ? '' : `[${output.type.toUpperCase()}] `;

    if (output.isObject && output.data) {
        return (
            <div key={index} className="console-line mb-3">
                <div className="mb-1">
                    <span className="text-xs text-foreground">{prefix}</span>
                </div>
                <div className="ml-0">
                    {Array.isArray(output.data) ? (
                        // Mixed arguments - render each one appropriately
                        <div className="space-y-2">
                            {output.data.map((arg: any, argIndex: number) => (
                                <div key={argIndex}>
                                    {arg.type === 'object' ? (
                                        <ObjectDisplay
                                            data={arg.data}
                                            name={false}
                                            collapsed={false}
                                            displayDataTypes={false}
                                            displayObjectSize={false} />
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
                </div>
            </div>
        );
    }

    return (
        <div key={index} className="console-line">
            <span className="text-xs">{prefix}{output.message}</span>
        </div>
    );
};

export default ConsoleOutput;