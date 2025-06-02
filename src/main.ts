import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import "anylogger-loglevel";
import loglevel from "loglevel";
import anylogger from 'anylogger';
import 'anylogger-console'

const log = anylogger('Main');
const os = require('node:os')
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



const createWindow = () => {
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

app.whenReady().then(async () => {

    // Set up IPC handler for user data path
    ipcMain.handle('get-user-data-path', () => {
        return app.getPath('userData');
    });

    ipcMain.handle('is-packaged', () => {
        return app.isPackaged;
    });
    log.info('App user data path:', app.getPath('userData'));
    // Load the extensions
    const platform = process.platform === 'darwin' ? 'mac' : 'win';
    const extensionsToLoad = extensions[platform];
    type ExtensionKey = keyof typeof extensions[typeof platform];
    const promises = (Object.keys(extensionsToLoad) as ExtensionKey[]).map(async (key) => {
        const extPath = extensionsToLoad[key];
        try {
            await session.defaultSession.extensions.loadExtension(extPath, { allowFileAccess: true });
            console.log(`Loaded extension: ${key} from ${extPath}`);
        } catch (error) {
            console.error(`Failed to load extension: ${key} from ${extPath}`, error);
        }
    });
    await Promise.all(promises);
    // const res = await session.defaultSession.extensions.loadExtension(reactDevToolsPath, { allowFileAccess: true });
    const win = createWindow();
    // setTimeout(() => {
    //     session.defaultSession.extensions.loadExtension(reactDevToolsPath, {allowFileAccess: true});
    // },1000);
})