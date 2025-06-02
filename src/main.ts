import { app, BrowserWindow, ipcMain, session, dialog } from 'electron';
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
            '/Library/Application Support/Microsoft Edge/Default/Extensions/nnkgneoiohoecpdiaponcejilbhhikei/3.2.10_0'
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



const createWindow = async () => {
    // Get window state
    const mainWindowStateKeeper = await windowStateKeeper('main');
    
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
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
    ipcMain.handle('show-messge-box', async (event, options) => {
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
    }
    );
    

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