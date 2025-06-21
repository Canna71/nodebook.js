# Markdown Cells

Markdown cells in NotebookJS provide rich text formatting with the ability to dynamically include variables and expressions from your reactive system. They support standard Markdown syntax enhanced with reactive variable interpolation.

## Basic Markdown Syntax

Markdown cells support all standard Markdown features:

```markdown
# Headers
## Subheaders
### Sub-subheaders

**Bold text** and *italic text*

- Bullet points
- Another point
  - Nested points

1. Numbered lists
2. Second item

[Links](https://example.com)

`inline code`

```code blocks```

> Blockquotes

| Tables | Are | Supported |
|--------|-----|-----------|
| Cell 1 | Cell 2 | Cell 3 |
```

## Variable Interpolation

The key feature of NotebookJS markdown cells is the ability to include dynamic variables using the `{{}}` syntax.

### Basic Variable References

Include any variable from your reactive system:

```markdown
The current price is ${{basePrice}}
Tax rate is {{taxRate}}%
```

### JavaScript Expressions

You can use full JavaScript expressions within the curly braces:

```markdown
**Base Price:** ${{basePrice}}
**Tax Amount:** ${{basePrice * (taxRate / 100)}}
**Total:** ${{basePrice + (basePrice * taxRate / 100)}}
**Formatted Price:** ${{basePrice.toFixed(2)}}
```

### Conditional Expressions

Use ternary operators for conditional content:

```markdown
{{discount > 0 ? '🎉 **You qualify for a discount!**' : 'No discount applied.'}}

{{finalPrice > 200 ? '⚠️ **High value purchase**' : '✅ **Standard purchase**'}}

Status: {{isActive ? 'Active' : 'Inactive'}}
```

### Mathematical Operations

Perform calculations directly in the markdown:

```markdown
**Calculations:**
- Sum: {{a + b}}
- Product: {{a * b}}
- Percentage: {{(value / total * 100).toFixed(1)}}%
- Square root: {{Math.sqrt(number)}}
- Rounded: {{Math.round(value * 100) / 100}}
```

### Object Properties and Methods

Access object properties and call methods:

```markdown
**User Information:**
- Name: {{user.name}}
- Email: {{user.email}}
- Full Name: {{user.firstName + ' ' + user.lastName}}
- Account Age: {{Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24))}} days

**Array Data:**
- Count: {{items.length}}
- First Item: {{items[0]}}
- Last Item: {{items[items.length - 1]}}
```

### Safe Navigation

Handle potentially undefined values safely:

```markdown
**Safe Access:**
- Name: {{user?.name || 'Unknown'}}
- Price: ${{product?.price?.toFixed(2) || '0.00'}}
- Status: {{data?.status || 'Not available'}}
```

## Filter System

For more complex formatting, you can use the pipe filter syntax:

### Currency Filter

```markdown
**Prices:**
- Base: {{basePrice | currency}}
- Total: {{totalPrice | currency}}
- Discount: {{discount | currency}}
```

### Rounding Filter

```markdown
**Rounded Values:**
- Two decimals: {{value | round,2}}
- No decimals: {{value | round,0}}
- Three decimals: {{value | round,3}}
```

### Percentage Filter

```markdown
**Rates:**
- Tax Rate: {{taxRate | percent}}
- Discount Rate: {{discountRate | percent}}
```

### Object Display Filter

```markdown
**Debug Information:**
{{debugData | object}}

**Raw JSON:**
{{configuration | json}}
{{settings | json,4}}
```

## Reactive Variables

Markdown cells automatically detect which variables they depend on and will re-render when those variables change. You can also explicitly specify dependencies:

```json
{
  "type": "markdown",
  "id": "summary",
  "content": "Total: ${{finalPrice.toFixed(2)}}",
  "variables": ["basePrice", "taxRate", "discount", "finalPrice"]
}
```

### Automatic Detection

Variables are automatically detected from expressions:

- `{{basePrice}}` → depends on `basePrice`
- `{{user.name}}` → depends on `user`
- `{{items.length}}` → depends on `items`
- `{{a + b * c}}` → depends on `a`, `b`, `c`

### Manual Dependencies

For complex expressions, you may need to manually specify dependencies:

```json
{
  "variables": ["customVariable", "dynamicData"]
}
```

## Advanced Examples

### Price Calculator Summary

```markdown
## Price Summary

**Input Values:**
- Base Price: ${{basePrice}}
- Tax Rate: {{taxRate}}%
- Discount: {{discountPercent}}%

**Calculated Results:**
- Subtotal: ${{(basePrice * quantity).toFixed(2)}}
- Tax Amount: ${{(basePrice * quantity * taxRate / 100).toFixed(2)}}
- Discount Amount: ${{(basePrice * quantity * discountPercent / 100).toFixed(2)}}
- **Final Total: ${{(basePrice * quantity * (1 + taxRate/100) * (1 - discountPercent/100)).toFixed(2)}}**

{{discountPercent > 0 ? '🎉 **Discount Applied!**' : ''}}
{{taxRate > 10 ? '⚠️ **High Tax Rate**' : ''}}
```

