'use client';

import { useState, useMemo } from 'react';
import { Search, Edit3, Save, X, Sparkles, Filter } from 'lucide-react';
import { DataGrid as ReactDataGrid, Column } from 'react-data-grid';
import { useDataStore } from '@/store/DataStore';
import { AIParser } from '@/lib/ai-parser';

type EntityType = 'clients' | 'workers' | 'tasks';

type DataGridProps = Record<string, never>;

export default function DataGrid({}: DataGridProps) {
  const [activeTab, setActiveTab] = useState<EntityType>('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<unknown[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const clients = useDataStore(state => state.clients);
  const workers = useDataStore(state => state.workers);
  const tasks = useDataStore(state => state.tasks);
  const validationResults = useDataStore(state => state.validationResults);
  const updateClient = useDataStore(state => state.updateClient);
  const updateWorker = useDataStore(state => state.updateWorker);
  const updateTask = useDataStore(state => state.updateTask);

  const getData = () => {
    switch (activeTab) {
      case 'clients': return clients || [];
      case 'workers': return workers || [];
      case 'tasks': return tasks || [];
      default: return [];
    }
  };

  const getColumns = (): Column<unknown>[] => {
    const baseColumns = [
      {
        key: 'actions',
        name: 'Actions',
        width: 80,
        renderCell: ({ rowIdx }: { rowIdx: number }) => (
          <div className="flex space-x-1">
            <button
              onClick={() => handleEdit(rowIdx)}
              className="p-1 text-blue-600 hover:text-blue-800"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ];

    const data = getData();
    if (data.length === 0) return baseColumns;

    const firstRow = data[0];
    const dataColumns = Object.keys(firstRow).map(key => ({
      key,
      name: key,
      width: 150,
      renderCell: ({ rowIdx, column }: { rowIdx: number; column: Column<unknown> }) => {
        const row = data[rowIdx];
        const value = ((row as unknown) as Record<string, unknown>)[column.key];
        const hasError = validationResults.some(
          v => v.entity === activeTab.slice(0, -1) && 
               v.entityId === ((row as unknown) as Record<string, unknown>)[activeTab === 'clients' ? 'ClientID' : activeTab === 'workers' ? 'WorkerID' : 'TaskID'] &&
               v.field === column.key
        );

        if (editingCell?.rowIndex === rowIdx && editingCell?.columnKey === column.key) {
          return (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded"
                autoFocus
              />
              <button
                onClick={() => handleSave(rowIdx, column.key)}
                className="p-1 text-green-600 hover:text-green-800"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCancel()}
                className="p-1 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }

        return (
          <div className={`px-2 py-1 ${hasError ? 'bg-red-50 border border-red-200' : ''}`}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
          </div>
        );
      },
    }));

    return [...baseColumns, ...dataColumns];
  };

  const handleEdit = (rowIndex: number, columnKey?: string) => {
    const data = getData();
    const row = data[rowIndex];
    const key = columnKey || Object.keys(row)[0];
    setEditingCell({ rowIndex, columnKey: key });
    setEditValue(String(((row as unknown) as Record<string, unknown>)[key] || ''));
  };

  const handleSave = (rowIndex: number, columnKey: string) => {
    const data = getData();
    const row = data[rowIndex];
    const id = ((row as unknown) as Record<string, unknown>)[activeTab === 'clients' ? 'ClientID' : activeTab === 'workers' ? 'WorkerID' : 'TaskID'];
    
    // Update data in store
    if (activeTab === 'clients') {
      updateClient(id as string, { [columnKey]: editValue });
    } else if (activeTab === 'workers') {
      updateWorker(id as string, { [columnKey]: editValue });
    } else if (activeTab === 'tasks') {
      updateTask(id as string, { [columnKey]: editValue });
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleNaturalLanguageSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const aiParser = AIParser.getInstance();
      const results = await aiParser.searchData(searchQuery, { clients, workers, tasks });
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredData = useMemo(() => {
    const data = getData();
    if (!searchQuery.trim()) return data;

    return data.filter(row => {
      const searchLower = searchQuery.toLowerCase();
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery, clients, workers, tasks, activeTab, getData]);

  const getValidationSummary = () => {
    const entityType = activeTab.slice(0, -1) as 'client' | 'worker' | 'task';
    const safeValidationResults = validationResults || [];
    const entityResults = safeValidationResults.filter(v => v.entity === entityType);
    
    return {
      total: entityResults.length,
      errors: entityResults.filter(r => r.severity === 'error').length,
      warnings: entityResults.filter(r => r.severity === 'warning').length,
      info: entityResults.filter(r => r.severity === 'info').length,
    };
  };

  const validationSummary = getValidationSummary();

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {(['clients', 'workers', 'tasks'] as EntityType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({getData().length})
          </button>
        ))}
      </div>

      {/* Search and AI Features */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search data or use natural language (e.g., 'tasks with duration more than 3')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>
        <button
          onClick={handleNaturalLanguageSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSearching ? 'Searching...' : 'AI Search'}</span>
        </button>
      </div>

      {/* Validation Summary */}
      {validationSummary.total > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Validation Issues</span>
            </div>
            <div className="flex space-x-4 text-sm">
              {validationSummary.errors > 0 && (
                <span className="text-red-600">{validationSummary.errors} errors</span>
              )}
              {validationSummary.warnings > 0 && (
                <span className="text-yellow-600">{validationSummary.warnings} warnings</span>
              )}
              {validationSummary.info > 0 && (
                <span className="text-blue-600">{validationSummary.info} info</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">AI Search Results</h3>
          <div className="space-y-2">
            {searchResults.slice(0, 5).map((result, index) => (
              <div key={index} className="bg-white p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{((result as Record<string, unknown>)[activeTab === 'clients' ? 'ClientName' : activeTab === 'workers' ? 'WorkerName' : 'TaskName']) as string}</span>
                    <span className="text-sm text-gray-500 ml-2">{((result as Record<string, unknown>).entityType) as string}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {Object.keys(result as Record<string, unknown>).filter(key => !['entityType', 'ClientName', 'WorkerName', 'TaskName'].includes(key)).length} fields
                  </span>
                </div>
              </div>
            ))}
            {searchResults.length > 5 && (
              <p className="text-sm text-blue-600">... and {searchResults.length - 5} more results</p>
            )}
          </div>
        </div>
      )}

      {/* Data Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {filteredData.length > 0 ? (
          <ReactDataGrid
            columns={getColumns() as any}
            rows={filteredData}
            className="rdg-light"
            style={{ height: 400 }}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            {searchQuery ? 'No results found for your search.' : 'No data available.'}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">How to use the Data Grid</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>&bull; Click the edit icon to modify any cell</li>
          <li>• Use the search bar for quick filtering</li>
          <li>• Try natural language queries like "workers with JavaScript skills"</li>
          <li>• Cells with validation errors are highlighted in red</li>
        </ul>
      </div>
    </div>
  );
} 