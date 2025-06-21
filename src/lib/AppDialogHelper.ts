import React from 'react';
import anylogger from 'anylogger';
import { AppErrorDialogConfig, AppConfirmDialogConfig, AppInfoDialogConfig, AppPromptDialogConfig, AppProgressDialogConfig } from '@/components/AppDialogProvider';

const log = anylogger('AppDialogHelper');

interface AppDialogHandlers {
  showError?: (config: AppErrorDialogConfig) => Promise<void>;
  showConfirm?: (config: AppConfirmDialogConfig) => Promise<boolean>;
  showInfo?: (config: AppInfoDialogConfig) => Promise<void>;
  showPrompt?: (config: AppPromptDialogConfig) => Promise<string | null>;
  showProgress?: (config: AppProgressDialogConfig) => Promise<void>;
}

/**
 * Helper class for app dialog operations that can be used outside React components
 * This class provides a bridge between the command system and the React dialog context
 */
export class AppDialogHelper {
  private static instance: AppDialogHelper;
  private dialogHandlers: AppDialogHandlers = {};

  private constructor() {}

  static getInstance(): AppDialogHelper {
    if (!AppDialogHelper.instance) {
      AppDialogHelper.instance = new AppDialogHelper();
    }
    return AppDialogHelper.instance;
  }

  /**
   * Register dialog handlers from the React context
   */
  registerHandlers(handlers: AppDialogHandlers): void {
    this.dialogHandlers = handlers;
    log.debug('App dialog handlers registered');
  }

  /**
   * Show an error dialog
   */
  async showError(title: string, message: string, error?: string, onRetry?: () => void): Promise<void> {
    log.debug('Showing error dialog', { title, message, hasError: !!error, hasRetry: !!onRetry });
    
    if (!this.dialogHandlers.showError) {
      log.error('Error dialog handler not registered');
      throw new Error('App dialog system not initialized');
    }
    
    await this.dialogHandlers.showError({
      title,
      message,
      error,
      onRetry,
    });
    log.debug('Error dialog completed');
  }

  /**
   * Show a confirmation dialog and return user choice
   */
  async showConfirm(
    title: string, 
    message: string, 
    options?: {
      variant?: 'default' | 'destructive';
      confirmText?: string;
      cancelText?: string;
    }
  ): Promise<boolean> {
    log.debug('Showing confirm dialog', { title, message, options });
    
    if (!this.dialogHandlers.showConfirm) {
      log.error('Confirm dialog handler not registered');
      throw new Error('App dialog system not initialized');
    }
    
    const result = await this.dialogHandlers.showConfirm({
      title,
      message,
      ...options,
    });
    log.debug('Confirm dialog result:', { confirmed: result });
    return result;
  }

  /**
   * Show an info dialog
   */
  async showInfo(title: string | React.ReactNode, message: string, details?: string): Promise<void> {
    log.debug('Showing info dialog', { title, message, hasDetails: !!details });
    
    if (!this.dialogHandlers.showInfo) {
      log.error('Info dialog handler not registered');
      throw new Error('App dialog system not initialized');
    }
    
    await this.dialogHandlers.showInfo({
      title,
      message,
      details,
    });
    log.debug('Info dialog completed');
  }

  /**
   * Show a prompt dialog and return user input
   */
  async showPrompt(
    title: string, 
    message: string, 
    options?: {
      placeholder?: string;
      defaultValue?: string;
      validation?: (value: string) => string | null;
    }
  ): Promise<string | null> {
    log.debug('Showing prompt dialog', { title, message, options });
    
    if (!this.dialogHandlers.showPrompt) {
      log.error('Prompt dialog handler not registered');
      throw new Error('App dialog system not initialized');
    }
    
    const result = await this.dialogHandlers.showPrompt({
      title,
      message,
      ...options,
    });
    log.debug('Prompt dialog result:', { hasResult: !!result, length: result?.length });
    return result;
  }

  /**
   * Show a progress dialog
   */
  async showProgress(
    title: string,
    message: string,
    options?: {
      progressValue?: number;
      onCancel?: () => void;
      canCancel?: boolean;
    }
  ): Promise<void> {
    log.debug('Showing progress dialog', { title, message, options });
    
    if (!this.dialogHandlers.showProgress) {
      log.error('Progress dialog handler not registered');
      throw new Error('App dialog system not initialized');
    }
    
    await this.dialogHandlers.showProgress({
      title,
      message,
      ...options,
    });
    log.debug('Progress dialog completed');
  }

  /**
   * Check if dialog handlers are registered
   */
  isInitialized(): boolean {
    return !!(
      this.dialogHandlers.showError &&
      this.dialogHandlers.showConfirm &&
      this.dialogHandlers.showInfo &&
      this.dialogHandlers.showPrompt &&
      this.dialogHandlers.showProgress
    );
  }

  /**
   * Convenience method for showing file operation errors
   */
  async showFileError(operation: string, filename: string, error: Error): Promise<void> {
    const title = `${operation} Failed`;
    const message = `Failed to ${operation.toLowerCase()} file: ${filename}`;
    const errorDetails = error.stack || error.message;
    
    await this.showError(title, message, errorDetails);
  }

  /**
   * Convenience method for showing save confirmation when there are unsaved changes
   */
  async showUnsavedChangesConfirm(filename?: string): Promise<'save' | 'discard' | 'cancel'> {
    const fileText = filename ? ` "${filename}"` : '';
    const confirmed = await this.showConfirm(
      'Unsaved Changes',
      `You have unsaved changes in${fileText}. Do you want to save your changes?`,
      {
        confirmText: 'Save',
        cancelText: 'Don\'t Save',
      }
    );
    
    if (confirmed) {
      return 'save';
    } else {
      // Show another confirmation for discarding changes
      const discardConfirmed = await this.showConfirm(
        'Discard Changes',
        'Are you sure you want to discard your changes? This action cannot be undone.',
        {
          variant: 'destructive',
          confirmText: 'Discard',
          cancelText: 'Cancel',
        }
      );
      
      return discardConfirmed ? 'discard' : 'cancel';
    }
  }

  /**
   * Convenience method for showing delete confirmation
   */
  async showDeleteConfirm(itemName: string, itemType: string = 'item'): Promise<boolean> {
    return await this.showConfirm(
      `Delete ${itemType}`,
      `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      {
        variant: 'destructive',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      }
    );
  }
}

export const appDialogHelper = AppDialogHelper.getInstance();
