import { useMemo } from 'react';
import { Completion } from '@codemirror/autocomplete';
import { useReactiveSystem } from '@/Engine/ReactiveProvider';

/**
 * Hook to generate completion suggestions specifically for formula cells
 * Provides reactive variables, math functions, and formula-specific syntax
 */
export function useFormulaCompletions() {
    const { reactiveStore } = useReactiveSystem();

    const completions = useMemo(() => {
        const suggestions: Completion[] = [];

        // 1. All reactive variables (both with and without $ prefix for flexibility)
        const allVariables = reactiveStore.getAllVariableNames();
        allVariables.forEach(varName => {
            // Skip internal variables (like execution counts)
            if (varName.startsWith('__cell_') || varName.startsWith('__formula_')) {
                return;
            }

            // Add variable without $ prefix (enhanced syntax)
            suggestions.push({
                label: varName,
                type: "variable",
                info: `Reactive variable: ${varName}`,
                detail: "Enhanced Syntax"
            });

            // Add variable with $ prefix (legacy syntax)
            suggestions.push({
                label: `$${varName}`,
                type: "variable", 
                info: `Reactive variable: ${varName} (legacy syntax)`,
                detail: "Legacy Syntax"
            });
        });

        // 2. Math object and its methods
        suggestions.push({
            label: "Math",
            type: "namespace",
            info: "Mathematical functions and constants",
            detail: "JavaScript Global"
        });

        // Add all Math methods
        const mathMethods = [
            'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
            'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor',
            'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2',
            'max', 'min', 'pow', 'random', 'round', 'sign', 'sin', 'sinh',
            'sqrt', 'tan', 'tanh', 'trunc'
        ];

        mathMethods.forEach(method => {
            suggestions.push({
                label: `Math.${method}`,
                type: "method",
                info: `Math.${method}() - Mathematical function`,
                detail: "Math Object"
            });
        });

        // Add Math constants
        const mathConstants = ['E', 'LN10', 'LN2', 'LOG10E', 'LOG2E', 'PI', 'SQRT1_2', 'SQRT2'];
        mathConstants.forEach(constant => {
            suggestions.push({
                label: `Math.${constant}`,
                type: "constant",
                info: `Math.${constant} - Mathematical constant`,
                detail: "Math Object"
            });
        });

        // 3. Common JavaScript operators and keywords for formulas
        const formulaKeywords = [
            {
                label: "true",
                type: "keyword",
                info: "Boolean true value",
                detail: "JavaScript"
            },
            {
                label: "false", 
                type: "keyword",
                info: "Boolean false value",
                detail: "JavaScript"
            },
            {
                label: "null",
                type: "keyword",
                info: "Null value",
                detail: "JavaScript"
            },
            {
                label: "undefined",
                type: "keyword", 
                info: "Undefined value",
                detail: "JavaScript"
            }
        ];

        suggestions.push(...formulaKeywords);

        // 4. Common formula patterns and functions
        const formulaPatterns = [
            {
                label: "? : (ternary)",
                type: "snippet",
                info: "condition ? valueIfTrue : valueIfFalse",
                detail: "Conditional Expression"
            },
            {
                label: "Math.round(x)",
                type: "snippet",
                info: "Round to nearest integer",
                detail: "Common Pattern"
            },
            {
                label: "Math.max(a, b)",
                type: "snippet", 
                info: "Maximum of two or more values",
                detail: "Common Pattern"
            },
            {
                label: "Math.min(a, b)",
                type: "snippet",
                info: "Minimum of two or more values", 
                detail: "Common Pattern"
            },
            {
                label: "x > 0 ? x : 0",
                type: "snippet",
                info: "Ensure non-negative value",
                detail: "Common Pattern"
            }
        ];

        suggestions.push(...formulaPatterns);

        // 5. Number methods that can be useful in formulas
        const numberMethods = [
            {
                label: "Number.isNaN",
                type: "function",
                info: "Check if value is NaN",
                detail: "Number Object"
            },
            {
                label: "Number.isFinite",
                type: "function", 
                info: "Check if value is finite",
                detail: "Number Object"
            },
            {
                label: "Number.parseInt",
                type: "function",
                info: "Parse string to integer",
                detail: "Number Object"
            },
            {
                label: "Number.parseFloat",
                type: "function",
                info: "Parse string to float",
                detail: "Number Object"
            },
            {
                label: "toFixed",
                type: "method",
                info: "Format number with fixed decimal places",
                detail: "Number Method"
            }
        ];

        suggestions.push(...numberMethods);

        return suggestions;
    }, [reactiveStore]);

    return completions;
}
