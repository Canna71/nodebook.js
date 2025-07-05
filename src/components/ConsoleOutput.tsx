import { ObjectDisplay } from "./ObjectDisplay";
import { DomElementDisplay } from './DomElementDisplay';
import { LatexRenderer, isLatexContent, renderMixedContent } from './LatexRenderer';
import { JSX } from "react";

export interface ConsoleOutputProps {
    output: any[];
    initialized: boolean;
}

// Render individual console output line
const ConsoleOutput = (output: any, index: number): JSX.Element => {
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

    // Handle mixed rendering (objects + primitives)
    if (output.isObject && output.data) {
        return (
            <div key={index} className={`console-line console-${output.type}`}>
                <div className="console-content">
                    {output.data.map((item: any, itemIndex: number) => (
                        <span key={itemIndex} className="console-item">
                            {item.type === 'object' ? (
                                <ObjectDisplay 
                                    data={item.data} 
                                    name={false}
                                    collapsed={true}
                                    displayDataTypes={false}
                                    displayObjectSize={false}
                                />
                            ) : typeof item.data === 'string' && isLatexContent(item.data) ? (
                                <span className="latex-console-output">
                                    {renderMixedContent(item.data)}
                                </span>
                            ) : (
                                <span className="console-primitive whitespace-pre-wrap">
                                    {item.message}
                                </span>
                            )}
                            {itemIndex < output.data.length - 1 && <span className="console-separator"> </span>}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    // Handle simple string messages (check for LaTeX)
    if (typeof output.message === 'string' && isLatexContent(output.message)) {
        return (
            <div key={index} className={`console-line console-${output.type}`}>
                <div className="console-content latex-console-output">
                    {renderMixedContent(output.message)}
                </div>
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
            <span className="log-message font-mono break-all whitespace-pre-wrap">
                {output.message}
            </span>
        </div>
    );
};

export default ConsoleOutput;