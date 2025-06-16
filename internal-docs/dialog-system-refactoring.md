# Dialog System Refactoring Specification

## Overview

Refactor the existing dialog system to establish a consistent, maintainable hierarchy where all dialogs extend from a common `AppDialog` base component. This will eliminate the current inconsistency between AI dialogs (using shadcn) and application dialogs (using Electron native dialogs).

## Current State Analysis

### ✅ Well-implemented
- `src/components/ui/dialog.tsx` - shadcn/ui base dialog components
- `src/components/AIDialogs.tsx` - AI-specific dialog implementations
- `src/components/AIDialogProvider.tsx` - AI dialog state management
- `src/lib/AIDialogHelper.ts` - Bridge for non-React AI dialog operations

### ❌ Problems to solve
- 13 occurrences of `window.api.showErrorBox()` in `ApplicationProvider.tsx`
- 4 occurrences of `window.api.showMessageBox()` in `ApplicationProvider.tsx`
- 1 occurrence of `alert()` in `SettingsView.tsx` (line 317)
- 2 fallback `alert()` calls in `AIDialogHelper.ts` (lines 68, 84)
- 1 fallback `window.prompt()` call in `AIDialogHelper.ts` (lines 49-51)

## Target Architecture

```
AppDialog (base component)
├── AIDialogs (AI-specific extensions)
│   ├── AIPromptDialog
│   ├── AIErrorDialog
│   └── AISuccessDialog
├── AppErrorDialog (general error handling)
├── AppConfirmDialog (confirmations)
├── AppInfoDialog (information display)
└── AppPromptDialog (general user input)
```

## Implementation Tasks

### Task 1: Create AppDialog Base Component

**File:** `src/components/AppDialog.tsx`

Create a base dialog component that:
- Extends shadcn's Dialog components
- Provides consistent styling and behavior
- Includes common props for all dialogs
- Handles standard keyboard shortcuts (Escape, Enter)
- Provides consistent button layouts

**Required Props:**
```typescript
interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  persistent?: boolean; // Prevents closing with Escape or backdrop click
  showCloseButton?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}
```

**Features to implement:**
- Consistent color schemes based on variant
- Responsive sizing based on size prop
- Auto-focus management
- Consistent animations
- Accessibility improvements (ARIA labels, focus trapping)

### Task 2: Create General App Dialog Components

**File:** `src/components/AppDialogs.tsx`

Implement these components extending AppDialog:

#### AppErrorDialog
```typescript
interface AppErrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  error?: string; // Technical error details
  onRetry?: () => void; // Optional retry button
}
```

#### AppConfirmDialog
```typescript
interface AppConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  variant?: 'default' | 'destructive';
  confirmText?: string; // Default: "Confirm"
  cancelText?: string; // Default: "Cancel"
  onConfirm: () => void;
  onCancel?: () => void;
}
```

#### AppInfoDialog
```typescript
interface AppInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  details?: string; // Optional expandable details
}
```

#### AppPromptDialog
```typescript
interface AppPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  validation?: (value: string) => string | null; // Return error message or null
  onSubmit: (value: string) => void;
  onCancel?: () => void;
}
```

### Task 3: Create App Dialog Provider

**File:** `src/components/AppDialogProvider.tsx`

Create a provider similar to `AIDialogProvider` but for general app dialogs:

```typescript
interface AppDialogContextType {
  showError: (config: AppErrorDialogConfig) => Promise<void>;
  showConfirm: (config: AppConfirmDialogConfig) => Promise<boolean>;
  showInfo: (config: AppInfoDialogConfig) => Promise<void>;
  showPrompt: (config: AppPromptDialogConfig) => Promise<string | null>;
  closeAllDialogs: () => void;
}
```

**State management:**
- Support multiple dialogs open simultaneously (queue system)
- Proper cleanup on unmount
- Integration with React Suspense boundaries

### Task 4: Create App Dialog Helper

**File:** `src/lib/AppDialogHelper.ts`

Create a helper similar to `AIDialogHelper` for non-React code:

```typescript
export class AppDialogHelper {
  private static instance: AppDialogHelper;
  private dialogHandlers: AppDialogHandlers = {};
  
  // Singleton pattern
  static getInstance(): AppDialogHelper;
  
  // Register handlers from React context
  registerHandlers(handlers: AppDialogHandlers): void;
  
  // Dialog methods for use outside React
  async showError(title: string, message: string, error?: string): Promise<void>;
  async showConfirm(title: string, message: string): Promise<boolean>;
  async showInfo(title: string, message: string): Promise<void>;
  async showPrompt(title: string, message: string, placeholder?: string): Promise<string | null>;
}
```

### Task 5: Refactor AI Dialogs to Extend AppDialog

**Files to modify:**
- `src/components/AIDialogs.tsx`
- `src/components/AIDialogProvider.tsx`

**Changes required:**
1. Make AI dialogs extend `AppDialog` instead of shadcn Dialog directly
2. Remove duplicate styling and behavior code
3. Add AI-specific props while maintaining AppDialog base props
4. Update interfaces to extend base AppDialog interfaces

