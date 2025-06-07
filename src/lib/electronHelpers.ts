export function isDev() {
  return process.mainModule.filename.indexOf('app.asar') === -1;
}



export interface ElectronApi {
    getUserDataPath: () => Promise<string>;
    isPackaged: () => Promise<boolean>;
    openFileDialog: (options?: Electron.OpenDialogOptions) => Promise<{canceled: boolean, filePaths: string[]}>;
    saveFileDialog: (options?: Electron.SaveDialogOptions) => Promise<{canceled: boolean, filePath?: string}>;
    showMessageBox: (options?: Electron.MessageBoxOptions) => Promise<boolean>;
    showErrorBox: (title: string, content: string) => Promise<boolean>;
    getAppVersion: () => Promise<string>;
    getAppPath: () => Promise<string>;
    getAppName: () => Promise<string>;
    getAppLocale: () => Promise<string>;
    
    // Menu event handling
    onMenuAction: (event: string, callback: (...args: any[]) => void) => void;
    removeMenuListener: (event: string) => void;
}

declare global {
    interface Window {
        api: ElectronApi;
    }
}