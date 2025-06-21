# Formula Syntax Guide

Nodebook.js supports two formula syntaxes that can be used interchangeably:

## Legacy `$variable` Syntax

The `$variable` syntax provides explicit reactive variable references:

```javascript
// Simple variable reference
$finalPrice

// Basic calculations
$basePrice * 1.08

// Conditionals with $ syntax
$discount > 0 ? $discount : 0
```

**Advantages:**
- ✅ Visually clear that variables are reactive
- ✅ Template-like feel familiar to many users
- ✅ Explicit about which values are dynamic

## Enhanced Natural JavaScript Syntax

The enhanced syntax supports full JavaScript expressions:

```javascript
// Simple variable reference (no $ needed)
finalPrice

// Complex math operations
Math.round((finalPrice * 1.05 + Math.max(0, discount - 10)) * 100) / 100

// Natural conditionals
discount > 0 ? discount + (basePrice * 0.01) : 0

// Built-in functions
Math.sqrt(basePrice)
Math.max(taxAmount, discount)
```

**Advantages:**
- ✅ Native JavaScript - familiar to developers
- ✅ Full Math library support
- ✅ Better IDE support and syntax highlighting
- ✅ Supports complex expressions naturally

## Mixing Syntaxes

You can mix both syntaxes in the same formula (though not recommended for readability):

```javascript
// Mixed syntax (converted automatically)
$basePrice + Math.round(discount * 1.1)
// Becomes: basePrice + Math.round(discount * 1.1)
```

## Available Functions

### Math Functions
All standard JavaScript Math functions are available:

```javascript
Math.round(42.7)          // 43
Math.max(10, 20, 5)       // 20
Math.min(10, 20, 5)       // 5
Math.abs(-15)             // 15
Math.sqrt(16)             // 4
Math.pow(2, 3)            // 8
Math.floor(3.8)           // 3
Math.ceil(3.2)            // 4
```

### Conditional Expressions
Standard JavaScript conditionals work:

```javascript
// Ternary operator
price > 100 ? price * 0.9 : price

// Logical operators
discount > 0 && basePrice > 500 ? discount * 1.1 : discount
```

## Best Practices

### 🎯 Use `$variable` for:
- Simple variable references
- When reactive nature should be visually obvious
- Template-like formulas

```javascript
$finalPrice
$taxRate
$basePrice * $taxRate
```

### 🎯 Use Natural syntax for:
- Complex calculations
- Math-heavy formulas
- When you want IDE support

```javascript
Math.round((finalPrice * taxRate / 100) * 100) / 100
Math.max(0, basePrice - discount)
finalPrice > 1000 ? finalPrice * 0.05 : 0
```

## Formula Examples

### Price Calculations
```javascript
// Legacy syntax
$basePrice * (1 + $taxRate / 100)

// Enhanced syntax  
basePrice * (1 + taxRate / 100)

// Complex with rounding
Math.round((basePrice * (1 + taxRate / 100)) * 100) / 100
```

### Discount Logic
```javascript
// Legacy syntax
$basePrice > 500 ? $basePrice * 0.1 : 0

// Enhanced syntax
basePrice > 500 ? basePrice * 0.1 : 0

// Complex tiered discounts
basePrice > 1000 ? basePrice * 0.15 : 
basePrice > 500 ? basePrice * 0.1 : 
basePrice > 100 ? basePrice * 0.05 : 0
```

### Statistical Calculations
```javascript
// Average of multiple values
(price1 + price2 + price3) / 3

// Weighted average
(price1 * weight1 + price2 * weight2) / (weight1 + weight2)

// Standard deviation approximation
Math.sqrt(Math.pow(value1 - average, 2) + Math.pow(value2 - average, 2)) / 2
```

## Migration from Legacy

Existing formulas using `$variable` syntax continue to work without changes. The system automatically converts `$variable` to `variable` internally.

To migrate to enhanced syntax:
1. Remove `$` prefixes from variable names
2. Add Math. prefix for mathematical functions
3. Test the formula to ensure it works as expected

## Error Handling

Formulas with errors will:
1. Display an error message in the console
2. Return `null` instead of crashing
3. Allow you to fix and retry

```javascript
// This will gracefully handle errors
someUndefinedVariable || 0

// This will show an error but not crash
Math.round(undefined) // Error logged, returns null
```

## Performance Notes

Both syntaxes have identical performance characteristics:
- Dependency tracking is automatic and efficient
- Formulas only re-execute when dependencies change
- Complex calculations are optimized by JavaScript engine

Choose the syntax that best fits your use case and team preferences!
