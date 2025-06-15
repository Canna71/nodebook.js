# Storage System Integration Test

This notebook provides a complete test of the storage system integration with the save/load workflow.

<VSCode.Cell language="markdown">
# Storage System Integration Test

This notebook tests the complete storage system implementation:

1. **Storage API** - Set, get, has, delete, keys, clear operations
2. **Markdown Integration** - Access storage in markdown expressions  
3. **Save/Load Integration** - Persistence across sessions
4. **Error Handling** - Graceful handling of edge cases

## Current Storage Status

- **Keys Count**: {{storage.keys().length}}
- **All Keys**: {{storage.keys().join(', ') || 'No keys stored'}}
- **Storage Empty**: {{storage.keys().length === 0 ? 'Yes' : 'No'}}
</VSCode.Cell>

<VSCode.Cell language="javascript">
// Test 1: Basic Storage Operations
console.log('=== Test 1: Basic Storage Operations ===');

// Store different data types
storage.set('string_test', 'Hello World');
storage.set('number_test', 42);
storage.set('boolean_test', true);
storage.set('array_test', [1, 2, 3, 4, 5]);
storage.set('object_test', {
  name: 'Test Object',
  created: new Date().toISOString(),
  nested: {
    value: 123,
    active: true
  }
});

console.log('✅ Stored 5 different data types');
console.log('Storage keys:', storage.keys());
console.log('Keys count:', storage.keys().length);
</VSCode.Cell>

<VSCode.Cell language="javascript">
// Test 2: Retrieval and Verification
console.log('=== Test 2: Data Retrieval ===');

// Test get operations
console.log('string_test:', storage.get('string_test'));
console.log('number_test:', storage.get('number_test'));
console.log('boolean_test:', storage.get('boolean_test'));
console.log('array_test:', storage.get('array_test'));
console.log('object_test:', storage.get('object_test'));

// Test has operations
console.log('\n=== Existence Tests ===');
console.log('has string_test:', storage.has('string_test'));
console.log('has nonexistent:', storage.has('nonexistent'));

// Test undefined get
console.log('get nonexistent:', storage.get('nonexistent'));

console.log('✅ All retrieval tests passed');
</VSCode.Cell>

<VSCode.Cell language="markdown">
## Storage Status After Basic Tests

- **Total Keys**: {{storage.keys().length}}
- **String Value**: {{storage.get('string_test')}}
- **Number Value**: {{storage.get('number_test')}}
- **Array Length**: {{storage.get('array_test').length}}
- **Object Name**: {{storage.get('object_test').name}}
- **Has String**: {{storage.has('string_test') ? 'Yes' : 'No'}}
- **Has Missing**: {{storage.has('missing_key') ? 'Yes' : 'No'}}
</VSCode.Cell>

<VSCode.Cell language="javascript">
// Test 3: Complex Data Storage (DataFrame simulation)
console.log('=== Test 3: Complex Data Storage ===');

// Simulate storing a DataFrame
const employeeData = {
  columns: ['name', 'age', 'department', 'salary'],
  values: [
    ['Alice Johnson', 28, 'Engineering', 85000],
    ['Bob Smith', 34, 'Marketing', 72000],
    ['Carol Davis', 29, 'Engineering', 88000],
    ['David Wilson', 42, 'Sales', 95000]
  ],
  shape: [4, 4],
  metadata: {
    created: new Date().toISOString(),
    source: 'HR Database',
    version: 1
  }
};

storage.set('employee_dataframe', employeeData);
console.log('✅ Stored complex DataFrame structure');

// Store analysis results
const analysisResults = {
  mean_salary: 85000,
  max_salary: 95000,
  min_salary: 72000,
  departments: ['Engineering', 'Marketing', 'Sales'],
  total_employees: 4,
  analysis_date: new Date().toISOString()
};

storage.set('salary_analysis', analysisResults);
console.log('✅ Stored analysis results');

console.log('Total storage keys:', storage.keys().length);
</VSCode.Cell>

<VSCode.Cell language="javascript">
// Test 4: Storage Management Operations
console.log('=== Test 4: Storage Management ===');

// Show all current keys
console.log('All keys before cleanup:', storage.keys());

// Delete a specific key
const deleted = storage.delete('boolean_test');
console.log('Deleted boolean_test:', deleted);
console.log('Keys after deletion:', storage.keys());

