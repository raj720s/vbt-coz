"use client";

import { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import { XIcon, DownloadIcon, EyeIcon } from '@/icons';

interface ExcelViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileContent: string; // base64 encoded Excel file content
  fileName: string;
}

interface ExcelData {
  headers: string[];
  rows: any[][];
  sheets: string[];
  activeSheet: string;
}

export function ExcelViewerModal({ isOpen, onClose, fileContent, fileName }: ExcelViewerModalProps) {
  const [data, setData] = useState<ExcelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullData, setShowFullData] = useState(false);

  useEffect(() => {
    if (isOpen && fileContent) {
      parseExcelContent();
    }
  }, [isOpen, fileContent]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const parseExcelContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if this is a CSV file (assignment results)
      if (fileName.includes('_processed')) {
        // Handle CSV content for assignment results
        const csvContent = atob(fileContent);
        const lines = csvContent.split('\n');
        
        if (lines.length < 2) {
          setError('No data found in the CSV file');
          return;
        }

        // Parse CSV headers and rows
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const rows = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setData({
          headers,
          rows,
          sheets: ['Assignment Results'],
          activeSheet: 'Assignment Results'
        });
      } else {
        // Handle Excel files using SheetJS
        const XLSX = await import('xlsx');

        // Convert base64 to blob
        const byteCharacters = atob(fileContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        // Parse the Excel file
        const workbook = XLSX.read(byteArray, { type: 'array' });
        
        // Get sheet names
        const sheetNames = workbook.SheetNames;
        const activeSheet = sheetNames[0];
        
        // Get the first sheet
        const worksheet = workbook.Sheets[activeSheet];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          setError('No data found in the Excel file');
          return;
        }

        // Extract headers and rows
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        setData({
          headers,
          rows,
          sheets: sheetNames,
          activeSheet
        });
      }
    } catch (err) {
      console.error('Error parsing file content:', err);
      setError('Failed to parse file content. Please ensure the file is valid.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (fileContent) {
      const byteCharacters = atob(fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Determine file type based on filename
      let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (fileName.includes('_processed') || fileName.endsWith('.csv')) {
        mimeType = 'text/csv';
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleClose = () => {
    setData(null);
    setLoading(true);
    setError(null);
    setShowFullData(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
            <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/30 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="flex items-start justify-center min-h-screen pt-28 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-top bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full mt-24 max-h-[calc(100vh-10rem)] mx-4 w-[calc(100%-2rem)] sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {fileName.includes('_processed') ? 'Assignment Results Viewer' : 'Excel File Viewer'}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {fileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={downloadFile} size="sm" variant="outline">
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleClose} size="sm" variant="outline">
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(100vh-18rem)] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading Excel file...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <p className="text-sm text-red-500 dark:text-red-300 mt-2">
                    Use the download button to access the file directly.
                  </p>
                </div>
              </div>
            )}

            {data && !loading && (
              <div className="space-y-4">
                {/* File Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Sheets:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{data.sheets.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Active Sheet:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{data.activeSheet}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Columns:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{data.headers.length}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Rows:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{data.rows.length}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {data.activeSheet} - Data Preview
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.rows.length} rows, {data.headers.length} columns
                      {!showFullData && data.rows.length > 50 && ` (showing first 50 rows)`}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowFullData(!showFullData)} 
                    size="sm" 
                    variant="outline"
                  >
                    <EyeIcon className="w-4 h-4 mr-2" />
                    {showFullData ? 'Show Less' : 'Show More'}
                  </Button>
                </div>

                {/* Excel Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                            #
                          </th>
                          {data.headers.map((header, index) => (
                            <th
                              key={index}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                            >
                              {header || `Column ${index + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                        {(showFullData ? data.rows : data.rows.slice(0, 50)).map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                              {rowIndex + 2}
                            </td>
                            {data.headers.map((header, colIndex) => {
                              const value = row[colIndex] || '';
                              return (
                                <td
                                  key={colIndex}
                                  className="px-3 py-2 text-sm text-gray-900 dark:text-white max-w-xs truncate"
                                  title={value.toString()}
                                >
                                  {value.toString()}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Show More Rows Button */}
                {!showFullData && data.rows.length > 50 && (
                  <div className="text-center">
                    <Button 
                      onClick={() => setShowFullData(true)} 
                      size="sm" 
                      variant="outline"
                    >
                      Show All {data.rows.length} Rows
                    </Button>
                  </div>
                )}

                {/* Note about preview */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> {fileName.includes('_processed') 
                      ? 'This shows the container assignment results after processing. Use the download button to access the complete CSV file with all assignment data.'
                      : 'This is a preview of the Excel file. Use the download button to access the complete file with all data.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
