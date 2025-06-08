import { CommandManager } from './CommandManager';
import { ICommandManager } from '@/Types/CommandTypes';

/**
 * Singleton instance of CommandManager for global access
 * This ensures a single command manager instance across the application
 */
export const commandManagerSingleton: ICommandManager = new CommandManager();