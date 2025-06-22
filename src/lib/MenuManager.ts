import { Menu, MenuItem, MenuItemConstructorOptions } from 'electron';
import { CommandManager } from '@/Engine/CommandManager';
import anylogger from 'anylogger';

const log = anylogger('MenuManager');

/**
 * Menu item configuration that maps to commands
 */
export interface MenuItemConfig {
    id?: string;
    label?: string; // Optional for separators
    commandId?: string;
    accelerator?: string;
    type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
    submenu?: MenuItemConfig[];
    role?: string;
    // Static properties that don't change
    staticEnabled?: boolean;
    staticVisible?: boolean;
    staticChecked?: boolean;
}

/**
 * Menu section configuration
 */
export interface MenuSectionConfig {
    label: string;
    submenu: MenuItemConfig[];
}

/**
 * Application menu configuration
 */
export interface MenuConfig {
    sections: MenuSectionConfig[];
}

/**
 * Context provider for menu state evaluation
 * This allows the main process to evaluate command states
 */
export interface MenuStateContext {
    // Notebook state
    hasNotebook: boolean;
    isDirty: boolean;
    isReadingMode: boolean;
    currentView: 'home' | 'notebook' | 'settings' | 'documentation';
    
    // Editor state
    canUndo: boolean;
    canRedo: boolean;
    undoDescription?: string;
    redoDescription?: string;
    
    // Cell operations
    hasSelectedCell: boolean;
    canAddCell: boolean;
    canDeleteCell: boolean;
    canMoveCell: boolean;
}

/**
 * Menu manager that creates and updates menus based on command states
 */
export class MenuManager {
    private currentMenu: Menu | null = null;
    private menuConfig: MenuConfig;
    private commandManager: CommandManager;
    private stateContext: MenuStateContext;

    constructor(commandManager: CommandManager, menuConfig: MenuConfig) {
        this.commandManager = commandManager;
        this.menuConfig = menuConfig;
        this.stateContext = this.getDefaultState();
        log.debug('MenuManager initialized');
    }

    /**
     * Update the menu state context and rebuild menu if needed
     */
    updateMenuState(newState: Partial<MenuStateContext>): void {
        const oldState = { ...this.stateContext };
        this.stateContext = { ...this.stateContext, ...newState };
        
        // Check if any state that affects menu visibility/enabled status changed
        if (this.shouldRebuildMenu(oldState, this.stateContext)) {
            log.debug('Menu state changed, rebuilding menu');
            this.buildMenu();
        }
    }

    /**
     * Build and set the application menu
     */
    buildMenu(): Menu {
        log.debug('Building application menu');
        
        const menu = new Menu();
        
        for (const section of this.menuConfig.sections) {
            const submenu = new Menu();
            this.buildSubmenu(submenu, section.submenu);
            
            const menuItem = new MenuItem({
                label: section.label,
                submenu: submenu
            });
            
            menu.append(menuItem);
        }
        
        this.currentMenu = menu;
        Menu.setApplicationMenu(menu);
        
        return menu;
    }

    /**
     * Build a submenu recursively
     */
    private buildSubmenu(menu: Menu, items: MenuItemConfig[]): void {
        for (const item of items) {
            const menuItem = this.createMenuItem(item);
            if (menuItem) {
                menu.append(menuItem);
            }
        }
    }

    /**
     * Create a menu item from configuration
     */
    private createMenuItem(config: MenuItemConfig): MenuItem | null {
        // Handle separators
        if (config.type === 'separator') {
            return new MenuItem({ type: 'separator' });
        }

        // Handle submenus
        if (config.type === 'submenu' && config.submenu) {
            const submenu = new Menu();
            this.buildSubmenu(submenu, config.submenu);
            return new MenuItem({
                label: config.label,
                submenu: submenu
            });
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
        } else if (config.commandId) {
            options.enabled = this.canExecuteCommand(config.commandId);
        } else {
            options.enabled = true;
        }

        // Determine visible state
        if (config.staticVisible !== undefined) {
            options.visible = config.staticVisible;
        } else if (config.commandId) {
            options.visible = this.isCommandVisible(config.commandId);
        } else {
            options.visible = true;
        }

        // Determine checked state
        if (config.staticChecked !== undefined) {
            options.checked = config.staticChecked;
        } else if (config.commandId) {
            options.checked = this.isCommandChecked(config.commandId);
        }

        // Set click handler
        if (config.commandId && !config.role) {
            options.click = () => {
                this.executeCommand(config.commandId!);
            };
        }

        // Don't create invisible menu items
        if (options.visible === false) {
            return null;
        }

        return new MenuItem(options);
    }

