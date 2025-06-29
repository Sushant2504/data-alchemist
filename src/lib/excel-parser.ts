import * as XLSX from 'xlsx';
import { Client, Worker, Task } from '@/types';

export interface ParsedFile {
  data: any[];
  headers: string[];
  fileName: string;
  fileType: 'csv' | 'xlsx';
}

export interface HeaderMapping {
  originalHeader: string;
  mappedHeader: string;
  confidence: number;
}

// Expected headers for each entity type
const EXPECTED_HEADERS = {
  clients: ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'],
  workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'],
  tasks: ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent']
};

// AI-powered header mapping function
export function mapHeaders(headers: string[], entityType: 'clients' | 'workers' | 'tasks'): HeaderMapping[] {
  const expectedHeaders = EXPECTED_HEADERS[entityType];
  const mappings: HeaderMapping[] = [];
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Find the best match
    let bestMatch = '';
    let bestScore = 0;
    
    expectedHeaders.forEach(expected => {
      const normalizedExpected = expected.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Exact match
      if (normalizedHeader === normalizedExpected) {
        bestMatch = expected;
        bestScore = 1.0;
        return;
      }
      
      // Partial match
      if (normalizedHeader.includes(normalizedExpected) || normalizedExpected.includes(normalizedHeader)) {
        const score = Math.min(normalizedHeader.length, normalizedExpected.length) / 
                     Math.max(normalizedHeader.length, normalizedExpected.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = expected;
        }
      }
      
      // Common variations
      const variations: Record<string, string[]> = {
        'ClientID': ['clientid', 'client_id', 'id', 'client'],
        'ClientName': ['clientname', 'client_name', 'name', 'clientname'],
        'PriorityLevel': ['prioritylevel', 'priority_level', 'priority', 'level'],
        'RequestedTaskIDs': ['requestedtaskids', 'requested_task_ids', 'tasks', 'taskids'],
        'GroupTag': ['grouptag', 'group_tag', 'group', 'tag'],
        'AttributesJSON': ['attributesjson', 'attributes_json', 'attributes', 'json'],
        'WorkerID': ['workerid', 'worker_id', 'id', 'worker'],
        'WorkerName': ['workername', 'worker_name', 'name', 'workername'],
        'Skills': ['skills', 'skill', 'capabilities'],
        'AvailableSlots': ['availableslots', 'available_slots', 'slots', 'availability'],
        'MaxLoadPerPhase': ['maxloadperphase', 'max_load_per_phase', 'maxload', 'load'],
        'WorkerGroup': ['workergroup', 'worker_group', 'group'],
        'QualificationLevel': ['qualificationlevel', 'qualification_level', 'qualification', 'level'],
        'TaskID': ['taskid', 'task_id', 'id', 'task'],
        'TaskName': ['taskname', 'task_name', 'name', 'taskname'],
        'Category': ['category', 'cat', 'type'],
        'Duration': ['duration', 'time', 'length'],
        'RequiredSkills': ['requiredskills', 'required_skills', 'skills', 'requirements'],
        'PreferredPhases': ['preferredphases', 'preferred_phases', 'phases', 'preference'],
        'MaxConcurrent': ['maxconcurrent', 'max_concurrent', 'concurrent', 'parallel']
      };
      
      if (variations[expected]) {
        variations[expected].forEach(variation => {
          if (normalizedHeader === variation) {
            bestMatch = expected;
            bestScore = 0.9;
          }
        });
      }
    });
    
    if (bestMatch && bestScore > 0.3) {
      mappings.push({
        originalHeader: header,
        mappedHeader: bestMatch,
        confidence: bestScore
      });
    }
  });
  
  return mappings;
}

export function parseExcelFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('File is empty'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Convert rows to objects
        const dataObjects = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve({
          data: dataObjects,
          headers,
          fileName: file.name,
          fileType: file.name.endsWith('.csv') ? 'csv' : 'xlsx'
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseCSVFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('File is empty'));
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataObjects = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
        
        resolve({
          data: dataObjects,
          headers,
          fileName: file.name,
          fileType: 'csv'
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function detectEntityType(headers: string[]): 'clients' | 'workers' | 'tasks' | 'unknown' {
  const headerString = headers.join(' ').toLowerCase();
  
  if (headerString.includes('client') || headerString.includes('priority')) {
    return 'clients';
  }
  
  if (headerString.includes('worker') || headerString.includes('skill')) {
    return 'workers';
  }
  
  if (headerString.includes('task') || headerString.includes('duration')) {
    return 'tasks';
  }
  
  return 'unknown';
}

export function transformData(data: any[], entityType: 'clients' | 'workers' | 'tasks'): any[] {
  const mappings = mapHeaders(Object.keys(data[0] || {}), entityType);
  
  return data.map(row => {
    const transformed: any = {};
    
    mappings.forEach(mapping => {
      if (mapping.confidence > 0.5) {
        transformed[mapping.mappedHeader] = row[mapping.originalHeader];
      }
    });
    
    // Fill missing fields with defaults
    const expectedHeaders = EXPECTED_HEADERS[entityType];
    expectedHeaders.forEach(header => {
      if (!(header in transformed)) {
        transformed[header] = '';
      }
    });
    
    return transformed;
  });
} 