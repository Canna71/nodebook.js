import { AppView } from '@/Engine/ViewProvider';

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
    // Application settings
    getAppSetting: (key: string, defaultValue?: any) => Promise<any>;
    setAppSetting: (key: string, value: any) => Promise<boolean>;
    getAllAppSettings: () => Promise<Record<string, any>>;
    // Menu event handling
    onMenuAction: (event: string, callback: (...args: any[]) => void) => void;
    removeMenuListener: (event: string) => void;
    // Dynamic menu updates
    updateCloseMenuLabel: (label: string) => Promise<void>;
    isDev: () => boolean;
}

declare global {
    interface Window {
        api: ElectronApi;
    }
}

export const updateCloseMenuLabel = async (currentView: AppView, hasNotebook: boolean = false) => {
    if (!window.api) {
        console.warn('Electron API not available');
        return;
    }
    
    let label: string;
    let shouldShow = true;
    
    switch (currentView) {
        case 'settings':
            label = 'Close Settings';
            break;
        case 'documentation':
            label = 'Close Documentation';
            break;
        case 'shortcuts':
            label = 'Close Keyboard Shortcuts';
            break;
        case 'notebook':
            if (hasNotebook) {
                label = 'Close Notebook';
            } else {
                // Hide the menu item when on home page (notebook view with no notebook)
                shouldShow = false;
                label = ''; // Not used when hidden
            }
            break;
        default:
            shouldShow = false;
            label = '';
    }
    
    try {
        if (shouldShow) {
            await window.api.updateCloseMenuLabel(label);
        } else {
            // Use a special marker to indicate the menu should be hidden
            await window.api.updateCloseMenuLabel('__HIDE_MENU_ITEM__');
        }
    } catch (error) {
        console.error('Failed to update close menu label:', error);
    }
};