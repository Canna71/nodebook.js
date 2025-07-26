# Test Static Cell Exports

This notebook tests that static code cells can export values that are accessible to other cells.

## Static Cell (Manual Execution)

```javascript
// This is a static cell - it won't auto-execute but should export values when run manually
console.log('🔧 Static cell executing...');

// Export some values
exports.staticValue = 'Hello from static cell!';
exports.staticNumber = 42;
exports.staticObject = { 
    timestamp: new Date().toISOString(),
    source: 'static cell'
};

console.log('✅ Static cell exports created');
```

## Regular Cell (Auto-Execution)

```javascript
// This regular cell should be able to access the static cell's exports
try {
    console.log('📖 Trying to access static cell exports...');
    
    // Try to access the exported values
    const staticVal = staticValue;
    const staticNum = staticNumber; 
    const staticObj = staticObject;
    
    console.log('staticValue:', staticVal);
    console.log('staticNumber:', staticNum);
    console.log('staticObject:', staticObj);
    
    // Export our own result
    exports.testResult = 'SUCCESS: Can access static cell exports';
    exports.accessedValues = {
        staticValue: staticVal,
        staticNumber: staticNum,
        staticObject: staticObj
    };
    
    console.log('✅ Regular cell can access static exports');
    
} catch (error) {
    console.log('❌ Failed to access static cell exports:', error.message);
    exports.testResult = 'FAILED: Cannot access static cell exports - ' + error.message;
}
```
