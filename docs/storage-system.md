# Storage System Documentation

Nodebook.js includes a built-in key-value storage system that allows you to persist data within the notebook file. This storage system is designed for explicit, user-controlled data persistence.

## Overview

The storage system provides a simple key-value store that is:
- **Persistent**: Data is saved with the notebook file
- **Explicit**: You control what gets stored and when
- **Synchronous**: All operations are immediate
- **JSON-serializable**: Supports strings, numbers, objects, arrays, booleans, and null

## Storage API

The storage API is available in all code cells via the global `storage` object:

### Basic Operations

```javascript
// Store data
storage.set('myKey', 'myValue');
storage.set('number', 42);
storage.set('object', { name: 'John', age: 30 });
storage.set('array', [1, 2, 3]);

// Retrieve data
const value = storage.get('myKey');
const number = storage.get('number');
const obj = storage.get('object');

// Check if key exists
if (storage.has('myKey')) {
    console.log('Key exists!');
}

// Delete data
storage.delete('myKey');

// Get all keys
const allKeys = storage.keys();
console.log('Stored keys:', allKeys);

// Clear all storage
storage.clear();
```

### Return Values

- `get(key)`: Returns the stored value, or `undefined` if the key doesn't exist
- `set(key, value)`: Returns `true` (always succeeds for valid JSON data)
- `has(key)`: Returns `true` if the key exists, `false` otherwise
- `delete(key)`: Returns `true` if the key existed and was deleted, `false` otherwise
- `keys()`: Returns an array of all stored keys
- `clear()`: Returns `undefined` (always succeeds)

## Data Types

The storage system can store any JSON-serializable data:

```javascript
// Primitives
storage.set('string', 'Hello World');
storage.set('number', 123.45);
storage.set('boolean', true);
storage.set('null', null);

// Objects and Arrays
storage.set('object', {
    name: 'Alice',
    scores: [95, 87, 92],
    active: true
});

storage.set('array', [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
]);
```

## Common Use Cases

### 1. Storing DataFrames

```javascript
// Example with danfojs
const df = new dfd.DataFrame({
    name: ['Alice', 'Bob', 'Charlie'],
    age: [25, 30, 35],
    city: ['New York', 'London', 'Tokyo']
});

// Convert to JSON for storage
const dfData = {
    data: df.values,
    columns: df.columns,
    index: df.index
};

storage.set('my_dataframe', dfData);

// Later, reconstruct the DataFrame
const storedData = storage.get('my_dataframe');
if (storedData) {
    const reconstructedDf = new dfd.DataFrame(
        storedData.data, 
        { columns: storedData.columns, index: storedData.index }
    );
    console.log(reconstructedDf);
}
```

### 2. Configuration and Settings

```javascript
// Store analysis parameters
storage.set('analysis_config', {
    algorithm: 'linear_regression',
    features: ['age', 'income', 'education'],
    target: 'salary',
    test_size: 0.2,
    random_state: 42
});

// Use in other cells
const config = storage.get('analysis_config');
if (config) {
    console.log('Using algorithm:', config.algorithm);
    // ... use config for analysis
}
```

### 3. Intermediate Results

```javascript
// Store expensive computation results
const expensiveResult = performLongComputation();
storage.set('computation_result', expensiveResult);

// In another cell, reuse the result
const result = storage.get('computation_result');
if (result) {
    // Continue with analysis using cached result
    analyzeResult(result);
} else {
    console.log('Need to run computation first');
}
```

### 4. State Management

```javascript
// Track analysis state
storage.set('analysis_state', {
    step: 'data_preprocessing',
    completed_steps: ['data_loading', 'data_cleaning'],
    parameters: { /* ... */ }
});

// Check state in other cells
const state = storage.get('analysis_state');
if (state && state.step === 'data_preprocessing') {
    console.log('Ready for preprocessing');
}
```

## Best Practices

### 1. Use Descriptive Keys
```javascript
// Good
storage.set('user_preferences', preferences);
storage.set('ml_model_weights', weights);

// Avoid
storage.set('data', someData);
storage.set('x', value);
```

### 2. Check Existence Before Use
```javascript
// Always check if data exists
if (storage.has('my_data')) {
    const data = storage.get('my_data');
    processData(data);
} else {
    console.log('Data not found, need to generate it first');
}
```

### 3. Handle Complex Objects Carefully
```javascript
// For objects with methods or non-JSON data, extract the data
const myClass = new MyClass();
storage.set('my_class_data', {
    property1: myClass.property1,
    property2: myClass.property2,
    // Don't store methods or functions
});
```

### 4. Use Namespace-like Keys
```javascript
// Group related data with prefixes
storage.set('experiment_1_data', data1);
storage.set('experiment_1_results', results1);
storage.set('experiment_2_data', data2);
storage.set('experiment_2_results', results2);
```

## Limitations

1. **JSON Only**: Data must be JSON-serializable (no functions, undefined, symbols, etc.)
2. **Synchronous Only**: All operations are synchronous
3. **No Validation**: The system doesn't validate data types or schemas
4. **File Size**: Large amounts of data will increase the notebook file size

## Storage vs. Variables

| Aspect | Storage | Reactive Variables |
|--------|---------|-------------------|
| Persistence | Saved with notebook | Lost on reload |
| Scope | Global across cells | Per-cell dependencies |
| Control | Explicit set/get | Automatic reactive updates |
| Use Case | Long-term data | Cell-to-cell communication |

## Examples in Practice

See the following example notebooks:
- `storage-example.nbjs` - Basic storage operations
- `storage-integration-test.json` - Testing save/load functionality

*Note: Example notebooks may have either `.json` or `.nbjs` file extensions.*

## Troubleshooting

### Data Not Persisting
- Ensure you're calling `storage.set()` explicitly
- Save the notebook after storing data
- Check that data is JSON-serializable

### Performance Issues
- Large objects in storage will slow down notebook save/load
- Consider storing only essential data
- Use compression for large datasets if needed

### Data Corruption
- Avoid storing circular references
- Don't modify objects after storing them (store copies instead)
- Validate data structure before storage
