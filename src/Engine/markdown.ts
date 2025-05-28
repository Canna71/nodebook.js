// Add object display support
import ReactDOMServer from 'react-dom/server';
import React from 'react';

// Custom markdown renderer
interface CalculatedValues {
    [key: string]: any;
}

export function renderMarkdownWithValues(markdownText: string, calculatedValues: CalculatedValues): string {
    return markdownText.replace(/\{\{([^}]+)\}\}/g, (match: string, expression: string) => {
        // Parse expression (e.g., "revenue | currency" or "data | object")
        const [varName, filter] = expression.split('|').map(s => s.trim());
        const value = calculatedValues[varName];
        
        if (value === undefined || value === null) {
            return '—'; // Return dash for undefined values
        }
        
        // Apply filters
        if (filter) {
            return applyFilter(value, filter);
        }
        return String(value);
    });
}

// Filter functions
interface FilterFunction {
    (value: any, ...args: any[]): string;
}

interface Filters {
    currency: FilterFunction;
    round: FilterFunction;
    percent: FilterFunction;
    object: FilterFunction;
    json: FilterFunction;
}

const filters: Filters = {
    currency: (value: number): string => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(value),
    round: (value: number, decimals: number = 0): string => value.toFixed(decimals),
    percent: (value: number): string => `${(value * 100).toFixed(1)}%`,
    object: (value: any): string => {
        // Return a placeholder that will be replaced by React component
        const id = `object-${Math.random().toString(36).substr(2, 9)}`;
        return `<div id="${id}" data-object='${JSON.stringify(value)}'></div>`;
    },
    json: (value: any, indent: number = 2): string => {
        return `<pre><code>${JSON.stringify(value, null, indent)}</code></pre>`;
    }
};

function applyFilter(value: any, filter: string): string {
    const [filterName, ...args] = filter.split(',').map(s => s.trim());
    const filterFunction = filters[filterName as keyof Filters];
    
    if (!filterFunction) {
        console.warn(`Unknown filter: ${filterName}`);
        return String(value);
    }
    
    return filterFunction(value, ...args.map(Number));
}
