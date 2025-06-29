# Nodebook.js Shared Configuration - Technical Specifications

This document contains technical specifications shared between notebook generation and single cell generation systems.

## Available Globals & Functions

### Built-in JavaScript
- **Math**: Full Math object (`Math.PI`, `Math.sqrt()`, `Math.random()`, `Math.max()`, `Math.min()`, `Math.round()`, `Math.floor()`, `Math.ceil()`, `Math.abs()`, `Math.pow()`, etc.)
- **Console**: Captured console output (`console.log`, `console.warn`, `console.error`) but to be used with caution as it may not always display in the UI
- **Standard JS**: All ES6+ features, async/await, Promises, etc.

### Node.js Built-ins (Injected as Globals)
**All these are available as global variables - no `require()` needed:**
- **fs**: File system operations (`fs.readdirSync()`, `fs.readFileSync()`)
- **path**: Path utilities (`path.join()`, `path.resolve()`)
- **os**: Operating system info (`os.platform()`, `os.cpus()`)
- **crypto**: Cryptography (`crypto.createHash()`, `crypto.randomBytes()`)
- **util**: Utilities (`util.inspect()`, `util.promisify()`)
- **url**: URL parsing (`url.parse()`, `new URL()`)
- **querystring**: Query string utilities (`querystring.parse()`)
- **zlib**: Compression (`zlib.gzip()`, `zlib.deflate()`)
- **stream**: Stream utilities (`stream.Readable`, `stream.Transform`)
- **events**: Event system (`EventEmitter` constructor available)
- **buffer**: Buffer manipulation (`Buffer` constructor available)
- **process**: Process information (`process.cwd()`, `process.env`)
- **readline**: Readline interface
- **worker_threads**: Worker threads
- **child_process**: Child processes
- **string_decoder**: String decoder (`StringDecoder` constructor)
- **timers**: Timer functions
- **async_hooks**: Async hooks
- **assert**: Assertion functions
- **constants**: Node.js constants

### Pre-bundled Scientific Libraries (Injected as Globals)
**Available as global variables:**
- **math**: Math.js mathematical functions and expressions
  ```javascript
  exports.result = math.evaluate('sqrt(3^2 + 4^2)');
  exports.matrix = math.matrix([[1, 2], [3, 4]]);
  exports.complex = math.evaluate('(2 + 3i) * (1 - 2i)');
  exports.units = math.evaluate('5 km + 3 miles');
  ```
- **dfd**: Danfo.js DataFrame library for data manipulation
  ```javascript
  const df = new dfd.DataFrame(data);
  exports.mean = df['column'].mean();
  exports.filtered = df.query(df['age'].gt(25));
  ```
- **tf**: TensorFlow.js for machine learning (from danfojs bundle)
  ```javascript
  const model = tf.sequential({
    layers: [tf.layers.dense({inputShape: [1], units: 1})]
  });
  ```
- **Plotly**: Interactive plotting library for visualizations
  ```javascript
  const plotDiv = createDiv({ style: 'height: 400px;' });
  Plotly.newPlot(plotDiv.id, data, layout);
  output(plotDiv);
  ```

### Shell Integration (zx Library - Injected as Globals)
**Available as global variables for shell operations:**
- **$**: Execute shell commands (`await $\`ls -la\``)
- **cd**: Change directory (`await cd('folder')`)
- **echo**: Print to stdout (`echo('message')`)
- **question**: Interactive prompts (`await question('Name? ')`)
- **sleep**: Delay execution (`await sleep(1000)`)
- **glob**: File pattern matching (`await glob('*.js')`)
- **which**: Find executable (`await which('git')`)
- **chalk**: Terminal styling (`chalk.blue('text')`)
- **YAML**: YAML parsing (`YAML.parse(str)`)
- **argv**: Command line arguments (`argv._`)

All code cells execute in the **notebook's directory**, not the application directory:
```javascript
// Both point to notebook directory
console.log('Working dir:', process.cwd());
console.log('__dirname:', __dirname);

// Shell commands run in notebook directory
const files = await $`ls *.nbjs`;  // Lists notebook files
```

### Pre-bundled Libraries (Require-Available)
**These need explicit `require()` calls:**
- **lodash**: Utility functions (`const _ = require('lodash')`)
- **moment**: Date/time manipulation (`const moment = require('moment')`)
- **d3**: Data visualization (`const d3 = require('d3')`)
- **papaparse**: CSV parsing (`const Papa = require('papaparse')`)
- **xlsx**: Excel file handling (`const XLSX = require('xlsx')`)
- **node-fetch**: HTTP requests (`const fetch = require('node-fetch')`)
- **axios**: HTTP client (`const axios = require('axios')`)

