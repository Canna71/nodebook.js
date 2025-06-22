// See the Electron documentation for details on how to use preload scripts:

import { ElectronApi } from "./lib/electronHelpers";


// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// const { ipcRenderer } = require('electron');
import { ipcRenderer } from 'electron';
import { memoize } from "./lib/utils";

const api: ElectronApi = {
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    isPackaged: () => ipcRenderer.invoke('is-packaged'),
    openFileDialog: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('open-file-dialog', options),
    saveFileDialog: (options?: Electron.SaveDialogOptions) => ipcRenderer.invoke('save-file-dialog', options),
    showMessageBox: (options?: Electron.MessageBoxOptions) => ipcRenderer.invoke('show-message-box', options),
    showErrorBox: (title: string, content: string) => ipcRenderer.invoke('show-error-box', title, content),
    showInputDialog: (options) => ipcRenderer.invoke('show-input-dialog', options),
    showMessageDialog: (options) => ipcRenderer.invoke('show-message-dialog', options),
    getEnvironmentVariables: (variableNames) => ipcRenderer.invoke('get-environment-variables', variableNames),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getAppName: () => ipcRenderer.invoke('get-app-name'),
    getAppLocale: () => ipcRenderer.invoke('get-app-locale'),
    setWindowTitle: (title: string) => ipcRenderer.invoke('set-window-title', title),

    // API Key storage
    saveAPIKeys: (keys) => ipcRenderer.invoke('save-api-keys', keys),
    getStoredAPIKeys: () => ipcRenderer.invoke('get-stored-api-keys'),
    getApiKeyStorageInfo: () => ipcRenderer.invoke('get-api-key-storage-info'),

    // Application settings
    getAppSetting: (key: string, defaultValue?: any) => ipcRenderer.invoke('get-app-setting', key, defaultValue),
    setAppSetting: (key: string, value: any) => ipcRenderer.invoke('set-app-setting', key, value),
    getAllAppSettings: () => ipcRenderer.invoke('get-all-app-settings'),

    // Menu event handling
    onMenuAction: (event: string, callback: (...args: any[]) => void) => {
        ipcRenderer.on(event, (_, ...args) => callback(...args));
    },

    removeMenuListener: (event: string) => {
        ipcRenderer.removeAllListeners(event);
    },
    isDev: memoize(() => {
        // Check if the app is running in development mode
        return process.env.ISDEV === '1';
    })
};

window.api = api;

