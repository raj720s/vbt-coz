import { any } from 'zod';
import { localStorageService, type ShipmentData, type ContainerAssignment } from './localStorageService';
import { storeAssignmentResults } from './assignmentResultsService';

// Types for the container planning system
interface BucketData {
  key: string;
  customer: string;
  pol: string;
  pod: string;
  shipments: ShipmentData[];
  totalCBM: number;
  totalQty: number;
  isGroupMix: boolean;
}

interface ContainerPriority {
  id: string;
  containerType: string;
  priority: number;
  status: 'active' | 'inactive';
}

interface ContainerThreshold {
  id: string;
  containerType: string;
  minCBM: number;
  maxCBM: number;
  pol?: string;
  isDefault: boolean;
  isActive: boolean;
}

interface PlanningResult {
  totalShipments: number;
  assignedShipments: number;
  unassignedShipmentsCount: number;
  totalContainers: number;
  containerTypes: Record<string, number>;
  assignments: ContainerAssignment[];
  unassignedShipments: ShipmentData[];
  summary: {
    buckets: BucketData[];
    planning: {
      [bucketKey: string]: {
        attempts: Array<{
          containerType: string;
          reason: string;
          totalCBM: number;
          minRequired: number;
          maxAllowed: number;
        }>;
      };
    };
  };
}

/**
 * STEP 1: DATA BUCKETING
 * Groups shipments by customer, POL, and destination
 */
function createBuckets(shipments: ShipmentData[]): BucketData[] {
  const bucketMap = new Map<string, BucketData>();

  shipments.forEach(shipment => {
    const key = `${shipment.customer}_${shipment.pol}_${shipment.destsite}`;
    
    if (!bucketMap.has(key)) {
      bucketMap.set(key, {
        key,
        customer: shipment.customer,
        pol: shipment.pol,
        pod: shipment.destsite,
        shipments: [],  // Initialize shipments array 
        totalCBM: 0,
        totalQty: 0,
        isGroupMix: false
      });
    }
    
    const bucket = bucketMap.get(key)!;
    bucket.shipments.push(shipment);
    bucket.totalCBM += shipment.volume;
    bucket.totalQty += shipment.qty;
  });

  return Array.from(bucketMap.values());
}

/**
 * STEP 2: GET CONTAINER PRIORITIES
 */
async function getContainerPriorities(): Promise<ContainerPriority[]> {
  try {
    const response = await fetch('/data/container-priorities.json');
    const data = await response.json();
    const priorities = data.containerPriorities || [];
    return priorities
      .filter((p: ContainerPriority) => p.status === 'active')
      .sort((a: ContainerPriority, b: ContainerPriority) => a.priority - b.priority);
  } catch (error) {
    console.error('Error loading container priorities:', error);
    // Fallback to hardcoded priorities
    return [
      { id: 'fallback_40hq', containerType: '40HQ', priority: 1, status: 'active' },
      { id: 'fallback_40gp', containerType: '40GP', priority: 2, status: 'active' },
      { id: 'fallback_20gp', containerType: '20GP', priority: 3, status: 'active' },
      { id: 'fallback_lcl', containerType: 'LCL', priority: 4, status: 'active' }
    ];
  }
}

/**
 * STEP 3: GET CONTAINER THRESHOLDS
 */
