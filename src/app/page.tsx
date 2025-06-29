'use client';

import { useState } from 'react';
import { Upload, FileText, Users, Briefcase, Settings, Download, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import DataGrid from '@/components/DataGrid';
import ValidationPanel from '@/components/ValidationPanel';
import RulesBuilder from '@/components/RulesBuilder';
import PrioritizationPanel from '@/components/PrioritizationPanel';
import ClientOnly from '@/components/ClientOnly';
import { useDataStore } from '@/store/DataStore';
import { ValidationResult } from '@/types/validation';
import { motion } from 'framer-motion';

export default function DataAlchemist() {
  const [activeTab, setActiveTab] = useState<'upload' | 'data' | 'validation' | 'rules' | 'priorities'>('upload');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get data from store with proper null checks
  const clients = useDataStore(state => state.clients) || [];
  const workers = useDataStore(state => state.workers) || [];
  const tasks = useDataStore(state => state.tasks) || [];
  const businessRules = useDataStore(state => state.businessRules) || [];
  const prioritizationWeights = useDataStore(state => state.prioritizationWeights) || {};

  const tabs = [
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'data', label: 'Data Grid', icon: FileText },
    { id: 'validation', label: 'Validation', icon: AlertCircle },
    { id: 'rules', label: 'Business Rules', icon: Settings },
    { id: 'priorities', label: 'Priorities', icon: Sparkles },
  ];

  const handleValidationComplete = (results: ValidationResult[]) => {
    setValidationResults(results);
    if (results.length === 0) {
      // Auto-advance to next tab if no errors
      if (activeTab === 'upload') setActiveTab('data');
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      // Export cleaned data as separate CSV files
      const exportCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0] || {});
        if (headers.length === 0) return;
        
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      };

      // Export data files
      exportCSV(clients, 'clients-cleaned.csv');
      exportCSV(workers, 'workers-cleaned.csv');
      exportCSV(tasks, 'tasks-cleaned.csv');

      // Export rules and configuration
      const rulesData = {
        timestamp: new Date().toISOString(),
        businessRules: businessRules.filter(rule => rule && rule.enabled),
        prioritizationWeights,
        validationSummary: {
          totalIssues: validationResults.length,
          errors: validationResults.filter(r => r.severity === 'error').length,
          warnings: validationResults.filter(r => r.severity === 'warning').length,
          info: validationResults.filter(r => r.severity === 'info').length,
        },
        dataSummary: {
          clients: clients.length,
          workers: workers.length,
          tasks: tasks.length,
        }
      };

      const rulesBlob = new Blob([JSON.stringify(rulesData, null, 2)], { type: 'application/json' });
      const rulesUrl = URL.createObjectURL(rulesBlob);
      const rulesLink = document.createElement('a');
      rulesLink.href = rulesUrl;
      rulesLink.download = 'business-rules.json';
      rulesLink.click();
      URL.revokeObjectURL(rulesUrl);

      // Create a comprehensive export report
      const exportReport = {
        timestamp: new Date().toISOString(),
        summary: {
          dataFiles: ['clients-cleaned.csv', 'workers-cleaned.csv', 'tasks-cleaned.csv'],
          rulesFile: 'business-rules.json',
          totalRecords: clients.length + workers.length + tasks.length,
          activeRules: businessRules.filter(rule => rule && rule.enabled).length,
        },
        validationResults,
        nextSteps: [
          'Review the cleaned CSV files for accuracy',
          'Use the business-rules.json file in your allocation system',
          'Monitor validation results for any remaining issues',
          'Adjust prioritization weights as needed'
        ]
      };

      const reportBlob = new Blob([JSON.stringify(exportReport, null, 2)], { type: 'application/json' });
      const reportUrl = URL.createObjectURL(reportBlob);
      const reportLink = document.createElement('a');
      reportLink.href = reportUrl;
      reportLink.download = 'export-report.json';
      reportLink.click();
      URL.revokeObjectURL(reportUrl);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasErrors = validationResults.some(r => r.severity === 'error');
  const hasData = clients.length > 0 || workers.length > 0 || tasks.length > 0;

  return (
    <ClientOnly>
      <div
        className="min-h-screen"
        style={{ background: 'rgba(255,255,255,0.85)' }}
      >
        {/* Header (fixed, transparent, blurred) */}
        <motion.header
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          className="fixed top-0 left-0 w-full z-30 flex justify-center bg-transparent shadow-none"
        >
          <div
            className="max-w-2xl w-full mx-auto px-2 sm:px-4 lg:px-6 flex items-center justify-between h-20"
            style={{
              background: 'rgba(255,255,255,0.85)',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(200,200,200,0.18)',
              marginTop: '0.75rem',
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Data Alchemist</h1>
                <span className="text-xs text-gray-600 font-medium">AI-Powered Resource Allocation Configurator</span>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isProcessing || hasErrors || !hasData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              style={{ minWidth: 110 }}
            >
              <Download className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Export'}</span>
            </button>
          </div>
        </motion.header>

        {/* Navigation Tabs (fixed under header) */}
        <motion.nav
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 80, damping: 15 }}
          className="fixed top-24 left-0 w-full z-20 flex justify-center bg-transparent shadow-none"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 60 }}
            className="max-w-2xl w-full mx-auto px-2 sm:px-4 lg:px-6"
            style={{
              background: 'rgba(255,255,255,0.85)',
              borderRadius: '1.5rem',
              boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(200,200,200,0.18)',
            }}
          >
            <div className="flex space-x-2 justify-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const hasErrors = tab.id === 'validation' && validationResults.some(r => r.severity === 'error');
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    whileHover={{ scale: 1.08, backgroundColor: 'rgba(59,130,246,0.08)' }}
                    whileTap={{ scale: 0.97 }}
                    animate={isActive ? { scale: 1.12, backgroundColor: 'rgba(59,130,246,0.18)' } : { scale: 1, backgroundColor: 'rgba(255,255,255,0)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`flex items-center space-x-2 py-3 px-4 font-medium text-sm focus:outline-none transition-all ${
                      isActive
                        ? 'text-blue-700 shadow-md'
                        : 'text-gray-600 hover:text-blue-700'
                    }`}
                    style={{ borderRadius: 12, border: 'none', outline: 'none' }}
                    layout
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {hasErrors && (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.nav>

        {/* Main Content (with top margin for fixed nav) */}
        <motion.main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'tween' }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          style={{ marginTop: '11.5rem' }}
        >
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Data Alchemist
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Upload your CSV or Excel files containing clients, workers, and tasks data. 
                  Our AI will help you clean, validate, and configure your resource allocation system.
                </p>
              </div>
              <FileUpload onValidationComplete={handleValidationComplete} />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Data Grid</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{clients.length} Clients</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{workers.length} Workers</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{tasks.length} Tasks</span>
                  </div>
                </div>
              </div>
              <DataGrid />
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Data Validation</h2>
                <div className="flex items-center space-x-2">
                  {validationResults.length === 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {validationResults.length} issues found
                  </span>
                </div>
              </div>
              <ValidationPanel results={validationResults} />
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Business Rules</h2>
              <RulesBuilder />
            </div>
          )}

          {activeTab === 'priorities' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Prioritization & Weights</h2>
              <PrioritizationPanel />
            </div>
          )}
        </motion.main>
      </div>
    </ClientOnly>
  );
}
