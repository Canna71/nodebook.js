import anylogger from 'anylogger';

const log = anylogger('DocumentationHelpers');

// Get required modules for Electron environment
let fs: typeof import('fs');
let path: typeof import('path');

try {
    fs = require('fs');
    path = require('path');
} catch (error) {
    log.error('Failed to load Node.js modules. This application requires Electron environment.', error);
    throw new Error('Documentation operations require Electron environment');
}

/**
 * Interface for documentation operations results
 */
interface DocumentationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Interface for documentation file metadata
 */
export interface DocumentationFileInfo {
    title?: string;
    filepath: string;
    filename: string;
    lastModified: Date;
    size: number;
}

/**
 * Documentation helper class for managing embedded documentation
 */
export class DocumentationHelpers {
    private docsPath: string;
    private isPackaged: boolean;

    constructor(isPackaged = true) {
        this.isPackaged = isPackaged;
        
        // Determine docs path based on environment
        let resourcesPath: string;
        if (isPackaged) {
            // In production, docs are copied to process.resourcesPath by forge.config.ts
            resourcesPath = process.resourcesPath;
        } else {
            // In development, docs are in the project root
            resourcesPath = process.cwd();
        }
        
        this.docsPath = path.join(resourcesPath, 'docs');

        log.debug('DocumentationHelpers initialized:', {
            docsPath: this.docsPath,
            isPackaged: this.isPackaged,
            resourcesPath: resourcesPath
        });
    }

    /**
     * Get the documentation directory path
     */
    public getDocsPath(): string {
        return this.docsPath;
    }

    /**
     * Load a documentation file
     */
    public async loadDocument(filename: string): Promise<DocumentationResult<string>> {
        try {
            const filePath = path.join(this.docsPath, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Documentation file not found: ${filename}`
                };
            }

            const content = await fs.promises.readFile(filePath, 'utf8');

            log.debug(`Documentation loaded successfully: ${filename}`);
            return {
                success: true,
                data: content
            };
        } catch (error) {
            const errorMsg = `Failed to load documentation ${filename}: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * List all available documentation files
     */
    public async listDocuments(): Promise<DocumentationResult<DocumentationFileInfo[]>> {
        try {
            // Check if docs directory exists
            if (!fs.existsSync(this.docsPath)) {
                log.warn(`Documentation directory does not exist: ${this.docsPath}`);
                return {
                    success: false,
                    error: `Documentation directory not found: ${this.docsPath}`
                };
            }
            
            const files = await this.getMarkdownFiles(this.docsPath);
            
            log.debug(`Found ${files.length} markdown files in documentation directory: ${this.docsPath}`);

            const docs: DocumentationFileInfo[] = [];

            for (const file of files) {
                const stats = await fs.promises.stat(file.filepath);

                try {
                    // Try to extract title from markdown content
                    const content = await fs.promises.readFile(file.filepath, 'utf8');
                    const title = this.extractTitle(content) || file.filename;

                    docs.push({
                        title,
                        filepath: file.filepath,
                        filename: file.filename,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                } catch (parseError) {
                    log.warn(`Failed to read documentation file ${file.filename}:`, parseError);
                    docs.push({
                        title: 'Unknown Document',
                        filepath: file.filepath,
                        filename: file.filename,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                }
            }

            // Sort by filename (index.md first, then alphabetically)
            docs.sort((a, b) => {
                if (a.filename === 'index.md') return -1;
                if (b.filename === 'index.md') return 1;
                return a.filename.localeCompare(b.filename);
            });

            log.debug(`Found ${docs.length} documentation files`);
            return {
                success: true,
                data: docs
            };
        } catch (error) {
            const errorMsg = `Failed to list documentation: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * Recursively get all markdown files in a directory
     */
    private async getMarkdownFiles(dir: string, relativePath = ''): Promise<Array<{filepath: string, filename: string}>> {
        const files: Array<{filepath: string, filename: string}> = [];
        
        try {
            const items = await fs.promises.readdir(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stats = await fs.promises.stat(fullPath);
                
                if (stats.isDirectory()) {
                    // Recursively search subdirectories
                    const subFiles = await this.getMarkdownFiles(fullPath, path.join(relativePath, item));
                    files.push(...subFiles);
                } else if (item.endsWith('.md')) {
                    const filename = relativePath ? path.join(relativePath, item) : item;
                    files.push({
                        filepath: fullPath,
                        filename: filename
                    });
                }
            }
        } catch (error) {
            log.warn(`Failed to read directory ${dir}:`, error);
        }
        
        return files;
    }

    /**
     * Extract title from markdown content (first # heading)
     */
    private extractTitle(content: string): string | null {
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('# ')) {
                return trimmed.substring(2).trim();
            }
        }
        return null;
    }

    /**
     * Check if a documentation file exists
     */
    public documentExists(filename: string): boolean {
        const filePath = path.join(this.docsPath, filename);
        return fs.existsSync(filePath);
    }

    /**
     * Load an image file as a data URL for embedding in documentation
     */
    public async loadImage(filename: string): Promise<DocumentationResult<string>> {
        try {
            const filePath = path.join(this.docsPath, filename);

            if (!fs.existsSync(filePath)) {
                return {
                    success: false,
                    error: `Image file not found: ${filename}`
                };
            }

            // Read the image file as a buffer
            const imageBuffer = await fs.promises.readFile(filePath);
            
            // Determine MIME type from file extension
            const ext = path.extname(filename).toLowerCase();
            let mimeType = 'image/png'; // default
            
            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case '.png':
                    mimeType = 'image/png';
                    break;
                case '.gif':
                    mimeType = 'image/gif';
                    break;
                case '.svg':
                    mimeType = 'image/svg+xml';
                    break;
                case '.webp':
                    mimeType = 'image/webp';
                    break;
            }

            // Convert to data URL
            const base64 = imageBuffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64}`;

            log.debug(`Image loaded successfully as data URL: ${filename}`);
            return {
                success: true,
                data: dataUrl
            };
        } catch (error) {
            const errorMsg = `Failed to load image ${filename}: ${error instanceof Error ? error.message : String(error)}`;
            log.error(errorMsg, error);
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * Debug method to check paths and existence
     */
    public async debugPaths(): Promise<{
        docsPath: string;
        docsExists: boolean;
        isPackaged: boolean;
        resourcesPath: string;
        processResourcesPath: string;
        processCwd: string;
    }> {
        const resourcesPath = this.isPackaged ? process.resourcesPath : process.cwd();
        return {
            docsPath: this.docsPath,
            docsExists: fs.existsSync(this.docsPath),
            isPackaged: this.isPackaged,
            resourcesPath: resourcesPath,
            processResourcesPath: process.resourcesPath || 'undefined',
            processCwd: process.cwd()
        };
    }
}

// Create singleton instance
let documentationHelpers: DocumentationHelpers | undefined;

export async function initializeDocumentationHelpers(): Promise<DocumentationHelpers> {
    if (documentationHelpers) {
        log.debug('DocumentationHelpers already initialized, returning existing instance');
        return documentationHelpers;
    }
    
    // Get packaged status from the window API
    const isPackaged = await window.api.isPackaged();
    documentationHelpers = new DocumentationHelpers(isPackaged);
    return documentationHelpers;
}

export function getDocumentationHelpers(): DocumentationHelpers {
    if (!documentationHelpers) {
        throw new Error('DocumentationHelpers not initialized. Call initializeDocumentationHelpers first.');
    }
    return documentationHelpers;
}
