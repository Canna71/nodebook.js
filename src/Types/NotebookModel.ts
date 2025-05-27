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
}

export type CellDefinition = InputCellDefinition | MarkdownCellDefinition | FormulaCellDefinition;

export interface ReactiveValueDefinition {
  name: string;
  defaultValue: any;
  type?: 'number' | 'string' | 'boolean';
}

export interface FormulaDefinition {
  name: string;
  formula: string;
  dependencies?: string[];
}

export interface NotebookModel {
  title: string;
  description?: string;
  reactiveValues: ReactiveValueDefinition[];
  formulas: FormulaDefinition[];
  cells: CellDefinition[];
}
