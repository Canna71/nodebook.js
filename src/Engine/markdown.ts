
// Custom markdown renderer
interface CalculatedValues {
    [key: string]: any;
}

function renderMarkdownWithValues(markdownText: string, calculatedValues: CalculatedValues): string {
    return markdownText.replace(/\{\{([^}]+)\}\}/g, (match: string, expression: string) => {
        // Parse expression (e.g., "revenue | currency")
        const [varName, filter] = expression.split('|').map(s => s.trim());
        const value = calculatedValues[varName];
        
        // Apply filters
        if (filter) {
            return applyFilter(value, filter);
        }
        return value;
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
    currency: (value: number): string => `$${value.toLocaleString()}`,
    round: (value: number, decimals: number = 0): string => value.toFixed(decimals),
    percent: (value: number): string => `${value}%`
};

function applyFilter(value: any, filter: string): string {
    const [filterName, ...args] = filter.split(',').map(s => s.trim());
    const filterFunction = filters[filterName as keyof Filters];
    
    if (!filterFunction) {
        throw new Error(`Unknown filter: ${filterName}`);
    }
    
    return filterFunction(value, ...args.map(Number));
}
