import { Menu, MenuItem, MenuItemConstructorOptions, BrowserWindow } from 'electron';
import anylogger from 'anylogger';
import type { ApplicationContext } from '@/Types/CommandTypes';

const log = anylogger('MainProcessMenuManager');

/**
 * Command handler function type
 */
export type CommandHandler = () => void;

/**
 * Command handlers mapping
 */
export interface CommandHandlers {
    [commandId: string]: CommandHandler;
}

/**
 * Menu item configuration for main process
 */
export interface MainProcessMenuItemConfig {
    id?: string;
    label?: string; // Optional for separators
    commandId?: string;
    accelerator?: string;
    type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
    submenu?: MainProcessMenuItemConfig[];
    role?: string;
    // Visibility and enabled state evaluators
    visibleWhen?: (context: ApplicationContext) => boolean;
    enabledWhen?: (context: ApplicationContext) => boolean;
    checkedWhen?: (context: ApplicationContext) => boolean;
    // Static properties
    staticEnabled?: boolean;
    staticVisible?: boolean;
    staticChecked?: boolean;
}

/**
 * Menu section configuration
 */
export interface MainProcessMenuSectionConfig {
    label: string;
    submenu: MainProcessMenuItemConfig[];
}

/**
 * Complete menu configuration
 */
export interface MainProcessMenuConfig {
    sections: MainProcessMenuSectionConfig[];
}

/**
 * Simplified menu manager for main process that doesn't require CommandManager
 */
export class MainProcessMenuManager {
    private commandHandlers: CommandHandlers;
    private menuConfig: MainProcessMenuConfig;
    private currentContext: ApplicationContext;
    private currentMenu: Menu | null = null;

    constructor(commandHandlers: CommandHandlers, menuConfig: MainProcessMenuConfig) {
        this.commandHandlers = commandHandlers;
        this.menuConfig = menuConfig;
        this.currentContext = this.getDefaultContext();
        log.debug('MainProcessMenuManager initialized');
    }

    /**
     * Get default application context
     */
    private getDefaultContext(): ApplicationContext {
        return {
            currentView: 'home',
            hasOpenNotebook: false,
            isNotebookDirty: false,
            canUndo: false,
            canRedo: false,
            readingMode: false,
            selectedCellId: null,
            totalCells: 0
        };
    }

    /**
     * Update context and rebuild menu if needed
     */
    updateContext(newContext: Partial<ApplicationContext>): void {
        const oldContext = { ...this.currentContext };
        this.currentContext = { ...this.currentContext, ...newContext };
        
        // Only rebuild if context actually changed
        if (this.shouldRebuildMenu(oldContext, this.currentContext)) {
            this.buildMenu();
            log.debug('Menu rebuilt due to context change');
        }
    }

    /**
     * Build and set the application menu
     */
    buildMenu(): Menu {
        log.debug('Building application menu with context:', this.currentContext);
        
        const template: MenuItemConstructorOptions[] = [];
        
        for (const section of this.menuConfig.sections) {
            const submenu = this.buildSubmenuItems(section.submenu);
            if (submenu.length > 0) {
                template.push({
                    label: section.label,
                    submenu: submenu
                });
            }
        }

        // Apply macOS-specific adjustments
        this.applyPlatformAdjustments(template);

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
        this.currentMenu = menu;
        
        return menu;
    }

    /**
     * Build submenu items recursively
     */
    private buildSubmenuItems(items: MainProcessMenuItemConfig[]): MenuItemConstructorOptions[] {
        const result: MenuItemConstructorOptions[] = [];
        
        for (const item of items) {
            const menuItem = this.createMenuItemOptions(item);
            if (menuItem && menuItem.visible !== false) {
                result.push(menuItem);
            }
        }
        
        return result;
    }

