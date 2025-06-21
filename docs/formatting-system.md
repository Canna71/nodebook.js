# Value Formatting System

Nodebook.js uses a unified formatting system that provides consistent value formatting across markdown cells and formula cells. The shared formatting utilities are located in `src/lib/formatters.ts`.

## Overview

The formatting system supports multiple output formats:
- **Number**: Standard numeric formatting with customizable decimal places
- **Currency**: Localized currency formatting (default: USD)
- **Percentage**: Percentage formatting with proper decimal handling
- **Text**: String representation of any value
- **JSON**: Pretty-printed JSON with syntax highlighting
- **Object**: Interactive object display (for complex data structures)

## Shared Formatters

### Core Functions

```typescript
import { 
  formatNumber, 
  formatCurrency, 
  formatPercentage, 
  formatText,
  formatValue 
} from '@/lib/formatters';

// Format as number
formatNumber(123.456, { decimals: 2 }); // "123.46"

// Format as currency
formatCurrency(123.45, { decimals: 2, currency: 'USD' }); // "$123.45"

// Format as percentage
formatPercentage(0.1234, { decimals: 1 }); // "12.3%"

// Universal formatter
formatValue(123.45, 'currency', { decimals: 2 }); // "$123.45"
```

### Format Options

```typescript
interface FormatOptions {
  decimals?: number;    // Number of decimal places (default: 2)
  currency?: string;    // Currency code (default: 'USD')
  locale?: string;      // Locale for formatting (default: 'en-US')
}
```

## Usage in Markdown Cells

Markdown cells use the pipe filter syntax to apply formatting:

```markdown
<!-- Basic formatting -->
Price: {{basePrice | currency}}
Rate: {{taxRate | percent}}
Amount: {{quantity | round,0}}

<!-- With decimal control -->
Precise: {{value | currency,4}}
Rounded: {{value | round,1}}
```

### Available Markdown Filters

| Filter | Usage | Example Input | Example Output |
|--------|-------|---------------|----------------|
| `currency` | `{{value \| currency}}` | `123.45` | `$123.45` |
| `currency,decimals` | `{{value \| currency,4}}` | `123.45` | `$123.4500` |
| `percent` | `{{value \| percent}}` | `0.1234` | `12.3%` |
| `percent,decimals` | `{{value \| percent,2}}` | `0.1234` | `12.34%` |
| `round` | `{{value \| round,2}}` | `123.456` | `123.46` |
| `number` | `{{value \| number,1}}` | `123.456` | `123.5` |
| `text` | `{{value \| text}}` | `any` | `"any"` |
| `json` | `{{object \| json}}` | `{a: 1}` | Pretty JSON |
| `object` | `{{object \| object}}` | `{a: 1}` | Interactive display |

### Percentage Handling in Markdown

In markdown filters, percentage values are expected as decimals (0.1 = 10%) and are automatically converted:

```markdown
<!-- Input: taxRate = 0.085 -->
Tax Rate: {{taxRate | percent}} <!-- Output: 8.5% -->
```

## Usage in Formula Cells

Formula cells use configuration-based formatting through cell properties:

```json
{
  "type": "formula",
  "variableName": "total",
  "formula": "$basePrice * $quantity",
  "outputFormat": "currency",
  "decimals": 2
}
```

### Formula Cell Configuration

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `outputFormat` | `string` | Format type: `number`, `currency`, `percentage`, `text` | `"currency"` |
| `decimals` | `number` | Decimal places for numeric formats | `2` |

### Percentage Handling in Formula Cells

Formula cells expect percentage values as whole numbers that represent percentages (8.5 = 8.5%):

```javascript
// In code cell: exports.rate = 8.5 (meaning 8.5%)
// Formula cell with outputFormat: "percentage" displays: 8.5%
```

## Implementation Details

### Percentage Conversion

The system handles two different percentage conventions:

1. **Markdown Filters**: Expect decimal values (0.085 = 8.5%)
   ```javascript
   // Converts 0.085 to "8.5%"
   percent: (value) => `${(value * 100).toFixed(1)}%`
   ```

