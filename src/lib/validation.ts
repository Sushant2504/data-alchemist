import { Client, Worker, Task, ValidationResult } from '@/types';

export interface ValidationContext {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
}

// Core validation rules
export const validationRules = {
  // 1. Missing required columns
  missingRequiredColumns: (data: Record<string, unknown>[], entityType: string): ValidationResult[] => {
    const requiredColumns = {
      clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
      workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
      tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
    };
    
    const required = requiredColumns[entityType as keyof typeof requiredColumns] || [];
    const missing = required.filter(col => !data.some(row => row[col] !== undefined));
    
    return missing.map(col => ({
      id: `missing-${col}`,
      type: 'missing_required_column',
      severity: 'error',
      message: `Missing required column: ${col}`,
      entity: entityType as 'client' | 'worker' | 'task',
      field: col,
      fixable: false
    }));
  },

  // 2. Duplicate IDs
  duplicateIDs: (data: Record<string, unknown>[], entityType: string): ValidationResult[] => {
    const idField = entityType === 'clients' ? 'ClientID' : entityType === 'workers' ? 'WorkerID' : 'TaskID';
    const ids = data.map(row => row[idField]).filter(Boolean);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    
    return [...new Set(duplicates)].map(id => ({
      id: `duplicate-${id}`,
      type: 'duplicate_id',
      severity: 'error',
      message: `Duplicate ID found: ${id}`,
      entity: entityType.slice(0, -1) as 'client' | 'worker' | 'task',
      entityId: id as string,
      field: idField,
      fixable: true,
      suggestion: `Remove or change the duplicate ID (${id})`,
    }));
  },

  // 3. Malformed lists
  malformedLists: (data: Record<string, unknown>[], entityType: string): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    data.forEach((row, index) => {
      // Check AvailableSlots for workers
      if (entityType === 'workers' && row.AvailableSlots) {
        try {
          const slots = JSON.parse(row.AvailableSlots as string);
          if (!Array.isArray(slots) || !slots.every(slot => typeof slot === 'number')) {
            results.push({
              id: `malformed-slots-${index}`,
              type: 'malformed_list',
              severity: 'error',
              message: `AvailableSlots must be a JSON array of numbers`,
              entity: 'worker',
              entityId: row.WorkerID as string,
              field: 'AvailableSlots',
              fixable: true,
              suggestion: 'Format as JSON array, e.g., [1, 3, 5]'
            });
          }
        } catch {
          results.push({
            id: `malformed-slots-${index}`,
            type: 'malformed_list',
            severity: 'error',
            message: `Invalid JSON in AvailableSlots`,
            entity: 'worker',
            entityId: row.WorkerID as string,
            field: 'AvailableSlots',
            fixable: true,
            suggestion: 'Format as JSON array, e.g., [1, 3, 5]'
          });
        }
      }
      
      // Check comma-separated lists
      const listFields = {
        clients: ['RequestedTaskIDs'],
        workers: ['Skills'],
        tasks: ['RequiredSkills', 'PreferredPhases']
      };
      
      const fields = listFields[entityType as keyof typeof listFields] || [];
      fields.forEach(field => {
        if (row[field] && typeof row[field] === 'string') {
          const items = row[field].split(',').map((item: string) => item.trim());
          if (items.some(item => !item)) {
            results.push({
              id: `malformed-list-${field}-${index}`,
              type: 'malformed_list',
              severity: 'warning',
              message: `Empty items in ${field} list`,
              entity: entityType as 'client' | 'worker' | 'task',
              entityId: row[entityType === 'clients' ? 'ClientID' : entityType === 'workers' ? 'WorkerID' : 'TaskID'] as string,
              field,
              fixable: true,
              suggestion: 'Remove empty items from the list'
            });
          }
        }
      });
    });
    
    return results;
  },

  // 4. Out-of-range values
  outOfRangeValues: (data: Record<string, unknown>[], entityType: string): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    data.forEach((row, index) => {
      // PriorityLevel (1-5)
      if (entityType === 'clients' && row.PriorityLevel) {
        const priority = parseInt(row.PriorityLevel as string);
        if (isNaN(priority) || priority < 1 || priority > 5) {
          results.push({
            id: `priority-range-${index}`,
            type: 'out_of_range',
            severity: 'error',
            message: `PriorityLevel must be between 1 and 5`,
            entity: 'client',
            entityId: row.ClientID as string,
            field: 'PriorityLevel',
            fixable: true,
            suggestion: 'Set PriorityLevel to a value between 1 and 5'
          });
        }
      }
      
      // Duration (>= 1)
      if (entityType === 'tasks' && row.Duration) {
        const duration = parseInt(row.Duration as string);
        if (isNaN(duration) || duration < 1) {
          results.push({
            id: `duration-range-${index}`,
            type: 'out_of_range',
            severity: 'error',
            message: `Duration must be at least 1`,
            entity: 'task',
            entityId: row.TaskID as string,
            field: 'Duration',
            fixable: true,
            suggestion: 'Set Duration to a value of 1 or greater'
          });
        }
      }
      
      // MaxLoadPerPhase (>= 1)
      if (entityType === 'workers' && row.MaxLoadPerPhase) {
        const load = parseInt(row.MaxLoadPerPhase as string);
        if (isNaN(load) || load < 1) {
          results.push({
            id: `load-range-${index}`,
            type: 'out_of_range',
            severity: 'error',
            message: `MaxLoadPerPhase must be at least 1`,
            entity: 'worker',
            entityId: row.WorkerID as string,
            field: 'MaxLoadPerPhase',
            fixable: true,
            suggestion: 'Set MaxLoadPerPhase to a value of 1 or greater'
          });
        }
      }
    });
    
    return results;
  },

  // 5. Broken JSON
  brokenJSON: (data: Record<string, unknown>[], entityType: string): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    data.forEach((row, index) => {
      if (entityType === 'clients' && row.AttributesJSON) {
        try {
          JSON.parse(row.AttributesJSON as string);
        } catch {
          results.push({
            id: `broken-json-${index}`,
            type: 'broken_json',
            severity: 'error',
            message: `Invalid JSON in AttributesJSON`,
            entity: 'client',
            entityId: row.ClientID as string,
            field: 'AttributesJSON',
            fixable: true,
            suggestion: 'Fix JSON syntax or use {} for empty attributes'
          });
        }
      }
    });
    
    return results;
  },

  // 6. Unknown references
  unknownReferences: (context: ValidationContext): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const taskIds = new Set(context.tasks.map(task => task.TaskID));
    
    context.clients.forEach(client => {
      if (client.RequestedTaskIDs) {
        const requestedTasks = client.RequestedTaskIDs.split(',').map(id => id.trim());
        requestedTasks.forEach(taskId => {
          if (taskId && !taskIds.has(taskId)) {
            results.push({
              id: `unknown-task-${client.ClientID}-${taskId}`,
              type: 'unknown_reference',
              severity: 'error',
              message: `Client requests unknown task: ${taskId}`,
              entity: 'client',
              entityId: client.ClientID,
              field: 'RequestedTaskIDs',
              fixable: true,
              suggestion: `Remove ${taskId} from RequestedTaskIDs or create task ${taskId}`
            });
          }
        });
      }
    });
    
    return results;
  },

  // 7. Skill coverage
  skillCoverage: (context: ValidationContext): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const workerSkills = new Set<string>();
    
    context.workers.forEach(worker => {
      if (worker.Skills) {
        worker.Skills.split(',').forEach(skill => {
          workerSkills.add(skill.trim().toLowerCase());
        });
      }
    });
    
    context.tasks.forEach(task => {
      if (task.RequiredSkills) {
        const requiredSkills = task.RequiredSkills.split(',').map(skill => skill.trim().toLowerCase());
        const missingSkills = requiredSkills.filter(skill => !workerSkills.has(skill));
        
        if (missingSkills.length > 0) {
          results.push({
            id: `missing-skills-${task.TaskID}`,
            type: 'skill_coverage',
            severity: 'error',
            message: `No workers have required skills: ${missingSkills.join(', ')}`,
            entity: 'task',
            entityId: task.TaskID,
            field: 'RequiredSkills',
            fixable: true,
            suggestion: `Add workers with skills: ${missingSkills.join(', ')} or modify task requirements`
          });
        }
      }
    });
    
    return results;
  },

  // 8. Overloaded workers
  overloadedWorkers: (context: ValidationContext): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    context.workers.forEach(worker => {
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots as string);
          if (Array.isArray(slots) && slots.length < worker.MaxLoadPerPhase) {
            results.push({
              id: `overloaded-${worker.WorkerID}`,
              type: 'overloaded_worker',
              severity: 'warning',
              message: `Worker has fewer available slots (${slots.length}) than max load (${worker.MaxLoadPerPhase})`,
              entity: 'worker',
              entityId: worker.WorkerID as string,
              field: 'AvailableSlots',
              fixable: true,
              suggestion: 'Increase AvailableSlots or decrease MaxLoadPerPhase'
            });
          }
        } catch {
          // JSON parsing error handled elsewhere
        }
      }
    });
    
    return results;
  }
};

