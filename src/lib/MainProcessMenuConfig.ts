import type { MainProcessMenuConfig, MainProcessMenuItemConfig } from './MainProcessMenuManager';
import type { ApplicationContext } from '@/Types/CommandTypes';

/**
 * Helper functions for menu item visibility and state
 */
const menuHelpers = {
    // File menu helpers
    hasNotebook: (context: ApplicationContext) => context.hasOpenNotebook,
    isDirty: (context: ApplicationContext) => context.isNotebookDirty,
    isNotHome: (context: ApplicationContext) => context.currentView !== 'home',
    isHome: (context: ApplicationContext) => context.currentView === 'home',
    
    // Edit menu helpers
    canUndo: (context: ApplicationContext) => context.canUndo,
    canRedo: (context: ApplicationContext) => context.canRedo,
    
    // Cell menu helpers
    hasSelectedCell: (context: ApplicationContext) => context.selectedCellId !== null,
    hasCells: (context: ApplicationContext) => context.totalCells > 0,
    
    // View menu helpers
    isReadingMode: (context: ApplicationContext) => context.readingMode,
    
    // Close notebook helpers - visible when not on home page and has context
    showCloseNotebook: (context: ApplicationContext) => {
        switch (context.currentView) {
            case 'home':
                return false;
            case 'settings':
                return true; // Show as "Close Settings"
            case 'documentation':
                return true; // Show as "Close Documentation"
            case 'shortcuts':
                return true; // Show as "Close Shortcuts"
            case 'notebook':
                return context.hasOpenNotebook; // Show as "Close Notebook"
            default:
                return false;
        }
    },
    
    // Dynamic close label
    getCloseLabel: (context: ApplicationContext) => {
        switch (context.currentView) {
            case 'settings':
                return 'Close Settings';
            case 'documentation':
                return 'Close Documentation';
            case 'shortcuts':
                return 'Close Shortcuts';
            case 'notebook':
                return context.hasOpenNotebook ? 'Close Notebook' : 'Close';
            default:
                return 'Close';
        }
    }
};

/**
 * Dynamic close menu configuration
 */
const closeNotebookMenuItem: MainProcessMenuItemConfig = {
    id: 'close-notebook',
    label: 'Close Notebook', // This will be dynamically updated
    commandId: 'file.closeNotebook',
    accelerator: 'CmdOrCtrl+W',
    visibleWhen: menuHelpers.showCloseNotebook
};

/**
 * Main process menu configuration
 */
