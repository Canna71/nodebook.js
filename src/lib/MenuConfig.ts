import { MenuConfig } from './MenuManager';

/**
 * Default menu configuration for Nodebook.js
 * Maps menu items to commands for consistent state management
 */
export const defaultMenuConfig: MenuConfig = {
    sections: [
        {
            label: 'File',
            submenu: [
                {
                    id: 'new-notebook',
                    label: 'New Notebook',
                    commandId: 'notebook.new',
                    accelerator: 'CmdOrCtrl+N'
                },
                {
                    id: 'open-notebook',
                    label: 'Open Notebook...',
                    commandId: 'notebook.open',
                    accelerator: 'CmdOrCtrl+O'
                },
                { type: 'separator' },
                {
                    id: 'ai-generate-notebook',
                    label: 'Generate Notebook with AI',
                    commandId: 'ai.generateNotebook',
                    accelerator: 'CmdOrCtrl+Alt+G'
                },
                { type: 'separator' },
                {
                    id: 'save-notebook',
                    label: 'Save',
                    commandId: 'notebook.save',
                    accelerator: 'CmdOrCtrl+S'
                },
                {
                    id: 'save-notebook-as',
                    label: 'Save As...',
                    commandId: 'notebook.saveAs',
                    accelerator: 'CmdOrCtrl+Shift+S'
                },
                { type: 'separator' },
                {
                    id: 'export-json',
                    label: 'Export as JSON...',
                    commandId: 'notebook.export'
                },
                { type: 'separator' },
                {
                    id: 'close-notebook',
                    label: 'Close Notebook',
                    commandId: 'notebook.close',
                    accelerator: 'CmdOrCtrl+W'
                },
                { type: 'separator' },
                {
                    id: 'quit',
                    label: process.platform === 'darwin' ? 'Quit' : 'Exit',
                    commandId: 'app.quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q'
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    id: 'undo',
                    label: 'Undo',
                    commandId: 'edit.undo',
                    accelerator: 'CmdOrCtrl+Z'
                },
                {
                    id: 'redo',
                    label: 'Redo',
                    commandId: 'edit.redo',
                    accelerator: 'CmdOrCtrl+Shift+Z'
                },
                { type: 'separator' },
                {
                    id: 'cut',
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut',
                    staticEnabled: true
                },
                {
                    id: 'copy',
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy',
                    staticEnabled: true
                },
                {
                    id: 'paste',
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste',
                    staticEnabled: true
                },
                {
                    id: 'select-all',
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectAll',
                    staticEnabled: true
                },
                { type: 'separator' },
                {
                    id: 'find',
                    label: 'Find',
                    commandId: 'edit.find',
                    accelerator: 'CmdOrCtrl+F'
                }
            ]
        },
        {
            label: 'Insert',
            submenu: [
                {
                    id: 'insert-code-cell',
                    label: 'Code Cell',
                    commandId: 'cell.insertCode',
                    accelerator: 'CmdOrCtrl+Shift+C'
                },
                {
                    id: 'insert-markdown-cell',
                    label: 'Markdown Cell',
                    commandId: 'cell.insertMarkdown',
                    accelerator: 'CmdOrCtrl+Shift+M'
                },
                {
                    id: 'ai-generate-code-cell',
                    label: 'Generate Code Cell with AI',
                    commandId: 'ai.generateCodeCell',
                    accelerator: 'CmdOrCtrl+Alt+C'
                },
                { type: 'separator' },
                {
                    id: 'insert-formula-cell',
                    label: 'Formula Cell',
                    commandId: 'cell.insertFormula',
                    accelerator: 'CmdOrCtrl+Shift+F'
                },
                {
                    id: 'insert-input-cell',
                    label: 'Input Cell',
                    commandId: 'cell.insertInput',
                    accelerator: 'CmdOrCtrl+Shift+I'
                }
            ]
        },
        {
            label: 'Cell',
            submenu: [
                {
                    id: 'run-cell',
                    label: 'Run Cell',
                    commandId: 'cell.run',
                    accelerator: 'Shift+Enter'
                },
                {
                    id: 'run-all-cells',
                    label: 'Run All Cells',
                    commandId: 'cell.runAll',
                    accelerator: 'CmdOrCtrl+Shift+Enter'
                },
                { type: 'separator' },
                {
                    id: 'clear-cell-output',
                    label: 'Clear Cell Output',
                    commandId: 'cell.clearOutput'
                },
                {
                    id: 'clear-all-outputs',
                    label: 'Clear All Outputs',
                    commandId: 'cell.clearAllOutputs'
                },
                { type: 'separator' },
                {
                    id: 'delete-cell',
                    label: 'Delete Cell',
                    commandId: 'cell.delete',
                    accelerator: 'CmdOrCtrl+Shift+D'
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    id: 'reload',
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    role: 'reload',
                    staticEnabled: true
                },
                {
                    id: 'force-reload',
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Alt+R',
                    role: 'forceReload',
                    staticEnabled: true
                },
                {
                    id: 'toggle-dev-tools',
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    role: 'toggleDevTools',
                    staticEnabled: true
                },
                { type: 'separator' },
                {
                    id: 'actual-size',
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    role: 'resetZoom',
                    staticEnabled: true
                },
                {
                    id: 'zoom-in',
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    role: 'zoomIn',
                    staticEnabled: true
                },
                {
                    id: 'zoom-out',
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    role: 'zoomOut',
                    staticEnabled: true
                },
                { type: 'separator' },
                {
                    id: 'toggle-fullscreen',
                    label: 'Toggle Fullscreen',
                    accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
                    role: 'togglefullscreen',
                    staticEnabled: true
                },
                { type: 'separator' },
                {
                    id: 'toggle-reading-mode',
                    label: 'Toggle Reading Mode',
                    commandId: 'view.toggleReadingMode',
                    accelerator: 'CmdOrCtrl+R'
                },
                { type: 'separator' },
                {
                    id: 'settings',
                    label: 'Settings',
                    commandId: 'view.settings',
                    accelerator: 'CmdOrCtrl+,'
                },
                { type: 'separator' },
                {
                    id: 'toggle-console',
                    label: 'Toggle Console Viewer',
                    commandId: 'view.toggleConsole',
                    accelerator: 'CmdOrCtrl+`'
                },
                {
                    id: 'toggle-output',
                    label: 'Toggle Output Panel',
                    commandId: 'view.toggleOutput',
                    accelerator: 'CmdOrCtrl+Shift+`'
                }
            ]
        },
        {
            label: 'Window',
            submenu: [
                {
                    id: 'minimize',
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    role: 'minimize',
                    staticEnabled: true
                },
                {
                    id: 'close-window',
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+Shift+W',
                    role: 'close',
                    staticEnabled: true
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    id: 'about',
                    label: 'About Nodebook.js',
                    commandId: 'help.about'
                },
                {
                    id: 'welcome',
                    label: 'Welcome Tutorial',
                    commandId: 'help.welcome'
                },
                { type: 'separator' },
                {
                    id: 'shortcuts',
                    label: 'Keyboard Shortcuts',
                    commandId: 'help.shortcuts',
                    accelerator: 'CmdOrCtrl+/'
                },
                {
                    id: 'documentation',
                    label: 'Documentation',
                    commandId: 'help.documentation'
                }
            ]
        }
    ]
};

