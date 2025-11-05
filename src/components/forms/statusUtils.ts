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
export const getShipmentStatusCode = (status: string): number => {
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

export const getTransportModeCode = (mode: string): number => {
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

export const getServiceTypeCode = (type: string): number => {
  const typeMap: { [key: string]: ServiceTypeEnum } = {
    'cy': ServiceTypeEnum.CY,
    'cfs': ServiceTypeEnum.CFS,
  };
  return typeMap[type.toLowerCase()] || ServiceTypeEnum.CY;
};

export const getServiceTypeText = (code: number): string => {
  return SERVICE_TYPE_LABELS[code as ServiceTypeEnum] || "CY";
};

export const getCargoTypeCode = (type: string): number => {
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
export const convertFormDataToApiFormat = (formData: any) => {
  return {
    ...formData,
    vendor_booking_status: getShipmentStatusCode(formData.vendor_booking_status),
    transportation_mode: getTransportModeCode(formData.transportation_mode),
    service_type: getServiceTypeCode(formData.service_type),
    cargo_type: getCargoTypeCode(formData.cargo_type),
  };
};

// Convert API response to form format with text values
export const convertApiResponseToFormFormat = (apiData: any) => {
  return {
    ...apiData,
    vendor_booking_status: getShipmentStatusText(apiData.vendor_booking_status),
    transportation_mode: getTransportModeText(apiData.transportation_mode),
    service_type: getServiceTypeText(apiData.service_type),
    cargo_type: getCargoTypeText(apiData.cargo_type),
  };
};

// Get status code for filter (for status tabs)
export const getStatusCodeForFilter = (status: string): number | undefined => {
  if (status === "all") return undefined;
  return getShipmentStatusCode(status);
};
