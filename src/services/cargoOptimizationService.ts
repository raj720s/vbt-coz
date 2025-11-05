/**
 * Cargo Optimization Service
 * Handles file upload to cargo optimization API and processes the response
 */

import superAxios from '@/utils/superAxios';
import * as XLSX from 'xlsx';

export interface CargoOptimizationResponse {
  success: boolean;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  error?: string;
}

export interface OptimizationResult {
  id: string;
  customer: string;
  shipment: string;
  optimizedContainerRef: string;
  containerType: string;
  minThreshold: number;
  maxThreshold: number;
  totalCBM: number;
  cbm: number;
  pol: string;
  destination: string;
  qty: number;
  totalQty: number;
  status: string;
  processingDate: string;
}

export interface CargoOptimizationUploadProgress {
  stage: 'uploading' | 'processing' | 'downloading' | 'parsing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

/**
 * Upload file to cargo optimization API
 */
export async function uploadFileForOptimization(
  file: File,
  onProgress?: (progress: CargoOptimizationUploadProgress) => void
): Promise<{ results: OptimizationResult[]; fileName: string; responseBlob: Blob }> {
  
  const updateProgress = (stage: CargoOptimizationUploadProgress['stage'], progress: number, message: string, error?: string) => {
    if (onProgress) {
      onProgress({ stage, progress, message, error });
    }
  };

  try {
    updateProgress('uploading', 10, 'Preparing file for upload...');

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);

    updateProgress('uploading', 30, 'Uploading file to optimization service...');

    // Upload file to cargo optimization API
    const response = await superAxios.post(
      '/shipment/api/cargo-optimization/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Important: expect binary response (Excel file)
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const adjustedProgress = 30 + (uploadProgress * 0.4); // 30-70% for upload
            updateProgress('uploading', adjustedProgress, `Uploading... ${uploadProgress}%`);
          }
        },
      }
    );

    updateProgress('processing', 75, 'Processing optimization results...');

    // Extract filename from response headers
    const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    let fileName = 'cargo_optimization_result.xlsx';
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }

    updateProgress('downloading', 85, 'Downloading optimization results...');

    // Convert blob response to array buffer for XLSX processing
    const arrayBuffer = await response.data.arrayBuffer();

    updateProgress('parsing', 90, 'Parsing optimization results...');

    // Parse the Excel response file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '', // Default value for empty cells
    }) as string[][];

    if (jsonData.length < 2) {
      throw new Error('Invalid response file format - no data rows found');
    }

    // Extract headers and data rows
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);

    // Map data to OptimizationResult format
    const results: OptimizationResult[] = dataRows.map((row, index) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header, headerIndex) => {
        rowData[header] = row[headerIndex] || '';
      });

      return {
        id: `opt_${index + 1}`,
        customer: rowData['Customer'] || rowData['CUSTOMER'] || '',
        shipment: rowData['Shipment'] || rowData['SHIPMENT'] || '',
        optimizedContainerRef: rowData['Optimized Container Ref'] || rowData['Container Ref'] || rowData['CONTAINER_REF'] || '',
        containerType: rowData['Cont. Type'] || rowData['Container Type'] || rowData['CONTAINER_TYPE'] || '',
        minThreshold: parseFloat(rowData['Min. Threshold'] || rowData['MIN_THRESHOLD'] || '0') || 0,
        maxThreshold: parseFloat(rowData['Max. Threshold'] || rowData['MAX_THRESHOLD'] || '0') || 0,
        totalCBM: parseFloat(rowData['Total CBM'] || rowData['TOTAL_CBM'] || '0') || 0,
        cbm: parseFloat(rowData['CBM'] || rowData['Volume'] || '0') || 0,
        pol: rowData['POL'] || rowData['Port of Loading'] || '',
        destination: rowData['Destination'] || rowData['POD'] || rowData['Destsite'] || '',
        qty: parseInt(rowData['Qty'] || rowData['Quantity'] || '0') || 0,
        totalQty: parseInt(rowData['Total Qty'] || rowData['TOTAL_QTY'] || '0') || 0,
        status: rowData['Status'] || rowData['STATUS'] || 'assigned',
        processingDate: rowData['Processing Date'] || rowData['PROCESSING_DATE'] || new Date().toLocaleDateString()
      };
    }).filter(result => result.shipment && result.shipment.trim() !== ''); // Filter out empty rows

    updateProgress('completed', 100, `Successfully processed ${results.length} optimization results`);

    // Store results in localStorage for assignment results page
    if (typeof window !== 'undefined') {
      const optimizationResults = {
        fileName,
        uploadDate: new Date().toISOString(),
        results,
        totalResults: results.length,
        processedAt: new Date().toISOString()
      };
      
      localStorage.setItem('cargo_optimization_results', JSON.stringify(optimizationResults));
    }

    return { results, fileName, responseBlob: response.data };

  } catch (error) {
    console.error('Cargo optimization upload error:', error);
    
    let errorMessage = 'Failed to process cargo optimization';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    updateProgress('error', 100, 'Optimization failed', errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Get stored optimization results from localStorage
 */
export function getStoredOptimizationResults(): {
  fileName: string;
  uploadDate: string;
  results: OptimizationResult[];
  totalResults: number;
  processedAt: string;
} | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('cargo_optimization_results');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading stored optimization results:', error);
    return null;
  }
}

/**
 * Clear stored optimization results
 */
export function clearStoredOptimizationResults(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cargo_optimization_results');
  }
}

/**
 * Convert file to CSV format for API upload
 * Some APIs prefer CSV format over Excel
 */
export async function convertExcelToCSV(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to CSV
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        
        // Create new CSV file
        const csvBlob = new Blob([csvData], { type: 'text/csv' });
        const csvFile = new File([csvBlob], file.name.replace(/\.(xlsx|xls)$/i, '.csv'), {
          type: 'text/csv'
        });
        
        resolve(csvFile);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validate API response file format
 */
export function validateOptimizationResponse(results: OptimizationResult[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (results.length === 0) {
    errors.push('No optimization results found in response file');
    return { isValid: false, errors, warnings };
  }
  
  // Check for required fields
  const requiredFields = ['customer', 'shipment', 'optimizedContainerRef', 'containerType'];
  const missingFields = new Set<string>();
  
  results.forEach((result, index) => {
    requiredFields.forEach(field => {
      if (!result[field as keyof OptimizationResult] || 
          result[field as keyof OptimizationResult].toString().trim() === '') {
        missingFields.add(field);
      }
    });
    
    // Check for invalid numeric values
    if (result.totalCBM < 0 || result.cbm < 0) {
      warnings.push(`Row ${index + 1}: Invalid CBM values`);
    }
    
    if (result.qty < 0 || result.totalQty < 0) {
      warnings.push(`Row ${index + 1}: Invalid quantity values`);
    }
  });
  
  if (missingFields.size > 0) {
    errors.push(`Missing required fields: ${Array.from(missingFields).join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
