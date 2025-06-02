// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { ipcRenderer } = require('electron');
// contextBridge.exposeInMainWorld('api', {
// //   node: () => process.versions.node,
// //   chrome: () => process.versions.chrome,
// //   electron: () => process.versions.electron,
//   getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
//   // we can also expose variables, not just functions
// })

(window as any).getUserDataPath = (): Promise<string> => {
    return ipcRenderer.invoke('get-user-data-path')
}

(window as any).isPackaged = (): Promise<boolean> => {
    return ipcRenderer.invoke('is-packaged')
}