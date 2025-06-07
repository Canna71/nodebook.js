// Shared formatting utilities for consistent value formatting across the application
// Used by both markdown filters and formula cells

export type OutputFormat = 'number' | 'currency' | 'percentage' | 'text';

export interface FormatOptions {
  decimals?: number;
  currency?: string;
  locale?: string;
}

/**
 * Format a value as currency
 */
export function formatCurrency(value: number, options: FormatOptions = {}): string {
  const { decimals = 2, currency = 'USD', locale = 'en-US' } = options;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a value as a percentage
 * @param value - The value to format (0.1 = 10%, 1 = 100%)
 * @param options - Formatting options
 */
export function formatPercentage(value: number, options: FormatOptions = {}): string {
  const { decimals = 1, locale = 'en-US' } = options;
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a value as a number
 */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const { decimals = 2, locale = 'en-US' } = options;
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Round a number to specified decimal places
 */
export function formatRounded(value: number, decimals: number = 0): string {
  return value.toFixed(decimals);
}

/**
 * Format a value as text
 */
export function formatText(value: any): string {
  return String(value);
}

/**
 * Format a value as JSON
 */
export function formatJson(value: any, indent: number = 2): string {
  return `<pre><code>${JSON.stringify(value, null, indent)}</code></pre>`;
}

/**
 * Format an object for display (used by markdown object filter)
 */
export function formatObject(value: any): string {
  // Return a placeholder that will be replaced by React component
  const id = `object-${Math.random().toString(36).substr(2, 9)}`;
  return `<div id="${id}" data-object='${JSON.stringify(value)}'></div>`;
}

/**
 * Universal formatter that handles all format types
 * Used by formula cells
 */
export function formatValue(
  value: any, 
  format: OutputFormat, 
  options: FormatOptions = {}
): string {
  if (value === null || value === undefined) {
    return 'Not calculated';
  }

  const numericValue = Number(value);
  
  switch (format) {
    case 'currency':
      return formatCurrency(numericValue, options);
    
    case 'percentage':
      // For formula cells, we expect the value to be a decimal (0.1 = 10%)
      // So we need to divide by 100 to get the correct percentage
      return formatPercentage(numericValue / 100, options);
    
    case 'number':
      return formatNumber(numericValue, options);
    
    case 'text':
    default:
      return formatText(value);
  }
}

/**
 * Filter functions for markdown system
 * These maintain the existing filter interface while using shared formatters
 */
export interface FilterFunction {
  (value: any, ...args: any[]): string;
}

export const markdownFilters: Record<string, FilterFunction> = {
  currency: (value: number, decimals?: number) => 
    formatCurrency(value, { decimals }),
  
  round: (value: number, decimals: number = 0) => 
    formatRounded(value, decimals),
  
  percent: (value: number, decimals?: number) => {
    // For markdown filters, we expect the raw decimal value (0.1)
    // and convert it to percentage by multiplying by 100
    const percentageValue = value * 100;
    return `${percentageValue.toFixed(decimals ?? 1)}%`;
  },
  
  number: (value: number, decimals?: number) => 
    formatNumber(value, { decimals }),
  
  text: (value: any) => 
    formatText(value),
  
  object: (value: any) => 
    formatObject(value),
  
  json: (value: any, indent: number = 2) => 
    formatJson(value, indent)
};

/**
 * Apply a markdown filter to a value
 */
export function applyMarkdownFilter(value: any, filterExpression: string): string {
  const [filterName, ...args] = filterExpression.split(',').map(s => s.trim());
  const filterFunction = markdownFilters[filterName];
  
  if (!filterFunction) {
    console.warn(`Unknown filter: ${filterName}`);
    return String(value);
  }
  
  return filterFunction(value, ...args.map(arg => {
    // Try to convert to number, fall back to string
    const num = Number(arg);
    return isNaN(num) ? arg : num;
  }));
}
