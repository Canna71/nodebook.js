export interface RecentNotebook {
  path: string;
  name: string;
  lastOpened: Date;
  size?: number;
  cellCount?: number;
}

export class RecentNotebooksManager {
  private static readonly MAX_RECENT = 10;
  private static readonly STORAGE_KEY = 'recentNotebooks';

  static async addRecentNotebook(path: string, name?: string): Promise<void> {
    try {
      const recent = await this.getRecentNotebooks();
      const notebookName = name || this.extractNameFromPath(path);
      const notebook: RecentNotebook = {
        path,
        name: notebookName,
        lastOpened: new Date()
      };

      // Remove existing entry for this path
      const filtered = recent.filter(r => r.path !== path);
      
      // Add to front and limit to MAX_RECENT
      const updated = [notebook, ...filtered].slice(0, this.MAX_RECENT);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Could not update recent notebooks:', error);
    }
  }

  static async getRecentNotebooks(): Promise<RecentNotebook[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const recent = JSON.parse(stored) as any[];
      
      // Convert date strings back to Date objects
      return recent.map(r => ({
        ...r,
        lastOpened: new Date(r.lastOpened)
      }));
    } catch (error) {
      console.warn('Could not load recent notebooks:', error);
      return [];
    }
  }

  static async removeRecentNotebook(path: string): Promise<void> {
    try {
      const recent = await this.getRecentNotebooks();
      const filtered = recent.filter(r => r.path !== path);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.warn('Could not remove recent notebook:', error);
    }
  }

  static async clearRecentNotebooks(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Could not clear recent notebooks:', error);
    }
  }

  private static extractNameFromPath(path: string): string {
    const fileName = path.split('/').pop() || path.split('\\').pop() || path;
    return fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  }
}
