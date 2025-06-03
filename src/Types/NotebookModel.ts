export type InputType = 'number' | 'text' | 'range' | 'checkbox' | 'select';

export interface InputOption {
  label: string;
  value: string | number;
}

export interface InputCellDefinition {
  type: 'input';
  id: string;
  label: string;
  inputType: InputType;
  variableName: string;
  defaultValue: any;
  props?: {
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    options?: InputOption[];
  };
}

export interface MarkdownCellDefinition {
  type: 'markdown';
  id: string;
  content: string;
  variables?: string[]; // Variables to interpolate in markdown
}

export interface FormulaCellDefinition {
  type: 'formula';
  id: string;
  variableName: string;
  formula: string;
  outputFormat?: 'number' | 'currency' | 'percentage' | 'text';
  decimals?: number;
  label?: string; // Optional label for display
  description?: string; // Optional description
}

export interface CodeCellDefinition {
  type: 'code';
  id: string;
  code: string;
  language?: 'javascript'; // For future extensibility
  exports?: string[]; // Names of variables this cell exports
}

export type CellDefinition = InputCellDefinition | MarkdownCellDefinition | FormulaCellDefinition | CodeCellDefinition;

export interface NotebookModel {
  title?: string;
  description?: string;
  cells: CellDefinition[];
  metadata?: {
    tags?: string[];
    [key: string]: any;
  };
}
