// src/types/electron.d.ts

import 'electron';

declare module 'electron' {
  export interface ElectronAPI {
    // Menu events
    onMenuAction: (event: string, callback: (...args: any[]) => void) => void;
    removeMenuListener?: (event: string) => void;
    
    // File association handling
    onOpenFileFromSystem: (callback: (filePath: string) => void) => void;
    removeOpenFileListener: () => void;
  }
}