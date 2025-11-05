import * as XLSX from 'xlsx';

export interface ExcelRow {
  [key: string]: any;
}

export interface ExcelData {
  headers: string[];
  rows: ExcelRow[];
  sheetName: string;
}

export interface ValidationError {
  rowNumber: number;
  field: string;
  errorMessage: string;
  value: string;
  severity: "error" | "warning";
}

/**
 * Read Excel file and return structured data
 */
export function readExcelFile(file: File): Promise<ExcelData> {
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
        
        if (jsonData.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map((row: unknown, index: number) => {
          const rowData: ExcelRow = {};
          const rowArray = row as string[];
          headers.forEach((header, colIndex) => {
            rowData[header] = rowArray[colIndex] || '';
          });
          return rowData;
        });
        
        resolve({
          headers,
          rows,
          sheetName
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Create Excel file from data
 */
export function createExcelFile(data: ExcelData): Blob {
  const worksheet = XLSX.utils.json_to_sheet(data.rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, data.sheetName);
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Fix validation errors in Excel data
 */
export function fixExcelErrors(data: ExcelData, errors: ValidationError[]): ExcelData {
  const fixedRows = [...data.rows];
  
  errors.forEach(error => {
    const rowIndex = error.rowNumber - 2; // Convert to 0-based index, subtract 2 for header
    if (rowIndex >= 0 && rowIndex < fixedRows.length) {
      const row = fixedRows[rowIndex];
      
      // Apply fixes based on error type
      switch (error.field.toLowerCase()) {
        case 'shipment':
          if (!row['SHIPMENT'] || row['SHIPMENT'].toString().trim() === '') {
            row['SHIPMENT'] = `FIXED_${Date.now()}_${rowIndex}`;
          }
          break;
        case 'customer':
          if (!row['CUSTOME'] || row['CUSTOME'].toString().trim() === '') {
            row['CUSTOME'] = 'DEFAULT_CUSTOMER';
          }
          break;
        case 'volume':
          const volume = parseFloat(row['VOLUME']);
          if (isNaN(volume) || volume <= 0) {
            row['VOLUME'] = '1.0';
          }
          break;
        case 'qty':
          const qty = parseInt(row['Qty']);
          if (isNaN(qty) || qty <= 0) {
            row['Qty'] = '1';
          }
          break;
        case 'rcv/pug':
          if (!row['RCV/PUG'] || row['RCV/PUG'].toString().trim() === '') {
            const today = new Date();
            const day = today.getDate().toString().padStart(2, '0');
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const year = today.getFullYear();
            row['RCV/PUG'] = `${day}/${month}/${year}`;
          }
          break;
        case 'pol':
          if (!row['POL'] || row['POL'].toString().trim() === '') {
            row['POL'] = 'DEFAULT_POL';
          }
          break;
        case 'destsite':
          if (!row['Destsite'] || row['Destsite'].toString().trim() === '') {
            row['Destsite'] = 'DEFAULT_DESTSITE';
          }
          break;
        case 'supplier':
          if (!row['SUPPLIER'] || row['SUPPLIER'].toString().trim() === '') {
            row['SUPPLIER'] = 'DEFAULT_SUPPLIER';
          }
          break;
        case 'pol detail':
          if (!row['POL detail']) {
            row['POL detail'] = '';
          }
          break;
        case 'pol in fcl rates?':
          if (!row['POL In FCL Rates?']) {
            row['POL In FCL Rates?'] = '';
          }
          break;
        case 'pol in lcl rates?':
          if (!row['POL In LCL Rates?']) {
            row['POL In LCL Rates?'] = '';
          }
          break;
        case 'pol alternative':
          if (!row['POL ALTERNATIVE']) {
            row['POL ALTERNATIVE'] = '';
          }
          break;
      }
    }
  });
  
  return {
    ...data,
    rows: fixedRows
  };
}

/**
 * Download Excel file
 */
export function downloadExcelFile(data: ExcelData, filename: string) {
  const blob = createExcelFile(data);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Convert Excel data to CSV string
 */
export function excelToCSV(data: ExcelData): string {
  const csvRows = [data.headers.join(',')];
  
  data.rows.forEach(row => {
    const csvRow = data.headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      const escapedValue = value.toString().replace(/"/g, '""');
      return `"${escapedValue}"`;
    });
    csvRows.push(csvRow.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Validate Excel data structure
 */
export function validateExcelStructure(data: ExcelData): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Define expected headers based on the image
  const expectedHeaders = [
    'SHIPMENT',
    'CUSTOME', // Note: This appears to be a typo for "CUSTOMER"
    'SUPPLIER', 
    'VOLUME',
    'Qty',
    'RCV/PUG',
    'POL',
    'POL detail',
    'POL In FCL Rates?',
    'POL In LCL Rates?',
    'POL ALTERNATIVE',
    'Destsite'
  ];
  
  // Check for missing required headers
  const requiredHeaders = ['SHIPMENT', 'CUSTOME', 'SUPPLIER', 'VOLUME', 'Qty', 'RCV/PUG', 'POL', 'Destsite'];
  const missingHeaders = requiredHeaders.filter(header => 
    !data.headers.some(h => h.toLowerCase() === header.toLowerCase())
  );
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Check for unexpected headers
  const unexpectedHeaders = data.headers.filter(header => 
    !expectedHeaders.some(expected => expected.toLowerCase() === header.toLowerCase())
  );
  
  if (unexpectedHeaders.length > 0) {
    warnings.push(`Unexpected headers found: ${unexpectedHeaders.join(', ')}`);
  }
  
  // Check for header typos
  data.headers.forEach(header => {
    if (header.toLowerCase() === 'custome') {
      warnings.push('Header "CUSTOME" should be "CUSTOMER" (typo detected)');
    }
  });
  
  // Check if there are data rows
  if (data.rows.length === 0) {
    errors.push('No data rows found');
  }
  
  // Check for minimum data requirements
  if (data.rows.length < 1) {
    errors.push('File must contain at least one data row');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get preview of Excel data (first 5 rows)
 */
export function getExcelPreview(data: ExcelData, maxRows: number = 5): ExcelData {
  return {
    ...data,
    rows: data.rows.slice(0, maxRows)
  };
}

/**
 * Comprehensive validation of Excel data content
 */
export function validateExcelContent(data: ExcelData): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2; // +2 because we skip header and arrays are 0-indexed
    
    // Validate SHIPMENT
    if (!row['SHIPMENT'] || row['SHIPMENT'].toString().trim() === '') {
      errors.push({
        rowNumber,
        field: 'SHIPMENT',
        errorMessage: 'Shipment ID is required',
        value: row['SHIPMENT'] || '',
        severity: 'error'
      });
    }
    
    // Validate CUSTOME (Customer)
    if (!row['CUSTOME'] || row['CUSTOME'].toString().trim() === '') {
      errors.push({
        rowNumber,
        field: 'CUSTOME',
        errorMessage: 'Customer is required',
        value: row['CUSTOME'] || '',
        severity: 'error'
      });
    }
    
    // Validate SUPPLIER
    if (!row['SUPPLIER'] || row['SUPPLIER'].toString().trim() === '') {
      errors.push({
        rowNumber,
        field: 'SUPPLIER',
        errorMessage: 'Supplier is required',
        value: row['SUPPLIER'] || '',
        severity: 'error'
      });
    }
    
    // Validate VOLUME
    const volume = parseFloat(row['VOLUME']);
    if (isNaN(volume) || volume <= 0) {
      errors.push({
        rowNumber,
        field: 'VOLUME',
        errorMessage: 'Volume must be a positive number',
        value: row['VOLUME'] || '',
        severity: 'error'
      });
    }
    
    // Validate Qty
    const qty = parseInt(row['Qty']);
    if (isNaN(qty) || qty <= 0) {
      errors.push({
        rowNumber,
        field: 'Qty',
        errorMessage: 'Quantity must be a positive integer',
        value: row['Qty'] || '',
        severity: 'error'
      });
    }
    
    // Validate RCV/PUG date format
    const rcvPug = row['RCV/PUG'];
    if (rcvPug && rcvPug.toString().trim() !== '') {
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
      if (!dateRegex.test(rcvPug.toString())) {
        errors.push({
          rowNumber,
          field: 'RCV/PUG',
          errorMessage: 'Date must be in DD/MM/YYYY format',
          value: rcvPug.toString(),
          severity: 'error'
        });
      }
    } else {
      errors.push({
        rowNumber,
        field: 'RCV/PUG',
        errorMessage: 'Receive/Pickup date is required',
        value: rcvPug || '',
        severity: 'error'
      });
    }
    
    // Validate POL
    if (!row['POL'] || row['POL'].toString().trim() === '') {
      errors.push({
        rowNumber,
        field: 'POL',
        errorMessage: 'Port of Loading is required',
        value: row['POL'] || '',
        severity: 'error'
      });
    }
    
    // Validate Destsite
    if (!row['Destsite'] || row['Destsite'].toString().trim() === '') {
      errors.push({
        rowNumber,
        field: 'Destsite',
        errorMessage: 'Destination site is required',
        value: row['Destsite'] || '',
        severity: 'error'
      });
    }
  });
  
  return errors;
}

/**
 * Check for duplicate shipment IDs within the Excel data
 */
export function checkDuplicateShipments(data: ExcelData): ValidationError[] {
  const errors: ValidationError[] = [];
  const shipmentIds = new Map<string, number[]>();
  
  data.rows.forEach((row, index) => {
    const shipmentId = row['SHIPMENT']?.toString().trim();
    if (shipmentId) {
      if (!shipmentIds.has(shipmentId)) {
        shipmentIds.set(shipmentId, []);
      }
      shipmentIds.get(shipmentId)!.push(index + 2);
    }
  });
  
  shipmentIds.forEach((rowNumbers, shipmentId) => {
    if (rowNumbers.length > 1) {
      rowNumbers.forEach(rowNumber => {
        errors.push({
          rowNumber,
          field: 'SHIPMENT',
          errorMessage: `Duplicate shipment ID "${shipmentId}" found`,
          value: shipmentId,
          severity: 'error'
        });
      });
    }
  });
  
  return errors;
}
