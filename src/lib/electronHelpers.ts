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
    showInputDialog: (options: {title: string, message: string, placeholder?: string}) => Promise<{cancelled: boolean, value: string}>;
    showMessageDialog: (options: {type: 'info' | 'error' | 'warning', title: string, message: string}) => Promise<void>;
    getEnvironmentVariables: (variableNames: string[]) => Promise<Record<string, string | undefined>>;
    getAppVersion: () => Promise<string>;
    getAppInfo: () => Promise<{name: string, version: string, author: string, license: string}>;
    getAppPath: () => Promise<string>;
    getAppName: () => Promise<string>;
    getAppLocale: () => Promise<string>;
    setWindowTitle: (title: string) => Promise<void>;
    // API Key storage
    saveAPIKeys: (keys: {openai?: string, anthropic?: string}) => Promise<void>;
    getStoredAPIKeys: () => Promise<{openai?: string, anthropic?: string} | null>;
    getApiKeyStorageInfo: () => Promise<{hasEncryptedKeys: boolean, hasObfuscatedKeys: boolean, encryptionAvailable: boolean}>;
    // Menu event handling
    onMenuAction: (event: string, callback: (...args: any[]) => void) => void;
    removeMenuListener: (event: string) => void;
    isDev: () => boolean;
}

declare global {
    interface Window {
        api: ElectronApi;
    }
}