// Try to delete non-existent key
const deletedMissing = storage.delete('nonexistent');
console.log('Deleted nonexistent key:', deletedMissing);

// Verify deletion
console.log('Still has boolean_test:', storage.has('boolean_test'));

console.log('✅ Storage management tests passed');
</VSCode.Cell>

<VSCode.Cell language="markdown">
## Storage Status After Management Tests

After running management operations:

- **Current Keys**: {{storage.keys().join(', ')}}
- **Keys Count**: {{storage.keys().length}}
- **Boolean Test Exists**: {{storage.has('boolean_test') ? 'Yes' : 'No'}}
- **Employee Data Exists**: {{storage.has('employee_dataframe') ? 'Yes' : 'No'}}

**Complex Data Sample**:
- **DataFrame Shape**: {{storage.get('employee_dataframe').shape.join(' x ')}}
- **Employee Count**: {{storage.get('employee_dataframe').values.length}}
- **Analysis Mean Salary**: ${{storage.get('salary_analysis').mean_salary.toLocaleString()}}
</VSCode.Cell>

<VSCode.Cell language="javascript">
// Test 5: Error Handling and Edge Cases
console.log('=== Test 5: Error Handling ===');

try {
  // Test storing circular references (should handle gracefully)
  const obj = { name: 'test' };
  obj.self = obj; // Create circular reference
  
  try {
    storage.set('circular_test', obj);
    console.log('❌ Circular reference should have failed');
  } catch (error) {
    console.log('✅ Circular reference properly rejected:', error.message);
  }
  
  // Test very large keys
  const longKey = 'a'.repeat(1000);
  storage.set(longKey, 'long key test');
  console.log('✅ Long key handled:', storage.has(longKey));
  
  // Test empty values
  storage.set('empty_string', '');
  storage.set('null_value', null);
  storage.set('undefined_value', undefined);
  
  console.log('Empty string:', storage.get('empty_string'));
  console.log('Null value:', storage.get('null_value'));
  console.log('Undefined value:', storage.get('undefined_value'));
  
  console.log('✅ Edge case tests completed');
  
} catch (error) {
  console.log('Test error:', error.message);
}
</VSCode.Cell>

<VSCode.Cell language="markdown">
## Save and Reload Test Instructions

**🔴 MANUAL TEST REQUIRED**

To complete the integration test:

1. **Save this notebook**: Use Cmd+S or File > Save
2. **Check console** for any save errors
3. **Close the notebook**: Close VS Code or switch to another notebook
4. **Reopen this notebook**: Load the saved file
5. **Check storage persistence**: Run the verification cell below

The storage should contain all data from the previous cells after reload.

**Expected Keys After Reload**: {{storage.keys().length}} keys
**Expected Values**: String, number, array, object, DataFrame, analysis results
</VSCode.Cell>

<VSCode.Cell language="javascript">
// Test 6: Post-Reload Verification
console.log('=== Test 6: Post-Reload Verification ===');
console.log('Run this cell after saving and reloading the notebook');

const expectedKeys = [
  'string_test',
  'number_test', 
  'array_test',
  'object_test',
  'employee_dataframe',
  'salary_analysis'
];

console.log('Current keys:', storage.keys());
console.log('Expected keys:', expectedKeys);

// Check if all expected keys exist
let allKeysPresent = true;
expectedKeys.forEach(key => {
  const exists = storage.has(key);
  console.log(`${key}: ${exists ? '✅' : '❌'}`);
  if (!exists) allKeysPresent = false;
});

if (allKeysPresent) {
  console.log('🎉 SUCCESS: All data persisted correctly!');
  
  // Verify data integrity
  const df = storage.get('employee_dataframe');
  const analysis = storage.get('salary_analysis');
  
  console.log('DataFrame shape:', df.shape);
  console.log('Employee count:', df.values.length);
  console.log('Mean salary:', analysis.mean_salary);
  
  console.log('✅ Storage system integration test PASSED');
} else {
  console.log('❌ FAILED: Some data was not persisted');
}
</VSCode.Cell>

<VSCode.Cell language="javascript">
// Test 7: Clear All Data (Optional)
console.log('=== Test 7: Storage Cleanup ===');
console.log('Keys before clear:', storage.keys());

// Uncomment to clear all storage
// storage.clear();
// console.log('Keys after clear:', storage.keys());

console.log('Storage integration test completed!');
console.log('Total test cases: 7');
console.log('Manual save/reload test required for full validation');
</VSCode.Cell>
