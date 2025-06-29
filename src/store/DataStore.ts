import { create } from 'zustand';
import { Client, Worker, Task, BusinessRule, PrioritizationWeights, ValidationResult } from '@/types';

interface DataStoreState {
  // Data
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  businessRules: BusinessRule[];
  validationResults: ValidationResult[];
  prioritizationWeights: PrioritizationWeights;
  
  // Actions
  setClients: (clients: Client[]) => void;
  setWorkers: (workers: Worker[]) => void;
  setTasks: (tasks: Task[]) => void;
  setBusinessRules: (rules: BusinessRule[]) => void;
  setValidationResults: (results: ValidationResult[]) => void;
  setPrioritizationWeights: (weights: PrioritizationWeights) => void;
  
  // Update actions
  updateClient: (id: string, updates: Partial<Client>) => void;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateBusinessRule: (id: string, updates: Partial<BusinessRule>) => void;
  
  // Add/Remove actions
  addBusinessRule: (rule: BusinessRule) => void;
  removeBusinessRule: (id: string) => void;
  
  // Reset
  reset: () => void;
}

export const defaultPrioritizationWeights: PrioritizationWeights = {
  priorityLevel: 70,
  taskFulfillment: 80,
  fairness: 60,
  costOptimization: 40,
  speedOptimization: 50,
  skillUtilization: 70,
};

export const useDataStore = create<DataStoreState>((set, get) => ({
  // Initial state
  clients: [],
  workers: [],
  tasks: [],
  businessRules: [],
  validationResults: [],
  prioritizationWeights: defaultPrioritizationWeights,
  
  // Setters
  setClients: (clients) => set({ clients }),
  setWorkers: (workers) => set({ workers }),
  setTasks: (tasks) => set({ tasks }),
  setBusinessRules: (businessRules) => set({ businessRules }),
  setValidationResults: (validationResults) => set({ validationResults }),
  setPrioritizationWeights: (prioritizationWeights) => set({ prioritizationWeights }),
  
  // Update actions
  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map(client => 
      client.ClientID === id ? { ...client, ...updates } : client
    )
  })),
  
  updateWorker: (id, updates) => set((state) => ({
    workers: state.workers.map(worker => 
      worker.WorkerID === id ? { ...worker, ...updates } : worker
    )
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.TaskID === id ? { ...task, ...updates } : task
    )
  })),
  
  updateBusinessRule: (id, updates) => set((state) => ({
    businessRules: state.businessRules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    )
  })),
  
  // Add/Remove actions
  addBusinessRule: (rule) => set((state) => ({
    businessRules: [...state.businessRules, rule]
  })),
  
  removeBusinessRule: (id) => set((state) => ({
    businessRules: state.businessRules.filter(rule => rule.id !== id)
  })),
  
  // Reset
  reset: () => set({
    clients: [],
    workers: [],
    tasks: [],
    businessRules: [],
    validationResults: [],
    prioritizationWeights: defaultPrioritizationWeights,
  }),
}));

// Initialize store on client side only
if (typeof window !== 'undefined') {
  // This ensures the store is only initialized on the client
  // and prevents hydration mismatches
} 