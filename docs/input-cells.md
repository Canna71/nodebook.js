# Input Cells

Input cells provide interactive UI controls that allow users to modify reactive values directly through the interface. They create form controls like sliders, text inputs, number inputs, and checkboxes that automatically update the reactive system when changed.

## Overview

Input cells are perfect for:
- **Interactive parameters**: Let users adjust values with sliders, inputs, and controls
- **Configuration interfaces**: Create settings panels for your notebooks
- **Data exploration**: Allow dynamic filtering and parameter adjustment
- **Dashboards**: Build interactive dashboards with user controls

## Input Types

### Number Input
```json
{
  "type": "input",
  "id": "price-input",
  "label": "Price ($)",
  "inputType": "number",
  "variableName": "price",
  "value": 20,
  "props": {
    "step": 1,
    "min": 0,
    "max": 1000
  }
}
```

### Range Slider
```json
{
  "type": "input",
  "id": "discount-input",
  "label": "Discount (%)",
  "inputType": "range",
  "variableName": "discountPercent",
  "value": 0,
  "props": {
    "min": 0,
    "max": 100,
    "step": 1
  }
}
```

### Text Input
```json
{
  "type": "input",
  "id": "name-input",
  "label": "Name",
  "inputType": "text",
  "variableName": "userName",
  "value": "John Doe",
  "props": {
    "placeholder": "Enter your name"
  }
}
```

### Checkbox
```json
{
  "type": "input",
  "id": "enabled-input",
  "label": "Enable Feature",
  "inputType": "checkbox",
  "variableName": "featureEnabled",
  "value": true
}
```

## Input Cell Properties

### Required Properties
- **`type`**: Must be `"input"`
- **`id`**: Unique identifier for the cell
- **`variableName`**: Name of the reactive variable this input controls
- **`inputType`**: Type of input control (see Input Types above)
- **`value`**: Initial value for the input

### Optional Properties
- **`label`**: Display label for the input control
- **`props`**: Additional HTML input properties (min, max, step, placeholder, etc.)

## Reactive Integration

Input cells automatically integrate with the reactive system:

```javascript
// In a code cell - the variables are automatically available
const total = price * quantity;
const discountAmount = total * (discountPercent / 100);
const finalPrice = total - discountAmount;

exports.total = total;
exports.discountAmount = discountAmount;
exports.finalPrice = finalPrice;

output(`Final price: $${finalPrice.toFixed(2)}`);
```

## Performance Optimization

### Throttled Updates
Range inputs (sliders) use throttled updates to prevent excessive calculations:

- **100ms throttling**: Reduces reactive system updates during sliding
- **Immediate final update**: Ensures final value is committed when dragging stops
- **Smooth UI**: Slider visual feedback is instant via local React state

### Input Type Behavior
- **Range inputs**: Throttled with 100ms delay
- **Text, number, checkbox**: Immediate updates
- **All types**: Final value committed on blur/change

## Examples

### Interactive Parameter Panel
```json
{
  "cells": [
    {
      "type": "markdown",
      "content": "# Data Visualization Parameters"
    },
    {
      "type": "input",
      "id": "sample-size",
      "label": "Sample Size",
      "inputType": "range",
      "variableName": "sampleSize",
      "value": 1000,
      "props": { "min": 100, "max": 10000, "step": 100 }
    },
    {
      "type": "input",
      "id": "chart-type",
      "label": "Chart Type",
      "inputType": "select",
      "variableName": "chartType",
      "value": "scatter",
      "props": {
        "options": ["scatter", "line", "bar", "histogram"]
      }
    },
    {
      "type": "code",
      "content": "// Generate data based on parameters\nconst data = generateRandomData(sampleSize);\nconst chart = createChart(data, chartType);\noutput(chart);"
    }
  ]
}
```

### Configuration Dashboard
```json
{
  "cells": [
    {
      "type": "markdown",
      "content": "# Application Settings"
    },
    {
      "type": "input",
      "id": "api-endpoint",
      "label": "API Endpoint",
      "inputType": "text",
      "variableName": "apiEndpoint",
      "value": "https://api.example.com",
      "props": { "placeholder": "Enter API URL" }
    },
    {
      "type": "input",
      "id": "timeout",
      "label": "Timeout (seconds)",
      "inputType": "number",
      "variableName": "timeoutSeconds",
      "value": 30,
      "props": { "min": 1, "max": 300 }
    },
    {
      "type": "input",
      "id": "debug-mode",
      "label": "Debug Mode",
      "inputType": "checkbox",
      "variableName": "debugMode",
      "value": false
    }
  ]
}
```

## Best Practices

1. **Use meaningful labels**: Clear labels help users understand what each input controls
2. **Set appropriate constraints**: Use min/max values to prevent invalid inputs
3. **Provide good defaults**: Start with sensible default values
4. **Group related inputs**: Use markdown cells to create sections and explanations
5. **Use throttling wisely**: Range inputs automatically use throttling for performance

## Integration with Reading Mode

Input cells work seamlessly in Reading Mode:
- ✅ All input controls remain functional
- ✅ Reactive updates continue to work
- ✅ Values can be changed and will trigger recalculations
- ❌ Input cell structure cannot be modified (labels, types, etc.)

## Common Use Cases

- **Parameter tuning**: Machine learning hyperparameters, visualization settings
- **Data filtering**: Date ranges, category filters, value thresholds
- **Configuration**: API endpoints, feature toggles, user preferences
- **Interactive exploration**: Adjusting analysis parameters in real-time
- **Dashboard controls**: User interface elements for data dashboards

Input cells make your notebooks interactive and user-friendly, allowing others to explore your work without needing to modify code directly.
