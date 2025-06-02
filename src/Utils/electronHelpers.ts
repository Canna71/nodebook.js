export function isDev() {
  return process.mainModule.filename.indexOf('app.asar') === -1;
}



export interface ElectronApi {
  getUserDataPath: () => Promise<string>;
  isPackaged: () => Promise<boolean>;
  openFileDialog: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  saveFileDialog: (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  showMessageBox: (options?: Electron.MessageBoxOptions) => Promise<boolean>;
  showErrorBox: (title: string, content: string) => Promise<void>;
  getAppVersion: () => Promise<string>;
  getAppPath: () => Promise<string>;
  getAppName: () => Promise<string>;
  getAppLocale: () => Promise<string>;
}

declare global {
    interface Window {
        api: ElectronApi;
    }
}