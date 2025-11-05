import * as XLSX from 'xlsx';
import { ContainerPlanningResult, ContainerAssignment, type ContainerThreshold } from './localStorageService';

export interface ExportRow {
  Customer: string;
  Shipment: string;
  'Optimized Container Ref': string;
  'Cont. Type': string;
  'Min. Threshold': number;
  'Max. Threshold': number;
  'Total CBM': number;
  CBM: number;
  POL: string;
  Destination: string;
  Qty: number;
  'Total Qty': number;
}

/**
 * Export container planning results to Excel in the exact format of Book-results.xlsx
 */
export function exportContainerPlanningResults(
  planningResult: ContainerPlanningResult,
  filename?: string
): void {
  try {
    // Transform assignments to export format
    const exportData: ExportRow[] = [];
    
    // Group assignments by container reference
    const containerGroups = new Map<string, ContainerAssignment[]>();
    
    planningResult.assignments.forEach(assignment => {
      if (assignment.status === 'assigned') {
        const containerRef = assignment.containerRef;
        if (!containerGroups.has(containerRef)) {
          containerGroups.set(containerRef, []);
        }
        containerGroups.get(containerRef)!.push(assignment);
      }
    });
    
    // Create export rows for each container
    containerGroups.forEach((assignments, containerRef) => {
      const containerType = assignments[0]?.containerType || 'Unknown';
      
      // Get container thresholds from localStorage
      const thresholds = getContainerThresholds(containerType);
      const minThreshold = thresholds?.minCBM || 0;
      const maxThreshold = thresholds?.maxCBM || 0;
      
      // Calculate totals for this container
      const totalCBM = assignments.reduce((sum, a) => sum + a.totalCBM, 0);
      const totalQty = assignments.reduce((sum, a) => sum + a.totalQty, 0);
      
      // Create a row for each shipment in this container
      assignments.forEach(assignment => {
        const exportRow: ExportRow = {
          Customer: assignment.customer,
          Shipment: assignment.shipmentId,
          'Optimized Container Ref': containerRef,
          'Cont. Type': containerType,
          'Min. Threshold': minThreshold,
          'Max. Threshold': maxThreshold,
          'Total CBM': totalCBM,
          CBM: assignment.volume,
          POL: assignment.pol,
          Destination: assignment.pod,
          Qty: assignment.qty,
          'Total Qty': totalQty
        };
        
        exportData.push(exportRow);
      });
    });
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Customer
      { wch: 15 }, // Shipment
      { wch: 20 }, // Optimized Container Ref
      { wch: 12 }, // Cont. Type
      { wch: 15 }, // Min. Threshold
      { wch: 15 }, // Max. Threshold
      { wch: 12 }, // Total CBM
      { wch: 10 }, // CBM
      { wch: 12 }, // POL
      { wch: 15 }, // Destination
      { wch: 10 }, // Qty
      { wch: 12 }  // Total Qty
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Container Planning Results');
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const defaultFilename = `container-planning-results-${timestamp}.xlsx`;
    const finalFilename = filename || defaultFilename;
    
    // Write the file
    XLSX.writeFile(workbook, finalFilename);
    
    console.log(`✅ Container planning results exported to: ${finalFilename}`);
    console.log(`📊 Exported ${exportData.length} rows for ${containerGroups.size} containers`);
    
  } catch (error) {
    console.error('❌ Error exporting container planning results:', error);
    throw new Error(`Failed to export results: ${error}`);
  }
}

/**
 * Export results in the exact format of Book-results.xlsx
 */