### Data Analysis Report

```markdown
## Analysis Results

**Dataset Overview:**
- Total Records: {{data.length}}
- Valid Records: {{data.filter(item => item.valid).length}}
- Average Value: {{(data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(2)}}

**Status Distribution:**
{{Object.entries(statusCounts).map(([status, count]) => `- ${status}: ${count} (${(count/data.length*100).toFixed(1)}%)`).join('\n')}}

**Quality Metrics:**
- Completeness: {{(validCount / totalCount * 100).toFixed(1)}}%
- Accuracy: {{accuracyScore > 0.9 ? '✅ High' : accuracyScore > 0.7 ? '⚠️ Medium' : '❌ Low'}}
```

### Conditional Content

```markdown
## System Status

{{systemHealth > 0.9 ? '🟢 **System Healthy**' : systemHealth > 0.7 ? '🟡 **System Warning**' : '🔴 **System Critical**'}}

**Performance Metrics:**
- CPU Usage: {{cpuUsage.toFixed(1)}}%
- Memory Usage: {{memoryUsage.toFixed(1)}}%
- Disk Usage: {{diskUsage.toFixed(1)}}%

{{alerts.length > 0 ? `⚠️ **${alerts.length} Active Alerts:**\n${alerts.map(alert => `- ${alert.message}`).join('\n')}` : '✅ **No Active Alerts**'}}
```

## Best Practices

### 1. Keep Expressions Simple

Prefer simple expressions for readability:

```markdown
<!-- Good -->
**Total:** ${{finalPrice.toFixed(2)}}

<!-- Less ideal -->
**Total:** ${{((basePrice * quantity) * (1 + taxRate/100) - discount).toFixed(2)}}
```

### 2. Use Meaningful Variable Names

```markdown
<!-- Good -->
**Customer:** {{customerName}}
**Order Date:** {{orderDate}}

<!-- Less clear -->
**Customer:** {{data.c}}
**Order Date:** {{dt}}
```

### 3. Handle Edge Cases

```markdown
<!-- Safe against undefined values -->
**Price:** ${{price?.toFixed(2) || 'N/A'}}
**Status:** {{status || 'Unknown'}}
```

### 4. Use Filters for Consistent Formatting

```markdown
<!-- Consistent currency formatting -->
**Prices:**
- Base: {{basePrice | currency}}
- Tax: {{taxAmount | currency}}
- Total: {{totalPrice | currency}}
```

### 5. Break Complex Logic into Code Cells

For complex calculations, perform them in a code cell and export the results:

```javascript
// In a code cell
const summary = {
  totalRevenue: data.reduce((sum, item) => sum + item.revenue, 0),
  averageOrder: data.reduce((sum, item) => sum + item.revenue, 0) / data.length,
  topCustomer: data.sort((a, b) => b.revenue - a.revenue)[0]
};

exports.summary = summary;
```

```markdown
<!-- In markdown cell -->
## Revenue Summary
- Total: {{summary.totalRevenue | currency}}
- Average: {{summary.averageOrder | currency}}
- Top Customer: {{summary.topCustomer.name}}
```

## Error Handling

When expressions fail to evaluate, they will display `[Error: expression]`. Common issues:

- **Undefined variables:** Use safe navigation (`?.`) or default values (`|| 'default'`)
- **Type errors:** Ensure variables are the expected type before calling methods
- **Complex syntax:** Break down complex expressions into simpler parts

## Performance Considerations

- Markdown cells re-render when their dependencies change
- Complex expressions in many cells can impact performance
- Consider computing complex values in code cells and referencing the results
- Use explicit `variables` arrays for better dependency tracking

## LaTeX Mathematical Expressions

**NEW**: Markdown cells now support native LaTeX rendering using the `markdown-it-mathjax3` plugin. You can include mathematical expressions directly in your markdown content without needing to wrap them in code cells.

**Configuration**: The plugin is integrated with default settings, supporting:
- Inline math: `$...$` syntax
- Display math: `$$...$$` syntax  
- Standard LaTeX mathematical notation
- Automatic escaping and processing
- Dark mode compatibility

**Key Benefits**:
- **Cleaner syntax**: No need to escape backslashes like in code cells
- **Variable integration**: Combine LaTeX with `{{variable}}` interpolation
- **Better performance**: Renders during markdown processing
- **Semantic clarity**: Mathematical content belongs in markdown, not code

### LaTeX Syntax in Markdown

#### Inline Math
Use single dollar signs `$...$` for inline mathematical expressions:

