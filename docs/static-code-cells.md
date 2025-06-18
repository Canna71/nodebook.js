# Static Code Cells Reference

Static code cells provide manual execution control for cells with side effects or expensive operations.

## Quick Reference

### Enabling Static Mode
1. Edit a code cell (enter edit mode)
2. Check "Static mode (manual execution only)" below the editor
3. Apply changes - cell shows orange border

### Key Behaviors
- ✅ **Manual execution only** - won't run automatically
- ✅ **Can read reactive variables** - access variables from other cells  
- ✅ **Can export variables** - other cells can use their exports
- ✅ **Skips initialization** - won't run when notebook loads
- ✅ **Orange visual styling** - distinct border and background

### When to Use Static Cells

```javascript
// ✅ Database operations
await db.query('UPDATE users SET last_login = NOW()');

// ✅ File operations  
fs.writeFileSync('report.json', JSON.stringify(data));

// ✅ Network requests with side effects
await api.sendNotification(message);

// ✅ Expensive computations
const result = await trainMLModel(dataset); // Takes 10 minutes

// ✅ Debug logging
console.log('Detailed debug info:', debugData);
```

### When to Keep Reactive

```javascript
// ✅ Data transformations
exports.cleanedData = rawData.filter(item => item.valid);

// ✅ Calculations
exports.total = items.reduce((sum, item) => sum + item.price, 0);

// ✅ Real-time updates
exports.currentTime = new Date().toISOString();
```

## Switching Modes

| From → To | Behavior |
|-----------|----------|
| Reactive → Static | Stops auto-execution, keeps current state |
| Static → Reactive | Remains dormant until manually executed |

**Important**: When switching from static to reactive, manually execute the cell once to rejoin the reactive chain.

## Visual Indicators

- **Orange border**: Static cells have orange borders
- **Orange background**: Subtle orange tint
- **Static badge**: Appears when toggle is enabled
- **Edit mode only**: Toggle only visible when editing

For detailed examples and advanced usage, see the [Code Cells Guide](./code-cells.md#static-code-cells).