/**
 * macOS-specific menu adjustments
 */
export function getMacOSMenuConfig(): MenuConfig {
    const config = JSON.parse(JSON.stringify(defaultMenuConfig)) as MenuConfig;
    
    // Add macOS app menu at the beginning
    config.sections.unshift({
        label: 'Nodebook.js', // Will be set to app name automatically
        submenu: [
            {
                id: 'about-app',
                label: 'About Nodebook.js',
                commandId: 'help.about'
            },
            { type: 'separator' },
            {
                id: 'services',
                label: 'Services',
                role: 'services',
                type: 'submenu',
                submenu: [],
                staticEnabled: true
            },
            { type: 'separator' },
            {
                id: 'hide-app',
                label: 'Hide Nodebook.js',
                accelerator: 'Command+H',
                role: 'hide',
                staticEnabled: true
            },
            {
                id: 'hide-others',
                label: 'Hide Others',
                accelerator: 'Command+Shift+H',
                role: 'hideOthers',
                staticEnabled: true
            },
            {
                id: 'show-all',
                label: 'Show All',
                role: 'unhide',
                staticEnabled: true
            },
            { type: 'separator' },
            {
                id: 'quit-app',
                label: 'Quit',
                accelerator: 'Command+Q',
                commandId: 'app.quit'
            }
        ]
    });
    
    // Remove Quit from File menu on macOS
    const fileMenu = config.sections.find(section => section.label === 'File');
    if (fileMenu) {
        fileMenu.submenu = fileMenu.submenu.filter(item => 
            item.id !== 'quit'
        );
    }
    
    // Add Window menu adjustments for macOS
    const windowMenu = config.sections.find(section => section.label === 'Window');
    if (windowMenu) {
        windowMenu.submenu.push(
            { type: 'separator' },
            {
                id: 'bring-all-to-front',
                label: 'Bring All to Front',
                role: 'front',
                staticEnabled: true
            }
        );
    }
    
    // Remove About from Help menu on macOS (it's in the app menu)
    const helpMenu = config.sections.find(section => section.label === 'Help');
    if (helpMenu) {
        helpMenu.submenu = helpMenu.submenu.filter(item => 
            item.id !== 'about'
        );
    }
    
    return config;
}
