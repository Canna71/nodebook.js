// Custom markdown renderer
interface CalculatedValues {
    [key: string]: any;
}

export function renderMarkdownWithValues(markdownText: string, calculatedValues: CalculatedValues): string {
    return markdownText.replace(/\{\{([^}]+)\}\}/g, (match: string, expression: string) => {
        // Parse expression (e.g., "revenue | currency")
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
    (value: number, decimals?: number): string;
}

interface Filters {
    currency: FilterFunction;
    round: FilterFunction;
    percent: FilterFunction;
}

const filters: Filters = {
    currency: (value: number): string => new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(value),
    round: (value: number, decimals: number = 0): string => value.toFixed(decimals),
    percent: (value: number): string => `${(value * 100).toFixed(1)}%`
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
