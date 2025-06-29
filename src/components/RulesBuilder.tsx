'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Settings, Users, FileText, Briefcase, CheckCircle } from 'lucide-react';
import { useDataStore } from '@/store/DataStore';
import { AIParser } from '@/lib/ai-parser';
import { BusinessRule, AISuggestion } from '@/types';

export default function RulesBuilder() {
  const [naturalLanguageRule, setNaturalLanguageRule] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestions, setSuggestions] = useState<unknown[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'natural' | 'ai'>('manual');

  const businessRules = useDataStore(state => state.businessRules) || [];
  const clients = useDataStore(state => state.clients);
  const workers = useDataStore(state => state.workers);
  const tasks = useDataStore(state => state.tasks);
  const addBusinessRule = useDataStore(state => state.addBusinessRule);
  const removeBusinessRule = useDataStore(state => state.removeBusinessRule);
  const updateBusinessRule = useDataStore(state => state.updateBusinessRule);

  useEffect(() => {
    const generateRuleSuggestions = async () => {
      try {
        const aiParser = AIParser.getInstance();
        const recommendations = await aiParser.generateRuleRecommendations({
          clients,
          workers,
          tasks,
        });
        setSuggestions(recommendations);
      } catch (error) {
        console.error('Failed to generate rule suggestions:', error);
      }
    };
    generateRuleSuggestions();
  }, [clients, workers, tasks]);

  const handleNaturalLanguageRule = async () => {
    if (!naturalLanguageRule.trim()) return;

    setIsProcessing(true);
    try {
      const aiParser = AIParser.getInstance();
      const rule = await aiParser.parseRuleFromText();

      if (rule) {
        addBusinessRule(rule);
        setNaturalLanguageRule('');
      } else {
        alert('Could not parse the rule. Please try a different format.');
      }
    } catch (error) {
      console.error('Failed to parse rule:', error);
      alert('Failed to parse the rule. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddManualRule = () => {
    const newRule: BusinessRule = {
      id: `rule-${Date.now()}`,
      type: 'coRun',
      enabled: true,
      description: 'New business rule',
      parameters: {},
    };
    addBusinessRule(newRule);
  };

  const handleDeleteRule = (id: string) => {
    removeBusinessRule(id);
  };

  const handleToggleRule = (id: string, enabled: boolean) => {
    updateBusinessRule(id, { enabled });
  };

  const handleApplySuggestion = (suggestion: unknown) => {
    const s = suggestion as AISuggestion;
    // Apply the suggestion to the data
    if (s.action === 'add_co_run_rule') {
      const rule: BusinessRule = {
        id: `co-run-${Date.now()}`,
        type: 'coRun',
        enabled: true,
        description: s.message,
        parameters: { tasks: (s.data as { tasks: string[] }).tasks },
      };
      addBusinessRule(rule);
    } else if (s.action === 'add_load_limit_rule') {
      const rule: BusinessRule = {
        id: `load-limit-${Date.now()}`,
        type: 'loadLimit',
        enabled: true,
        description: s.message,
        parameters: {
          group: (s.data as { group: string }).group,
          maxLoad: (s.data as { suggestedLimit: number }).suggestedLimit,
        },
      };
      addBusinessRule(rule);
    }

    // Remove the suggestion
    setSuggestions(prev => prev.filter(sug => (sug as AISuggestion).id !== s.id));
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'coRun': return <FileText className="w-4 h-4" />;
      case 'slotRestriction': return <Users className="w-4 h-4" />;
      case 'loadLimit': return <Briefcase className="w-4 h-4" />;
      case 'phaseWindow': return <Settings className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'coRun': return 'Co-run';
      case 'slotRestriction': return 'Slot Restriction';
      case 'loadLimit': return 'Load Limit';
      case 'phaseWindow': return 'Phase Window';
      case 'patternMatch': return 'Pattern Match';
      case 'precedenceOverride': return 'Precedence Override';
      default: return type;
    }
  };

  const getRuleParameters = (rule: BusinessRule) => {
    switch (rule.type) {
      case 'coRun':
        return `Tasks: ${Array.isArray(rule.parameters.tasks) ? rule.parameters.tasks.join(', ') : 'None'}`;
      case 'slotRestriction':
        return `Group: ${rule.parameters.group || 'None'}, Max Slots: ${rule.parameters.maxSlots || 'None'}`;
      case 'loadLimit':
        return `Group: ${rule.parameters.group || 'None'}, Max Load: ${rule.parameters.maxLoad || 'None'}`;
      case 'phaseWindow':
        return `Task: ${rule.parameters.taskId || 'None'}, Phases: ${Array.isArray(rule.parameters.phases) ? rule.parameters.phases.join('-') : 'None'}`;
      default:
        return JSON.stringify(rule.parameters);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'manual', label: 'Manual Rules', icon: Settings },
          { id: 'natural', label: 'Natural Language', icon: Sparkles },
          { id: 'ai', label: 'AI Suggestions', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as unknown as 'manual' | 'natural' | 'ai')}
              className={`flex items-center space-x-2 flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Manual Rules Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Business Rules</h3>
            <button
              onClick={handleAddManualRule}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="space-y-3">
            {businessRules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No business rules defined yet.</p>
                <p className="text-sm">Add rules to control resource allocation behavior.</p>
              </div>
            ) : (
              businessRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                        className="rounded"
                      />
                      {getRuleIcon(rule.type)}
                      <span className="font-medium text-gray-900">
                        {getRuleTypeLabel(rule.type)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {rule.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getRuleParameters(rule)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Natural Language Tab */}
      {activeTab === 'natural' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Natural Language Rule Creation</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Describe your business rules in plain English. Our AI will convert them into proper rule configurations.
            </p>
            <div className="space-y-4">
              <textarea
                value={naturalLanguageRule}
                onChange={(e) => setNaturalLanguageRule(e.target.value)}
                placeholder={`Examples:
• Tasks T12 and T14 must run together
• Limit sales workers to 3 slots per phase
• Task T15 can only run in phases 1-3
• Premium clients get priority 5`}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleNaturalLanguageRule}
                disabled={isProcessing || !naturalLanguageRule.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'Processing...' : 'Create Rule'}</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Supported Rule Types</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium mb-1">Co-run Rules:</p>
                <p>&quot;Tasks T12 and T14 must run together&quot;</p>
              </div>
              <div>
                <p className="font-medium mb-1">Slot Restrictions:</p>
                <p>&quot;Limit sales workers to 3 slots per phase&quot;</p>
              </div>
              <div>
                <p className="font-medium mb-1">Phase Windows:</p>
                <p>&quot;Task T15 can only run in phases 1-3&quot;</p>
              </div>
              <div>
                <p className="font-medium mb-1">Load Limits:</p>
                <p>&quot;Limit developers to 2 tasks per phase&quot;</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">AI Rule Recommendations</h3>
            </div>
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showSuggestions ? 'Hide' : 'Show'} Suggestions
            </button>
          </div>

          {showSuggestions && (
            <div className="space-y-3">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No rule suggestions available.</p>
                  <p className="text-sm">AI will analyze your data and suggest rules when patterns are detected.</p>
                </div>
              ) : (
                suggestions.map((suggestion) => {
                  const s = suggestion as AISuggestion;
                  return (
                    <div
                      key={s.id}
                      className="bg-white p-4 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-900">{s.message}</span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">{s.type}</div>
                          <div className="text-xs text-gray-500">Confidence: {s.confidence}</div>
                        </div>
                        <button
                          onClick={() => handleApplySuggestion(s)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">How AI Suggestions Work</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <li>&bull; Use filters to focus on specific issues</li>
              <li>&bull; Click &quot;Fix&quot; buttons for one-click corrections</li>
              <li>&bull; Try AI suggestions for automated fixes</li>
            </div>
          </div>
        </div>
      )}

      {/* Rules Summary */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-medium text-gray-900 mb-3">Rules Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{businessRules.length}</div>
            <div className="text-gray-600">Total Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {businessRules.filter(r => r.enabled).length}
            </div>
            <div className="text-gray-600">Active Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {businessRules.filter(r => r.type === 'coRun').length}
            </div>
            <div className="text-gray-600">Co-run Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {businessRules.filter(r => r.type === 'loadLimit').length}
            </div>
            <div className="text-gray-600">Load Limits</div>
          </div>
        </div>
      </div>
    </div>
  );
} 