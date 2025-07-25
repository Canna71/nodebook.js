export type InputType = 'number' | 'text' | 'range' | 'checkbox' | 'select';

export interface InputOption {
  label: string;
  value: string | number;
}

/**
 * Base interface that all cell definitions must extend
 */
export interface BaseCellDefinition {
  type: string;
  id: string;
  metadata?: {
    createdAt?: Date;
    updatedAt?: Date;
    tags?: string[];
    [key: string]: any;
  };
}

export interface InputCellDefinition extends BaseCellDefinition {
  type: 'input';
  label?: string; // Make label optional
  inputType: InputType;
  variableName: string;
  value: any; // Renamed from defaultValue to value
  props?: {
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    options?: InputOption[];
  };
}

export interface MarkdownCellDefinition extends BaseCellDefinition {
  type: 'markdown';
  content: string;
  variables?: string[]; // Variables to interpolate in markdown
}

export interface FormulaCellDefinition extends BaseCellDefinition {
  type: 'formula';
  variableName: string;
  formula: string;
}

export interface CodeCellDefinition extends BaseCellDefinition {
  type: 'code';
  code: string;
  language?: 'javascript'; // For future extensibility
  exports?: string[]; // Names of variables this cell exports
  isStatic?: boolean; // Optional flag for static mode, defaults to false
}

export type CellDefinition = InputCellDefinition | MarkdownCellDefinition | FormulaCellDefinition | CodeCellDefinition;

/**
 * Type guard functions for cell definitions
 */
export function isInputCell(cell: CellDefinition): cell is InputCellDefinition {
  return cell.type === 'input';
}

export function isMarkdownCell(cell: CellDefinition): cell is MarkdownCellDefinition {
  return cell.type === 'markdown';
}

export function isFormulaCell(cell: CellDefinition): cell is FormulaCellDefinition {
  return cell.type === 'formula';
}

export function isCodeCell(cell: CellDefinition): cell is CodeCellDefinition {
  return cell.type === 'code';
}

/**
 * Utility function to get cell display name
 */
export function getCellDisplayName(cell: CellDefinition): string {
  switch (cell.type) {
    case 'input':
      return cell.label || cell.variableName; // Use variableName as fallback
    case 'markdown':
      // Extract first heading or first line
      const firstLine = cell.content.split('\n')[0];
      if (firstLine.startsWith('#')) {
        return firstLine.replace(/^#+\s*/, '');
      }
      return firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
    case 'formula':
      return `${cell.variableName} = ${cell.formula}`;
    case 'code':
      return `Code Cell`;
    default:
      return 'Unknown Cell';
  }
}

/**
 * Utility function to validate cell definition
 */
export function validateCellDefinition(cell: any): cell is CellDefinition {
  if (!cell || typeof cell !== 'object') return false;
  if (!cell.type || !cell.id) return false;
  
  switch (cell.type) {
    case 'input':
      return !!(cell.inputType && cell.variableName); // Remove value requirement, allow empty
    case 'markdown':
      return !!(cell.content);
    case 'formula':
      return !!(cell.variableName && cell.formula);
    case 'code':
      return !!(cell.code !== undefined);
    default:
      return false;
  }
}

/**
 * Key-value storage for explicit data persistence in notebooks
 * Users can manually serialize/deserialize data using storage.set() and storage.get()
 */
export interface NotebookStorage {
  [key: string]: any; // Allow any serializable value
}

export interface NotebookModel {
  cells: CellDefinition[];
  // Add explicit key-value storage that users control
  storage?: NotebookStorage;
  // Support for root-level title and description (used in some examples)
  title?: string;
  description?: string;
  metadata?: {
    tags?: string[];
    title?: string; // Also support title in metadata
    description?: string; // Also support description in metadata
    version?: string;
    createdAt?: Date;
    updatedAt?: Date;
    [key: string]: any;
  };
}

// Editing state for the notebook
export interface NotebookEditingState {
  selectedCellId: string | null;
  editModeCells: Set<string>; // Cell IDs in edit mode
  focusedCellId: string | null;
}

// Cell creation templates
export interface CellTemplate {
  type: CellDefinition['type'];
  label: string;
  description: string;
  defaultDefinition: Partial<CellDefinition>;
}
