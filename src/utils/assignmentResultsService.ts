import { ContainerPlanningResult, ContainerAssignment } from './localStorageService';

export interface AssignmentResult {
  id: string;
  fileId: string;
  uploadDate: string;
  assignments: ContainerAssignment[];
  summary: {
    totalShipments: number;
    assignedShipments: number;
    unassignedShipments: number;
    totalContainers: number;
    containerTypes: Record<string, number>;
  };
  processingDate: string;
}

export interface AssignmentResultRow {
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
  Status: string;
  'Processing Date': string;
}

// Storage key for assignment results
const ASSIGNMENT_RESULTS_KEY = 'nxt_admin_assignment_results';

/**
 * Store assignment results for a specific file
 */
export function storeAssignmentResults(
  fileId: string,
  planningResult: ContainerPlanningResult,
  uploadDate: string
): AssignmentResult {
  const result: AssignmentResult = {
    id: generateId(),
    fileId,
    uploadDate,
    assignments: planningResult.assignments,
    summary: planningResult.summary,
    processingDate: new Date().toISOString()
  };

  // Get existing results
  const existingResults = getAssignmentResults();
  
  // Remove any existing result for this file
  const filteredResults = existingResults.filter(r => r.fileId !== fileId);
  
  // Add new result
  const updatedResults = [...filteredResults, result];
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(ASSIGNMENT_RESULTS_KEY, JSON.stringify(updatedResults));
  }

  return result;
}

/**
 * Get assignment results for a specific file
 */
export function getAssignmentResultByFileId(fileId: string): AssignmentResult | null {
  const results = getAssignmentResults();
  return results.find(r => r.fileId === fileId) || null;
}

/**
 * Get all assignment results
 */
export function getAssignmentResults(): AssignmentResult[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(ASSIGNMENT_RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading assignment results:', error);
    return [];
  }
}

/**
 * Convert assignment results to Excel format rows
 */
export function convertToExcelRows(result: AssignmentResult): AssignmentResultRow[] {
  const rows: AssignmentResultRow[] = [];
  
  // Group assignments by container reference
  const containerGroups = new Map<string, ContainerAssignment[]>();
  
  result.assignments.forEach(assignment => {
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
      const row: AssignmentResultRow = {
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
        'Total Qty': totalQty,
        Status: assignment.status,
        'Processing Date': new Date(result.processingDate).toLocaleDateString()
      };
      
      rows.push(row);
    });
  });
  
  // Add unassigned shipments
  result.assignments
    .filter(a => a.status === 'unassigned')
    .forEach(assignment => {
      const row: AssignmentResultRow = {
        Customer: assignment.customer,
        Shipment: assignment.shipmentId,
        'Optimized Container Ref': 'UNASSIGNED',
        'Cont. Type': 'UNASSIGNED',
        'Min. Threshold': 0,
        'Max. Threshold': 0,
        'Total CBM': 0,
        CBM: assignment.volume,
        POL: assignment.pol,
        Destination: assignment.pod,
        Qty: assignment.qty,
        'Total Qty': assignment.qty,
        Status: 'unassigned',
        'Processing Date': new Date(result.processingDate).toLocaleDateString()
      };
      
      rows.push(row);
    });
  
  return rows;
}

/**
 * Generate Excel file from assignment results
 */
export function generateAssignmentResultsExcel(result: AssignmentResult, filename: string): Blob {
  const rows = convertToExcelRows(result);
  
  // Convert to CSV format for Excel
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        const value = row[header as keyof AssignmentResultRow];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  return new Blob([csvContent], { type: 'text/csv' });
}

/**
 * Get container thresholds for a specific container type
 */
function getContainerThresholds(containerType: string): { minCBM: number; maxCBM: number } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('nxt_admin_container_thresholds');
    if (!stored) return null;
    
    const thresholds = JSON.parse(stored);
    const threshold = thresholds.find((t: any) => 
      t.containerType === containerType && t.isActive
    );
    
    return threshold ? { minCBM: threshold.minCBM, maxCBM: threshold.maxCBM } : null;
  } catch (error) {
    console.error('Error reading container thresholds:', error);
    return null;
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
