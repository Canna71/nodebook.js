// See the Electron documentation for details on how to use preload scripts:

import { ElectronApi } from "./Utils/electronHelpers";



// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
// const { ipcRenderer } = require('electron');
import {  ipcRenderer } from 'electron';
// contextBridge.exposeInMainWorld('api', {
// //   node: () => process.versions.node,
// //   chrome: () => process.versions.chrome,
// //   electron: () => process.versions.electron,
//   getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
//   // we can also expose variables, not just functions
// })

const api : ElectronApi = {
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    isPackaged: () => ipcRenderer.invoke('is-packaged'),
    openFileDialog: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke('open-file-dialog', options),
    saveFileDialog: (options?: Electron.SaveDialogOptions) => ipcRenderer.invoke('save-file-dialog', options),
    showMessageBox: (options?: Electron.MessageBoxOptions) => ipcRenderer.invoke('show-message-box', options),
    showErrorBox: (title: string, content: string) => ipcRenderer.invoke('show-error-box', title, content),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getAppName: () => ipcRenderer.invoke('get-app-name'),
    getAppLocale: () => ipcRenderer.invoke('get-app-locale')  
};

window.api = api;