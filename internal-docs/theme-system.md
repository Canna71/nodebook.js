# Theme System and Color Management

## Overview

Nodebook.js uses a centralized theme system that supports both light and dark modes. This guide explains how to use theme colors correctly and avoid hardcoded colors that break theming.

## ❌ Problems with Hardcoded Colors

### **Issues We Had:**
```tsx
// ❌ Bad: Hardcoded colors that only work in dark mode
className="text-red-400 bg-gray-900 border-gray-700"

// ❌ Bad: Colors that don't adapt to theme changes
className="text-yellow-400 hover:bg-gray-600"
```

### **Why This Is Bad:**
- **Theme inconsistency**: Colors don't match the design system
- **Mode-specific**: Only works in dark OR light mode, not both
- **Not customizable**: Users can't theme the application
- **Maintenance nightmare**: Hard to update colors across the app

## ✅ Correct Theme Usage

### **Use Semantic Color Classes:**
```tsx
// ✅ Good: Semantic colors that adapt to themes
className="text-error bg-console-background border-console-border"

// ✅ Good: Status colors that work in all themes
className="text-warning hover:bg-muted/80"
```

## 🎨 Available Theme Colors

### **Base Colors**
```tsx
bg-background          // Main app background
text-foreground        // Main text color
bg-card               // Card backgrounds
text-card-foreground  // Card text color
```

### **Interactive Colors**
```tsx
bg-primary            // Primary buttons, links
text-primary-foreground
bg-secondary          // Secondary elements
text-secondary-foreground
bg-accent             // Highlighted elements
text-accent-foreground
```

### **Utility Colors**
```tsx
bg-muted              // Subdued backgrounds
text-muted-foreground // Secondary text
border-border         // Default borders
bg-input              // Form inputs
```

### **Status Colors (NEW)**
```tsx
text-success          // Success states, log messages
text-warning          // Warning states, alerts
text-error            // Error states, failures
text-info             // Information, help text
text-debug            // Debug information
```

### **Console Colors (NEW)**
```tsx
bg-console-background // Console panel background
text-console-foreground // Console text
border-console-border // Console borders
text-console-muted    // Console secondary text
```

## 🔧 How the Theme System Works

### **1. CSS Custom Properties**
Colors are defined as CSS custom properties in `src/styles/theme.css`:

```css
:root {
  --error: oklch(0.60 0.20 25);
  --success: oklch(0.55 0.15 145);
  /* ... */
}

.dark {
  --error: oklch(0.70 0.20 25);
  --success: oklch(0.65 0.15 145);
  /* ... */
}
```

### **2. Tailwind Integration**
Colors are exposed to Tailwind via the `@theme` directive:

```css
@theme inline {
  --color-error: var(--error);
  --color-success: var(--success);
  /* ... */
}
```

### **3. Component Usage**
Use semantic Tailwind classes in components:

```tsx
<div className="bg-console-background text-console-foreground">
  <span className="text-error">Error message</span>
  <span className="text-success">Success message</span>
</div>
```

## 📋 Migration Guidelines

### **Step 1: Identify Hardcoded Colors**
Look for patterns like:
```tsx
// ❌ These need to be replaced:
text-red-400
text-yellow-400
text-blue-400
text-green-400
text-gray-400
bg-gray-900
bg-gray-800
border-gray-700
```

### **Step 2: Map to Semantic Colors**
```tsx
// Replace with semantic equivalents:
text-red-400    → text-error
text-yellow-400 → text-warning  
text-blue-400   → text-info
text-green-400  → text-success
text-gray-400   → text-debug
bg-gray-900     → bg-console-background
bg-gray-800     → bg-muted
border-gray-700 → border-console-border
```

### **Step 3: Update Components**
```tsx
// Before:
<div className="bg-gray-900 text-gray-100 border-gray-700">
  <span className="text-red-400">Error</span>
</div>

// After:
<div className="bg-console-background text-console-foreground border-console-border">
  <span className="text-error">Error</span>
</div>
```

## 🎯 Best Practices

### **1. Use Semantic Names**
```tsx
// ✅ Good: Semantic, descriptive
text-error
text-warning  
text-success

// ❌ Bad: Implementation-specific
text-red-500
text-yellow-400
```

### **2. Follow the Design System**
```tsx
// ✅ Good: Uses established patterns
bg-background
text-foreground
border-border

// ❌ Bad: Creates new color variants
bg-custom-dark
text-my-special-blue
```

### **3. Test in Both Themes**
Always test your components in both light and dark modes:
```tsx
// Use theme toggle to verify colors work in both modes
// Check contrast ratios and readability
```

### **4. Prefer Opacity Over New Colors**
```tsx
// ✅ Good: Uses existing color with opacity
bg-error/10
border-error/30

// ❌ Bad: Creates new similar colors  
bg-red-950/20
border-red-800/30
```

## 🚀 Advanced Usage

### **Custom Color Properties**
For special cases, add new semantic colors to the theme:

```css
/* In theme.css */
:root {
  --special-highlight: oklch(0.70 0.15 280);
}

.dark {
  --special-highlight: oklch(0.75 0.15 280);
}

/* In @theme inline */
--color-special-highlight: var(--special-highlight);
```

Then use as:
```tsx
className="bg-special-highlight text-foreground"
```

### **Component-Specific Colors**
For component-specific theming:

```css
/* Console-specific colors */
--console-background: oklch(0.15 0.02 269);
--console-success: oklch(0.65 0.15 145);
--console-error: oklch(0.70 0.20 25);
```

### **Dynamic Color Calculation**
Use `oklch()` color space for consistent lightness across themes:

```css
/* Light theme */
--primary: oklch(0.60 0.15 220);

/* Dark theme - same hue/chroma, different lightness */
--primary: oklch(0.70 0.15 220);
```

## 🔍 Debugging Theme Issues

### **1. Check CSS Custom Properties**
```javascript
// In browser console:
getComputedStyle(document.documentElement).getPropertyValue('--error')
```

### **2. Verify Theme Classes**
```tsx
// Add debugging classes temporarily:
<div className="bg-error text-error-foreground p-4">
  Error color test
</div>
```

### **3. Use Browser DevTools**
- Inspect elements to see computed colors
- Toggle dark/light mode classes manually
- Check CSS custom property values

## 📊 Color Accessibility

### **Contrast Ratios**
All theme colors maintain WCAG AA contrast ratios:
- **Normal text**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **Interactive elements**: 3:1 minimum

### **Color Blindness**
- Use distinctive hues (red, green, blue, yellow)
- Provide non-color indicators (icons, text)
- Test with color blindness simulators

## 🔄 Theme Updates

### **When Adding New Colors:**
1. **Add to theme.css** (both light and dark variants)
2. **Add to @theme inline** section
3. **Document** the new color's purpose
4. **Test** across all components
5. **Update** this documentation

### **When Removing Colors:**
1. **Search** for all usages across the codebase
2. **Replace** with appropriate semantic alternatives
3. **Remove** from theme.css and @theme
4. **Test** that nothing breaks

This centralized approach ensures consistent theming across the entire application! 🎨