// AI-enhanced validation function
export async function runAIValidation(context: ValidationContext): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  // Pattern-based validations
  const patterns = [
    {
      name: 'high_priority_low_skills',
      check: () => {
        const highPriorityClients = context.clients.filter(c => c.PriorityLevel >= 4);
        const lowSkillWorkers = context.workers.filter(w => 
          w.Skills.split(',').length < 2
        );
        
        if (highPriorityClients.length > 0 && lowSkillWorkers.length > context.workers.length * 0.5) {
          return {
            severity: 'warning' as const,
            message: 'High priority clients but many low-skill workers',
            suggestion: 'Consider adding more skilled workers or training existing ones'
          };
        }
        return null;
      }
    },
    {
      name: 'task_duration_mismatch',
      check: () => {
        const longTasks = context.tasks.filter(t => t.Duration > 3);
        const shortPhaseWorkers = context.workers.filter(w => {
          try {
            const slots = JSON.parse(w.AvailableSlots as string);
            return Array.isArray(slots) && slots.length < 3;
          } catch {
            return false;
          }
        });
        
        if (longTasks.length > 0 && shortPhaseWorkers.length > 0) {
          return {
            severity: 'warning' as const,
            message: 'Long tasks but workers with limited phase availability',
            suggestion: 'Consider adjusting task durations or worker availability'
          };
        }
        return null;
      }
    }
  ];
  
  patterns.forEach(pattern => {
    const result = pattern.check();
    if (result) {
      results.push({
        id: `ai-${pattern.name}`,
        type: 'ai_pattern',
        severity: result.severity,
        message: result.message,
        entity: 'client',
        suggestion: result.suggestion,
        fixable: false
      });
    }
  });
  
  return results;
}

