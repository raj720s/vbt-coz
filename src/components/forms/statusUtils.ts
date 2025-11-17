// Status utility for handling enum codes and labels

// Shipment Status Enum
export enum ShipmentStatusEnum {
  DRAFT = 5,
  CONFIRMED = 10,
  SHIPPED = 15,
  BOOKED = 20,
  MODIFIED = 25,
  CANCELLED = 30,
}

// Transport Mode Enum
export enum TransportModeEnum {
  OCEAN = 5,
  AIR = 10,
  ROAD = 15,
  RAIL = 20,
}

// Service Type Enum
export enum ServiceTypeEnum {
  CY = 5,
  CFS = 10,
}

// Cargo Type Enum
export enum CargoTypeEnum {
  NORMAL = 5,
  REEFER = 10,
  DG = 15,
}

// Status label mappings
export const SHIPMENT_STATUS_LABELS = {
  [ShipmentStatusEnum.DRAFT]: "Draft",
  [ShipmentStatusEnum.CONFIRMED]: "Confirmed",
  [ShipmentStatusEnum.SHIPPED]: "Shipped",
  [ShipmentStatusEnum.BOOKED]: "Booked",
  [ShipmentStatusEnum.MODIFIED]: "Modified",
  [ShipmentStatusEnum.CANCELLED]: "Cancelled",
};

export const TRANSPORT_MODE_LABELS = {
  [TransportModeEnum.OCEAN]: "Ocean",
  [TransportModeEnum.AIR]: "Air",
  [TransportModeEnum.ROAD]: "Road",
  [TransportModeEnum.RAIL]: "Rail",
};

export const SERVICE_TYPE_LABELS = {
  [ServiceTypeEnum.CY]: "CY",
  [ServiceTypeEnum.CFS]: "CFS",
};

export const CARGO_TYPE_LABELS = {
  [CargoTypeEnum.NORMAL]: "Normal",
  [CargoTypeEnum.REEFER]: "Reefer",
  [CargoTypeEnum.DG]: "Dangerous Goods",
};

// Utility functions for status codes
export const getShipmentStatusCode = (status: string | number | undefined | null): number => {
  // If already a number, return it (or default to DRAFT if invalid)
  if (typeof status === 'number') {
    return status || ShipmentStatusEnum.DRAFT;
  }
  
  // If undefined or null, return default
  if (!status || typeof status !== 'string') {
    return ShipmentStatusEnum.DRAFT;
  }
  
  const statusMap: { [key: string]: ShipmentStatusEnum } = {
    'draft': ShipmentStatusEnum.DRAFT,
    'confirmed': ShipmentStatusEnum.CONFIRMED,
    'shipped': ShipmentStatusEnum.SHIPPED,
    'booked': ShipmentStatusEnum.BOOKED,
    'modified': ShipmentStatusEnum.MODIFIED,
    'cancelled': ShipmentStatusEnum.CANCELLED,
  };
  return statusMap[status.toLowerCase()] || ShipmentStatusEnum.DRAFT;
};

export const getShipmentStatusText = (code: number): string => {
  return SHIPMENT_STATUS_LABELS[code as ShipmentStatusEnum] || "Draft";
};

export const getTransportModeCode = (mode: string | number | undefined | null): number => {
  // If already a number, return it (or default to OCEAN if invalid)
  if (typeof mode === 'number') {
    return mode || TransportModeEnum.OCEAN;
  }
  
  // If undefined or null, return default
  if (!mode || typeof mode !== 'string') {
    return TransportModeEnum.OCEAN;
  }
  
  const modeMap: { [key: string]: TransportModeEnum } = {
    'ocean': TransportModeEnum.OCEAN,
    'air': TransportModeEnum.AIR,
    'road': TransportModeEnum.ROAD,
    'rail': TransportModeEnum.RAIL,
  };
  return modeMap[mode.toLowerCase()] || TransportModeEnum.OCEAN;
};

export const getTransportModeText = (code: number): string => {
  return TRANSPORT_MODE_LABELS[code as TransportModeEnum] || "Ocean";
};

export const getServiceTypeCode = (type: string | number | undefined | null): number => {
  // If already a number, return it (or default to CY if invalid)
  if (typeof type === 'number') {
    return type || ServiceTypeEnum.CY;
  }
  
  // If undefined or null, return default
  if (!type || typeof type !== 'string') {
    return ServiceTypeEnum.CY;
  }
  
  const typeMap: { [key: string]: ServiceTypeEnum } = {
    'cy': ServiceTypeEnum.CY,
    'cfs': ServiceTypeEnum.CFS,
  };
  return typeMap[type.toLowerCase()] || ServiceTypeEnum.CY;
};

export const getServiceTypeText = (code: number): string => {
  return SERVICE_TYPE_LABELS[code as ServiceTypeEnum] || "CY";
};

export const getCargoTypeCode = (type: string | number | undefined | null): number => {
  // If already a number, return it (or default to NORMAL if invalid)
  if (typeof type === 'number') {
    return type || CargoTypeEnum.NORMAL;
  }
  
  // If undefined or null, return default
  if (!type || typeof type !== 'string') {
    return CargoTypeEnum.NORMAL;
  }
  
  const typeMap: { [key: string]: CargoTypeEnum } = {
    'normal': CargoTypeEnum.NORMAL,
    'reefer': CargoTypeEnum.REEFER,
    'dg': CargoTypeEnum.DG,
  };
  return typeMap[type.toLowerCase()] || CargoTypeEnum.NORMAL;
};

export const getCargoTypeText = (code: number): string => {
  return CARGO_TYPE_LABELS[code as CargoTypeEnum] || "Normal";
};

// Convert form data to API format with numeric codes
// Note: This function now handles both string and numeric values since the form uses numeric IDs
export const convertFormDataToApiFormat = (formData: any) => {
  return {
    ...formData,
    // Only convert if the value exists and is not already a number
    vendor_booking_status: formData.vendor_booking_status !== undefined 
      ? getShipmentStatusCode(formData.vendor_booking_status)
      : undefined,
    transportation_mode: formData.transportation_mode !== undefined
      ? getTransportModeCode(formData.transportation_mode)
      : undefined,
    service_type: formData.service_type !== undefined
      ? getServiceTypeCode(formData.service_type)
      : undefined,
    cargo_type: formData.cargo_type !== undefined
      ? getCargoTypeCode(formData.cargo_type)
      : undefined,
  };
};

// Convert API response to form format
// Note: The form now uses numeric IDs directly, so we keep the numeric values
// This function is kept for backwards compatibility but doesn't convert to text anymore
export const convertApiResponseToFormFormat = (apiData: any) => {
  return {
    ...apiData,
    // Keep numeric values as-is since the form now uses numeric IDs
    vendor_booking_status: apiData.vendor_booking_status,
    transportation_mode: apiData.transportation_mode,
    service_type: apiData.service_type,
    cargo_type: apiData.cargo_type,
  };
};

// Get status code for filter (for status tabs)
export const getStatusCodeForFilter = (status: string): number | undefined => {
  if (status === "all") return undefined;
  return getShipmentStatusCode(status);
};