```markdown
The quadratic formula $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ is used to solve equations of the form $ax^2 + bx + c = 0$.

The value of π is approximately $\pi \approx 3.14159$.
```

#### Display Math (Block)
Use double dollar signs `$$...$$` for centered, block-level equations:

```markdown
## Maxwell's Equations

Maxwell's equations in differential form:

$$\begin{array}{c}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &
= \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} & = 0
\end{array}$$
```

#### Complex Mathematical Expressions
LaTeX supports a wide range of mathematical notation:

```markdown
## Calculus Examples

### Derivatives
The derivative of $f(x) = x^n$ is:
$$\frac{d}{dx}[x^n] = nx^{n-1}$$

### Integrals
The fundamental theorem of calculus:
$$\int_a^b f'(x) dx = f(b) - f(a)$$

### Matrices
A 2x2 matrix multiplication:
$$\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} ax + by \\ cx + dy \end{pmatrix}$$

### Statistics
Sample standard deviation:
$$s = \sqrt{\frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2}$$
```

### LaTeX with Variable Interpolation

You can combine LaTeX expressions with reactive variables using `{{}}` interpolation:

```markdown
## Dynamic Mathematical Results

For a sample size of **{{sampleSize}}** observations:

- Sample mean: $\bar{x} = {{mean.toFixed(3)}}$
- Sample variance: $s^2 = {{variance.toFixed(3)}}$
- Standard deviation: $s = {{standardDeviation.toFixed(3)}}$

The **coefficient of variation** is:
$$CV = \frac{s}{\bar{x}} = \frac{{{standardDeviation.toFixed(3)}}}{{{mean.toFixed(3)}}} = {{(standardDeviation/mean*100).toFixed(1)}}\%$$
```

### Mathematical Documentation Patterns

#### Educational Content
```markdown
# Quadratic Functions

A quadratic function has the form $f(x) = ax^2 + bx + c$ where $a \neq 0$.

## Vertex Form
We can rewrite this in vertex form:
$$f(x) = a(x - h)^2 + k$$

Where $(h, k)$ is the vertex of the parabola.

## Finding the Vertex
The x-coordinate of the vertex is:
$$h = -\frac{b}{2a}$$

For our function with $a = {{a}}$, $b = {{b}}$, and $c = {{c}}$:
$$h = -\frac{{{b}}}{2 \cdot {{a}}} = {{(-b/(2*a)).toFixed(3)}}$$
```

#### Scientific Analysis
```markdown
# Statistical Analysis Results

## Sample Statistics
For our dataset of {{data.length}} observations:

| Statistic | Symbol | Value |
|-----------|--------|--------|
| Mean | $\bar{x}$ | {{mean.toFixed(3)}} |
| Median | $\tilde{x}$ | {{median.toFixed(3)}} |
| Std Dev | $s$ | {{stdDev.toFixed(3)}} |

## Confidence Interval
The 95% confidence interval for the population mean is:
$$\bar{x} \pm t_{0.025, {{data.length-1}}} \cdot \frac{s}{\sqrt{n}}$$
$${{mean.toFixed(3)}} \pm {{tValue.toFixed(3)}} \cdot \frac{{{stdDev.toFixed(3)}}}{\sqrt{{{data.length}}}}$$
$$[{{lowerBound.toFixed(3)}}, {{upperBound.toFixed(3)}}]$$
```

### Troubleshooting LaTeX in Markdown

**Common Issues:**
1. **Escaping**: In markdown cells, use natural LaTeX syntax (`\frac{1}{2}`, not `\\frac{1}{2}`)
2. **Variable conflicts**: If `$` conflicts with variable interpolation, use `\$` to escape dollar signs
3. **Complex expressions**: For dynamically generated LaTeX, consider using code cells with MathJS

**LaTeX vs Code Cell Comparison:**

| Aspect | Markdown Cells | Code Cells |
|--------|---------------|------------|
| **Syntax** | Natural LaTeX: `$\frac{1}{2}$` | Escaped: `"$$\\frac{1}{2}$$"` |
| **Best for** | Static math, explanations | Dynamic generation, MathJS |
| **Interpolation** | `{{variable}}` within LaTeX | Generate complete LaTeX strings |
| **Performance** | Faster rendering | Slower (requires code execution) |
| **Editing** | WYSIWYG in edit mode | Requires execution to see output |

**Example comparison:**
```markdown
<!-- Markdown cell (preferred for static math) -->
The derivative of $f(x) = x^{{n}}$ is $f'(x) = {{n}}x^{{{n-1}}}$

<!-- Code cell (preferred for dynamic math) -->
const n = 3;
const derivative = mathjs.derivative(`x^${n}`, 'x');
output(`Derivative: $$${derivative.toTex()}$$`);
```