export const mainProcessMenuConfig: MainProcessMenuConfig = {
    sections: [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Notebook',
                    commandId: 'file.new',
                    accelerator: 'CmdOrCtrl+N'
                },
                {
                    label: 'Open Notebook...',
                    commandId: 'file.open',
                    accelerator: 'CmdOrCtrl+O'
                },
                { type: 'separator' },
                {
                    label: 'Generate Notebook with AI',
                    commandId: 'file.aiGenerate',
                    accelerator: 'CmdOrCtrl+Alt+G'
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    commandId: 'file.save',
                    accelerator: 'CmdOrCtrl+S',
                    enabledWhen: menuHelpers.hasNotebook
                },
                {
                    label: 'Save As...',
                    commandId: 'file.saveAs',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    enabledWhen: menuHelpers.hasNotebook
                },
                { type: 'separator' },
                {
                    label: 'Export as JSON...',
                    commandId: 'file.exportJson',
                    enabledWhen: menuHelpers.hasNotebook
                },
                { type: 'separator' },
                closeNotebookMenuItem,
                { type: 'separator' },
                {
                    label: 'Quit',
                    commandId: 'file.quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q'
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    commandId: 'edit.undo',
                    accelerator: 'CmdOrCtrl+Z',
                    enabledWhen: menuHelpers.canUndo
                },
                {
                    label: 'Redo',
                    commandId: 'edit.redo',
                    accelerator: 'CmdOrCtrl+Shift+Z',
                    enabledWhen: menuHelpers.canRedo
                },
                { type: 'separator' },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectAll'
                },
                { type: 'separator' },
                {
                    label: 'Find',
                    commandId: 'edit.find',
                    accelerator: 'CmdOrCtrl+F',
                    enabledWhen: menuHelpers.hasNotebook
                }
            ]
        },
        {
            label: 'Insert',
            submenu: [
                {
                    label: 'Code Cell',
                    commandId: 'insert.codeCell',
                    accelerator: 'CmdOrCtrl+Shift+C',
                    enabledWhen: menuHelpers.hasNotebook
                },
                {
                    label: 'Markdown Cell',
                    commandId: 'insert.markdownCell',
                    accelerator: 'CmdOrCtrl+Shift+M',
                    enabledWhen: menuHelpers.hasNotebook
                },
                {
                    label: 'Generate Code Cell with AI',
                    commandId: 'insert.aiCodeCell',
                    accelerator: 'CmdOrCtrl+Alt+C',
                    enabledWhen: menuHelpers.hasNotebook
                },
                { type: 'separator' },
                {
                    label: 'Formula Cell',
                    commandId: 'insert.formulaCell',
                    accelerator: 'CmdOrCtrl+Shift+F',
                    enabledWhen: menuHelpers.hasNotebook
                },
                {
                    label: 'Input Cell',
                    commandId: 'insert.inputCell',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    enabledWhen: menuHelpers.hasNotebook
                }
            ]
        },
        {
            label: 'Cell',
            submenu: [
                {
                    label: 'Run Cell',
                    commandId: 'cell.run',
                    accelerator: 'Shift+Enter',
                    enabledWhen: menuHelpers.hasSelectedCell
                },
                {
                    label: 'Run All Cells',
                    commandId: 'cell.runAll',
                    accelerator: 'CmdOrCtrl+Shift+Enter',
                    enabledWhen: menuHelpers.hasCells
                },
                { type: 'separator' },
                {
                    label: 'Clear Cell Output',
                    commandId: 'cell.clearOutput',
                    enabledWhen: menuHelpers.hasSelectedCell
                },
                {
                    label: 'Clear All Outputs',
                    commandId: 'cell.clearAllOutputs',
                    enabledWhen: menuHelpers.hasCells
                },
                { type: 'separator' },
                {
                    label: 'Delete Cell',
                    commandId: 'cell.delete',
                    accelerator: 'CmdOrCtrl+Shift+D',
                    enabledWhen: menuHelpers.hasSelectedCell
                },
                {
                    label: 'Duplicate Cell',
                    commandId: 'cell.duplicate',
                    accelerator: 'CmdOrCtrl+D',
                    enabledWhen: menuHelpers.hasSelectedCell
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    commandId: 'view.reload',
                    accelerator: 'CmdOrCtrl+Shift+R'
                },
                {
                    label: 'Force Reload',
                    commandId: 'view.forceReload',
                    accelerator: 'CmdOrCtrl+Alt+R'
                },
                {
                    label: 'Toggle Developer Tools',
                    commandId: 'view.toggleDevTools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I'
                },
                { type: 'separator' },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    role: 'resetZoom'
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    role: 'zoomIn'
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    role: 'zoomOut'
                },
                { type: 'separator' },
                {
                    label: 'Toggle Fullscreen',
                    accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
                    role: 'togglefullscreen'
                },
                { type: 'separator' },
                {
                    label: 'Toggle Reading Mode',
                    commandId: 'view.toggleReadingMode',
                    accelerator: 'CmdOrCtrl+R',
                    enabledWhen: menuHelpers.hasNotebook
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    commandId: 'view.settings',
                    accelerator: 'CmdOrCtrl+,'
                },
                { type: 'separator' },
                {
                    label: 'Toggle Console Viewer',
                    commandId: 'view.toggleConsole',
                    accelerator: 'CmdOrCtrl+`',
                    enabledWhen: menuHelpers.hasNotebook
                },
                {
                    label: 'Toggle Output Panel',
                    commandId: 'view.toggleOutputPanel',
                    accelerator: 'CmdOrCtrl+Shift+`',
                    enabledWhen: menuHelpers.hasNotebook
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    role: 'minimize'
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+Shift+W',
                    role: 'close'
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Nodebook.js',
                    commandId: 'help.about'
                },
                {
                    label: 'Welcome Tutorial',
                    commandId: 'help.welcome'
                },
                { type: 'separator' },
                {
                    label: 'Keyboard Shortcuts',
                    commandId: 'help.shortcuts',
                    accelerator: 'CmdOrCtrl+/'
                },
                {
                    label: 'Documentation',
                    commandId: 'help.documentation'
                }
            ]
        }
    ]
};

/**
 * Helper to update close menu item label dynamically
 * This is used when the context changes to update the label
 */
export function updateCloseMenuItemLabel(context: ApplicationContext): void {
    closeNotebookMenuItem.label = menuHelpers.getCloseLabel(context);
}
