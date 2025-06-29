'use client';

import { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, Sparkles, Wrench } from 'lucide-react';
import { ValidationResult } from '@/types';
import { useDataStore } from '@/store/DataStore';
import { AIParser } from '@/lib/ai-parser';

interface ValidationPanelProps {
  results: ValidationResult[];
}

export default function ValidationPanel({ results }: ValidationPanelProps) {
  const safeResults = useMemo(() => results || [], [results]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [entityFilter, setEntityFilter] = useState<'all' | 'client' | 'worker' | 'task'>('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<unknown[]>([]);

  const updateClient = useDataStore(state => state.updateClient);
  const updateWorker = useDataStore(state => state.updateWorker);
  const updateTask = useDataStore(state => state.updateTask);
  const clients = useDataStore(state => state.clients);
  const workers = useDataStore(state => state.workers);
  const tasks = useDataStore(state => state.tasks);

  const memoizedSafeResults = useMemo(() => safeResults, [safeResults]);
  const filteredResults = useMemo(() => {
    return memoizedSafeResults.filter(result => {
      const severityMatch = filter === 'all' || result.severity === filter;
      const entityMatch = entityFilter === 'all' || result.entity === entityFilter;
      return severityMatch && entityMatch;
    });
  }, [memoizedSafeResults, filter, entityFilter]);

  const summary = useMemo(() => {
    return {
      total: memoizedSafeResults.length,
      errors: memoizedSafeResults.filter(r => r.severity === 'error').length,
      warnings: memoizedSafeResults.filter(r => r.severity === 'warning').length,
      info: memoizedSafeResults.filter(r => r.severity === 'info').length,
      fixable: memoizedSafeResults.filter(r => r.fixable).length,
    };
  }, [memoizedSafeResults]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleGenerateSuggestions = async () => {
    setShowSuggestions(true);
    try {
      const aiParser = AIParser.getInstance();
      const corrections = await aiParser.generateCorrections({
        clients,
        workers,
        tasks,
      });
      setSuggestions(corrections);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    }
  };

  const handleApplySuggestion = (suggestion: unknown) => {
    const s = suggestion as { action: string; data: Record<string, unknown>; id: string };
    // Apply the suggestion to the data
    if (s.action === 'fix_priority') {
      updateClient(s.data.clientId as string, { PriorityLevel: s.data.suggestedValue as number });
    } else if (s.action === 'fix_json') {
      updateClient(s.data.clientId as string, { AttributesJSON: s.data.suggestedValue as string });
    } else if (s.action === 'fix_slots') {
      updateWorker(s.data.workerId as string, { AvailableSlots: s.data.suggestedValue as string });
    } else if (s.action === 'fix_load') {
      updateWorker(s.data.workerId as string, { MaxLoadPerPhase: s.data.suggestedValue as number });
    } else if (s.action === 'fix_duration') {
      updateTask(s.data.taskId as string, { Duration: s.data.suggestedValue as number });
    } else if (s.action === 'fix_concurrent') {
      updateTask(s.data.taskId as string, { MaxConcurrent: s.data.suggestedValue as number });
    }

    // Remove the suggestion from the list
    setSuggestions(prev => prev.filter(sug => (sug as { id: string }).id !== s.id));
  };

  const handleQuickFix = (result: ValidationResult) => {
    if (!result.fixable || !result.suggestion) return;

    // Apply common fixes
    if (result.type === 'out_of_range' && result.field === 'PriorityLevel') {
      const value = parseInt(result.entityId?.split('-')[1] || '3');
      const fixedValue = Math.max(1, Math.min(5, value));
      updateClient(result.entityId!, { PriorityLevel: fixedValue });
    } else if (result.type === 'broken_json' && result.field === 'AttributesJSON') {
      updateClient(result.entityId!, { AttributesJSON: '{}' });
    } else if (result.type === 'malformed_list' && result.field === 'AvailableSlots') {
      updateWorker(result.entityId!, { AvailableSlots: '[1,2,3,4,5]' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-sm text-gray-600">Total Issues</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
          <div className="text-sm text-gray-600">Info</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-green-600">{summary.fixable}</div>
          <div className="text-sm text-gray-600">Fixable</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as unknown as 'all' | 'error' | 'warning' | 'info')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Severities</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="info">Info</option>
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as unknown as 'all' | 'client' | 'worker' | 'task')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Entities</option>
            <option value="client">Clients</option>
            <option value="worker">Workers</option>
            <option value="task">Tasks</option>
          </select>
        </div>
        <button
          onClick={handleGenerateSuggestions}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Suggestions</span>
        </button>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-900">AI-Powered Suggestions</h3>
          </div>
          <div className="space-y-3">
            {suggestions.map((suggestion) => {
              const s = suggestion as { id: string; message: string; confidence: number };
              return (
                <div key={s.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{s.message}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Confidence: {Math.round(s.confidence * 100)}%
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplySuggestion(s)}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation Results */}
      <div className="space-y-3">
        {filteredResults.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">No validation issues found with the current filters.</p>
          </div>
        ) : (
          filteredResults.map((result) => (
            <div
              key={result.id}
              className={`p-4 rounded-lg border ${getSeverityColor(result.severity)}`}
            >
              <div className="flex items-start space-x-3">
                {getSeverityIcon(result.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{result.message}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 capitalize">
                        {result.entity} &bull; {result.type}
                      </span>
                      {result.fixable && (
                        <button
                          onClick={() => handleQuickFix(result)}
                          className="flex items-center space-x-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Fix</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {result.entityId && (
                    <p className="text-sm text-gray-600 mt-1">
                      Entity ID: <span className="font-mono">{result.entityId}</span>
                    </p>
                  )}
                  {result.field && (
                    <p className="text-sm text-gray-600">
                      Field: <span className="font-mono">{result.field}</span>
                    </p>
                  )}
                  {result.suggestion && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Suggestion:</span> {result.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Understanding Validation Results</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium mb-1">Severity Levels:</p>
            <ul className="space-y-1">
              <li>• <span className="text-red-600">Errors:</span> Critical issues that must be fixed</li>
              <li>• <span className="text-yellow-600">Warnings:</span> Issues that should be addressed</li>
              <li>• <span className="text-blue-600">Info:</span> Informational messages</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Quick Actions:</p>
            <ul className="space-y-1">
              <li>&bull; Use filters to focus on specific issues</li>
              <li>&bull; Click &quot;Fix&quot; buttons for one-click corrections</li>
              <li>&bull; Try AI suggestions for automated fixes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 