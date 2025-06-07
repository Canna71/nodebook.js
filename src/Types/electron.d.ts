// src/types/electron.d.ts

import 'electron';

declare module 'electron' {
  export interface ElectronAPI {
    // Menu events
    onMenuAction: (event: string, callback: (...args: any[]) => void) => void;
    removeMenuListener?: (event: string) => void;
  }
}