# Example and User Notebooks File System

## Overview

The Nodebook.js application includes a file system for managing both example notebooks and user notebooks. Examples are displayed on the homepage to help users get started, while user notebooks are stored in the application's user data directory.

## File System Support

Both the examples and user notebooks systems support both file formats:
- **`.json` files**: Traditional JSON-formatted notebook files
- **`.nbjs` files**: Native Nodebook.js format files

## Implementation

The file system operations are handled by:
- **Frontend**: `src/Views/HomePage.tsx` - displays examples and recent files in the UI
- **File System**: `src/lib/fileSystemHelpers.ts` - scans and loads notebook files

### Key Methods

#### `FileSystemHelpers.listExamples()`
Scans the examples directory and returns metadata for all example notebook files:

```typescript
public async listExamples(): Promise<FileSystemResult<NotebookFileInfo[]>> {
    // Scans for both .json and .nbjs files
    const notebookFiles = files.filter(file => file.endsWith('.json') || file.endsWith('.nbjs'));
    // Returns file metadata including path, size, and last modified date
}
```

#### `FileSystemHelpers.listNotebooks()`
Scans the user notebooks directory and returns metadata for all user notebook files:

```typescript
public async listNotebooks(): Promise<FileSystemResult<NotebookFileInfo[]>> {
    // Scans for both .json and .nbjs files in user data directory
    const notebookFiles = files.filter(file => file.endsWith('.json') || file.endsWith('.nbjs'));
    // Returns file metadata including path, size, and last modified date
}
```

## Directory Structure

### Examples Directory
#### Development
In development, examples are loaded from `{projectRoot}/examples/`

#### Production
In production, examples are copied to `{process.resourcesPath}/examples/` by the build system (configured in `forge.config.ts`)

### User Notebooks Directory
User notebooks are stored in the application's user data directory:
- **Location**: `{app.getPath('userData')}/notebooks/`
- **Supports**: Both `.json` and `.nbjs` files
- **Purpose**: User-created notebooks and saved files

## Adding New Examples

To add a new example notebook:

1. **Create the notebook file** in the `examples/` directory
2. **Use either format**: 
   - `.json` for traditional JSON format
   - `.nbjs` for native Nodebook.js format
3. **Test locally** to ensure it appears on the homepage
4. **Commit the file** - it will be automatically included in builds

## Best Practices

- **Use descriptive filenames** that indicate the example's purpose
- **Keep examples focused** on specific features or use cases
- **Test examples** before committing to ensure they work correctly
- **Consider file size** as examples are packaged with the application
- **Prefer `.nbjs` extension** for new files (it's the native format)

## Technical Notes

- Examples and user notebooks are loaded asynchronously on homepage mount
- File metadata is cached during the user session
- Both formats are treated equally by the file system helpers
- Files are sorted by last modified date (newest first)
- The save dialog defaults to `.nbjs` extension for new files

## Recent Changes

- **2024**: Added support for `.nbjs` files in both examples and user notebooks systems
- Files with both extensions now appear on the homepage and in recent files
- Updated documentation to reflect the dual format support
- User notebooks directory now scans for both file types