async function getThresholdForContainer(containerType: string, pol: string): Promise<ContainerThreshold | null> {
  try {
    const response = await fetch('/data/container-thresholds.json');
    const data = await response.json();
    const thresholds = data.containerThresholds || [];
    
    // First try to find POL-specific threshold
    const polSpecific = thresholds.find((t: ContainerThreshold) => 
      t.containerType === containerType && 
      t.pol === pol && 
      t.isActive
    );
    
    if (polSpecific) return polSpecific;
    
    // Fall back to default threshold
    const defaultThreshold = thresholds.find((t: ContainerThreshold) => 
      t.containerType === containerType && 
      t.isDefault && 
      t.isActive
    );
    
    if (defaultThreshold) return defaultThreshold;
    
    // Last resort: hardcoded fallbacks
    const fallbackThresholds: Record<string, ContainerThreshold> = {
      '20GP': { id: 'fallback_20gp', containerType: '20GP', minCBM: 15, maxCBM: 33, isDefault: true, isActive: true, description: 'Fallback 20GP' } as ContainerThreshold,
      '40GP': { id: 'fallback_40gp', containerType: '40GP', minCBM: 30, maxCBM: 67, isDefault: true, isActive: true, description: 'Fallback 40GP' } as ContainerThreshold,
      '40HQ': { id: 'fallback_40hq', containerType: '40HQ', minCBM: 35, maxCBM: 76, isDefault: true, isActive: true, description: 'Fallback 40HQ' } as ContainerThreshold,
    };
    
    return fallbackThresholds[containerType] || null;
  } catch (error) {
    console.error('Error loading container thresholds:', error);
    // Fallback to hardcoded thresholds
    const fallbackThresholds: Record<string, ContainerThreshold> = {
      '20GP': { id: 'fallback_20gp', containerType: '20GP', minCBM: 15, maxCBM: 33, isDefault: true, isActive: true, description: 'Fallback 20GP' } as ContainerThreshold,
      '40GP': { id: 'fallback_40gp', containerType: '40GP', minCBM: 30, maxCBM: 67, isDefault: true, isActive: true, description: 'Fallback 40GP' } as ContainerThreshold,
      '40HQ': { id: 'fallback_40hq', containerType: '40HQ', minCBM: 35, maxCBM: 76, isDefault: true, isActive: true, description: 'Fallback 40HQ' } as ContainerThreshold,
    };
    
    return fallbackThresholds[containerType] || null;
  }
}

/**
 * STEP 4: CONTAINER ASSIGNMENT WITH OPTIMIZED FILLING
 */
async function assignContainerToGroup(
  bucket: BucketData, 
  containerType: string, 
  containerNumber: number,
  pol: string
): Promise<ContainerAssignment[]> {
  const threshold = await getThresholdForContainer(containerType, pol);
  if (!threshold) {
    return [];
  }
  
  const assignments: ContainerAssignment[] = [];
  
  // Sort shipments by volume (DESCENDING) - Higher volume first
  const sortedShipments = [...bucket.shipments].sort((a, b) => b.volume - a.volume);
  
  // Create temporary container to test fitting
  const tempContainer = {
    shipments: [] as ShipmentData[],
    totalCBM: 0,
    totalQty: 0
  };
  
  // Try to fit shipments into container
  for (const shipment of sortedShipments) {
    const newTotal = tempContainer.totalCBM + shipment.volume;
    
    // Check if shipment fits within max threshold
    if (newTotal <= threshold.maxCBM) {
      tempContainer.shipments.push(shipment);
      tempContainer.totalCBM = newTotal;
      tempContainer.totalQty += shipment.qty;
    }
  }
  
  // Check if container meets minimum requirements
  if (tempContainer.totalCBM >= threshold.minCBM && tempContainer.shipments.length > 0) {
    // Generate container reference
    const containerRef = `CONTAINER_${containerNumber.toString().padStart(3, '0')}_${containerType}`;
    
    // Create assignments for all shipments in this container
    tempContainer.shipments.forEach(shipment => {
      assignments.push({
        shipmentId: shipment.shipmentId,
        containerRef,
        containerType,
        volume: shipment.volume,
        qty: shipment.qty,
        totalCBM: tempContainer.totalCBM,
        totalQty: tempContainer.totalQty,
        priority: 0,
        customer: shipment.customer,
        pol: shipment.pol,
        pod: shipment.destsite,
        status: 'assigned'
      });
    });
  }
  
  return assignments;
}

/**
 * MAIN CONTAINER PLANNING ALGORITHM (CLIENT-SIDE)
 */