### Custom Object Rendering
When using `output()` with objects, Nodebook.js provides special rendering for:
- **LaTeX**: Strings containing LaTeX syntax (e.g., `"$$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$"`)
  - Display math: `$$..$$` for centered, block-level equations
  - Inline math: `$...$` for inline mathematical expressions
  - Mixed content: Regular text with embedded LaTeX expressions
  - Automatic detection and rendering using MathJax
- **DataFrames**: Rendered as interactive, editable tables using react-table
- **DataSeries**: Rendered as structured data displays
- **Generic Objects**: Rendered using react-json-view for exploration

### LaTeX Mathematical Expression Support
Nodebook.js automatically detects and renders LaTeX content in:
- Code cell outputs (return values and `output()` calls)
- Console output (`console.log()`, `console.error()`, etc.)
- Object property values when displayed
- Mixed text content with embedded math expressions

**LaTeX Examples:**
```javascript
// Display math (block-level, centered)
output("$$\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$");

// Inline math within text
output("The quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ solves $ax^2 + bx + c = 0$.");

// Console output with LaTeX
console.log("Computing $\\sum_{i=1}^{n} i^2 = \\frac{n(n+1)(2n+1)}{6}$ for n=10");

// MathJS integration for automatic LaTeX generation (math is global)
const expr = 'derivative(x^3 + 2*x^2 + x + 1, x)';
const node = math.parse(expr);
output("$$" + node.toTex() + "$$"); // Renders: $$3 x^{2}+4 x+1$$
```

### LaTeX in Markdown Cells
**NEW**: Markdown cells now support native LaTeX rendering using `markdown-it-mathjax3`:

**Key Benefits:**
- **Natural syntax**: Use `$` and `$$` without escaping (unlike code cells which need `\\`)
- **Variable integration**: Seamlessly combine LaTeX with `{{variable}}` interpolation
- **Better performance**: Renders during markdown processing, not code execution
- **Semantic clarity**: Mathematical content belongs in markdown, not code

**Inline Math:**
```markdown
The quadratic formula $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$ solves $ax^2 + bx + c = 0$.
```

**Display Math:**
```markdown
$$\int_0^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$
```

**LaTeX with Variable Interpolation:**
```markdown
For our sample of **{{sampleSize}}** observations:
- Mean: $\bar{x} = {{mean.toFixed(3)}}$
- Standard deviation: $s = {{stdDev.toFixed(3)}}$

The coefficient of variation is:
$$CV = \frac{s}{\bar{x}} = {{(stdDev/mean*100).toFixed(1)}}\%$$
```

**When to Use Each Approach:**
- **Markdown cells**: Static mathematical content, explanations, formulas with variable values
- **Code cells**: Dynamic LaTeX generation (Math.js global integration), computed mathematical results

### DOM Output Functions (Use Sparingly)
- **output(...values)**: Output any value - objects get custom rendering, DOM elements are displayed. Arrays are shown as single-column tables.
- **output.table(array)**: Force tabular rendering for arrays of objects - creates multi-column tables
- **outEl**: Direct access to output container (advanced use only)
- **createElement(tag, options)**: Create HTML elements with styling
- **createDiv(options)**: Create div containers with automatic styling
- **createTitle(text, level, options)**: Create styled headings (h1-h6)
- **createTable(headers, rows, options)**: Create responsive data tables
- **createButton(text, onClick, options)**: Create interactive buttons
- **createList(items, options)**: Create ul/ol lists with styling
- **createKeyValueGrid(data, options)**: Create responsive metric grids
- **createContainer(options)**: Create styled containers (auto-outputs to DOM)

### Storage System
- **storage**: Notebook-level persistent storage
  ```javascript
  storage.set('key', value);
  const value = storage.get('key');
  storage.clear(); // Clear all storage
  ```
  This allows you to store data across notebook sessions, especially to persist dataframes after editing.

## Output Hierarchy & Critical Rules

### Output Hierarchy
1. **FIRST CHOICE - Formula Cells**: For ALL simple math operations and calculations
2. **SECOND CHOICE - Markdown Cells with {{}} Interpolation**: For presenting results with explanation
3. **THIRD CHOICE - Code Cells**: For complex logic that ONLY computes and exports (never HTML)
4. **FOURTH CHOICE - Direct Object Output**: For complex data that has custom rendering
5. **LAST RESORT - DOM Manipulation**: Only when other methods don't work

### Critical Restrictions
**NEVER Do These Things:**
1. **NEVER use `innerHTML`** - This defeats the purpose of reactive markdown cells
2. **NEVER create HTML strings** - Use markdown interpolation instead  
3. **NEVER use `createElement` for simple outputs** - Use markdown cells
4. **NEVER use `createDiv` with content** - Just export data and use markdown
5. **NEVER output HTML directly** - Let Nodebook.js handle rendering

