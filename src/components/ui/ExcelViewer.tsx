"use client";

import { useState, useEffect } from 'react';
import { ExcelData, ExcelRow, ValidationError, readExcelFile, fixExcelErrors, downloadExcelFile } from '@/utils/excelUtils';
import Button from '@/components/ui/button/Button';
import toast from 'react-hot-toast';

interface ExcelViewerProps {
  file?: File;
  excelData?: ExcelData;
  validationErrors?: ValidationError[];
  onDataChange?: (data: ExcelData) => void;
  onFixErrors?: (fixedData: ExcelData) => void;
  showPreview?: boolean;
  maxPreviewRows?: number;
}

export default function ExcelViewer({
  file,
  excelData,
  validationErrors = [],
  onDataChange,
  onFixErrors,
  showPreview = true,
  maxPreviewRows = 10
}: ExcelViewerProps) {
  const [data, setData] = useState<ExcelData | null>(excelData || null);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (file && !data) {
      loadExcelFile(file);
    }
  }, [file, data]);

  const loadExcelFile = async (file: File) => {
    setLoading(true);
    try {
      const excelData = await readExcelFile(file);
      setData(excelData);
      onDataChange?.(excelData);
      toast.success('Excel file loaded successfully');
    } catch (error) {
      console.error('Error loading Excel file:', error);
      toast.error('Failed to load Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = (rowIndex: number, colName: string, value: string) => {
    if (!data) return;

    const updatedRows = [...data.rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [colName]: value };
    
    const updatedData = { ...data, rows: updatedRows };
    setData(updatedData);
    onDataChange?.(updatedData);
  };

  const handleFixErrors = () => {
    if (!data || validationErrors.length === 0) return;

    try {
      const fixedData = fixExcelErrors(data, validationErrors);
      setData(fixedData);
      onFixErrors?.(fixedData);
      toast.success('Errors fixed automatically');
    } catch (error) {
      console.error('Error fixing data:', error);
      toast.error('Failed to fix errors');
    }
  };

  const handleDownload = () => {
    if (!data) return;
    
    const filename = file?.name || 'fixed_shipments.xlsx';
    downloadExcelFile(data, filename);
    toast.success('File downloaded successfully');
  };

  const handleCellClick = (rowIndex: number, colName: string, value: string) => {
    setEditingCell({ row: rowIndex, col: colName });
    setEditValue(value.toString());
  };

  const handleCellSave = () => {
    if (!editingCell || !data) return;

    handleCellEdit(editingCell.row, editingCell.col, editValue);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Excel file...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No Excel data to display</p>
      </div>
    );
  }

  const displayRows = showPreview ? data.rows.slice(0, maxPreviewRows) : data.rows;
  const hasMoreRows = data.rows.length > maxPreviewRows;

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Excel Data Viewer
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.rows.length} rows, {data.headers.length} columns
            {showPreview && hasMoreRows && ` (showing first ${maxPreviewRows} rows)`}
          </p>
        </div>
        <div className="flex space-x-2">
          {validationErrors.length > 0 && (
            <Button onClick={handleFixErrors} size="sm" variant="outline">
              Auto Fix Errors
            </Button>
          )}
          <Button onClick={handleDownload} size="sm" variant="outline">
            Download
          </Button>
        </div>
      </div>

      {/* Excel Table */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 overflow-hidden">
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
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {displayRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    validationErrors.some(error => error.rowNumber === rowIndex + 2)
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {rowIndex + 2}
                  </td>
                  {data.headers.map((header, colIndex) => {
                    const value = row[header] || '';
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === header;
                    const hasError = validationErrors.some(
                      error => error.rowNumber === rowIndex + 2 && error.field.toLowerCase() === header.toLowerCase()
                    );

                    return (
                      <td
                        key={colIndex}
                        className={`px-3 py-2 text-sm ${
                          hasError
                            ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                            : ''
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={handleCellSave}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleCellCancel}
                              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 px-1 py-1 rounded"
                            onClick={() => handleCellClick(rowIndex, header, value)}
                            title="Click to edit"
                          >
                            {value.toString()}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Summary */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
            Validation Errors ({validationErrors.length})
          </h4>
          <div className="space-y-1">
            {validationErrors.slice(0, 3).map((error, index) => (
              <p key={index} className="text-xs text-red-700 dark:text-red-300">
                Row {error.rowNumber}: {error.field} - {error.errorMessage}
              </p>
            ))}
            {validationErrors.length > 3 && (
              <p className="text-xs text-red-700 dark:text-red-300">
                ... and {validationErrors.length - 3} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Show More Rows Button */}
      {showPreview && hasMoreRows && (
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {maxPreviewRows} of {data.rows.length} rows
          </p>
        </div>
      )}
    </div>
  );
}
