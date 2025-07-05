# PropertyGrid Component

## Overview

The PropertyGrid component provides a spreadsheet-like interface for viewing and editing object properties, replacing the traditional JSON tree view with a more user-friendly two-column layout.

## Features

### Layout
- **Two-column design**: Property names on the left, values on the right
- **Type information**: Each property displays its data type with a badge
- **Full path display**: Nested properties show their complete path (e.g., `user.preferences.theme`)
- **Collapsible interface**: Can expand/collapse the entire grid

### Editing
- **Reactive integration**: Automatically detects and enables editing for reactive variables
- **Click-to-edit**: Click the edit icon to modify any editable property
- **Type-aware parsing**: Automatically converts strings to appropriate types (numbers, booleans, etc.)
- **Keyboard shortcuts**: Enter to save, Escape to cancel
- **Visual feedback**: Shows editable state and provides save/cancel buttons

### Data Types
- **Primitive types**: Strings, numbers, booleans, null, undefined
- **Complex types**: Objects and arrays (with configurable depth)
- **Type preservation**: Maintains original data types during editing

## Usage

### Basic Usage
```tsx
import PropertyGrid from '@/components/PropertyGrid';

<PropertyGrid 
  data={myObject}
  name="myObject"
  editable={true}
/>
```

### Integration with ObjectDisplay
The PropertyGrid is automatically used by ObjectDisplay for generic objects:

```tsx
// Uses PropertyGrid by default
<ObjectDisplay data={myObject} name="myObject" />

// Force ReactJson view
<ObjectDisplay data={myObject} name="myObject" usePropertyGrid={false} />
```

### Utility Functions
```tsx
import { 
  renderObjectAsPropertyGrid, 
  renderObjectAsJson 
} from '@/components/ObjectDisplay';

// Render with PropertyGrid
const propertyGridView = renderObjectAsPropertyGrid(data, 'myData');

// Render with ReactJson (legacy)
const jsonView = renderObjectAsJson(data, 'myData');
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `any` | - | The object to display |
| `name` | `string` | - | Variable name (enables editing if reactive) |
| `editable` | `boolean` | `false` | Whether to allow editing |
| `collapsed` | `boolean` | `false` | Initial collapsed state |
| `maxDepth` | `number` | `3` | Maximum nesting depth to display |
| `onValueChange` | `function` | - | Custom value change handler |

## Integration with Reactive System

### Automatic Detection
The PropertyGrid automatically detects if the displayed object is a reactive variable by:
1. Checking if a `name` prop is provided
2. Verifying the variable exists in the reactive store
3. Enabling editing only for confirmed reactive variables

### Value Updates
When editing reactive variables:
1. User clicks edit icon and modifies value
2. Value is parsed according to its type
3. The entire object is updated in the reactive store
4. Dependent cells automatically re-execute

### Example
```javascript
// In a code cell
exports.userSettings = {
  theme: "dark",
  fontSize: 14,
  notifications: {
    email: true,
    push: false
  }
};

output(userSettings); // Shows editable PropertyGrid
```

## Comparison with ReactJson

| Feature | PropertyGrid | ReactJson |
|---------|--------------|-----------|
| Layout | Two-column table | Tree structure |
| Editing | Click-to-edit | JSON editing |
| Type info | Type badges | Inferred from color |
| Paths | Full path shown | Hierarchical |
| Reactive | Native support | Manual integration |
| Compactness | More space per item | More items visible |
| UX Consistency | Matches DataFrame editor | Unique interface |

## Configuration

### Default Behavior
- PropertyGrid is enabled by default for generic objects in ObjectDisplay
- Users can toggle between PropertyGrid and ReactJson views using the toggle button
- Editing is automatically enabled for reactive variables

### Customization
```tsx
// Custom depth limit
<PropertyGrid data={data} maxDepth={5} />

// Custom value change handler
<PropertyGrid 
  data={data} 
  onValueChange={(path, newValue) => {
    console.log(`Changed ${path.join('.')} to`, newValue);
  }}
/>

// Read-only mode
<PropertyGrid data={data} editable={false} />
```

## Best Practices

### When to Use PropertyGrid
- ✅ Editing object properties
- ✅ Exploring data structure in a spreadsheet-like view
- ✅ Working with configuration objects
- ✅ When consistency with DataFrame editor is desired

### When to Use ReactJson
- ✅ Viewing raw JSON structure
- ✅ Copying JSON snippets
- ✅ Working with deeply nested objects
- ✅ When familiar tree view is preferred

### Performance Considerations
- PropertyGrid flattens objects up to `maxDepth` (default: 3)
- For very large objects, consider using ReactJson or increasing `maxDepth`
- Editing creates a copy of the entire object, so very large objects may impact performance

## Implementation Details

### Flattening Algorithm
The PropertyGrid flattens nested objects using a breadth-first approach:
1. Recursively traverses object properties up to `maxDepth`
2. Creates flat list with full property paths
3. Preserves type information and editability flags

### Type Detection and Parsing
- **Numbers**: Detects numeric strings and converts automatically
- **Booleans**: Recognizes "true"/"false" strings
- **Null/Undefined**: Handles special string representations
- **Objects/Arrays**: Attempts JSON.parse for complex types

### Reactive Integration
- Uses `useReactiveSystem()` hook to access reactive store
- Performs reverse lookup to find variable names for unnamed objects
- Updates reactive store with modified object copies
- Triggers re-execution of dependent cells automatically

## Migration from ReactJson

### Backwards Compatibility
- ReactJson remains available as fallback
- Toggle button allows users to switch between views
- All existing code continues to work unchanged

### Gradual Migration
1. PropertyGrid is enabled by default for new object displays
2. Users can toggle to ReactJson if needed
3. Specific use cases can disable PropertyGrid via props
4. No breaking changes to existing API

### Code Updates
```tsx
// Old way (still works)
<ObjectDisplay data={obj} />

// New way with explicit control
<ObjectDisplay data={obj} usePropertyGrid={true} />

// Disable PropertyGrid for specific cases
<ObjectDisplay data={obj} usePropertyGrid={false} />
```
