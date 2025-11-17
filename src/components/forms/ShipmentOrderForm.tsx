// normal 
"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import Input from "@/components/form/input/InputField";
import DatePicker from "@/components/form/input/DatePicker";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { 
  ShipmentOrderFormData, 
  ShipmentOrderStatus,
  TransportationMode,
  ServiceType,
  CargoType,
  VENDOR_BOOKING_STATUS_OPTIONS,
  TRANSPORTATION_MODE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  CARGO_TYPE_OPTIONS,
  INCOTERM_OPTIONS,
  PAYMENT_TERM_OPTIONS,
  CustomerDynamicField,
  EquipmentType,
  ShipmentType,
  Carrier
} from "@/types/shipmentOrder";
import { ShipmentOrderInput, ShipmentFieldValue } from "@/services/shipmentOrderService";
import { 
  getCustomerDynamicFieldsById,
  type DynamicField 
} from "@/utils/customerDynamicFieldsUtils";
import { shipmentOrderService } from "@/services/shipmentOrderService";
import { polService } from "@/services/polService";
import { podService } from "@/services/podService";
import { customerService } from "@/services/customerService";
import { userCustomerService } from "@/services/userCustomerService";
import { POLResponse, PODResponse, CustomerResponse } from "@/types/api";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import { PlusIcon, TrashBinIcon, ChevronDownIcon } from "@/icons";

