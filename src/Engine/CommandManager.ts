
import { ICommand, ICommandManager, CommandInfo, CommandContext } from '@/Types/CommandTypes';
import anylogger from 'anylogger';

const log = anylogger('CommandManager');

/**
 * Command manager implementation using the Command Pattern
 */
export class CommandManager implements ICommandManager {
    private commands = new Map<string, CommandInfo>();
    private context: CommandContext | null = null;

    constructor() {
        log.debug('CommandManager initialized');
    }

    /**
     * Set the command execution context
     */
    setContext(context: CommandContext): void {
        this.context = context;
        log.debug('CommandManager context set');
    }

    /**
     * Register a command with the manager
     */
    registerCommand(info: CommandInfo): void {
        this.commands.set(info.id, info);
        log.debug(`Command registered: ${info.id}`);
    }

    /**
     * Execute a command by ID
     */
    async executeCommand(commandId: string): Promise<void> {
        const commandInfo = this.commands.get(commandId);
        if (!commandInfo) {
            throw new Error(`Command not found: ${commandId}`);
        }

        if (!this.context) {
            throw new Error('Command context not set');
        }

        const command = commandInfo.command;
        
        // Check if command can be executed
        if (command.canExecute && !command.canExecute()) {
            log.warn(`Command ${commandId} cannot be executed at this time`);
            return;
        }

        try {
            log.debug(`Executing command: ${commandId}`);
            await command.execute();
            log.debug(`Command executed successfully: ${commandId}`);
        } catch (error) {
            log.error(`Error executing command ${commandId}:`, error);
            throw error;
        }
    }

    /**
     * Check if a command can be executed
     */
    canExecuteCommand(commandId: string): boolean {
        const commandInfo = this.commands.get(commandId);
        if (!commandInfo || !this.context) {
            return false;
        }

        const command = commandInfo.command;
        return command.canExecute ? command.canExecute() : true;
    }

    /**
     * Get a command by ID
     */
    getCommand(commandId: string): ICommand | undefined {
        const commandInfo = this.commands.get(commandId);
        return commandInfo?.command;
    }

    /**
     * Get all registered commands
     */
    getAllCommands(): CommandInfo[] {
        return Array.from(this.commands.values());
    }

    /**
     * Unregister a command
     */
    unregisterCommand(commandId: string): void {
        if (this.commands.delete(commandId)) {
            log.debug(`Command unregistered: ${commandId}`);
        }
    }

    /**
     * Get command context (for commands to access)
     */
    getContext(): CommandContext | null {
        return this.context;
    }
}
