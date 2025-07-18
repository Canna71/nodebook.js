import { app, BrowserWindow, ipcMain, session, dialog, Menu } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';
import "anylogger-loglevel";
import loglevel from "loglevel";
import anylogger from 'anylogger';
import 'anylogger-console'
import windowStateKeeper from './lib/windowStateKeeper';
import settings from 'electron-settings';
import { MainProcessMenuManager } from './lib/MainProcessMenuManager';
import { mainProcessMenuConfig, updateCloseMenuItemLabel } from './lib/MainProcessMenuConfig';
import type { ApplicationContext } from './Types/CommandTypes';

const log = anylogger('Main');
import os from 'node:os';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL !== undefined;

process.env.ISDEV = isDev ? '1' : '0';

// distinguish the path between windows and macOS
const extensions = {
    "mac": {
        "reactDevTools": path.join(
            os.homedir(),
            '/Library/Application Support/Microsoft Edge/Default/Extensions/gpphkfbcpidddadnkolkpfckpihlkkil/6.1.2_1'
        ),
        "reduxDevTools": path.join(
            os.homedir(),
            '/Library/Application Support/Microsoft Edge/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/3.2.10_0'
        )
    },
    "win": {
        "reactDevTools": path.join(
            os.homedir(),
            '/AppData/Local/Microsoft/Edge/User Data/Default/Extensions/gpphkfbcpidddadnkolkpfckpihlkkil/6.1.2_0'
        ),
        "reduxDevTools": path.join(
            os.homedir(),
            '/AppData/Local/Microsoft/Edge/User Data/Default/Extensions/nnkgneoiohoecpdiaponcejilbhhikei/3.2.10_0'
        )
    }
}

// Initialize menu manager
let menuManager: MainProcessMenuManager | null = null;
let mainWindowRef: BrowserWindow | null = null;
let currentApplicationContext: ApplicationContext = {
    currentView: 'home',
    hasOpenNotebook: false,
    isNotebookDirty: false,
    canUndo: false,
    canRedo: false,
    readingMode: false,
    selectedCellId: null,
    totalCells: 0
};

// Legacy variables for backward compatibility (will be removed)
let closeMenuItem: Electron.MenuItem | null = null;
let currentCloseMenuLabel = 'Close Notebook';
let closeMenuVisible = true;

// New menu creation using MainProcessMenuManager
function createMenuWithManager(mainWindow: BrowserWindow) {
    if (!menuManager) {
        // Create command handlers that send IPC messages to renderer
        const commandHandlers = {
            'file.new': () => mainWindow.webContents.send('menu-new-notebook'),
            'file.open': () => mainWindow.webContents.send('menu-open-notebook'),
            'file.save': () => mainWindow.webContents.send('menu-save-notebook'),
            'file.saveAs': () => mainWindow.webContents.send('menu-save-notebook-as'),
            'file.exportJson': () => mainWindow.webContents.send('menu-export-json'),
            'file.closeNotebook': () => mainWindow.webContents.send('menu-close-notebook'),
            'file.quit': () => app.quit(),
            'file.aiGenerate': () => mainWindow.webContents.send('menu-ai-generate-notebook'),
            'edit.undo': () => mainWindow.webContents.send('menu-undo'),
            'edit.redo': () => mainWindow.webContents.send('menu-redo'),
            'edit.find': () => mainWindow.webContents.send('menu-find'),
            'insert.codeCell': () => mainWindow.webContents.send('menu-insert-cell', 'code'),
            'insert.markdownCell': () => mainWindow.webContents.send('menu-insert-cell', 'markdown'),
            'insert.formulaCell': () => mainWindow.webContents.send('menu-insert-cell', 'formula'),
            'insert.inputCell': () => mainWindow.webContents.send('menu-insert-cell', 'input'),
            'insert.aiCodeCell': () => mainWindow.webContents.send('menu-ai-generate-code-cell'),
            'cell.run': () => mainWindow.webContents.send('menu-run-cell'),
            'cell.runAll': () => mainWindow.webContents.send('menu-run-all-cells'),
            'cell.clearOutput': () => mainWindow.webContents.send('menu-clear-cell-output'),
            'cell.clearAllOutputs': () => mainWindow.webContents.send('menu-clear-all-outputs'),
            'cell.delete': () => mainWindow.webContents.send('menu-delete-cell'),
            'cell.duplicate': () => mainWindow.webContents.send('menu-duplicate-cell'),
            'view.reload': () => mainWindow.reload(),
            'view.forceReload': () => mainWindow.webContents.reloadIgnoringCache(),
            'view.toggleDevTools': () => mainWindow.webContents.toggleDevTools(),
            'view.toggleReadingMode': () => mainWindow.webContents.send('menu-toggle-reading-mode'),
            'view.settings': () => mainWindow.webContents.send('menu-settings'),
            'view.toggleConsole': () => mainWindow.webContents.send('menu-toggle-console-viewer'),
            'view.toggleOutputPanel': () => mainWindow.webContents.send('menu-toggle-output-panel'),
            'help.about': () => mainWindow.webContents.send('menu-about'),
            'help.welcome': () => mainWindow.webContents.send('menu-welcome'),
            'help.shortcuts': () => mainWindow.webContents.send('menu-shortcuts'),
            'help.documentation': () => mainWindow.webContents.send('menu-documentation'),
        };

        menuManager = new MainProcessMenuManager(commandHandlers, mainProcessMenuConfig);
    }

    // Update close menu item label based on current context
    updateCloseMenuItemLabel(currentApplicationContext);
    
    // Update menu context and build menu
    menuManager.updateContext(currentApplicationContext);
    const menu = menuManager.buildMenu();
    
    log.debug('Menu created using MainProcessMenuManager');
}

