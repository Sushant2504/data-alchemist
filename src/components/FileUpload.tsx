'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Users, Briefcase, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useDataStore } from '@/store/DataStore';
import { parseExcelFile, parseCSVFile, detectEntityType, transformData } from '@/lib/excel-parser';
import { validateData } from '@/lib/validation';
import { Client, Worker, Task, ValidationResult } from '@/types';

interface FileUploadProps {
  onValidationComplete: (results: ValidationResult[]) => void;
}

export default function FileUpload({ onValidationComplete }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    name: string;
    type: string;
    entityType: 'clients' | 'workers' | 'tasks' | 'unknown';
    data: any[];
    headers: string[];
    status: 'uploading' | 'processing' | 'success' | 'error';
    error?: string;
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    const newFiles: typeof uploadedFiles = [];

    // Filter out Mac resource fork files (._ files)
    const filteredFiles = acceptedFiles.filter(file => !file.name.startsWith('._'));
    if (filteredFiles.length === 0) {
      setUploadedFiles([{ name: '', type: '', entityType: 'unknown', data: [], headers: [], status: 'error', error: 'No valid files selected. Please upload a real CSV or Excel file.' }]);
      setIsProcessing(false);
      return;
    }

    for (const file of filteredFiles) {
      const fileInfo = {
        name: file.name,
        type: file.type,
        entityType: 'unknown' as const,
        data: [],
        headers: [],
        status: 'uploading' as const,
      };

      newFiles.push(fileInfo);
      setUploadedFiles(prev => [...prev, fileInfo]);

      try {
        fileInfo.status = 'processing';
        setUploadedFiles(prev => [...prev]);

        // Parse file
        let parsedData;
        if (file.name.endsWith('.csv')) {
          parsedData = await parseCSVFile(file);
        } else {
          parsedData = await parseExcelFile(file);
        }

        // Check for empty file
        if (!parsedData.data || parsedData.data.length === 0) {
          throw new Error('File is empty or contains no data rows.');
        }

        // Detect entity type
        const entityType = detectEntityType(parsedData.headers);
        fileInfo.entityType = entityType;

        // Transform data with AI header mapping
        const transformedData = transformData(parsedData.data, entityType);
        fileInfo.data = transformedData;
        fileInfo.headers = parsedData.headers;
        fileInfo.status = 'success';

        // Store data in global state
        if (entityType === 'clients') {
          useDataStore.getState().setClients(transformedData as Client[]);
        } else if (entityType === 'workers') {
          useDataStore.getState().setWorkers(transformedData as Worker[]);
        } else if (entityType === 'tasks') {
          useDataStore.getState().setTasks(transformedData as Task[]);
        }

        setUploadedFiles(prev => [...prev]);
      } catch (error) {
        fileInfo.status = 'error';
        fileInfo.error = error instanceof Error ? error.message : 'Unknown error';
        setUploadedFiles(prev => [...prev]);
      }
    }

    // Run validation after all files are processed
    if (newFiles.some(f => f.status === 'success')) {
      try {
        const validationResults = await validateData({
          clients: useDataStore.getState().clients,
          workers: useDataStore.getState().workers,
          tasks: useDataStore.getState().tasks,
        });
        
        useDataStore.getState().setValidationResults(validationResults);
        onValidationComplete(validationResults);
      } catch (error) {
        console.error('Validation failed:', error);
      }
    }

    setIsProcessing(false);
  }, [onValidationComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
  });

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'clients': return <Users className="w-4 h-4" />;
      case 'workers': return <Briefcase className="w-4 h-4" />;
      case 'tasks': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing': return <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Upload className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Upload your data files'}
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop CSV or Excel files containing clients, workers, and tasks data.
          <br />
          <span className="text-sm text-gray-500">
            Supported formats: .csv, .xlsx, .xls
          </span>
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>Clients</span>
          </div>
          <div className="flex items-center space-x-1">
            <Briefcase className="w-4 h-4" />
            <span>Workers</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="w-4 h-4" />
            <span>Tasks</span>
          </div>
        </div>
      </div>

      {/* AI Features Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">AI-Powered Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">Smart Header Mapping</p>
              <p className="text-gray-600">Automatically maps incorrectly named columns</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">Entity Detection</p>
              <p className="text-gray-600">Intelligently identifies file types</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-gray-900">Real-time Validation</p>
              <p className="text-gray-600">Immediate feedback on data quality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Uploaded Files</h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg border"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(file.status)}
                  <div className="flex items-center space-x-2">
                    {getEntityIcon(file.entityType)}
                    <span className="font-medium text-gray-900">{file.name}</span>
                    {file.entityType !== 'unknown' && (
                      <span className="text-sm text-gray-500 capitalize">
                        ({file.entityType})
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {file.status === 'success' && (
                    <span className="text-sm text-green-600">
                      {file.data.length} records
                    </span>
                  )}
                  {file.status === 'error' && (
                    <span className="text-sm text-red-600">{file.error}</span>
                  )}
                  {file.status === 'processing' && (
                    <span className="text-sm text-blue-600">Processing...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <Sparkles className="w-5 h-5 animate-spin" />
          <span>Processing files and running validation...</span>
        </div>
      )}
    </div>
  );
} 