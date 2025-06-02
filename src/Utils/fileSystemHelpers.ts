import anylogger from 'anylogger';
import { NotebookModel } from '@/Types/NotebookModel';
import { use } from 'react';


const log = anylogger('FileSystemHelpers');

// Get required modules for Electron environment
let fs: typeof import('fs');
let path: typeof import('path');
let electron: typeof import('electron');

try {
    fs = require('fs');
    path = require('path');
    electron = require('electron');
} catch (error) {
    log.error('Failed to load Node.js modules. This application requires Electron environment.', error);
    throw new Error('File system operations require Electron environment');
}

/**
 * Interface for file system operations results
 */
interface FileSystemResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Interface for example file metadata
 */
export interface NotebookFileInfo {
    description?: string;
    filepath: string;
    lastModified: Date;
    size: number;
}


/**
 * File system helper class for managing notebook examples and user data
 */
export class FileSystemHelpers {
    private userDataPath: string;
    private examplesPath: string;
    private userNotebooksPath: string;
    private isPackaged: boolean;

    constructor(userDataPath = '', isPackaged = true) {
        // Get application user data directory
        this.userDataPath = userDataPath;
        const resourcesPath = isPackaged ? process.resourcesPath : process.cwd();
        this.examplesPath = path.join(resourcesPath, 'examples');
        this.userNotebooksPath = path.join(this.userDataPath, 'notebooks');

        log.debug('FileSystemHelpers initialized:', {
            userDataPath: this.userDataPath,
            examplesPath: this.examplesPath,
            userNotebooksPath: this.userNotebooksPath
        });

        // Ensure directories exist
        // this.ensureDirectories();
    }