    /**
     * Check if a command can be executed based on current state
     */
    private canExecuteCommand(commandId: string): boolean {
        // Check with command manager first
        const canExecute = this.commandManager.canExecuteCommand(commandId);
        if (!canExecute) {
            return false;
        }

        // Apply context-specific logic for menu items
        return this.evaluateCommandState(commandId).enabled;
    }

    /**
     * Check if a command should be visible based on current state
     */
    private isCommandVisible(commandId: string): boolean {
        return this.evaluateCommandState(commandId).visible;
    }

    /**
     * Check if a command should be checked based on current state
     */
    private isCommandChecked(commandId: string): boolean {
        return this.evaluateCommandState(commandId).checked;
    }

    /**
     * Evaluate command state based on current context
     */
    private evaluateCommandState(commandId: string): { enabled: boolean; visible: boolean; checked: boolean } {
        const defaults = { enabled: true, visible: true, checked: false };

        switch (commandId) {
            case 'notebook.new':
                return { ...defaults, enabled: true };

            case 'notebook.open':
                return { ...defaults, enabled: true };

            case 'notebook.save':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.hasNotebook && this.stateContext.isDirty 
                };

            case 'notebook.saveAs':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.hasNotebook 
                };

            case 'notebook.export':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.hasNotebook 
                };

            case 'notebook.close':
                // Dynamic label and visibility based on current view
                return {
                    enabled: true,
                    visible: this.stateContext.currentView !== 'home',
                    checked: false
                };

            case 'edit.undo':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.canUndo 
                };

            case 'edit.redo':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.canRedo 
                };

            case 'view.readingMode':
                return {
                    ...defaults,
                    enabled: this.stateContext.hasNotebook,
                    checked: this.stateContext.isReadingMode
                };

            case 'cell.add':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.canAddCell 
                };

            case 'cell.delete':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.canDeleteCell 
                };

            case 'cell.moveUp':
            case 'cell.moveDown':
                return { 
                    ...defaults, 
                    enabled: this.stateContext.canMoveCell 
                };

            default:
                return defaults;
        }
    }

    /**
     * Execute a command via the command manager
     */
    private executeCommand(commandId: string): void {
        log.debug(`Executing command from menu: ${commandId}`);
        this.commandManager.executeCommand(commandId).catch(error => {
            log.error(`Failed to execute command ${commandId}:`, error);
        });
    }

    /**
     * Determine if menu should be rebuilt based on state changes
     */
    private shouldRebuildMenu(oldState: MenuStateContext, newState: MenuStateContext): boolean {
        // Check for changes that affect menu visibility or enabled state
        const significantChanges = [
            'hasNotebook',
            'isDirty',
            'isReadingMode',
            'currentView',
            'canUndo',
            'canRedo',
            'hasSelectedCell',
            'canAddCell',
            'canDeleteCell',
            'canMoveCell'
        ];

        return significantChanges.some(key => 
            oldState[key as keyof MenuStateContext] !== newState[key as keyof MenuStateContext]
        );
    }

    /**
     * Get default menu state
     */
    private getDefaultState(): MenuStateContext {
        return {
            hasNotebook: false,
            isDirty: false,
            isReadingMode: false,
            currentView: 'home',
            canUndo: false,
            canRedo: false,
            undoDescription: undefined,
            redoDescription: undefined,
            hasSelectedCell: false,
            canAddCell: false,
            canDeleteCell: false,
            canMoveCell: false
        };
    }

    /**
     * Get the current menu
     */
    getCurrentMenu(): Menu | null {
        return this.currentMenu;
    }

    /**
     * Get the current state context
     */
    getStateContext(): MenuStateContext {
        return { ...this.stateContext };
    }

    /**
     * Get dynamic menu item label based on current state
     */
    getDynamicLabel(commandId: string, baseLabel: string): string {
        switch (commandId) {
            case 'notebook.close':
                switch (this.stateContext.currentView) {
                    case 'settings':
                        return 'Close Settings';
                    case 'documentation':
                        return 'Close Documentation';
                    case 'notebook':
                        return 'Close Notebook';
                    default:
                        return baseLabel;
                }

            case 'edit.undo':
                return this.stateContext.undoDescription 
                    ? `Undo ${this.stateContext.undoDescription}`
                    : 'Undo';

            case 'edit.redo':
                return this.stateContext.redoDescription 
                    ? `Redo ${this.stateContext.redoDescription}`
                    : 'Redo';

            default:
                return baseLabel;
        }
    }
}