export async function planContainers(shipments: ShipmentData[]): Promise<PlanningResult> {
  const result: PlanningResult = {
    totalShipments: shipments.length,
    assignedShipments: 0,
    unassignedShipmentsCount: 0,
    totalContainers: 0,
    containerTypes: {},
    assignments: [],
    unassignedShipments: [],
    summary: {
      buckets: [],
      planning: {}
    }
  };

  if (shipments.length === 0) {
    return result;
  }

  // STEP 1: Create buckets
  const buckets = createBuckets(shipments);
  result.summary.buckets = buckets;

  // STEP 2: Get container priorities
  const priorities = await getContainerPriorities();

  // STEP 3: Process each bucket
  const processedShipmentIds = new Set<string>();
  let containerNumber = 1;

  for (const bucket of buckets) {
    result.summary.planning[bucket.key] = { attempts: [] };
    let bucketAssigned = false;

    // Try each container type in priority order
    for (const priority of priorities) {
      const containerType = priority.containerType;
      const threshold = await getThresholdForContainer(containerType, bucket.pol);
      
      if (threshold && bucket.totalCBM >= threshold.minCBM && bucket.totalCBM <= threshold.maxCBM) {
        const assignments = await assignContainerToGroup(bucket, containerType, containerNumber, bucket.pol);
        
        if (assignments.length > 0) {
          result.assignments.push(...assignments);
          
          // Track processed shipments
          assignments.forEach(assignment => {
            processedShipmentIds.add(assignment.shipmentId);
          });
          
          // Update result statistics
          result.assignedShipments += assignments.length;
          result.totalContainers++;
          result.containerTypes[containerType] = (result.containerTypes[containerType] || 0) + 1;
          
          bucketAssigned = true;
          containerNumber++;
          break; // Move to next bucket
        }
      }
      
      // Log attempt
      if (threshold) {
        const reason = bucket.totalCBM < threshold.minCBM 
          ? `Total CBM ${bucket.totalCBM} below minimum ${threshold.minCBM}`
          : bucket.totalCBM > threshold.maxCBM
          ? `Total CBM ${bucket.totalCBM} exceeds maximum ${threshold.maxCBM}`
          : "Failed to create assignments";
          
        result.summary.planning[bucket.key].attempts.push({
          containerType,
          reason,
          totalCBM: bucket.totalCBM,
          minRequired: threshold.minCBM,
          maxAllowed: threshold.maxCBM
        });
      }
    }

    // If bucket couldn't be assigned, mark shipments as unassigned
    if (!bucketAssigned) {
      bucket.shipments.forEach(shipment => {
        if (!processedShipmentIds.has(shipment.shipmentId)) {
          result.unassignedShipments.push(shipment);
          
          // Create unassigned entry
          result.assignments.push({
            shipmentId: shipment.shipmentId,
            containerRef: "UNASSIGNED",
            containerType: "UNASSIGNED",
            volume: shipment.volume,
            qty: shipment.qty,
            totalCBM: 0,
            totalQty: 0,
            priority: 999,
            customer: shipment.customer,
            pol: shipment.pol,
            pod: shipment.destsite,
            status: 'unassigned'
          });
        }
      });
    }
  }

  result.unassignedShipmentsCount = result.totalShipments - result.assignedShipments;

  return result;
}

/**
 * Save planning results to localStorage
 */
export function savePlanningResults(result: PlanningResult, fileId: string) {
  // Save to localStorage service
  const savedResult = localStorageService.saveContainerPlanningResult({
    fileId,
    planDate: new Date().toISOString(),
    assignments: result.assignments,
    summary: {
      totalShipments: result.totalShipments,
      assignedShipments: result.assignedShipments,
      unassignedShipments: result.unassignedShipmentsCount,
      totalContainers: result.totalContainers,
      containerTypes: result.containerTypes
    }
  });

  // Also store assignment results for uploads history
  try {
    const uploadDate = new Date().toISOString();
    storeAssignmentResults(fileId, savedResult, uploadDate);
  } catch (error) {
    console.error('Error storing assignment results:', error);
  }

  return savedResult;
}