**Example refactor for AIPromptDialog:**
```typescript
interface AIPromptDialogProps extends AppDialogProps {
  onSubmit: (prompt: string) => void;
  placeholder?: string;
  isGenerating?: boolean;
  generationProgress?: string;
}

export function AIPromptDialog({
  isGenerating = false,
  generationProgress,
  placeholder = 'Enter your prompt here...',
  onSubmit,
  ...appDialogProps
}: AIPromptDialogProps) {
  // Implementation using AppDialog as base
}
```

### Task 6: Replace Native Electron Dialogs

**File:** `src/Engine/ApplicationProvider.tsx`

Replace all instances of:
- `window.api.showErrorBox()` → Use `AppDialogHelper.showError()`
- `window.api.showMessageBox()` → Use `AppDialogHelper.showInfo()` or `AppDialogHelper.showConfirm()`

**Specific replacements needed:**

1. **Error dialogs (13 instances):**
   - Lines 200, 214, 233, 248, 262, 273, 282, 381, 399, 446, 582, 592, 603
   - Replace with: `await appDialogHelper.showError(title, message)`

2. **Message boxes (4 instances):**
   - Line 454: About dialog → `await appDialogHelper.showInfo()`
   - Lines 501, 528, 571: Various info messages → `await appDialogHelper.showInfo()`

### Task 7: Remove Remaining Native Dialog Usage

**Files to modify:**
- `src/Views/SettingsView.tsx` - Remove `alert()` on line 317
- `src/lib/AIDialogHelper.ts` - Remove fallback `alert()` and `window.prompt()` calls

**Replacement strategy:**
- Remove debug `alert()` in SettingsView and use proper logging
- Remove fallbacks in AIDialogHelper (should always have handlers registered)

### Task 8: Integration and Provider Setup

**File:** `src/Views/App.tsx` or main app file

Add the AppDialogProvider to the provider tree:

```tsx
<ApplicationProvider>
  <ReactiveProvider>
    <ViewProvider>
      <CommandProvider>
        <AIDialogProvider>
          <AppDialogProvider>  {/* Add this */}
            {/* App content */}
          </AppDialogProvider>
        </AIDialogProvider>
      </CommandProvider>
    </ViewProvider>
  </ReactiveProvider>
</ApplicationProvider>
```

### Task 9: Update Type Definitions

**File:** `src/Types/` (appropriate type files)

Add type definitions for:
- Dialog variant types
- Dialog size types  
- Dialog configuration interfaces
- Error handling types

### Task 10: Testing and Validation

**Create test scenarios for:**
1. All dialog variants display correctly
2. Keyboard shortcuts work (Escape, Enter)
3. Focus management works properly
4. Multiple dialogs can be queued
5. Dialog state persists correctly during navigation
6. Accessibility features work (screen readers, tab navigation)
7. Error boundaries handle dialog failures gracefully

## Implementation Order

1. **Phase 1: Base Infrastructure**
   - Task 1: Create AppDialog base component
   - Task 2: Create general app dialog components
   - Task 3: Create AppDialogProvider
   - Task 4: Create AppDialogHelper

2. **Phase 2: Integration**
   - Task 8: Set up providers in app
   - Task 9: Update type definitions

3. **Phase 3: Refactoring**
   - Task 5: Refactor AI dialogs to extend AppDialog
   - Task 6: Replace Electron native dialogs
   - Task 7: Remove remaining native dialog usage

4. **Phase 4: Validation**
   - Task 10: Testing and validation

## Success Criteria

- [ ] All dialogs use consistent styling and behavior
- [ ] No native `alert()`, `confirm()`, or `window.prompt()` calls
- [ ] No Electron `showErrorBox()` or `showMessageBox()` calls  
- [ ] AI dialogs extend AppDialog properly
- [ ] Dialog system is accessible (WCAG 2.1 AA compliant)
- [ ] Dialog system works consistently across all app features
- [ ] Code is maintainable with clear separation of concerns
- [ ] Performance is not degraded by dialog system changes

## Notes

- Maintain backward compatibility during transition
- Ensure all dialog text can be localized in the future
- Consider implementing dialog history/logging for debugging
- Plan for future dialog types (progress dialogs, multi-step wizards, etc.)
- Ensure dialog system works with the reactive system properly
- Consider implementing dialog persistence across app restarts if needed

## Files to Create
- `src/components/AppDialog.tsx`
- `src/components/AppDialogs.tsx`  
- `src/components/AppDialogProvider.tsx`
- `src/lib/AppDialogHelper.ts`

## Files to Modify
- `src/components/AIDialogs.tsx`
- `src/components/AIDialogProvider.tsx`
- `src/Engine/ApplicationProvider.tsx`
- `src/Views/SettingsView.tsx`
- `src/lib/AIDialogHelper.ts`
- `src/Views/App.tsx` (or main app file)
- Type definition files in `src/Types/`
