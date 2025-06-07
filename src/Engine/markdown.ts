// Add object display support
import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { applyMarkdownFilter } from '@/lib/formatters';

// Custom markdown renderer
interface CalculatedValues {
    [key: string]: any;
}

export function renderMarkdownWithValues(markdownText: string, calculatedValues: CalculatedValues): string {
    return markdownText.replace(/\{\{([^}]+)\}\}/g, (match: string, expression: string) => {
        try {
            // Check if this is a filter expression (contains pipe)
            if (expression.includes('|')) {
                const [varExpression, filter] = expression.split('|').map(s => s.trim());
                
                // Evaluate the variable expression first
                const value = evaluateExpression(varExpression.trim(), calculatedValues);
                
                if (value === undefined || value === null) {
                    return '—'; // Return dash for undefined values
                }
                
                // Apply filters
                return applyMarkdownFilter(value, filter);
            } else {
                // Evaluate as JavaScript expression
                const result = evaluateExpression(expression.trim(), calculatedValues);
                
                if (result === undefined || result === null) {
                    return '—';
                }
                
                return String(result);
            }
        } catch (error) {
            console.warn(`Error evaluating expression "${expression}":`, error);
            return `[Error: ${expression}]`;
        }
    });
}

// Safely evaluate JavaScript expressions with access to calculated values
function evaluateExpression(expression: string, calculatedValues: CalculatedValues): any {
    try {
        // Create a safe evaluation context
        const context: any = {
            ...calculatedValues,
            // Add some safe utility functions
            Math,
            Number,
            String,
            Boolean,
            Array,
            Object,
            Date,
            JSON
        };
        
        // Create function that evaluates the expression in the context
        const contextKeys = Object.keys(context);
        const contextValues = Object.values(context);
        
        // Use Function constructor for safer evaluation than eval
        const func = new Function(...contextKeys, `
            // undefined and null are already available as global keywords
            return (${expression});
        `);
        
        // Execute the function with the context values
        return func(...contextValues);
    } catch (error) {
        console.warn(`Failed to evaluate expression: ${expression}`, error);
        return undefined;
    }
}