    /**
     * Ensure required directories exist
     */
    private ensureDirectories(): void {
        try {
            [this.examplesPath, this.userNotebooksPath].forEach(dir => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                    log.debug(`Created directory: ${dir}`);
                }
            });
        } catch (error) {
            log.error('Failed to create directories:', error);
            throw new Error(`Failed to create required directories: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get the examples directory path
     */
    public getExamplesPath(): string {
        return this.examplesPath;
    }

    /**
     * Get the user notebooks directory path
     */
    public getUserNotebooksPath(): string {
        return this.userNotebooksPath;
    }

    /**
     * Get the user data directory path
     */
    public getUserDataPath(): string {
        return this.userDataPath;
    }

    /**
     * Save a notebook example to the examples folder
     */
    public async saveExample(example: NotebookModel, filename?: string): Promise<FileSystemResult<string>> {
        try {
            // Use provided filename or generate one from available properties, falling back to a default
            const fileName = filename ||
                `${(example as any).id || (example as any).title || 'example'}.json`;
            const filePath = path.join(this.examplesPath, fileName);

            const jsonContent = JSON.stringify(example, null, 2);

            await fs.promises.writeFile(filePath, jsonContent, 'utf8');

            log.debug(`Example saved successfully: ${filePath}`);
            return {
                success: true,
                data: filePath
            };
        } catch (error) {
            const errorMsg = `Failed to save example: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * Load a notebook example from the examples folder
     */
    public async loadExample(filename: string): Promise<FileSystemResult<NotebookModel>> {
        try {
            const filePath = path.join(this.examplesPath, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Example file not found: ${filename}`
                };
            }

            const content = await fs.promises.readFile(filePath, 'utf8');
            const notebook: NotebookModel = JSON.parse(content);

            log.debug(`Example loaded successfully: ${filename}`);
            return {
                success: true,
                data: notebook
            };
        } catch (error) {
            const errorMsg = `Failed to load example ${filename}: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }



    /**
     * List all available examples
     */
    public async listExamples(): Promise<FileSystemResult<NotebookFileInfo[]>> {
        try {
            const files = await fs.promises.readdir(this.examplesPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            const examples: NotebookFileInfo[] = [];

            for (const file of jsonFiles) {
                const filePath = path.join(this.examplesPath, file);
                const stats = await fs.promises.stat(filePath);

                try {
                    // Try to read the file to get metadata
                    const content = await fs.promises.readFile(filePath, 'utf8');
                    const notebook = JSON.parse(content) as NotebookModel;

                    // Use filename as fallback for name
                    const baseFileName = path.basename(file, '.json');

                    examples.push({
                        description: notebook.description,
                        filepath: filePath,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                } catch (parseError) {
                    log.warn(`Failed to parse example file ${file}, including with basic info:`, parseError);
                    const baseFileName = path.basename(file, '.json');
                    examples.push({
                        description: 'Invalid JSON file',
                        filepath: filePath,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                }
            }

            // Sort by last modified date (newest first)
            examples.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

            log.debug(`Found ${examples.length} examples`);
            return {
                success: true,
                data: examples
            };
        } catch (error) {
            const errorMsg = `Failed to list examples: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * Save a user notebook
     */
    public async saveNotebook(notebook: NotebookModel, filename?: string): Promise<FileSystemResult<string>> {
        try {
            // Use provided filename or generate one from available properties, falling back to a default
            const fileName = filename ||
                `${(notebook as any).id || (notebook as any).title || 'notebook'}.json`;
            const filePath = path.join(this.userNotebooksPath, fileName);

            const jsonContent = JSON.stringify(notebook, null, 2);

            await fs.promises.writeFile(filePath, jsonContent, 'utf8');

            log.debug(`Notebook saved successfully: ${filePath}`);
            return {
                success: true,
                data: filePath
            };
        } catch (error) {
            const errorMsg = `Failed to save notebook: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * Load a user notebook from the notebooks folder
     */
    public async loadNotebook(filename: string): Promise<FileSystemResult<NotebookModel>> {
        try {
            const filePath = path.join(this.userNotebooksPath, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Notebook file not found: ${filename}`
                };
            }

            const content = await fs.promises.readFile(filePath, 'utf8');
            const notebook: NotebookModel = JSON.parse(content);

            log.debug(`Notebook loaded successfully: ${filename}`);
            return {
                success: true,
                data: notebook
            };
        } catch (error) {
            const errorMsg = `Failed to load notebook ${filename}: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * List all user notebooks
     */
    public async listNotebooks(): Promise<FileSystemResult<NotebookFileInfo[]>> {
        try {
            const files = await fs.promises.readdir(this.userNotebooksPath);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            const notebooks: NotebookFileInfo[] = [];

            for (const file of jsonFiles) {
                const filePath = path.join(this.userNotebooksPath, file);
                const stats = await fs.promises.stat(filePath);

                try {
                    const content = await fs.promises.readFile(filePath, 'utf8');
                    const notebook = JSON.parse(content) as NotebookModel;

                    // Use filename as fallback for name
                    const baseFileName = path.basename(file, '.json');

                    notebooks.push({
                        description: notebook.description,
                        filepath: filePath,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                } catch (parseError) {
                    log.warn(`Failed to parse notebook file ${file}:`, parseError);
                    const baseFileName = path.basename(file, '.json');
                    notebooks.push({
                        description: 'Invalid JSON file',
                        filepath: filePath,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                }
            }

            // Sort by last modified date (newest first)
            notebooks.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

            log.debug(`Found ${notebooks.length} user notebooks`);
            return {
                success: true,
                data: notebooks
            };
        } catch (error) {
            const errorMsg = `Failed to list notebooks: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }





    /**
     * Delete a notebook file
     */
    public async deleteNotebook(filename: string): Promise<FileSystemResult<boolean>> {
        try {
            const filePath = path.join(this.userNotebooksPath, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Notebook file not found: ${filename}`
                };
            }

            await fs.promises.unlink(filePath);

            log.debug(`Notebook deleted successfully: ${filename}`);
            return {
                success: true,
                data: true
            };
        } catch (error) {
            const errorMsg = `Failed to delete notebook ${filename}: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * Check if a file exists in examples folder
     */
    public exampleExists(filename: string): boolean {
        const filePath = path.join(this.examplesPath, filename);
        return fs.existsSync(filePath);
    }

    /**
     * Check if a file exists in notebooks folder
     */
    public notebookExists(filename: string): boolean {
        const filePath = path.join(this.userNotebooksPath, filename);
        return fs.existsSync(filePath);
    }

    /**
     * Get file stats for a specific example
     */
    public async getExampleStats(filename: string): Promise<FileSystemResult<NotebookFileInfo>> {
        try {
            const filePath = path.join(this.examplesPath, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Example file not found: ${filename}`
                };
            }

            const stats = await fs.promises.stat(filePath);

            try {
                const content = await fs.promises.readFile(filePath, 'utf8');
                const notebook = JSON.parse(content) as NotebookModel;

                // Use filename as fallback for name
                const baseFileName = path.basename(filename, '.json');

                const fileInfo: NotebookFileInfo = {
                    filepath: filePath,
                    lastModified: stats.mtime,
                    size: stats.size
                };

                return {
                    success: true,
                    data: fileInfo
                };
            } catch (parseError) {
                return {
                    success: false,
                    error: `Failed to parse example file: ${parseError instanceof Error ? parseError.message : String(parseError)}`
                };
            }
        } catch (error) {
            const errorMsg = `Failed to get example stats: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }
}

// Create singleton instance
let fileSystemHelpers: FileSystemHelpers = undefined;

export async function initializeFileSystemHelpers(): Promise<FileSystemHelpers> {

    if (fileSystemHelpers) {
        log.debug('FileSystemHelpers already initialized, returning existing instance');
        return fileSystemHelpers;
    }
    // Reinitialize with the provided user data path
    const [userDataPath, isPackaged] = await Promise.all(
        [(window as any).getUserDataPath(),
        (window as any).isPackaged()])

    fileSystemHelpers = new FileSystemHelpers(userDataPath, isPackaged);
    return fileSystemHelpers;
}

export function getFileSystemHelpers(): FileSystemHelpers {
    if (!fileSystemHelpers) {
        throw new Error('FileSystemHelpers not initialized. Call initializeFileSystemHelpers first.');
    }
    return fileSystemHelpers;
}

// Export utility functions
export async function loadExampleFromDisk(filename: string): Promise<NotebookModel | null> {
    const result = await fileSystemHelpers.loadExample(filename);
    if (result.success && result.data) {
        return result.data;
    }
    log.error(`Failed to load example ${filename}: ${result.error}`);
    return null;
}


export async function getAllExamples(): Promise<NotebookFileInfo[]> {
    const result = await fileSystemHelpers.listExamples();
    if (result.success && result.data) {
        return result.data;
    }
    log.error(`Failed to list examples: ${result.error}`);
    return [];
}

export async function getAllNotebooks(): Promise<NotebookFileInfo[]> {
    const result = await fileSystemHelpers.listNotebooks();
    if (result.success && result.data) {
        return result.data;
    }
    log.error(`Failed to list notebooks: ${result.error}`);
    return [];
}