    /**
     * Create menu item options from configuration
     */
    private createMenuItemOptions(config: MainProcessMenuItemConfig): MenuItemConstructorOptions | null {
        // Handle separators
        if (config.type === 'separator') {
            return { type: 'separator' };
        }

        // Handle submenus
        if (config.type === 'submenu' && config.submenu) {
            const submenu = this.buildSubmenuItems(config.submenu);
            return {
                label: config.label,
                submenu: submenu
            };
        }

        // Handle regular menu items
        const options: MenuItemConstructorOptions = {
            id: config.id,
            label: config.label,
            accelerator: config.accelerator,
            type: config.type || 'normal',
            role: config.role as any,
        };

        // Determine enabled state
        if (config.staticEnabled !== undefined) {
            options.enabled = config.staticEnabled;
        } else if (config.enabledWhen) {
            options.enabled = config.enabledWhen(this.currentContext);
        } else {
            options.enabled = true;
        }

        // Determine visible state
        if (config.staticVisible !== undefined) {
            options.visible = config.staticVisible;
        } else if (config.visibleWhen) {
            options.visible = config.visibleWhen(this.currentContext);
        } else {
            options.visible = true;
        }

        // Determine checked state
        if (config.staticChecked !== undefined) {
            options.checked = config.staticChecked;
        } else if (config.checkedWhen) {
            options.checked = config.checkedWhen(this.currentContext);
        }

        // Set click handler
        if (config.commandId && !config.role) {
            const handler = this.commandHandlers[config.commandId];
            if (handler) {
                options.click = handler;
            } else {
                log.warn(`No handler found for command: ${config.commandId}`);
            }
        }

        return options;
    }

    /**
     * Apply platform-specific menu adjustments
     */
    private applyPlatformAdjustments(template: MenuItemConstructorOptions[]): void {
        if (process.platform === 'darwin') {
            // Add macOS app menu
            template.unshift({
                label: 'Nodebook.js',
                submenu: [
                    {
                        label: 'About Nodebook.js',
                        click: this.commandHandlers['help.about']
                    },
                    { type: 'separator' },
                    {
                        label: 'Services',
                        role: 'services',
                        submenu: []
                    },
                    { type: 'separator' },
                    {
                        label: 'Hide Nodebook.js',
                        accelerator: 'Command+H',
                        role: 'hide'
                    },
                    {
                        label: 'Hide Others',
                        accelerator: 'Command+Shift+H',
                        role: 'hideOthers'
                    },
                    {
                        label: 'Show All',
                        role: 'unhide'
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit',
                        accelerator: 'Command+Q',
                        click: this.commandHandlers['file.quit']
                    }
                ]
            });

            // Remove Quit from File menu on macOS
            const fileMenu = template.find(item => item.label === 'File');
            if (fileMenu && Array.isArray(fileMenu.submenu)) {
                fileMenu.submenu = fileMenu.submenu.filter(item =>
                    typeof item === 'object' && item.label !== 'Quit'
                );
            }

            // Remove About from Help menu on macOS
            const helpMenu = template.find(item => item.label === 'Help');
            if (helpMenu && Array.isArray(helpMenu.submenu)) {
                helpMenu.submenu = helpMenu.submenu.filter(item =>
                    typeof item === 'object' && item.label !== 'About Nodebook.js'
                );
            }

            // Add window menu items for macOS
            const windowMenu = template.find(item => item.label === 'Window');
            if (windowMenu && Array.isArray(windowMenu.submenu)) {
                windowMenu.submenu.push(
                    { type: 'separator' },
                    {
                        label: 'Bring All to Front',
                        role: 'front'
                    }
                );
            }
        }
    }

    /**
     * Determine if menu should be rebuilt based on context changes
     */
    private shouldRebuildMenu(oldContext: ApplicationContext, newContext: ApplicationContext): boolean {
        // Check for changes that affect menu visibility/state
        return (
            oldContext.currentView !== newContext.currentView ||
            oldContext.hasOpenNotebook !== newContext.hasOpenNotebook ||
            oldContext.isNotebookDirty !== newContext.isNotebookDirty ||
            oldContext.canUndo !== newContext.canUndo ||
            oldContext.canRedo !== newContext.canRedo ||
            oldContext.readingMode !== newContext.readingMode ||
            oldContext.selectedCellId !== newContext.selectedCellId ||
            oldContext.totalCells !== newContext.totalCells
        );
    }

    /**
     * Get current menu
     */
    getCurrentMenu(): Menu | null {
        return this.currentMenu;
    }

    /**
     * Get current context
     */
    getCurrentContext(): ApplicationContext {
        return { ...this.currentContext };
    }
}
