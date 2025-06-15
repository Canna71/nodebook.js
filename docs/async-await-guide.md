# Async/Await Usage Guide for NotebookJS

## ✅ Proper Async/Await Patterns

### 1. Basic Async Operations
```javascript
// Cell 1: Define and use async functions
async function fetchData(url) {
    const response = await fetch(url);
    return await response.json();
}

const data = await fetchData('https://api.example.com/data');
console.log('Data received:', data);

// IMPORTANT: Export for use in other cells
exports.data = data;
exports.fetchData = fetchData; // Export the function too
```

### 2. TensorFlow.js Async Training
```javascript
// Cell 1: Model setup and training
const model = tf.sequential({
    layers: [tf.layers.dense({ inputShape: [1], units: 1 })]
});

model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

// Use await for model training
const history = await model.fit(xs, ys, { epochs: 100 });

// Export results
exports.model = model;
exports.trainingHistory = history.history;
```

### 3. Sequential Async Operations
```javascript
// Cell 1: Setup
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.delay = delay; // Export for reuse

// Cell 2: Use exported async function
const results = [];
for (let i = 0; i < 3; i++) {
    await delay(100);
    results.push(`Operation ${i} completed at ${Date.now()}`);
}

exports.results = results;
```

### 4. Error Handling in Async Code
```javascript
async function riskyOperation() {
    try {
        await delay(50);
        const result = await someAsyncFunction();
        return { success: true, data: result };
    } catch (error) {
        console.error('Async error:', error.message);
        return { success: false, error: error.message };
    }
}

const outcome = await riskyOperation();
exports.outcome = outcome;
```

## 🚫 Common Mistakes to Avoid

### ❌ Forgetting to Export Async Results
```javascript
// BAD: Results not available in other cells
const data = await fetchData();
console.log(data); // Only logs, not exported
```

### ❌ Not Awaiting Async Operations
```javascript
// BAD: Promise object instead of actual result
const data = fetchData(); // Missing await
exports.data = data; // Exports Promise, not data
```

### ❌ Using Async Functions Without Proper Exports
```javascript
// BAD: Function not available in other cells
async function helper() { /* ... */ }
const result = await helper();
// Missing: exports.helper = helper;
```

## ✅ Best Practices

1. **Always Export**: Export both results and reusable functions
2. **Use Await**: Don't forget `await` for async operations
3. **Error Handling**: Wrap async operations in try-catch
4. **Resource Cleanup**: Dispose of tensors and clean up resources
5. **Cross-Cell Dependencies**: Export what other cells need

## 🎯 Real-World Examples

### Machine Learning Pipeline
```javascript
// Cell 1: Data preparation
const rawData = await loadDataset();
const processedData = await preprocessData(rawData);
exports.dataset = processedData;

// Cell 2: Model training
const model = await trainModel(dataset);
const metrics = await evaluateModel(model, dataset);
exports.model = model;
exports.metrics = metrics;

// Cell 3: Predictions
const predictions = await model.predict(newData);
exports.predictions = predictions;
```

### API Integration
```javascript
// Cell 1: Authentication
const auth = await authenticate(credentials);
exports.authToken = auth.token;

// Cell 2: Data fetching
const userData = await fetchUserData(authToken);
const analytics = await fetchAnalytics(authToken);
exports.userData = userData;
exports.analytics = analytics;

// Cell 3: Processing
const insights = await generateInsights(userData, analytics);
exports.insights = insights;
```

## 🔧 Technical Implementation

NotebookJS now supports async/await by:
- Wrapping user code in async IIFE
- Properly awaiting all code cell execution
- Maintaining reactive dependencies across async operations
- Preserving exports and cross-cell state

This enables modern JavaScript data science workflows with libraries like TensorFlow.js, D3, and Plotly!
