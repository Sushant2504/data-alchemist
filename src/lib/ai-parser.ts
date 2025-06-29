import { Client, Worker, Task, BusinessRule, AISuggestion } from '@/types';

// Mock AI service - in a real implementation, this would use OpenAI API
export class AIParser {
  private static instance: AIParser;
  
  static getInstance(): AIParser {
    if (!AIParser.instance) {
      AIParser.instance = new AIParser();
    }
    return AIParser.instance;
  }

  // Natural language search
  async searchData(query: string, data: { clients: Client[], workers: Worker[], tasks: Task[] }): Promise<any[]> {
    const normalizedQuery = query.toLowerCase();
    const results: any[] = [];
    
    // Search in clients
    data.clients.forEach(client => {
      if (this.matchesQuery(client, normalizedQuery)) {
        results.push({ ...client, entityType: 'client' });
      }
    });
    
    // Search in workers
    data.workers.forEach(worker => {
      if (this.matchesQuery(worker, normalizedQuery)) {
        results.push({ ...worker, entityType: 'worker' });
      }
    });
    
    // Search in tasks
    data.tasks.forEach(task => {
      if (this.matchesQuery(task, normalizedQuery)) {
        results.push({ ...task, entityType: 'task' });
      }
    });
    
    return results;
  }

  private matchesQuery(item: any, query: string): boolean {
    const itemString = JSON.stringify(item).toLowerCase();
    
    // Duration queries
    if (query.includes('duration') && query.includes('more than')) {
      const match = query.match(/more than (\d+)/);
      if (match && item.Duration) {
        return parseInt(item.Duration) > parseInt(match[1]);
      }
    }
    
    // Phase queries
    if (query.includes('phase') && item.PreferredPhases) {
      const phases = item.PreferredPhases.toLowerCase();
      if (query.includes('phase 2') && phases.includes('2')) {
        return true;
      }
    }
    
    // Priority queries
    if (query.includes('priority') && item.PriorityLevel) {
      const match = query.match(/priority (\d+)/);
      if (match) {
        return parseInt(item.PriorityLevel) === parseInt(match[1]);
      }
    }
    
    // Skill queries
    if (query.includes('skill') && (item.Skills || item.RequiredSkills)) {
      const skills = (item.Skills || item.RequiredSkills || '').toLowerCase();
      if (query.includes('javascript') && skills.includes('javascript')) {
        return true;
      }
    }
    
    // General text search
    return itemString.includes(query);
  }

  // Natural language to business rule converter
  async parseRuleFromText(text: string, data: { clients: Client[], workers: Worker[], tasks: Task[] }): Promise<BusinessRule | null> {
    const normalizedText = text.toLowerCase();
    
    // Co-run rules
    if (normalizedText.includes('run together') || normalizedText.includes('must run')) {
      const taskMatches = normalizedText.match(/t(\d+)/g);
      if (taskMatches && taskMatches.length >= 2) {
        const taskIds = taskMatches.map(match => match.toUpperCase());
        return {
          id: `co-run-${Date.now()}`,
          type: 'coRun',
          enabled: true,
          description: text,
          parameters: { tasks: taskIds }
        };
      }
    }
    
    // Slot restriction rules
    if (normalizedText.includes('limit') && normalizedText.includes('slots')) {
      const groupMatch = normalizedText.match(/(\w+) workers/);
      const slotMatch = normalizedText.match(/(\d+) slots/);
      
      if (groupMatch && slotMatch) {
        return {
          id: `slot-restriction-${Date.now()}`,
          type: 'slotRestriction',
          enabled: true,
          description: text,
          parameters: {
            group: groupMatch[1],
            maxSlots: parseInt(slotMatch[1])
          }
        };
      }
    }
    
    // Phase window rules
    if (normalizedText.includes('only run') && normalizedText.includes('phase')) {
      const taskMatch = normalizedText.match(/t(\d+)/);
      const phaseMatch = normalizedText.match(/phases? (\d+)-(\d+)/);
      
      if (taskMatch && phaseMatch) {
        return {
          id: `phase-window-${Date.now()}`,
          type: 'phaseWindow',
          enabled: true,
          description: text,
          parameters: {
            taskId: taskMatch[0].toUpperCase(),
            phases: [parseInt(phaseMatch[1]), parseInt(phaseMatch[2])]
          }
        };
      }
    }
    
    // Load limit rules
    if (normalizedText.includes('load') && normalizedText.includes('limit')) {
      const groupMatch = normalizedText.match(/(\w+) workers/);
      const loadMatch = normalizedText.match(/(\d+) per phase/);
      
      if (groupMatch && loadMatch) {
        return {
          id: `load-limit-${Date.now()}`,
          type: 'loadLimit',
          enabled: true,
          description: text,
          parameters: {
            group: groupMatch[1],
            maxLoad: parseInt(loadMatch[1])
          }
        };
      }
    }
    
    return null;
  }

  // AI-powered data corrections
  async generateCorrections(data: { clients: Client[], workers: Worker[], tasks: Task[] }): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    
    // Check for common patterns and suggest fixes
    data.clients.forEach(client => {
      // Fix priority levels
      if (client.PriorityLevel && (client.PriorityLevel < 1 || client.PriorityLevel > 5)) {
        suggestions.push({
          id: `fix-priority-${client.ClientID}`,
          type: 'correction',
          message: `Fix PriorityLevel for ${client.ClientName}`,
          confidence: 0.9,
          action: 'fix_priority',
          data: { clientId: client.ClientID, suggestedValue: Math.max(1, Math.min(5, client.PriorityLevel)) }
        });
      }
      
      // Fix JSON attributes
      if (client.AttributesJSON && client.AttributesJSON !== '{}') {
        try {
          JSON.parse(client.AttributesJSON);
        } catch {
          suggestions.push({
            id: `fix-json-${client.ClientID}`,
            type: 'correction',
            message: `Fix JSON syntax for ${client.ClientName}`,
            confidence: 0.8,
            action: 'fix_json',
            data: { clientId: client.ClientID, suggestedValue: '{}' }
          });
        }
      }
    });
    
