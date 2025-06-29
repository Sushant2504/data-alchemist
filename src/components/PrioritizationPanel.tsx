'use client';

import { useState } from 'react';
import { Sliders, Target, Users, Zap, DollarSign, Clock, Sparkles } from 'lucide-react';
import { useDataStore } from '@/store/DataStore';
import { PrioritizationWeights } from '@/types';
import { defaultPrioritizationWeights } from '@/store/DataStore';

const PRESET_PROFILES = {
  maximizeFulfillment: {
    name: 'Maximize Fulfillment',
    description: 'Complete as many tasks as possible',
    icon: Target,
    weights: {
      priorityLevel: 80,
      taskFulfillment: 100,
      fairness: 30,
      costOptimization: 20,
      speedOptimization: 60,
      skillUtilization: 70,
    },
  },
  fairDistribution: {
    name: 'Fair Distribution',
    description: 'Ensure fair workload distribution',
    icon: Users,
    weights: {
      priorityLevel: 60,
      taskFulfillment: 70,
      fairness: 100,
      costOptimization: 40,
      speedOptimization: 50,
      skillUtilization: 60,
    },
  },
  minimizeWorkload: {
    name: 'Minimize Workload',
    description: 'Reduce overall workload and stress',
    icon: Sliders,
    weights: {
      priorityLevel: 40,
      taskFulfillment: 50,
      fairness: 80,
      costOptimization: 60,
      speedOptimization: 30,
      skillUtilization: 40,
    },
  },
  costOptimized: {
    name: 'Cost Optimized',
    description: 'Minimize costs while maintaining quality',
    icon: DollarSign,
    weights: {
      priorityLevel: 50,
      taskFulfillment: 60,
      fairness: 40,
      costOptimization: 100,
      speedOptimization: 40,
      skillUtilization: 50,
    },
  },
  speedOptimized: {
    name: 'Speed Optimized',
    description: 'Complete tasks as quickly as possible',
    icon: Clock,
    weights: {
      priorityLevel: 70,
      taskFulfillment: 80,
      fairness: 30,
      costOptimization: 30,
      speedOptimization: 100,
      skillUtilization: 60,
    },
  },
};

export default function PrioritizationPanel() {
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [showCustomWeights, setShowCustomWeights] = useState(false);

  const weights = useDataStore(state => state.prioritizationWeights) || defaultPrioritizationWeights;
  const setPrioritizationWeights = useDataStore(state => state.setPrioritizationWeights);

  const handleWeightChange = (key: keyof PrioritizationWeights, value: number) => {
    setPrioritizationWeights({
      ...weights,
      [key]: value,
    });
    setActiveProfile(null); // Clear preset when manually adjusting
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESET_PROFILES[presetKey as keyof typeof PRESET_PROFILES];
    if (preset) {
      setPrioritizationWeights(preset.weights);
      setActiveProfile(presetKey as unknown as string);
    }
  };

  const getWeightLabel = (key: string) => {
    switch (key) {
      case 'priorityLevel': return 'Priority Level';
      case 'taskFulfillment': return 'Task Fulfillment';
      case 'fairness': return 'Fairness';
      case 'costOptimization': return 'Cost Optimization';
      case 'speedOptimization': return 'Speed Optimization';
      case 'skillUtilization': return 'Skill Utilization';
      default: return key;
    }
  };

  const getWeightDescription = (key: string) => {
    switch (key) {
      case 'priorityLevel': return 'How much to prioritize high-priority clients';
      case 'taskFulfillment': return 'How much to focus on completing all requested tasks';
      case 'fairness': return 'How much to ensure fair workload distribution';
      case 'costOptimization': return 'How much to minimize costs';
      case 'speedOptimization': return 'How much to prioritize fast completion';
      case 'skillUtilization': return 'How much to optimize skill matching';
      default: return '';
    }
  };

  const getWeightIcon = (key: string) => {
    switch (key) {
      case 'priorityLevel': return <Target className="w-4 h-4" />;
      case 'taskFulfillment': return <Zap className="w-4 h-4" />;
      case 'fairness': return <Users className="w-4 h-4" />;
      case 'costOptimization': return <DollarSign className="w-4 h-4" />;
      case 'speedOptimization': return <Clock className="w-4 h-4" />;
      case 'skillUtilization': return <Sparkles className="w-4 h-4" />;
      default: return <Sliders className="w-4 h-4" />;
    }
  };

  const getWeightColor = (key: string) => {
    switch (key) {
      case 'priorityLevel': return 'from-red-500 to-red-600';
      case 'taskFulfillment': return 'from-blue-500 to-blue-600';
      case 'fairness': return 'from-green-500 to-green-600';
      case 'costOptimization': return 'from-yellow-500 to-yellow-600';
      case 'speedOptimization': return 'from-purple-500 to-purple-600';
      case 'skillUtilization': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Profiles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Optimization Profiles</h3>
          <button
            onClick={() => setShowCustomWeights(!showCustomWeights)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showCustomWeights ? 'Hide' : 'Show'} Custom Weights
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(PRESET_PROFILES).map(([key, profile]) => {
            const Icon = profile.icon;
            const isActive = activeProfile === key;
            const isCurrentProfile = JSON.stringify(profile.weights) === JSON.stringify(weights);

            return (
              <button
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isActive || isCurrentProfile
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">{profile.name}</span>
                  {isCurrentProfile && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Active</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{profile.description}</p>
                <div className="mt-3 flex space-x-2">
                  {Object.entries(profile.weights).slice(0, 3).map(([weightKey, value]) => (
                    <div key={weightKey} className="text-xs">
                      <div className="font-medium text-gray-700">{getWeightLabel(weightKey)}</div>
                      <div className="text-gray-500">{value}%</div>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Weights */}
      {showCustomWeights && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Sliders className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Custom Weights</h3>
          </div>

          <div className="space-y-6">
            {Object.entries(weights).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getWeightIcon(key)}
                    <span className="font-medium text-gray-900">{getWeightLabel(key)}</span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">{value}%</span>
                </div>
                <p className="text-sm text-gray-600">{getWeightDescription(key)}</p>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleWeightChange(key as keyof PrioritizationWeights, parseInt(e.target.value))}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r ${getWeightColor(key)}`}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weight Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Current Optimization Strategy</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="bg-white p-3 rounded-lg border">
              <div className="flex items-center space-x-2 mb-1">
                {getWeightIcon(key)}
                <span className="text-sm font-medium text-gray-900">{getWeightLabel(key)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${getWeightColor(key)}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-gray-600">{value}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-2">Strategy Summary</h4>
          <p className="text-sm text-gray-600">
            This configuration prioritizes{' '}
            {Object.entries(weights)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 2)
              .map(([key]) => getWeightLabel(key).toLowerCase())
              .join(' and ')}{' '}
            while balancing other factors for optimal resource allocation.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">How Prioritization Works</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium mb-1">Preset Profiles:</p>
            <ul className="space-y-1">
              <li>• Choose from optimized configurations</li>
              <li>• Each profile balances different objectives</li>
              <li>• Profiles can be customized further</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Custom Weights:</p>
            <ul className="space-y-1">
              <li>• Fine-tune each optimization factor</li>
              <li>• Higher percentages = higher priority</li>
              <li>• Weights influence allocation decisions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 