export function exportResultsInBookFormat(
  planningResult: ContainerPlanningResult,
  filename?: string
): void {
  try {
    // Transform assignments to match Book-results.xlsx format exactly
    const exportData: string[][] = [];
    
    // Add headers exactly as in Book-results.xlsx
    const headers = [
      'Customer',
      'Shipment',
      'Optimized Container Ref',
      'Cont. Type',
      'Min. Threshold',
      'Max. Threshold',
      'Total CBM',
      'CBM',
      'POL',
      'Destination',
      'Qty',
      'Total Qty'
    ];
    exportData.push(headers);
    
    // Group assignments by container reference
    const containerGroups = new Map<string, ContainerAssignment[]>();
    
    planningResult.assignments.forEach(assignment => {
      if (assignment.status === 'assigned') {
        const containerRef = assignment.containerRef;
        if (!containerGroups.has(containerRef)) {
          containerGroups.set(containerRef, []);
        }
        containerGroups.get(containerRef)!.push(assignment);
      }
    });
    
    // Create export rows for each container
    containerGroups.forEach((assignments, containerRef) => {
      const containerType = assignments[0]?.containerType || 'Unknown';
      
      // Get container thresholds
      const thresholds = getContainerThresholds(containerType);
      const minThreshold = thresholds?.minCBM || 0;
      const maxThreshold = thresholds?.maxCBM || 0;
      
      // Calculate totals for this container
      const totalCBM = assignments.reduce((sum, a) => sum + a.totalCBM, 0);
      const totalQty = assignments.reduce((sum, a) => sum + a.totalQty, 0);
      
      // Create a row for each shipment in this container
      assignments.forEach(assignment => {
        const row = [
          assignment.customer,                    // Customer
          assignment.shipmentId,                  // Shipment
          containerRef,                           // Optimized Container Ref
          containerType,                          // Cont. Type
          minThreshold,                           // Min. Threshold
          maxThreshold,                           // Max. Threshold
          totalCBM,                               // Total CBM
          assignment.volume,                      // CBM
          assignment.pol,                         // POL
          assignment.pod,                         // Destination
          assignment.qty,                         // Qty
          totalQty                                // Total Qty
        ];
        
        exportData.push(row);
      });
    });
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Customer
      { wch: 15 }, // Shipment
      { wch: 20 }, // Optimized Container Ref
      { wch: 12 }, // Cont. Type
      { wch: 15 }, // Min. Threshold
      { wch: 15 }, // Max. Threshold
      { wch: 12 }, // Total CBM
      { wch: 10 }, // CBM
      { wch: 12 }, // POL
      { wch: 15 }, // Destination
      { wch: 10 }, // Qty
      { wch: 12 }  // Total Qty
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const defaultFilename = `Book-results-${timestamp}.xlsx`;
    const finalFilename = filename || defaultFilename;
    
    // Write the file
    XLSX.writeFile(workbook, finalFilename);
    
    console.log(`✅ Results exported in Book format: ${finalFilename}`);
    console.log(`📊 Exported ${exportData.length - 1} data rows for ${containerGroups.size} containers`);
    
  } catch (error) {
    console.error('❌ Error exporting results in Book format:', error);
    throw new Error(`Failed to export results: ${error}`);
  }
}

/**
 * Get container thresholds for a specific container type
 */
function getContainerThresholds(containerType: string): { minCBM: number; maxCBM: number } | null {
  try {
    // Try to get from localStorage if available
    if (typeof window !== 'undefined') {
      const thresholdsData = localStorage.getItem('nxt_admin_container_thresholds');
      if (thresholdsData) {
        const thresholds = JSON.parse(thresholdsData);
        const threshold = thresholds.find((t: ContainerThreshold) => t.containerType === containerType);
        if (threshold) {
          return { minCBM: threshold.minCBM, maxCBM: threshold.maxCBM };
        }
      }
    }
    
    // Fallback to default thresholds
    const defaultThresholds: Record<string, { minCBM: number; maxCBM: number }> = {
      '40HQ': { minCBM: 35, maxCBM: 76 },
      '40GP': { minCBM: 30, maxCBM: 67 },
      '20GP': { minCBM: 15, maxCBM: 33 },
      '40HC': { minCBM: 35, maxCBM: 76 }, // Alias for 40HQ
      '40FT': { minCBM: 30, maxCBM: 67 }  // Alias for 40GP
    };
    
    return defaultThresholds[containerType] || null;
  } catch (error) {
    console.warn('Warning: Could not get container thresholds:', error);
    return null;
  }
}

/**
 * Download results as Excel file
 */
export function downloadResultsExcel(
  planningResult: ContainerPlanningResult,
  filename?: string
): void {
  try {
    exportResultsInBookFormat(planningResult, filename);
  } catch (error) {
    console.error('❌ Error downloading results:', error);
    throw error;
  }
}

export default {
  exportContainerPlanningResults,
  exportResultsInBookFormat,
  downloadResultsExcel
};