    data.workers.forEach(worker => {
      // Fix AvailableSlots format
      if (worker.AvailableSlots) {
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          if (!Array.isArray(slots)) {
            suggestions.push({
              id: `fix-slots-${worker.WorkerID}`,
              type: 'correction',
              message: `Fix AvailableSlots format for ${worker.WorkerName}`,
              confidence: 0.9,
              action: 'fix_slots',
              data: { workerId: worker.WorkerID, suggestedValue: '[1,2,3,4,5]' }
            });
          }
        } catch {
          suggestions.push({
            id: `fix-slots-${worker.WorkerID}`,
            type: 'correction',
            message: `Fix AvailableSlots JSON for ${worker.WorkerName}`,
            confidence: 0.9,
            action: 'fix_slots',
            data: { workerId: worker.WorkerID, suggestedValue: '[1,2,3,4,5]' }
          });
        }
      }
      
      // Fix MaxLoadPerPhase
      if (worker.MaxLoadPerPhase && worker.MaxLoadPerPhase < 1) {
        suggestions.push({
          id: `fix-load-${worker.WorkerID}`,
          type: 'correction',
          message: `Fix MaxLoadPerPhase for ${worker.WorkerName}`,
          confidence: 0.9,
          action: 'fix_load',
          data: { workerId: worker.WorkerID, suggestedValue: 1 }
        });
      }
    });
    
    data.tasks.forEach(task => {
      // Fix Duration
      if (task.Duration && task.Duration < 1) {
        suggestions.push({
          id: `fix-duration-${task.TaskID}`,
          type: 'correction',
          message: `Fix Duration for ${task.TaskName}`,
          confidence: 0.9,
          action: 'fix_duration',
          data: { taskId: task.TaskID, suggestedValue: 1 }
        });
      }
      
      // Fix MaxConcurrent
      if (task.MaxConcurrent && task.MaxConcurrent < 1) {
        suggestions.push({
          id: `fix-concurrent-${task.TaskID}`,
          type: 'correction',
          message: `Fix MaxConcurrent for ${task.TaskName}`,
          confidence: 0.9,
          action: 'fix_concurrent',
          data: { taskId: task.TaskID, suggestedValue: 1 }
        });
      }
    });
    
    return suggestions;
  }

  // AI rule recommendations
  async generateRuleRecommendations(data: { clients: Client[], workers: Worker[], tasks: Task[] }): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];
    const clients = data.clients || [];
    const workers = data.workers || [];
    const tasks = data.tasks || [];
    
    // Check for patterns that suggest co-run rules
    const taskGroups = new Map<string, string[]>();
    clients.forEach(client => {
      if (client.RequestedTaskIDs) {
        const tasks = client.RequestedTaskIDs.split(',').map(t => t.trim());
        tasks.forEach(task => {
          if (!taskGroups.has(task)) {
            taskGroups.set(task, []);
          }
          taskGroups.get(task)!.push(client.ClientID);
        });
      }
    });
    
    // Find tasks that are frequently requested together
    const taskPairs = new Map<string, number>();
    clients.forEach(client => {
      if (client.RequestedTaskIDs) {
        const tasks = client.RequestedTaskIDs.split(',').map(t => t.trim()).filter(Boolean);
        for (let i = 0; i < tasks.length; i++) {
          for (let j = i + 1; j < tasks.length; j++) {
            const pair = [tasks[i], tasks[j]].sort().join('-');
            taskPairs.set(pair, (taskPairs.get(pair) || 0) + 1);
          }
        }
      }
    });
    
    // Suggest co-run rules for frequently paired tasks
    taskPairs.forEach((count, pair) => {
      if (count >= 2) {
        const [task1, task2] = pair.split('-');
        suggestions.push({
          id: `co-run-rec-${task1}-${task2}`,
          type: 'rule',
          message: `Tasks ${task1} and ${task2} are frequently requested together. Consider adding a co-run rule.`,
          confidence: 0.7,
          action: 'add_co_run_rule',
          data: { tasks: [task1, task2] }
        });
      }
    });
    
    // Check for overloaded worker groups
    const groupLoads = new Map<string, { totalSlots: number, maxLoad: number }>();
    workers.forEach(worker => {
      if (worker.WorkerGroup) {
        const current = groupLoads.get(worker.WorkerGroup) || { totalSlots: 0, maxLoad: 0 };
        try {
          const slots = JSON.parse(worker.AvailableSlots);
          current.totalSlots += Array.isArray(slots) ? slots.length : 0;
        } catch {}
        current.maxLoad += worker.MaxLoadPerPhase || 0;
        groupLoads.set(worker.WorkerGroup, current);
      }
    });
    
    // Suggest load limits for overloaded groups
    groupLoads.forEach((load, group) => {
      if (load.maxLoad > load.totalSlots * 2) {
        suggestions.push({
          id: `load-limit-rec-${group}`,
          type: 'rule',
          message: `${group} workers are overloaded. Consider adding a load limit rule.`,
          confidence: 0.8,
          action: 'add_load_limit_rule',
          data: { group, suggestedLimit: Math.floor(load.totalSlots * 1.5) }
        });
      }
    });
    
    return suggestions;
  }
} 