// Form validation schema - updated for numeric IDs
const shipmentOrderSchema = z.object({
  vendor_booking_status: z.number().optional(),
  shipper: z.string().min(1, "Shipper is required"),
  consignee: z.string().min(1, "Consignee is required"),
  transportation_mode: z.number().optional(),
  cargo_readiness_date: z.string()
    .min(1, "Cargo readiness date is required")
    .refine((date) => {
      if (!date) return false;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Please enter a valid date"),
  service_type: z.number().min(1, "Service type is required"),
  notify_party_1: z.string().optional(),
  notify_party_2: z.string().optional(),
  origin_agent: z.string().optional(),
  destination_agent: z.string().optional(),
  hs_code: z.string().min(1, "HS Code is required"),
  cargo_description: z.string().optional(),
  marks_and_numbers: z.string().optional(),
  cargo_type: z.number().optional(),
  dangerous_goods_notes: z.string().optional(),
  place_of_receipt: z.string().optional(),
  place_of_delivery: z.string().optional(),
  carrier: z.number().optional(),
  carrier_booking_number: z.string().optional(),
  customer: z.number().min(1, "Customer is required"),
  pol: z.number().optional(),
  pod: z.number().optional(),
  pickup_address: z.string().optional(),
  equipment_type: z.number().optional(),
  shipment_type: z.number().optional(),
  equipment_count: z.string().optional(),
  equipment_no: z.string().optional(),
  vessel_name: z.string().optional(),
  carrier_service_contract: z.string().optional(),
  incoterm: z.number().optional(),
  payment_terms: z.number().optional(),
  customer_reference: z.string().optional(),
  vendor_reference: z.string().optional(),
  agent_reference: z.string().optional(),
  volume_booked: z.number().optional(),
  volume_actual: z.number().optional(),
  volume_shipped: z.number().optional(),
  weight_booked: z.number().optional(),
  weight_actual: z.number().optional(),
  weight_shipped: z.number().optional(),
  quantity_booked: z.number().optional(),
  quantity_actual: z.number().optional(),
  quantity_shipped: z.number().optional(),
  custom_field_values: z.array(z.object({
    field: z.union([z.number(), z.string()]),
    value: z.string()
  })).optional(),
}).refine((data) => {
  // Dangerous goods validation (cargo_type 15 = Dangerous Goods)
  if (data.cargo_type === 15 && !data.dangerous_goods_notes?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Dangerous goods notes are required when cargo type is Dangerous Goods",
  path: ["dangerous_goods_notes"],
});

export type ShipmentOrderFormSchema = z.infer<typeof shipmentOrderSchema>;

interface ShipmentOrderFormProps {
  initialData?: ShipmentOrderFormData;
  onSubmit: (data: ShipmentOrderFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const ShipmentOrderForm: React.FC<ShipmentOrderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {

  console.log("initialData", initialData);
  const [customerDynamicFields, setCustomerDynamicFields] = useState<CustomerDynamicField[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<{[key: string]: string}>({});
  const [isClient, setIsClient] = useState(false);
  const [isLoadingCustomerFields, setIsLoadingCustomerFields] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | null>(null);
  const [selectedShipmentType, setSelectedShipmentType] = useState<ShipmentType | null>(null);
  const [selectedPOL, setSelectedPOL] = useState<POLResponse | null>(null);
  const [selectedPOD, setSelectedPOD] = useState<PODResponse | null>(null);
  
  // 🔧 OPTIMIZATION 1: Enhanced caching with metadata
  const customerCacheRef = useRef<Map<number, {
    data: CustomerResponse;
    timestamp: number;
  }>>(new Map());
  
  // 🔧 OPTIMIZATION 2: Track in-flight requests to prevent duplicates
  const pendingRequestsRef = useRef<Map<string, Promise<any>>>(new Map());
  
  // 🔧 OPTIMIZATION 3: Debounce timer refs
  const debounceTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // 🔧 OPTIMIZATION 4: Track initialization state
  const isInitializedRef = useRef(false);
  const initialDataIdRef = useRef<number | undefined>(undefined);

  const {
    register,
    handleSubmit,
    reset,
    formState,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm<ShipmentOrderFormSchema>({
    resolver: zodResolver(shipmentOrderSchema),
    defaultValues: {
      vendor_booking_status: undefined,
      shipper: "",
      consignee: "",
      transportation_mode: undefined,
      cargo_readiness_date: "",
      service_type: undefined,
      notify_party_1: "",
      notify_party_2: "",
      origin_agent: "",
      destination_agent: "",
      hs_code: "",
      cargo_description: "",
      marks_and_numbers: "",
      cargo_type: undefined,
      dangerous_goods_notes: "",
      place_of_receipt: "",
      place_of_delivery: "",
      carrier: undefined,
      carrier_booking_number: "",
      customer: 0,
      pol: undefined,
      pod: undefined,
      pickup_address: "",
      equipment_type: undefined,
      shipment_type: undefined,
      equipment_count: "",
      equipment_no: "",
      vessel_name: "",
      carrier_service_contract: "",
      incoterm: undefined,
      payment_terms: undefined,
      customer_reference: "",
      vendor_reference: "",
      agent_reference: "",
      volume_booked: undefined,
      volume_actual: undefined,
      volume_shipped: undefined,
      weight_booked: undefined,
      weight_actual: undefined,
      weight_shipped: undefined,
      quantity_booked: undefined,
      quantity_actual: undefined,
      quantity_shipped: undefined,
      custom_field_values: [],
    },
  });

  const isEditing = !!initialData?.id; // ✅ Check for id, not just initialData
  const selectedCustomerId = watch("customer");
  const cargoType = watch("cargo_type");
  
  // Watch custom field values to trigger form updates
  const watchedCustomFieldValues = watch("custom_field_values");
  
  // Watch actual fields to auto-populate shipped fields
  const volumeActual = watch("volume_actual");
  const weightActual = watch("weight_actual");
  const quantityActual = watch("quantity_actual");

  // 🔧 OPTIMIZATION 5: Memoized cache helper functions
  const getCachedCustomer = useCallback((customerId: number, maxAge = 5 * 60 * 1000) => {
    const cached = customerCacheRef.current.get(customerId);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      customerCacheRef.current.delete(customerId);
      return null;
    }
    
    return cached.data;
  }, []);

  const setCachedCustomer = useCallback((customerId: number, data: CustomerResponse) => {
    customerCacheRef.current.set(customerId, {
      data,
      timestamp: Date.now()
    });
  }, []);

  // 🔧 OPTIMIZATION 6: Deduplicated API call wrapper
  const callWithDeduplication = useCallback(async <T,>(
    key: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    // Check if request is already pending
    const pending = pendingRequestsRef.current.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Create new request
    const request = apiCall().finally(() => {
      pendingRequestsRef.current.delete(key);
    });

    pendingRequestsRef.current.set(key, request);
    return request;
  }, []);

  // 🔧 OPTIMIZATION 7: Optimized customer data loader with caching and deduplication
  const loadCustomerData = useCallback(async (customerId: number) => {
    if (!customerId) return null;

    // Check cache first
    const cached = getCachedCustomer(customerId);
    if (cached) {
      console.log(`Using cached customer data for ID: ${customerId}`);
      return cached;
    }

    // Use deduplicated API call - now using userCustomerService
    const customer = await callWithDeduplication(
      `customer-${customerId}`,
      () => userCustomerService.getUserCustomer(customerId)
    );

    if (customer) {
      setCachedCustomer(customerId, customer);
    }
    return customer;
  }, [getCachedCustomer, setCachedCustomer, callWithDeduplication]);

  // 🔧 OPTIMIZATION 8: Optimized dynamic fields loader
  const loadCustomerDynamicFields = useCallback(async (customerId: number) => {
    if (!customerId || !isClient) {
      setCustomerDynamicFields([]);
      setCustomFieldValues({});
      setValue("custom_field_values", []);
      return;
    }

    try {
      setIsLoadingCustomerFields(true);
      
      const customer = await loadCustomerData(customerId);
      
      if (!customer) {
        setCustomerDynamicFields([]);
        setCustomFieldValues({});
        setValue("custom_field_values", []);
        return;
      }

      if (customer.custom_fields && customer.custom_fields.length > 0) {
        const dynamicFields: CustomerDynamicField[] = customer.custom_fields.map((field) => ({
          id: field.id?.toString() || '',
          label: field.name,
          value: ''
        }));
        setCustomerDynamicFields(dynamicFields);
        
        const customFieldValuesArray = customer.custom_fields.map((field) => {
          const existingValue = initialData?.custom_field_values?.find(
            cfv => cfv.field === field.id
          );
          
          return {
            field: field.id || 0,
            value: existingValue?.value || ''
          };
        });
        
        setValue("custom_field_values", customFieldValuesArray, { 
          shouldValidate: false,
          shouldDirty: false 
        });
        
        if (initialData?.custom_field_values) {
          const fieldValuesMap: {[key: string]: string} = {};
          initialData.custom_field_values.forEach(cfv => {
            fieldValuesMap[cfv.field.toString()] = cfv.value;
          });
          setCustomFieldValues(fieldValuesMap);
        } else {
          setCustomFieldValues({});
        }
      } else {
        setCustomerDynamicFields([]);
        setValue("custom_field_values", []);
        setCustomFieldValues({});
      }
    } catch (error) {
      console.error("Failed to load customer dynamic fields:", error);
      setCustomerDynamicFields([]);
      setValue("custom_field_values", []);
      setCustomFieldValues({});
    } finally {
      setIsLoadingCustomerFields(false);
    }
  }, [isClient, setValue, initialData, loadCustomerData]);

  // 🔧 OPTIMIZATION 9: Effect with proper dependency tracking
  useEffect(() => {
    // Skip if not initialized yet
    if (!isInitializedRef.current) return;
    
    // Skip if customer hasn't changed
    if (!selectedCustomerId) {
      setCustomerDynamicFields([]);
      setCustomFieldValues({});
      setValue("custom_field_values", []);
      return;
    }

    loadCustomerDynamicFields(selectedCustomerId);
  }, [selectedCustomerId, loadCustomerDynamicFields, setValue]);
  
  // Auto-populate shipped fields from actual fields
  useEffect(() => {
    if (volumeActual !== undefined && volumeActual !== null) {
      setValue("volume_shipped", volumeActual as number, { shouldValidate: false, shouldDirty: false });
    } else {
      setValue("volume_shipped", undefined, { shouldValidate: false, shouldDirty: false });
    }
  }, [volumeActual, setValue]);
  
  useEffect(() => {
    if (weightActual !== undefined && weightActual !== null) {
      setValue("weight_shipped", weightActual as number, { shouldValidate: false, shouldDirty: false });
    } else {
      setValue("weight_shipped", undefined, { shouldValidate: false, shouldDirty: false });
    }
  }, [weightActual, setValue]);
  
  useEffect(() => {
    if (quantityActual !== undefined && quantityActual !== null) {
      setValue("quantity_shipped", quantityActual as number, { shouldValidate: false, shouldDirty: false });
    } else {
      setValue("quantity_shipped", undefined, { shouldValidate: false, shouldDirty: false });
    }
  }, [quantityActual, setValue]);


  // 🔧 OPTIMIZATION 10: Single initialization effect
  useEffect(() => {
    setIsClient(true);
    
    // Skip if already initialized with same data
    if (isInitializedRef.current && initialDataIdRef.current === initialData?.id) {
      return;
    }
    
    isInitializedRef.current = true;
    initialDataIdRef.current = initialData?.id;

    if (initialData) {
      console.log("Initializing form with data:", initialData);
      
      const transformedData = {
        ...initialData,
        cargo_readiness_date: initialData.cargo_readiness_date 
          ? (() => {
              try {
                const date = new Date(initialData.cargo_readiness_date);
                if (isNaN(date.getTime())) {
                  console.warn("Invalid date format:", initialData.cargo_readiness_date);
                  return initialData.cargo_readiness_date;
                }
                return date.toISOString().split('T')[0];
              } catch (error) {
                console.warn("Error parsing date:", error);
                return initialData.cargo_readiness_date;
              }
            })()
          : initialData.cargo_readiness_date,
        custom_field_values: []
      };
      
      reset(transformedData);

      // Auto-populate shipped fields
      if (initialData.volume_actual !== undefined && initialData.volume_actual !== null) {
        setValue("volume_shipped", initialData.volume_actual, { shouldValidate: false, shouldDirty: false });
      }
      if (initialData.weight_actual !== undefined && initialData.weight_actual !== null) {
        setValue("weight_shipped", initialData.weight_actual, { shouldValidate: false, shouldDirty: false });
      }
      if (initialData.quantity_actual !== undefined && initialData.quantity_actual !== null) {
        setValue("quantity_shipped", initialData.quantity_actual, { shouldValidate: false, shouldDirty: false });
      }

      // Load initial customer data
      const loadInitialCustomerData = async () => {
        if (initialData.customer) {
          try {
            setIsLoadingCustomerFields(true);
            
            const customer = await loadCustomerData(initialData.customer);
            
            if (!customer) {
              setCustomerDynamicFields([]);
              setCustomFieldValues({});
              setValue("custom_field_values", []);
              setSelectedCustomer(null);
              return;
            }
            
            setSelectedCustomer(customer);

            if (customer.custom_fields && customer.custom_fields.length > 0) {
              const dynamicFields: CustomerDynamicField[] = customer.custom_fields.map((field) => ({
                id: field.id?.toString() || '',
                label: field.name,
                value: ''
              }));
              setCustomerDynamicFields(dynamicFields);
              
              const customFieldValuesArray = customer.custom_fields.map((field) => ({
                field: field.id || 0,
                value: ''
              }));
              
              if (initialData.custom_field_values && initialData.custom_field_values.length > 0) {
                const fieldValuesMap: {[key: string]: string} = {};
                initialData.custom_field_values.forEach(cfv => {
                  fieldValuesMap[cfv.field.toString()] = cfv.value;
                });
                setCustomFieldValues(fieldValuesMap);
                
                const populatedCustomFieldValues = customer.custom_fields.map((field) => {
                  const existingValue = initialData.custom_field_values?.find(cfv => cfv.field === field.id);
                  return {
                    field: field.id || 0,
                    value: existingValue?.value || ''
                  };
                });
                setValue("custom_field_values", populatedCustomFieldValues);
              } else {
                setCustomFieldValues({});
                setValue("custom_field_values", customFieldValuesArray);
              }
            } else {
              setCustomerDynamicFields([]);
              setCustomFieldValues({});
              setValue("custom_field_values", []);
            }
          } catch (error) {
            console.error("Failed to load customer data for edit:", error);
            setCustomerDynamicFields([]);
            setCustomFieldValues({});
            setValue("custom_field_values", []);
          } finally {
            setIsLoadingCustomerFields(false);
          }
        } else {
          setCustomerDynamicFields([]);
          setCustomFieldValues({});
          setValue("custom_field_values", []);
          setSelectedCustomer(null);
        }
      };

      loadInitialCustomerData();

    } else {
      setCustomerDynamicFields([]);
      setCustomFieldValues({});
      setValue("custom_field_values", []);
      setSelectedCustomer(null);
    }
  }, [initialData?.id, reset, setValue, loadCustomerData]); // 🔧 Only depend on ID to prevent re-runs


  // 🔧 OPTIMIZATION 11: Memoized search functions with caching
  const searchPOLs = useCallback(async (query: string): Promise<POLResponse[]> => {
    try {
      return await callWithDeduplication(
        `pol-search-${query}`,
        () => polService.searchPOLs(query, 10)
      );
    } catch (error) {
      console.error("Failed to search POLs:", error);
      return [];
    }
  }, [callWithDeduplication]);

  const searchPODs = useCallback(async (query: string): Promise<PODResponse[]> => {
    try {
      return await callWithDeduplication(
        `pod-search-${query}`,
        () => podService.searchPODs(query, 10)
      );
    } catch (error) {
      console.error("Failed to search PODs:", error);
      return [];
    }
  }, [callWithDeduplication]);

  const searchCustomers = useCallback(async (query: string): Promise<CustomerResponse[]> => {
    try {
      return await callWithDeduplication(
        `customer-search-${query}`,
        () => userCustomerService.searchUserCustomers(query)
      );
    } catch (error) {
      console.error("Failed to search customers:", error);
      return [];
    }
  }, [callWithDeduplication]);

  const searchCarriers = useCallback(async (query: string): Promise<any[]> => {
    try {
      const carriers = await callWithDeduplication(
        `carrier-search-${query}`,
        () => shipmentOrderService.searchCarriers(query, 50)
      );
      return carriers.map((c: Carrier) => ({
        id: c.id,
        name: c.name,
        carrier_code: c.carrier_code,
      }));
    } catch (error) {
      console.error("Failed to search carriers:", error);
      return [];
    }
  }, [callWithDeduplication]);

  const searchEquipmentTypes = useCallback(async (query: string): Promise<any[]> => {
    try {
      const equipmentTypes = await callWithDeduplication(
        `equipment-search-${query}`,
        () => shipmentOrderService.searchEquipmentTypes(query, 50)
      );
      return equipmentTypes.map((e: EquipmentType) => ({
        id: e.id,
        name: e.equipment_name,
        equipment_name: e.equipment_name,
        equipment_category: e.equipment_category,
      }));
    } catch (error) {
      console.error("Failed to search equipment types:", error);
      return [];
    }
  }, [callWithDeduplication]);

  const searchShipmentTypes = useCallback(async (query: string): Promise<any[]> => {
    try {
      const shipmentTypes = await callWithDeduplication(
        `shipment-search-${query}`,
        () => shipmentOrderService.searchShipmentTypes(query, 50)
      );
      return shipmentTypes.map((s: ShipmentType) => ({
        id: s.id,
        name: s.shipment_type_name,
        shipment_type_name: s.shipment_type_name,
        description: s.description,
      }));
    } catch (error) {
      console.error("Failed to search shipment types:", error);
      return [];
    }
  }, [callWithDeduplication]);


  // Memoize custom field value handler to prevent re-renders
  const handleCustomFieldChange = useCallback((fieldId: string, value: string) => {
    // Update local state for UI display (if needed)
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Note: Controller handles React Hook Form updates automatically
  }, []);

  // Memoize form submission handler
  const handleFormSubmit = useCallback((data: ShipmentOrderFormSchema) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", errors);
    console.log("Current form values:", watch());
    console.log("Form state:", formState);
    
    // Filter out empty custom field values
    const custom_field_values: ShipmentFieldValue[] = (data.custom_field_values || [])
      .filter(cfv => cfv && cfv.field && cfv.value && cfv.value.trim().length > 0)
      .map(cfv => ({
        field: typeof cfv.field === 'string' ? parseInt(cfv.field) : cfv.field,
        value: cfv.value.trim()
      }));
    
    console.log("Filtered custom field values:", custom_field_values);
    
    // Transform data for API (now using numeric IDs directly)
    const transformedData: ShipmentOrderInput = {
      ...data,
      cargo_readiness_date: data.cargo_readiness_date 
        ? new Date(data.cargo_readiness_date).toISOString()
        : data.cargo_readiness_date,
      cargo_description: data.cargo_description || undefined,
      marks_and_numbers: data.marks_and_numbers || undefined,
      dangerous_goods_notes: data.dangerous_goods_notes || undefined,
      place_of_receipt: data.place_of_receipt || undefined,
      place_of_delivery: data.place_of_delivery || undefined,
      carrier: data.carrier || undefined,
      carrier_booking_number: data.carrier_booking_number || undefined,
      notify_party_1: data.notify_party_1 || undefined,
      notify_party_2: data.notify_party_2 || undefined,
      origin_agent: data.origin_agent || undefined,
      destination_agent: data.destination_agent || undefined,
      pickup_address: data.pickup_address || undefined,
      equipment_count: data.equipment_count || undefined,
      equipment_no: data.equipment_no || undefined,
      vessel_name: data.vessel_name || undefined,
      carrier_service_contract: data.carrier_service_contract || undefined,
      customer_reference: data.customer_reference || undefined,
      vendor_reference: data.vendor_reference || undefined,
      agent_reference: data.agent_reference || undefined,
      volume_booked: data.volume_booked || undefined,
      volume_actual: data.volume_actual || undefined,
      volume_shipped: data.volume_shipped || undefined,
      weight_booked: data.weight_booked || undefined,
      weight_actual: data.weight_actual || undefined,
      weight_shipped: data.weight_shipped || undefined,
      quantity_booked: data.quantity_booked || undefined,
      quantity_actual: data.quantity_actual || undefined,
      quantity_shipped: data.quantity_shipped || undefined,
      custom_field_values: custom_field_values.length > 0 ? custom_field_values : undefined
    };
    
    console.log("Transformed data for API:", transformedData);
    onSubmit(transformedData as any);
  }, [errors, onSubmit, watch, formState]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  }, [onCancel]);

  const handleUpdate = useCallback(() => {
    const formData = watch();
    console.log("Form submitted with data:", formData);
    
    // Filter out empty custom field values
    const custom_field_values: ShipmentFieldValue[] = (formData.custom_field_values || [])
      .filter(cfv => cfv && cfv.field && cfv.value && cfv.value.trim().length > 0)
      .map(cfv => ({
        field: typeof cfv.field === 'string' ? parseInt(cfv.field) : cfv.field,
        value: cfv.value.trim()
      }));
    
    // Transform data for API (now using numeric IDs directly)
    const transformedData: ShipmentOrderInput = {
      ...formData,
      cargo_readiness_date: formData.cargo_readiness_date 
        ? new Date(formData.cargo_readiness_date).toISOString()
        : formData.cargo_readiness_date,
      cargo_description: formData.cargo_description || undefined,
      marks_and_numbers: formData.marks_and_numbers || undefined,
      dangerous_goods_notes: formData.dangerous_goods_notes || undefined,
      place_of_receipt: formData.place_of_receipt || undefined,
      place_of_delivery: formData.place_of_delivery || undefined,
      carrier: formData.carrier || undefined,
      carrier_booking_number: formData.carrier_booking_number || undefined,
      notify_party_1: formData.notify_party_1 || undefined,
      notify_party_2: formData.notify_party_2 || undefined,
      origin_agent: formData.origin_agent || undefined,
      destination_agent: formData.destination_agent || undefined,
      pickup_address: formData.pickup_address || undefined,
      equipment_count: formData.equipment_count || undefined,
      equipment_no: formData.equipment_no || undefined,
      vessel_name: formData.vessel_name || undefined,
      carrier_service_contract: formData.carrier_service_contract || undefined,
      customer_reference: formData.customer_reference || undefined,
      vendor_reference: formData.vendor_reference || undefined,
      agent_reference: formData.agent_reference || undefined,
      volume_booked: formData.volume_booked || undefined,
      volume_actual: formData.volume_actual || undefined,
      volume_shipped: formData.volume_shipped || undefined,
      weight_booked: formData.weight_booked || undefined,
      weight_actual: formData.weight_actual || undefined,
      weight_shipped: formData.weight_shipped || undefined,
      quantity_booked: formData.quantity_booked || undefined,
      quantity_actual: formData.quantity_actual || undefined,
      quantity_shipped: formData.quantity_shipped || undefined,
      custom_field_values: custom_field_values.length > 0 ? custom_field_values : undefined
    };
    
    console.log("Transformed data for API:", transformedData);
    onSubmit(transformedData as any);
  }, [onSubmit, watch]);
  
  // 🔧 OPTIMIZATION 12: Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timers
      debounceTimersRef.current.forEach(timer => clearTimeout(timer));
      debounceTimersRef.current.clear();
      
      // Clear pending requests
      pendingRequestsRef.current.clear();
    };
  }, []);


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 bg-white overflow-visible">
      {/* General Section - Accordion */}
      <Disclosure defaultOpen={true}>
        {({ open }) => (
          <div className="rounded-lg border border-gray-200 overflow-visible">
            <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">General</h3>
              <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel className="bg-white px-6 pb-6 overflow-visible relative z-10">
              {/* Transportation Mode, Cargo Readiness Date, Service Type, Incoterm */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4 overflow-visible">
                <div>
                  <Label htmlFor="transportation_mode" required>Transportation Mode</Label>
                  <select
                    id="transportation_mode"
                    {...register("transportation_mode", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Transportation Mode</option>
                    {TRANSPORTATION_MODE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.transportation_mode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.transportation_mode.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Controller
                    name="cargo_readiness_date"
                    control={control}
                    rules={{ required: "Cargo readiness date is required" }}
                    render={({ field, fieldState }) => (
                      <DatePicker
                        id="cargo_readiness_date"
                        label="Cargo Readiness Date"
                        required
                        placeholder="DD/MM/YYYY"
                        value={field.value || ""}
                        onChange={(value) => field.onChange(value)}
                        onBlur={field.onBlur}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                
                <div>
                  <Label htmlFor="service_type" required>Service Type</Label>
                  <select
                    id="service_type"
                    {...register("service_type", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Service Type</option>
                    {SERVICE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.service_type && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.service_type.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="incoterm" required>Incoterm</Label>
                  <select
                    id="incoterm"
                    {...register("incoterm", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select incoterm</option>
                    {INCOTERM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.incoterm && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.incoterm.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Payment Terms */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 overflow-visible">
                <div>
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <select
                    id="payment_terms"
                    {...register("payment_terms", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Payment Terms</option>
                    {PAYMENT_TERM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.payment_terms && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.payment_terms.message}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Customer Reference, Vendor Reference, Agent Reference */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 overflow-visible">
                <div>
                  <Label htmlFor="customer_reference">Customer Reference</Label>
                  <Input
                    id="customer_reference"
                    {...register("customer_reference")}
                    placeholder="Enter Customer Reference"
                    error={errors.customer_reference?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_reference">Vendor Reference</Label>
                  <Input
                    id="vendor_reference"
                    {...register("vendor_reference")}
                    placeholder="Enter Vendor Reference"
                    error={errors.vendor_reference?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="agent_reference">Agent Reference</Label>
                  <Input
                    id="agent_reference"
                    {...register("agent_reference")}
                    placeholder="Enter Agent Reference"
                    error={errors.agent_reference?.message}
                  />
                </div>
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Parties Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="rounded-lg border border-gray-200 overflow-visible">
            <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Parties</h3>
              <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel className="bg-white px-6 pb-6 overflow-visible relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-visible">
                <div>
                  <Label htmlFor="shipper" required>Shipper</Label>
                  <Input
                    id="shipper"
                    {...register("shipper")}
                    placeholder="Enter shipper name"
                    error={errors.shipper?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="consignee" required>Consignee</Label>
                  <Input
                    id="consignee"
                    {...register("consignee")}
                    placeholder="Enter consignee name"
                    error={errors.consignee?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="notify_party_1">Notify Party 1</Label>
                  <Input
                    id="notify_party_1"
                    {...register("notify_party_1")}
                    placeholder="Enter notify party 1"
                    error={errors.notify_party_1?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="notify_party_2">Notify Party 2</Label>
                  <Input
                    id="notify_party_2"
                    {...register("notify_party_2")}
                    placeholder="Enter notify party 2"
                    error={errors.notify_party_2?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="pickup_address">Pickup Address</Label>
                  <Input
                    id="pickup_address"
                    {...register("pickup_address")}
                    placeholder="Enter pickup address"
                    error={errors.pickup_address?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="origin_agent">Origin Agent</Label>
                  <Input
                    id="origin_agent"
                    {...register("origin_agent")}
                    placeholder="Enter origin agent"
                    error={errors.origin_agent?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="destination_agent">Destination Agent</Label>
                  <Input
                    id="destination_agent"
                    {...register("destination_agent")}
                    placeholder="Enter destination agent"
                    error={errors.destination_agent?.message}
                  />
                </div>
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Routes Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="rounded-lg border border-gray-200 overflow-visible">
            <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Routes</h3>
              <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel className="bg-white px-6 pb-6 overflow-visible relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-visible">
                <div>
                  <Label htmlFor="place_of_receipt">Place of Receipt</Label>
                  <Input
                    id="place_of_receipt"
                    {...register("place_of_receipt")}
                    placeholder="Enter place of receipt"
                    error={errors.place_of_receipt?.message}
                  />
                </div>
                
                <div className="overflow-visible">
                <SearchableSelect
                  id="pol"
                  label="Port of Loading (POL)"
                  placeholder="Search for POL"
                  value={selectedPOL?.id || watch("pol") || null}
                  onChange={(value) => {
                    const polId = value as number;
                    setValue("pol", polId || undefined);
                    searchPOLs("").then(results => {
                      const found = results.find((p: POLResponse) => p.id === polId);
                      setSelectedPOL(found || null);
                    });
                  }}
                  onSearch={async (query: string) => {
                    const results = await searchPOLs(query);
                    if (selectedPOL && !query && !results.find((r: POLResponse) => r.id === selectedPOL.id)) {
                      return [selectedPOL, ...results];
                    }
                    return results;
                  }}
                  error={errors.pol?.message}
                  displayFormat={(option) => `${option.name} (${option.code})`}
                  searchPlaceholder="Search POLs..."
                  valueExtractor={(option) => option.id}
                />
                </div>
                
                <div className="overflow-visible">
                <SearchableSelect
                  id="pod"
                  label="Port of Discharge (POD)"
                  placeholder="Search for POD"
                  value={selectedPOD?.id || watch("pod") || null}
                  onChange={(value) => {
                    const podId = value as number;
                    setValue("pod", podId || undefined);
                    searchPODs("").then(results => {
                      const found = results.find((p: PODResponse) => p.id === podId);
                      setSelectedPOD(found || null);
                    });
                  }}
                  onSearch={async (query: string) => {
                    const results = await searchPODs(query);
                    if (selectedPOD && !query && !results.find((r: PODResponse) => r.id === selectedPOD.id)) {
                      return [selectedPOD, ...results];
                    }
                    return results;
                  }}
                  error={errors.pod?.message}
                  displayFormat={(option) => `${option.name} (${option.code})`}
                  searchPlaceholder="Search PODs..."
                  valueExtractor={(option) => option.id}
                />
                </div>
                
                <div>
                  <Label htmlFor="place_of_delivery">Place of Delivery</Label>
                  <Input
                    id="place_of_delivery"
                    {...register("place_of_delivery")}
                    placeholder="Enter place of delivery"
                    error={errors.place_of_delivery?.message}
                  />
                </div>
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Cargo Details Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="rounded-lg border border-gray-200 overflow-visible">
            <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Cargo Details</h3>
              <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel className="bg-white px-6 pb-6 overflow-visible relative z-10">
              {/* Volume Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-4 overflow-visible">
                <div>
                  <Label htmlFor="volume_booked" required>Volume Booked</Label>
                  <Input
                    id="volume_booked"
                    type="number"
                    step="0.001"
                    {...register("volume_booked", { valueAsNumber: true })}
                    placeholder="Enter volume booked"
                    error={errors.volume_booked?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="volume_actual" required>Volume Actual</Label>
                  <Input
                    id="volume_actual"
                    type="number"
                    step="0.001"
                    {...register("volume_actual", { valueAsNumber: true })}
                    placeholder="Enter volume actual"
                    error={errors.volume_actual?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="volume_shipped" required>Volume Shipped</Label>
                  <Input
                    id="volume_shipped"
                    type="number"
                    step="0.001"
                    
                    {...register("volume_shipped", { valueAsNumber: true })}
                    placeholder="Auto-populated from Volume Actual"
                    error={errors.volume_shipped?.message}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              
              {/* Weight Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 overflow-visible">
                <div>
                  <Label htmlFor="weight_booked" required>Weight Booked</Label>
                  <Input
                    id="weight_booked"
                    type="number"
                    step="0.01"
                    {...register("weight_booked", { valueAsNumber: true })}
                    placeholder="Enter weight booked"
                    error={errors.weight_booked?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="weight_actual" required>Weight Actual</Label>
                  <Input
                    id="weight_actual"
                    type="number"
                    step="0.01"
                    {...register("weight_actual", { valueAsNumber: true })}
                    placeholder="Enter weight actual"
                    error={errors.weight_actual?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="weight_shipped" required>Weight Shipped</Label>
                  <Input
                    id="weight_shipped"
                    type="number"
                    step="0.01"
                    
                    {...register("weight_shipped", { valueAsNumber: true })}
                    placeholder="Auto-populated from Weight Actual"
                    error={errors.weight_shipped?.message}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              
              {/* Quantity Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 overflow-visible">
                <div>
                  <Label htmlFor="quantity_booked" required>Quantity (Packages) Booked</Label>
                  <Input
                    id="quantity_booked"
                    type="number"
                    step="0.01"
                    {...register("quantity_booked", { valueAsNumber: true })}
                    placeholder="Enter quantity booked"
                    error={errors.quantity_booked?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity_actual" required>Quantity (Packages) Actual</Label>
                  <Input
                    id="quantity_actual"
                    type="number"
                    step="0.01"
                    {...register("quantity_actual", { valueAsNumber: true })}
                    placeholder="Enter quantity actual"
                    error={errors.quantity_actual?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity_shipped" required>Quantity (Packages) Shipped</Label>
                  <Input
                    id="quantity_shipped"
                    type="number"
                    step="0.01"
                    
                    {...register("quantity_shipped", { valueAsNumber: true })}
                    placeholder="Auto-populated from Quantity Actual"
                    error={errors.quantity_shipped?.message}
                    disabled
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
              
              {/* HS Code and Cargo Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 overflow-visible">
                <div>
                  <Label htmlFor="hs_code">HS Code</Label>
                  <Input
                    id="hs_code"
                    {...register("hs_code")}
                    placeholder="Enter HS code"
                    error={errors.hs_code?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="cargo_type" required>Cargo Type</Label>
                  <select
                    id="cargo_type"
                    {...register("cargo_type", { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select cargo type</option>
                    {CARGO_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.cargo_type && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.cargo_type.message}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <Label htmlFor="cargo_description">Cargo Description</Label>
                <textarea
                  id="cargo_description"
                  {...register("cargo_description")}
                  placeholder="Enter cargo description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  rows={3}
                />
                {errors.cargo_description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.cargo_description.message}
                  </p>
                )}
              </div>
              
              <div className="mt-6">
                <Label htmlFor="marks_and_numbers">Marks & Numbers</Label>
                <Input
                  id="marks_and_numbers"
                  {...register("marks_and_numbers")}
                  placeholder="Enter marks and numbers"
                  error={errors.marks_and_numbers?.message}
                />
              </div>
              
              {cargoType === 15 && (
                <div className="mt-6">
                  <Label htmlFor="dangerous_goods_notes" required>Dangerous Goods Notes</Label>
                  <textarea
                    id="dangerous_goods_notes"
                    {...register("dangerous_goods_notes")}
                    placeholder="Enter dangerous goods notes"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                  {errors.dangerous_goods_notes && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.dangerous_goods_notes.message}
                    </p>
                  )}
                </div>
              )}
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Carrier & Equipment Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="rounded-lg border border-gray-200 overflow-visible">
            <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Carrier & Equipment</h3>
              <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel className="bg-white px-6 pb-6 overflow-visible relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 overflow-visible">
                <div className="overflow-visible">
                <SearchableSelect
                  id="carrier"
                  label="Carrier"
                  placeholder="Search for carrier"
                  value={selectedCarrier?.id || watch("carrier") || null}
                  onChange={(value) => {
                    const carrierId = value as number;
                    setValue("carrier", carrierId || undefined);
                    searchCarriers("").then(results => {
                      const found = results.find((c: Carrier) => c.id === carrierId);
                      setSelectedCarrier(found || null);
                    });
                  }}
                  onSearch={async (query: string) => {
                    const results = await searchCarriers(query);
                    if (selectedCarrier && !query && !results.find((r: Carrier) => r.id === selectedCarrier.id)) {
                      return [selectedCarrier, ...results];
                    }
                    return results;
                  }}
                  error={errors.carrier?.message}
                  displayFormat={(option: any) => `${option.name}${option.carrier_code ? ` (${option.carrier_code})` : ''}`}
                  searchPlaceholder="Search carriers..."
                  valueExtractor={(option) => option.id}
                />
                </div>
                <div>
                  <Label htmlFor="vessel_name">Vessel Name / Voyage</Label>
                  <Input
                    id="vessel_name"
                    {...register("vessel_name")}
                    placeholder="Enter vessel name"
                    error={errors.vessel_name?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="carrier_service_contract">Carrier Service Contract #</Label>
                  <Input
                    id="carrier_service_contract"
                    {...register("carrier_service_contract")}
                    placeholder="Enter carrier service contract"
                    error={errors.carrier_service_contract?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="carrier_booking_number" required>Carrier Booking Number</Label>
                  <Input
                    id="carrier_booking_number"
                    {...register("carrier_booking_number")}
                    placeholder="Enter carrier booking number"
                    error={errors.carrier_booking_number?.message}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 overflow-visible">
                <div>
                  <Label htmlFor="equipment_count" required>Equipment Count #</Label>
                  <Input
                    id="equipment_count"
                    type="number"
                    {...register("equipment_count")}
                    placeholder="Enter equipment count"
                    error={errors.equipment_count?.message}
                  />
                </div>
                <div className="overflow-visible">
                <SearchableSelect
                  id="equipment_type"
                  label="Equipment Size / Type"
                  required
                  placeholder="Search for equipment type"
                  value={selectedEquipmentType?.id || watch("equipment_type") || null}
                  onChange={(value) => {
                    const eqTypeId = value as number;
                    setValue("equipment_type", eqTypeId || undefined);
                    searchEquipmentTypes("").then(results => {
                      const found = results.find((e: EquipmentType) => e.id === eqTypeId);
                      setSelectedEquipmentType(found || null);
                    });
                  }}
                  onSearch={async (query: string) => {
                    const results = await searchEquipmentTypes(query);
                    if (selectedEquipmentType && !query && !results.find((r: EquipmentType) => r.id === selectedEquipmentType.id)) {
                      return [selectedEquipmentType, ...results];
                    }
                    return results;
                  }}
                  error={errors.equipment_type?.message}
                  displayFormat={(option: any) => option.equipment_name || option.name}
                  searchPlaceholder="Search equipment types..."
                  valueExtractor={(option) => option.id}
                />
                </div>
                <div>
                  <Label htmlFor="equipment_no" required>Equipment Number</Label>
                  <Input
                    id="equipment_no"
                    {...register("equipment_no")}
                    placeholder="Enter equipment number"
                    error={errors.equipment_no?.message}
                  />
                </div>
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Customer Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="rounded-lg border border-gray-200 overflow-visible">
            <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
              <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
            </DisclosureButton>
            <DisclosurePanel className="bg-white px-6 pb-6 overflow-visible relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-4 overflow-visible">
                <div className="overflow-visible">
                <SearchableSelect
                  id="customer"
                  label="Customer"
                  required
                  placeholder="Search for customer"
                  value={selectedCustomer?.id || watch("customer") || null}
                  onChange={async (value) => {
                    const customerId = value as number;
                    setValue("customer", customerId || 0);
                    
                    if (!customerId) {
                      setSelectedCustomer(null);
                      setCustomerDynamicFields([]);
                      setValue("custom_field_values", []);
                      setCustomFieldValues({});
                      return;
                    }
                    
                    // Use optimized loadCustomerData function
                    const customer = await loadCustomerData(customerId);
                    if (customer) {
                      setSelectedCustomer(customer);
                      // loadCustomerDynamicFields will be called automatically via useEffect
                    } else {
                      setSelectedCustomer(null);
                      setCustomerDynamicFields([]);
                      setValue("custom_field_values", []);
                      setCustomFieldValues({});
                    }
                  }}
                  // eslint-disable-next-line react-hooks/exhaustive-deps
                  onSearch={async (query: string) => {
                    const results = await searchCustomers(query);
                    // If we have a selected customer and it's not in results, add it
                    if (selectedCustomer && !query && !results.find((r: any) => r.id === selectedCustomer.id)) {
                      return [selectedCustomer, ...results];
                    }
                    return results;
                  }}
                  error={errors.customer?.message}
                  displayFormat={(option) => `${option.name} (${option.customer_code || option.code})`}
                  searchPlaceholder="Search customers..."
                  valueExtractor={(option) => option.id}
                />
                </div>
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Customer Dynamic Fields Section - Accordion */}
      {isClient && customerDynamicFields.length > 0 && (
        <Disclosure>
          {({ open }) => (
            <div className="rounded-lg border border-gray-200 overflow-visible">
              <DisclosureButton className="flex w-full justify-between items-center px-6 py-4 text-left bg-indigo-50 hover:bg-indigo-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Custom Fields
                </h3>
                <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
              </DisclosureButton>
              <DisclosurePanel className="bg-white px-6 pb-6 overflow-visible relative z-10">
                <p className="text-sm text-gray-500 mb-4 mt-4">
                  These fields are specific to the selected customer
                </p>
                
                <div className="space-y-4">
                  {customerDynamicFields.map((field, index) => (
                    <div key={field.id}>
                      <Label htmlFor={`custom_field_${field.id}`}>
                        {field.label}
                      </Label>
                      
                      {/* Value Controller */}
                      <Controller
                        name={`custom_field_values.${index}.value` as any}
                        control={control}
                        defaultValue=""
                        rules={{ required: false }}
                        render={({ field: controllerField, fieldState }) => (
                          <Input
                            id={`custom_field_${field.id}`}
                            value={controllerField.value as string || ""}
                            onChange={controllerField.onChange}
                            onBlur={controllerField.onBlur}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            disabled={isLoadingCustomerFields}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                      
                      {/* Hidden Field Controller */}
                      <Controller
                        name={`custom_field_values.${index}.field` as any}
                        control={control}
                        defaultValue={parseInt(field.id)}
                        render={({ field: hiddenField }) => (
                          <input type="hidden" value={hiddenField.value} onChange={hiddenField.onChange} />
                        )}
                      />
                    </div>
                  ))}
                </div>
              </DisclosurePanel>
            </div>
          )}
        </Disclosure>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 bg-white px-6 pb-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>

        {
          isEditing ? (
            <Button
              // type="submit"
              disabled={isLoading}  
              onClick={handleUpdate}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}  
            >
              {isLoading ? 'Saving...' : 'Submit'}
            </Button>
          )
        }
      </div>
    </form>
  );
};

export default ShipmentOrderForm;
