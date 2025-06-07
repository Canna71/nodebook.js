// from: https://medium.com/@hql287/persisting-windows-state-in-electron-using-javascript-closure-17fc0821d37
import { BrowserWindow, Rectangle } from 'electron';
import appConfig from 'electron-settings';
import anylogger from 'anylogger';
const log = anylogger('WindowStateKeeper');

export type WindowState = {
    rectangle: Rectangle,
    // x: number | undefined;
    // y: number | undefined;
    // width: number;
    // height: number;
    isMaximized?: boolean;
};

export type WindowStateKeeper = {
    rectangle: Rectangle,
    track: (window: BrowserWindow) => void;
};

export default async function windowStateKeeper(windowName: string): Promise<WindowStateKeeper> {
    let window: BrowserWindow;
    let windowState: WindowState;

    async function setBounds() {
        // Restore from appConfig
        if (await appConfig.has(`windowState.${windowName}`)) {
            windowState = await appConfig.get(`windowState.${windowName}`) as unknown as WindowState;
            return;
        }
        // Default
        windowState = {
           rectangle: {
                x: undefined,
                y: undefined,
                width: 1000,
                height: 800,
            },
        };
        log.log('No window state found, using default');
        log.log(windowState);
    }

    async function saveState() {
        if (!windowState.isMaximized) {
            windowState = {rectangle: window.getBounds()};
        }
        windowState.isMaximized = window.isMaximized();
        await appConfig.set(`windowState.${windowName}`, windowState as any);
    }

    function track(win: BrowserWindow) {
        window = win;
        win.on('resize', saveState);
        win.on('move', saveState);
        win.on('close', saveState);
    }

    await setBounds();

    return ({
        rectangle: windowState.rectangle,
        track,
    });
}