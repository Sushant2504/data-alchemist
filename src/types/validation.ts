export interface ValidationResult {
  id: string;
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  entity: 'client' | 'worker' | 'task';
  entityId?: string;
  field?: string;
  suggestion?: string;
  fixable?: boolean;
  rowIndex?: number;
  columnIndex?: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (data: unknown) => ValidationResult[];
  aiEnhanced?: boolean;
}

export interface ValidationSummary {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  fixable: number;
}

export interface AISuggestion {
  id: string;
  type: 'correction' | 'rule' | 'validation';
  message: string;
  confidence: number;
  action: string;
  data?: unknown;
} 