// Main validation function
export async function validateData(context: ValidationContext): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  // Run core validations
  results.push(...validationRules.missingRequiredColumns(context.clients as unknown as Record<string, unknown>[], 'clients'));
  results.push(...validationRules.missingRequiredColumns(context.workers as unknown as Record<string, unknown>[], 'workers'));
  results.push(...validationRules.missingRequiredColumns(context.tasks as unknown as Record<string, unknown>[], 'tasks'));
  
  results.push(...validationRules.duplicateIDs(context.clients as unknown as Record<string, unknown>[], 'clients'));
  results.push(...validationRules.duplicateIDs(context.workers as unknown as Record<string, unknown>[], 'workers'));
  results.push(...validationRules.duplicateIDs(context.tasks as unknown as Record<string, unknown>[], 'tasks'));
  
  results.push(...validationRules.malformedLists(context.clients as unknown as Record<string, unknown>[], 'clients'));
  results.push(...validationRules.malformedLists(context.workers as unknown as Record<string, unknown>[], 'workers'));
  results.push(...validationRules.malformedLists(context.tasks as unknown as Record<string, unknown>[], 'tasks'));
  
  results.push(...validationRules.outOfRangeValues(context.clients as unknown as Record<string, unknown>[], 'clients'));
  results.push(...validationRules.outOfRangeValues(context.workers as unknown as Record<string, unknown>[], 'workers'));
  results.push(...validationRules.outOfRangeValues(context.tasks as unknown as Record<string, unknown>[], 'tasks'));
  
  results.push(...validationRules.brokenJSON(context.clients as unknown as Record<string, unknown>[], 'clients'));
  
  // Cross-reference validations
  results.push(...validationRules.unknownReferences(context));
  results.push(...validationRules.skillCoverage(context));
  results.push(...validationRules.overloadedWorkers(context));
  
  // AI-enhanced validations
  const aiResults = await runAIValidation(context);
  results.push(...aiResults);
  
  return results;
} 