### Formula Cells Are Mandatory For:
- Basic arithmetic: `a + b`, `price * quantity`, `total - discount`
- Math functions: `Math.round(value)`, `Math.sqrt(area)`, `Math.max(a, b)`
- Conditional logic: `age >= 18 ? 'Adult' : 'Minor'`
- Percentage calculations: `price * (taxRate / 100)`
- Any single-expression calculation

### When to Use Each Cell Type
**Formula Cells**: Simple math, single expressions, reactive calculations, Math functions
**Input Cells**: User parameters, interactive controls, configuration values
**Code Cells**: Complex logic, data manipulation, multiple outputs, external libraries, side effects
**Markdown Cells**: Documentation, formatted text, results presentation with `{{}}` interpolation

## Formula Cell Syntax

### Basic Arithmetic
```javascript
// Simple addition
number1 + number2

// With parentheses for clarity
(price * quantity) + tax

// Multiple operations
(basePrice * quantity) * (1 + taxRate / 100)
```

### Math Functions
```javascript
// Rounding
Math.round(price * 1.15)

// Square root and powers
Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))

// Min/Max
Math.max(price1, price2, price3)
Math.min(discount1, discount2)

// Absolute value
Math.abs(value1 - value2)

// Trigonometry
Math.sin(angle * Math.PI / 180)
```

### Conditional Logic
```javascript
// Simple conditional
value > 100 ? value * 0.9 : value

// Multiple conditions
price > 1000 ? price * 0.15 : 
price > 500 ? price * 0.1 : 
price > 100 ? price * 0.05 : 0

// Boolean logic
isActive && hasDiscount ? basePrice * 0.8 : basePrice
```

### String Operations
```javascript
// String concatenation
firstName + ' ' + lastName

// Template-like expressions
'Total: $' + (price * quantity).toFixed(2)
```

### Array and Object Access
```javascript
// Array elements
items[0] + items[1]

// Object properties
user.age + bonus.years

// Array methods that return single values
numbers.length
prices.reduce((sum, p) => sum + p, 0)
```

## Markdown Cell Variable Interpolation

### Basic Variable References
```markdown
The current price is ${{basePrice}}
Tax rate is {{taxRate}}%
Total items: {{itemCount}}
```

### JavaScript Expressions
```markdown
**Base Price:** ${{basePrice}}
**Tax Amount:** ${{basePrice * (taxRate / 100)}}
**Total:** ${{basePrice + (basePrice * taxRate / 100)}}
**Formatted Price:** ${{basePrice.toFixed(2)}}
```

### Conditional Expressions
```markdown
{{discount > 0 ? '🎉 **You qualify for a discount!**' : 'No discount applied.'}}
{{finalPrice > 200 ? '⚠️ **High value purchase**' : '✅ **Standard purchase**'}}
Status: {{isActive ? 'Active' : 'Inactive'}}
```

### Safe Navigation
```markdown
**Safe Access:**
- Name: {{user?.name || 'Unknown'}}
- Price: ${{product?.price?.toFixed(2) || '0.00'}}
- Status: {{data?.status || 'Not available'}}
```

### Filter System
```markdown
**Prices:**
- Base: {{basePrice | currency}}
- Total: {{totalPrice | currency}}
- Discount: {{discount | currency}}

**Rounded Values:**
- Two decimals: {{value | round,2}}
- No decimals: {{value | round,0}}

**Rates:**
- Tax Rate: {{taxRate | percent}}
- Discount Rate: {{discountRate | percent}}
```

## Best Practices

### General Principles
- **Separate computation from presentation**: Use formula/code cells for logic, markdown cells for formatted output
- **Export meaningful variables**: Use descriptive names for reactive variables
- **Handle errors gracefully**: Wrap risky operations in try-catch
- **Use reactive patterns**: Let variables automatically update dependent cells
- **Avoid manual HTML**: Let Nodebook.js handle rendering

### Code Cell Patterns
```javascript
// ✅ CORRECT - Only computation, no HTML
const processedData = rawData.map(item => ({
  ...item,
  calculated: item.value * multiplier
}));

// Export for other cells
exports.processedData = processedData;
exports.total = processedData.reduce((sum, item) => sum + item.calculated, 0);
```

### Formula Cell Patterns
```javascript
// ✅ CORRECT - Simple expressions
number1 + number2
Math.round((price * quantity) * (1 + taxRate / 100))
price > 100 ? price * 0.1 : 0
```

### Markdown Cell Patterns
```markdown
## Results
- **Total**: {{total.toLocaleString()}}
- **Average**: {{(total / count).toFixed(2)}}
- **Status**: {{total > 1000 ? 'High' : 'Normal'}}
```

This shared configuration ensures consistency across all Nodebook.js AI assistants while avoiding duplication of technical specifications.