2. **Formula Cells**: Expect percentage values (8.5 = 8.5%)
   ```javascript
   // Converts 8.5 to "8.5%" using Intl.NumberFormat
   formatPercentage(8.5 / 100, options)
   ```

### Localization Support

All formatters support localization through the `Intl` API:

```typescript
// Custom locale
formatCurrency(123.45, { locale: 'de-DE', currency: 'EUR' }); // "123,45 €"
formatNumber(1234.56, { locale: 'fr-FR', decimals: 2 }); // "1 234,56"
```

### Error Handling

The formatting system gracefully handles edge cases:

- `null` or `undefined` values return `"Not calculated"`
- Invalid numbers fall back to text representation
- Unknown filters log warnings and return string values
- Type conversion errors are caught and handled

## Best Practices

### 1. Consistent Decimal Places

Use consistent decimal places within the same context:

```markdown
<!-- Good: Consistent formatting -->
- Base: {{base | currency,2}}
- Tax: {{tax | currency,2}}  
- Total: {{total | currency,2}}

<!-- Less ideal: Inconsistent decimals -->
- Base: {{base | currency}}
- Tax: {{tax | currency,4}}
- Total: {{total | currency,1}}
```

### 2. Choose Appropriate Formats

Match format to data type:

```markdown
<!-- Financial data -->
Revenue: {{revenue | currency}}

<!-- Rates and ratios -->
Growth Rate: {{growthRate | percent,1}}

<!-- Counts and quantities -->
Items: {{count | round,0}}

<!-- Precise calculations -->
Result: {{calculation | number,4}}
```

### 3. Handle Null Values

The system automatically handles null/undefined values, but you can provide custom fallbacks:

```markdown
<!-- Automatic handling -->
Price: {{price | currency}} <!-- Shows "Not calculated" if price is null -->

<!-- Custom fallback in expression -->
Price: {{price ? (price | currency) : 'No price set'}}
```

### 4. Performance Considerations

- Formatters are optimized for frequent use
- Avoid complex calculations within filter expressions
- Cache formatted results when possible in code cells

## Examples

### Financial Dashboard

```markdown
## Financial Summary

**Revenue Metrics:**
- Gross Revenue: {{grossRevenue | currency}}
- Net Revenue: {{netRevenue | currency,2}}
- Profit Margin: {{profitMargin | percent,1}}

**Growth Indicators:**
- MoM Growth: {{momGrowth | percent,2}}
- YoY Growth: {{yoyGrowth | percent,2}}

**Key Performance:**
- Average Order: {{avgOrder | currency,2}}
- Customer Count: {{customerCount | round,0}}
- Conversion Rate: {{conversionRate | percent,1}}
```

### Scientific Data

```markdown
## Experimental Results

**Measurements:**
- Temperature: {{temperature | number,3}}°C
- Pressure: {{pressure | number,2}} kPa
- Accuracy: {{accuracy | percent,4}}

**Statistical Analysis:**
- Mean: {{mean | number,6}}
- Standard Deviation: {{stdDev | number,4}}
- R-squared: {{rSquared | number,3}}
```

### Data Processing Pipeline

```javascript
// In code cell
const results = {
  totalRecords: data.length,
  validRecords: data.filter(r => r.valid).length,
  avgProcessingTime: times.reduce((a, b) => a + b) / times.length,
  errorRate: errors.length / data.length
};

exports.processingResults = results;
```

```markdown
## Processing Summary

**Record Statistics:**
- Total Records: {{processingResults.totalRecords | round,0}}
- Valid Records: {{processingResults.validRecords | round,0}}
- Error Rate: {{processingResults.errorRate | percent,2}}

**Performance:**
- Avg Processing Time: {{processingResults.avgProcessingTime | number,3}}ms
```

This unified formatting system ensures consistent, professional presentation of data across all notebook components while providing flexibility for different use cases and localization requirements.