// Function to update application context and rebuild menu
function updateApplicationContext(updates: Partial<ApplicationContext>) {
    const oldContext = { ...currentApplicationContext };
    currentApplicationContext = { ...currentApplicationContext, ...updates };
    
    // Update close menu item label if needed
    updateCloseMenuItemLabel(currentApplicationContext);
    
    // Only rebuild menu if context changed and menuManager exists
    if (menuManager && JSON.stringify(oldContext) !== JSON.stringify(currentApplicationContext)) {
        menuManager.updateContext(currentApplicationContext);
        log.debug('Menu context updated:', updates);
    }
}

// Legacy function (will be removed)
function createMenu(mainWindow: BrowserWindow) {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'New Notebook',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow.webContents.send('menu-new-notebook');
                    }
                },
                {
                    label: 'Open Notebook...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        mainWindow.webContents.send('menu-open-notebook');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Generate Notebook with AI',
                    accelerator: 'CmdOrCtrl+Alt+G',
                    click: () => {
                        mainWindow.webContents.send('menu-ai-generate-notebook');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-notebook');
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        mainWindow.webContents.send('menu-save-notebook-as');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Export as JSON...',
                    click: () => {
                        mainWindow.webContents.send('menu-export-json');
                    }
                },
                ...(closeMenuVisible ? [
                    { type: 'separator' as const },
                    {
                        label: currentCloseMenuLabel,
                        accelerator: 'CmdOrCtrl+W',
                        click: () => {
                            mainWindow.webContents.send('menu-close-notebook');
                        }
                    },
                    { type: 'separator' as const }
                ] : [{ type: 'separator' as const }]),
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    click: () => {
                        mainWindow.webContents.send('menu-undo');
                    }
                },
                {
                    label: 'Redo',
                    accelerator: 'CmdOrCtrl+Shift+Z',
                    click: () => {
                        mainWindow.webContents.send('menu-redo');
                    }
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
                    accelerator: 'CmdOrCtrl+F',
                    click: () => {
                        mainWindow.webContents.send('menu-find');
                    }
                }
            ]
        },
        {
            label: 'Insert',
            submenu: [
                {
                    label: 'Code Cell',
                    accelerator: 'CmdOrCtrl+Shift+C',
                    click: () => {
                        mainWindow.webContents.send('menu-insert-cell', 'code');
                    }
                },
                {
                    label: 'Markdown Cell',
                    accelerator: 'CmdOrCtrl+Shift+M',
                    click: () => {
                        mainWindow.webContents.send('menu-insert-cell', 'markdown');
                    }
                },
                {
                    label: 'Generate Code Cell with AI',
                    accelerator: 'CmdOrCtrl+Alt+C',
                    click: () => {
                        mainWindow.webContents.send('menu-ai-generate-code-cell');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Formula Cell',
                    accelerator: 'CmdOrCtrl+Shift+F',
                    click: () => {
                        mainWindow.webContents.send('menu-insert-cell', 'formula');
                    }
                },
                {
                    label: 'Input Cell',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.send('menu-insert-cell', 'input');
                    }
                }
            ]
        },
        {
            label: 'Cell',
            submenu: [
                {
                    label: 'Run Cell',
                    accelerator: 'Shift+Enter',
                    click: () => {
                        mainWindow.webContents.send('menu-run-cell');
                    }
                },
                {
                    label: 'Run All Cells',
                    accelerator: 'CmdOrCtrl+Shift+Enter',
                    click: () => {
                        mainWindow.webContents.send('menu-run-all-cells');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Clear Cell Output',
                    click: () => {
                        mainWindow.webContents.send('menu-clear-cell-output');
                    }
                },
                {
                    label: 'Clear All Outputs',
                    click: () => {
                        mainWindow.webContents.send('menu-clear-all-outputs');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Delete Cell',
                    accelerator: 'CmdOrCtrl+Shift+D',
                    click: () => {
                        mainWindow.webContents.send('menu-delete-cell');
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Alt+R',
                    click: () => {
                        mainWindow.webContents.reloadIgnoringCache();
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
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
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-reading-mode');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Settings',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => {
                        mainWindow.webContents.send('menu-settings');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Toggle Console Viewer',
                    accelerator: 'CmdOrCtrl+`',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-console-viewer');
                    }
                },
                {
                    label: 'Toggle Output Panel',
                    accelerator: 'CmdOrCtrl+Shift+`',
                    click: () => {
                        mainWindow.webContents.send('menu-toggle-output-panel');
                    }
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
                    click: () => {
                        mainWindow.webContents.send('menu-about');
                    }
                },
                {
                    label: 'Welcome Tutorial',
                    click: () => {
                        mainWindow.webContents.send('menu-welcome');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Keyboard Shortcuts',
                    accelerator: 'CmdOrCtrl+/',
                    click: () => {
                        mainWindow.webContents.send('menu-shortcuts');
                    }
                },
                {
                    label: 'Documentation',
                    click: () => {
                        mainWindow.webContents.send('menu-documentation');
                    }
                }
            ]
        }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
        // App menu for macOS
        template.unshift({
            label: app.getName(),
            submenu: [
                {
                    label: 'About ' + app.getName(),
                    click: () => {
                        mainWindow.webContents.send('menu-about');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                },
                { type: 'separator' },
                {
                    label: 'Hide ' + app.getName(),
                    accelerator: 'Command+H',
                    role: 'hide'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Shift+H',
                    role: 'hideOthers'
                },
                {
                    label: 'Show All',
                    role: 'unhide'
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        });

        // Remove Quit from File menu on macOS (it's in the app menu)
        const fileMenu = template.find(item => item.label === 'File');
        if (fileMenu && Array.isArray(fileMenu.submenu)) {
            fileMenu.submenu = fileMenu.submenu.filter(item =>
                typeof item === 'object' && item.label !== 'Quit'
            );
        }

        // Window menu adjustments for macOS
        const windowMenu = template.find(item => item.label === 'Window');
        if (windowMenu && Array.isArray(windowMenu.submenu)) {
            windowMenu.submenu.push(
                { type: 'separator' },
                {
                    label: 'Bring All to Front',
                    role: 'front'
                }
            );
        }

        // Remove About from Help menu on macOS (it's in the app menu)
        const helpMenu = template.find(item => item.label === 'Help');
        if (helpMenu && Array.isArray(helpMenu.submenu)) {
            helpMenu.submenu = helpMenu.submenu.filter(item =>
                typeof item === 'object' && item.label !== 'About Nodebook.js'
            );
        }
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
    // Find and store reference to the close menu item for dynamic updates
    log.debug('Looking for close menu item...');
    const fileMenu = menu.items.find(item => item.label === 'File');
    log.debug('File menu found:', !!fileMenu);
    
    if (fileMenu && fileMenu.submenu) {
        log.debug('File submenu items:', fileMenu.submenu.items.map(item => item.label));
        closeMenuItem = fileMenu.submenu.items.find(item => 
            item.label === 'Close Notebook' || item.label?.startsWith('Close ')
        ) || null;
        log.debug('Close menu item found:', !!closeMenuItem);
        if (closeMenuItem) {
            log.debug('Close menu item label:', closeMenuItem.label);
        }
    }
}

// Function to update the close menu item label and visibility
function updateCloseMenuLabel(label: string) {
    log.debug('updateCloseMenuLabel called with label:', label);
    
    const shouldHide = label === '__HIDE_MENU_ITEM__';
    const actualLabel = shouldHide ? 'Close' : label;
    const visible = !shouldHide;
    
    log.debug('Processing: shouldHide =', shouldHide, 'actualLabel =', actualLabel, 'visible =', visible);
    log.debug('Current state: currentCloseMenuLabel =', currentCloseMenuLabel, 'closeMenuVisible =', closeMenuVisible);
    
    if (currentCloseMenuLabel === actualLabel && closeMenuVisible === visible) {
        log.debug('Label and visibility unchanged, skipping update');
        return;
    }
    
    currentCloseMenuLabel = actualLabel;
    closeMenuVisible = visible;
    log.debug('Updated currentCloseMenuLabel to:', currentCloseMenuLabel, 'closeMenuVisible:', closeMenuVisible);
    
    // Instead of modifying the existing menu item, rebuild the menu
    // This ensures the changes are properly reflected
    if (mainWindowRef) {
        createMenuWithManager(mainWindowRef);
        log.debug('Menu rebuilt with new close label and visibility using MenuManager');
    } else {
        log.warn('mainWindow not available for menu rebuild');
    }
}

const createWindow = async () => {
    // Get window state
    const mainWindowStateKeeper = await windowStateKeeper('main');

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        ...mainWindowStateKeeper.rectangle,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../../build-resources/icon.png') // Use proper relative path
    });
    mainWindowStateKeeper.track(mainWindow);

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    if (isDev) {
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
    }
    // Store reference to main window for menu updates
    mainWindowRef = mainWindow;
    // Create menu using new system
    createMenuWithManager(mainWindow);

    // Handle file to open after window is ready
    mainWindow.webContents.once('did-finish-load', () => {
        if (fileToOpen) {
            log.info('Opening file after window ready:', fileToOpen);
            mainWindow.webContents.send('open-file-from-system', fileToOpen);
            fileToOpen = null; // Clear the stored file
        }
    });

    return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

function registerHandlers() {
    // Register any IPC handlers here
    ipcMain.handle('get-user-data-path', () => {
        return app.getPath('userData');
    });

    ipcMain.handle('is-packaged', () => {
        return app.isPackaged;
    });

    ipcMain.handle('open-file-dialog', async (event, options) => {

        const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            ...options
        });
        if (result.canceled) {
            return { canceled: true, filePaths: [] };
        }
        return { canceled: false, filePaths: result.filePaths };
    });
    ipcMain.handle('save-file-dialog', async (event, options) => {
        const { dialog } = require('electron');
        const result = await dialog.showSaveDialog({
            properties: ['createDirectory'],
            ...options
        });
        if (result.canceled) {
            return { canceled: true, filePath: '' };
        }
        return { canceled: false, filePath: result.filePath };
    }
    );
    ipcMain.handle('show-message-box', async (event, options) => {
        const { dialog } = require('electron');
        const result = await dialog.showMessageBox({
            type: 'info',
            buttons: ['OK'],
            ...options
        });
        return result.response === 0; // 0 is the index of the "OK" button
    }
    );
    ipcMain.handle('show-error-box', async (event, title, content) => {
        const { dialog } = require('electron');
        await dialog.showErrorBox(title, content);
        return true; // Just to indicate the error box was shown
    }
    );

    ipcMain.handle('get-app-version', () => {
        return app.getVersion();
    });

    ipcMain.handle('get-app-info', () => {
        // Read package.json to get app info
        const packageJsonPath = path.join(__dirname, '../../package.json');
        try {
            const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            return {
                name: packageData.productName || packageData.name,
                version: packageData.version,
                author: packageData.author?.name || packageData.author,
                license: packageData.license
            };
        } catch (error) {
            console.error('Failed to read package.json:', error);
            return {
                name: 'Nodebook.js',
                version: app.getVersion(),
                author: 'Unknown',
                license: 'MIT'
            };
        }
    });

    ipcMain.handle('get-runtime-versions', () => {
        return {
            node: process.versions.node,
            chromium: process.versions.chrome,
            v8: process.versions.v8,
            electron: process.versions.electron
        };
    });

    ipcMain.handle('get-app-path', () => {
        return app.getAppPath();
    }
    );
    ipcMain.handle('get-app-name', () => {
        return app.getName();
    }
    );
    ipcMain.handle('get-app-locale', () => {
        return app.getLocale();
    });

    ipcMain.handle('set-window-title', (event, title: string) => {
        const webContents = event.sender;
        const window = BrowserWindow.fromWebContents(webContents);
        if (window) {
            window.setTitle(title);
        }
        return true;
    });

    // AI Assistant Dialog Handlers
    ipcMain.handle('show-input-dialog', async (event, options: { title: string, message: string, placeholder?: string }) => {
        const result = await dialog.showMessageBox({
            type: 'question',
            title: options.title,
            message: options.message,
            buttons: ['Cancel', 'OK'],
            defaultId: 1,
            cancelId: 0
            // Note: Electron doesn't have a built-in input dialog
            // In a production app, you'd create a proper input dialog window
        });

        if (result.response === 1) {
            // For demo purposes, return a sample prompt
            // In a real implementation, you'd create a proper input dialog
            return {
                cancelled: false,
                value: 'Create a data analysis notebook with sample data and visualizations'
            };
        } else {
            return {
                cancelled: true,
                value: ''
            };
        }
    });

    ipcMain.handle('show-message-dialog', async (event, options: { type: 'info' | 'error' | 'warning', title: string, message: string }) => {
        await dialog.showMessageBox({
            type: options.type,
            title: options.title,
            message: options.message,
            buttons: ['OK']
        });
    });

    // Environment variables handler for AI service
    ipcMain.handle('get-environment-variables', async (event, variableNames: string[]) => {
        const result: Record<string, string | undefined> = {};
        variableNames.forEach(varName => {
            result[varName] = process.env[varName];
        });
        return result;
    });

    // API Key storage handlers
    ipcMain.handle('save-api-keys', async (event, keys: { openai?: string, anthropic?: string }) => {
        try {
            const { SecureApiKeyStorage } = await import('./lib/secureApiKeyStorage');
            await SecureApiKeyStorage.saveApiKeys(keys);
            log.info('API keys saved securely');
        } catch (error) {
            log.error('Failed to save API keys:', error);
            throw error;
        }
    });

    ipcMain.handle('get-stored-api-keys', async () => {
        try {
            const { SecureApiKeyStorage } = await import('./lib/secureApiKeyStorage');
            const keys = await SecureApiKeyStorage.loadApiKeys();
            log.info('API keys loaded securely');
            return keys;
        } catch (error) {
            log.warn('Failed to load API keys:', error);
            return null;
        }
    });

    // Debug handler for API key storage info
    ipcMain.handle('get-api-key-storage-info', async () => {
        try {
            const { SecureApiKeyStorage } = await import('./lib/secureApiKeyStorage');
            const info = await SecureApiKeyStorage.getStorageInfo();
            log.debug('API key storage info:', info);
            return info;
        } catch (error) {
            log.error('Failed to get storage info:', error);
            return { error: error.message };
        }
    });

    // Application settings handlers
    ipcMain.handle('get-app-setting', async (event, key: string, defaultValue?: any) => {
        try {
            if (await settings.has(key)) {
                const value = await settings.get(key);
                log.debug(`Got app setting: ${key} = ${value}`);
                return value;
            } else {
                log.debug(`App setting ${key} not found, returning default: ${defaultValue}`);
                return defaultValue;
            }
        } catch (error) {
            log.error(`Failed to get app setting: ${key}`, error);
            return defaultValue;
        }
    });

    ipcMain.handle('set-app-setting', async (event, key: string, value: any) => {
        try {
            await settings.set(key, value);
            log.debug(`Set app setting: ${key} = ${value}`);
            return true;
        } catch (error) {
            log.error(`Failed to set app setting: ${key}`, error);
            return false;
        }
    });

    ipcMain.handle('get-all-app-settings', async () => {
        try {
            const allSettings = settings.get() as Record<string, any>;
            log.debug('Got all app settings:', allSettings);
            return allSettings;
        } catch (error) {
            log.error('Failed to get all app settings:', error);
            return {};
        }
    });

    // Legacy handler for backward compatibility
    ipcMain.handle('update-close-menu-label', async (event, label: string) => {
        try {
            updateCloseMenuLabel(label);
            log.debug(`Updated close menu label to: ${label} (legacy)`);
            return true;
        } catch (error) {
            log.error('Failed to update close menu label:', error);
            return false;
        }
    });

    // New handler for application context updates
    ipcMain.handle('update-application-context', async (event, updates: Partial<ApplicationContext>) => {
        try {
            updateApplicationContext(updates);
            log.debug('Updated application context:', updates);
            return true;
        } catch (error) {
            log.error('Failed to update application context:', error);
            return false;
        }
    });

    // Handler to get current application context
    ipcMain.handle('get-application-context', async () => {
        return currentApplicationContext;
    });
}

// Global variable to store file to open
let fileToOpen: string | null = null;

// Handle file associations
function setupFileAssociations() {
    // Handle file opening on macOS and Linux
    app.on('open-file', (event, filePath) => {
        event.preventDefault();
        log.info('File opened via association:', filePath);
        
        if (filePath.endsWith('.nbjs')) {
            if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                // Window exists, send the file path to renderer
                mainWindowRef.webContents.send('open-file-from-system', filePath);
            } else {
                // Store the file to open when window is ready
                fileToOpen = filePath;
            }
        }
    });

    // Handle command line arguments (Windows and Linux)
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        log.info('Second instance launched with args:', commandLine);
        
        // Find .nbjs file in command line arguments
        const nbjsFile = commandLine.find(arg => arg.endsWith('.nbjs'));
        if (nbjsFile && mainWindowRef && !mainWindowRef.isDestroyed()) {
            // Focus the existing window and open the file
            if (mainWindowRef.isMinimized()) mainWindowRef.restore();
            mainWindowRef.focus();
            mainWindowRef.webContents.send('open-file-from-system', nbjsFile);
        }
    });

    // Check for .nbjs file in initial command line arguments
    const args = process.argv.slice(app.isPackaged ? 1 : 2);
    const initialFile = args.find(arg => arg.endsWith('.nbjs'));
    if (initialFile) {
        log.info('Initial file from command line:', initialFile);
        fileToOpen = initialFile;
    }
}

async function loadExtensions() {
    // Load extensions if needed
    const platform = process.platform === 'darwin' ? 'mac' : 'win';
    const extensionsToLoad = extensions[platform];
    type ExtensionKey = keyof typeof extensions[typeof platform];
    const promises = (Object.keys(extensionsToLoad) as ExtensionKey[]).map(async (key) => {
        const extPath = extensionsToLoad[key];
        try {
            await session.defaultSession.extensions.loadExtension(extPath, { allowFileAccess: true });
            log.info(`Loaded extension: ${key} from ${extPath}`);
        } catch (error) {
            log.error(`Failed to load extension: ${key} from ${extPath}`, error);
        }
    });
    await Promise.all(promises);
}

// Ensure single instance for file associations
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // Set the app name to the productName for proper menu display
    // if (process.platform === 'darwin') {
    app.setName('Nodebook.js');
    // }

    registerHandlers();
    setupFileAssociations();
    loadExtensions();

    app.whenReady().then(async () => {
        const win = createWindow();
    });
}