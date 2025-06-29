export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string;
  GroupTag: string;
  AttributesJSON: string;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string;
  AvailableSlots: string;
  MaxLoadPerPhase: number;
  WorkerGroup: string;
  QualificationLevel: number;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category: string;
  Duration: number;
  RequiredSkills: string;
  PreferredPhases: string;
  MaxConcurrent: number;
}

export interface BusinessRule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedenceOverride';
  enabled: boolean;
  description: string;
  parameters: Record<string, any>;
  priority?: number;
}

export interface PrioritizationWeights {
  priorityLevel: number;
  taskFulfillment: number;
  fairness: number;
  costOptimization: number;
  speedOptimization: number;
  skillUtilization: number;
}

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
}

export interface ParsedData {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
}

export interface ExportData {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  businessRules: BusinessRule[];
  prioritizationWeights: PrioritizationWeights;
  validationResults: ValidationResult[];
  timestamp: string;
} 