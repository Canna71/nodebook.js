import { app, BrowserWindow, ipcMain, session, dialog, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import "anylogger-loglevel";
import loglevel from "loglevel";
import anylogger from 'anylogger';
import 'anylogger-console'
import windowStateKeeper from './lib/windowStateKeeper';

const log = anylogger('Main');
import os from 'node:os';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}


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
                { type: 'separator' },
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
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
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
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close'
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About NotebookJS',
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
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
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
    });
    mainWindowStateKeeper.track(mainWindow);

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Create menu after window is created
    createMenu(mainWindow);
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
    }
    );
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
    ipcMain.handle('show-input-dialog', async (event, options: {title: string, message: string, placeholder?: string}) => {
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

    ipcMain.handle('show-message-dialog', async (event, options: {type: 'info' | 'error' | 'warning', title: string, message: string}) => {
        await dialog.showMessageBox({
            type: options.type,
            title: options.title,
            message: options.message,
            buttons: ['OK']
        });
    });
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.whenReady().then(async () => {

    registerHandlers();
    await loadExtensions();

    // const res = await session.defaultSession.extensions.loadExtension(reactDevToolsPath, { allowFileAccess: true });
    const win = createWindow();
    // setTimeout(() => {
    //     session.defaultSession.extensions.loadExtension(reactDevToolsPath, {allowFileAccess: true});
    // },1000);
})