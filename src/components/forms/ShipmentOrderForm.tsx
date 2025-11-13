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
  
  // Cache for customer data to prevent redundant API calls
  const customerCacheRef = useRef<Map<number, CustomerResponse>>(new Map());
  const loadingCustomerRef = useRef<number | null>(null);

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

  // Load customer dynamic fields when customer changes (optimized with caching)
  useEffect(() => {
    const loadCustomerDynamicFields = async () => {
      if (!selectedCustomerId || !isClient) {
        setCustomerDynamicFields([]);
        setCustomFieldValues({});
        return;
      }

      // Prevent duplicate calls for the same customer
      if (loadingCustomerRef.current === selectedCustomerId) {
        return;
      }

      try {
        setIsLoadingCustomerFields(true);
        loadingCustomerRef.current = selectedCustomerId;
        
        // Get customer data (from cache or API)
        let customer = customerCacheRef.current.get(selectedCustomerId);
        if (!customer) {
          customer = await customerService.getCustomer(selectedCustomerId);
          customerCacheRef.current.set(selectedCustomerId, customer);
        }
        
        if (customer.custom_fields && customer.custom_fields.length > 0) {
          const dynamicFields: CustomerDynamicField[] = customer.custom_fields.map((field) => ({
            id: field.id?.toString() || '',
            label: field.name,
            value: ''
          }));
          setCustomerDynamicFields(dynamicFields);
          
          // Create custom field values array
          const customFieldValuesArray = customer.custom_fields.map((field) => {
            // If editing, find existing value
            const existingValue = initialData?.custom_field_values?.find(
              cfv => cfv.field === field.id
            );
            
            return {
              field: field.id || 0,
              value: existingValue?.value || ''
            };
          });
          
          // Set form values using setValue with shouldValidate and shouldDirty
          setValue("custom_field_values", customFieldValuesArray, { 
            shouldValidate: true,
            shouldDirty: true 
          });
          
          // Update local state for UI
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
        loadingCustomerRef.current = null;
      }
    };

    loadCustomerDynamicFields();
  }, [selectedCustomerId, isClient, setValue, initialData]);

  // Initialize form data
  useEffect(() => {
    setIsClient(true);
    if (initialData) {
      console.log("Initializing form with data:", initialData);
      console.log("Cargo readiness date:", initialData.cargo_readiness_date);
      
      // Transform date to YYYY-MM-DD format for HTML date input
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
        // Initialize custom_field_values as empty array initially
        custom_field_values: []
      };
      
      console.log("Transformed data:", transformedData);
      reset(transformedData);

      // Load customer fields and populate custom field values if editing
      const loadInitialCustomerData = async () => {
        if (initialData.customer) {
          try {
            // Check cache first
            let customer = customerCacheRef.current.get(initialData.customer);
            
            // Load from API if not cached
            if (!customer) {
              setIsLoadingCustomerFields(true);
              customer = await customerService.getCustomer(initialData.customer);
              customerCacheRef.current.set(initialData.customer, customer);
              setIsLoadingCustomerFields(false);
            }
            
            // Set selected customer for SearchableSelect
            setSelectedCustomer(customer);

            // Set customer dynamic fields (even if empty)
            if (customer.custom_fields && customer.custom_fields.length > 0) {
              const dynamicFields: CustomerDynamicField[] = customer.custom_fields.map((field) => ({
                id: field.id?.toString() || '',
                label: field.name,
                value: ''
              }));
              setCustomerDynamicFields(dynamicFields);
              
              // Initialize custom_field_values array for React Hook Form
              const customFieldValuesArray = customer.custom_fields.map((field) => ({
                field: field.id || 0,
                value: ''
              }));
              
              // If editing, populate with existing values
              if (initialData.custom_field_values && initialData.custom_field_values.length > 0) {
                const fieldValuesMap: {[key: string]: string} = {};
                initialData.custom_field_values.forEach(cfv => {
                  fieldValuesMap[cfv.field.toString()] = cfv.value;
                });
                setCustomFieldValues(fieldValuesMap);
                
                // Map existing values to the correct structure
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
              // Important: Set empty array even if no custom fields
              setCustomerDynamicFields([]);
              setCustomFieldValues({});
              setValue("custom_field_values", []);
            }
          } catch (error) {
            console.error("Failed to load customer data for edit:", error);
            setIsLoadingCustomerFields(false);
            // Set empty values on error
            setCustomerDynamicFields([]);
            setCustomFieldValues({});
            setValue("custom_field_values", []);
          }
        } else {
          // No customer selected, clear dynamic fields
          setCustomerDynamicFields([]);
          setCustomFieldValues({});
          setValue("custom_field_values", []);
          setSelectedCustomer(null);
        }
      };

      loadInitialCustomerData();

    } else {
      // No initial data, clear everything
      setCustomerDynamicFields([]);
      setCustomFieldValues({});
      setValue("custom_field_values", []);
      setSelectedCustomer(null);
    }
  }, [initialData, reset]);


  // Search functions for dropdowns
  const searchPOLs = async (query: string): Promise<POLResponse[]> => {
    try {
      return await polService.searchPOLs(query, 10);
    } catch (error) {
      console.error("Failed to search POLs:", error);
      return [];
    }
  };

  const searchPODs = async (query: string): Promise<PODResponse[]> => {
    try {
      return await podService.searchPODs(query, 10);
    } catch (error) {
      console.error("Failed to search PODs:", error);
      return [];
    }
  };

  const searchCustomers = async (query: string): Promise<CustomerResponse[]> => {
    try {
      // TODO: Filter by user's company mapping
      return await customerService.searchCustomers(query);
    } catch (error) {
      console.error("Failed to search customers:", error);
      return [];
    }
  };

  const searchCarriers = async (query: string): Promise<any[]> => {
    try {
      const carriers = await shipmentOrderService.searchCarriers(query, 50);
      // Transform to match SearchableSelectOption interface
      return carriers.map((c: Carrier) => ({
        id: c.id,
        name: c.name,
        carrier_code: c.carrier_code,
      }));
    } catch (error) {
      console.error("Failed to search carriers:", error);
      return [];
    }
  };

  const searchEquipmentTypes = async (query: string): Promise<any[]> => {
    try {
      const equipmentTypes = await shipmentOrderService.searchEquipmentTypes(query, 50);
      // Transform to match SearchableSelectOption interface
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
  };

  const searchShipmentTypes = async (query: string): Promise<any[]> => {
    try {
      const shipmentTypes = await shipmentOrderService.searchShipmentTypes(query, 50);
      // Transform to match SearchableSelectOption interface
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
  };


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

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  };

  const handleUpdate = () => {
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
  };


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* General Section - Accordion */}
      <Disclosure defaultOpen={true}>
        {({ open }) => (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">General</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
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
                  <Label htmlFor="transportation_mode">Transportation Mode</Label>
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
              </div>
              
              {/* Vendor Reference, Agent Reference, Customer Reference */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                <div>
                  <Label htmlFor="customer_reference">Customer Reference</Label>
                  <Input
                    id="customer_reference"
                    {...register("customer_reference")}
                    placeholder="Enter Customer Reference"
                    error={errors.customer_reference?.message}
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
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Parties</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Route Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Route</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <SearchableSelect
                  id="pol"
                  label="POL (Place of Loading)"
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
                
                <SearchableSelect
                  id="pod"
                  label="POD (Place of Discharge)"
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
                
                <div>
                  <Label htmlFor="pickup_address">Pickup Address</Label>
                  <Input
                    id="pickup_address"
                    {...register("pickup_address")}
                    placeholder="Enter pickup address"
                    error={errors.pickup_address?.message}
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
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cargo Details</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                  <Label htmlFor="cargo_type">Cargo Type</Label>
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
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Carrier & Equipment</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                <div>
                  <Label htmlFor="carrier_booking_number">Carrier Booking Number</Label>
                  <Input
                    id="carrier_booking_number"
                    {...register("carrier_booking_number")}
                    placeholder="Enter carrier booking number"
                    error={errors.carrier_booking_number?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="vessel_name">Vessel Name</Label>
                  <Input
                    id="vessel_name"
                    {...register("vessel_name")}
                    placeholder="Enter vessel name"
                    error={errors.vessel_name?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="carrier_service_contract">Carrier Service Contract</Label>
                  <Input
                    id="carrier_service_contract"
                    {...register("carrier_service_contract")}
                    placeholder="Enter carrier service contract"
                    error={errors.carrier_service_contract?.message}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <SearchableSelect
                  id="equipment_type"
                  label="Equipment Type"
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
                <SearchableSelect
                  id="shipment_type"
                  label="Shipment Type"
                  placeholder="Search for shipment type"
                  value={selectedShipmentType?.id || watch("shipment_type") || null}
                  onChange={(value) => {
                    const stTypeId = value as number;
                    setValue("shipment_type", stTypeId || undefined);
                    searchShipmentTypes("").then(results => {
                      const found = results.find((s: ShipmentType) => s.id === stTypeId);
                      setSelectedShipmentType(found || null);
                    });
                  }}
                  onSearch={async (query: string) => {
                    const results = await searchShipmentTypes(query);
                    if (selectedShipmentType && !query && !results.find((r: ShipmentType) => r.id === selectedShipmentType.id)) {
                      return [selectedShipmentType, ...results];
                    }
                    return results;
                  }}
                  error={errors.shipment_type?.message}
                  displayFormat={(option: any) => option.shipment_type_name || option.name}
                  searchPlaceholder="Search shipment types..."
                  valueExtractor={(option) => option.id}
                />
                <div>
                  <Label htmlFor="equipment_count">Equipment Count</Label>
                  <Input
                    id="equipment_count"
                    {...register("equipment_count")}
                    placeholder="Enter equipment count"
                    error={errors.equipment_count?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="equipment_no">Equipment Number</Label>
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

      {/* Commercial Terms Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Commercial Terms</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <Label htmlFor="incoterm">Incoterm</Label>
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
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Volume/Weight/Quantity Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Volume, Weight & Quantity</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              {/* Volume Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-4">
                <div>
                  <Label htmlFor="volume_booked">Volume Booked</Label>
                  <Input
                    id="volume_booked"
                    type="number"
                    step="0.01"
                    {...register("volume_booked", { valueAsNumber: true })}
                    placeholder="Enter volume booked"
                    error={errors.volume_booked?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="volume_actual">Volume Actual</Label>
                  <Input
                    id="volume_actual"
                    type="number"
                    step="0.01"
                    {...register("volume_actual", { valueAsNumber: true })}
                    placeholder="Enter volume actual"
                    error={errors.volume_actual?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="volume_shipped">Volume Shipped</Label>
                  <Input
                    id="volume_shipped"
                    type="number"
                    step="0.01"
                    {...register("volume_shipped", { valueAsNumber: true })}
                    placeholder="Enter volume shipped"
                    error={errors.volume_shipped?.message}
                  />
                </div>
              </div>
              
              {/* Weight Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <Label htmlFor="weight_booked">Weight Booked</Label>
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
                  <Label htmlFor="weight_actual">Weight Actual</Label>
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
                  <Label htmlFor="weight_shipped">Weight Shipped</Label>
                  <Input
                    id="weight_shipped"
                    type="number"
                    step="0.01"
                    {...register("weight_shipped", { valueAsNumber: true })}
                    placeholder="Enter weight shipped"
                    error={errors.weight_shipped?.message}
                  />
                </div>
              </div>
              
              {/* Quantity Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="quantity_booked">Quantity Booked</Label>
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
                  <Label htmlFor="quantity_actual">Quantity Actual</Label>
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
                  <Label htmlFor="quantity_shipped">Quantity Shipped</Label>
                  <Input
                    id="quantity_shipped"
                    type="number"
                    step="0.01"
                    {...register("quantity_shipped", { valueAsNumber: true })}
                    placeholder="Enter quantity shipped"
                    error={errors.quantity_shipped?.message}
                  />
                </div>
              </div>
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Master Data References Section - Accordion */}
      <Disclosure>
        {({ open }) => (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Master Data References</h3>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  open ? 'transform rotate-180' : ''
                }`}
              />
            </DisclosureButton>
            <DisclosurePanel className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-4">
                <SearchableSelect
                  id="customer"
                  label="Customer"
                  required
                  placeholder="Search for customer"
                  value={selectedCustomer?.id || watch("customer") || null}
                  onChange={async (value) => {
                    const customerId = value as number;
                    setValue("customer", customerId || 0);
                    
                    // Find and set selected customer
                    const results = await searchCustomers("");
                    const found = results.find((c: CustomerResponse) => c.id === customerId);
                    if (found) {
                      setSelectedCustomer(found);
                      
                      // Load customer details to get custom fields
                      try {
                        const customerDetails = await customerService.getCustomer(customerId);
                        customerCacheRef.current.set(customerId, customerDetails);
                        
                        // Load custom fields if available
                        if (customerDetails.custom_fields && customerDetails.custom_fields.length > 0) {
                          const dynamicFields: CustomerDynamicField[] = customerDetails.custom_fields.map((field) => ({
                            id: field.id?.toString() || '',
                            label: field.name,
                            value: ''
                          }));
                          setCustomerDynamicFields(dynamicFields);
                          
                          // Initialize custom field values array
                          const customFieldValuesArray = customerDetails.custom_fields.map((field) => ({
                            field: field.id || 0,
                            value: ''
                          }));
                          setValue("custom_field_values", customFieldValuesArray);
                          setCustomFieldValues({});
                        } else {
                          setCustomerDynamicFields([]);
                          setValue("custom_field_values", []);
                          setCustomFieldValues({});
                        }
                      } catch (error) {
                        console.error("Failed to load customer details:", error);
                        setCustomerDynamicFields([]);
                        setValue("custom_field_values", []);
                        setCustomFieldValues({});
                      }
                    } else {
                      setSelectedCustomer(null);
                      setCustomerDynamicFields([]);
                      setValue("custom_field_values", []);
                      setCustomFieldValues({});
                    }
                  }}
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
            </DisclosurePanel>
          </div>
        )}
      </Disclosure>

      {/* Customer Dynamic Fields Section - Accordion */}
      {isClient && customerDynamicFields.length > 0 && (
        <Disclosure>
          {({ open }) => (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <DisclosureButton className="flex justify-between items-center w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Customer Custom Fields
                </h3>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    open ? 'transform rotate-180' : ''
                  }`}
                />
              </DisclosureButton>
              <DisclosurePanel className="px-6 pb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 mt-4">
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
      <div className="flex justify-end gap-3 pt-4 bg-white dark:bg-gray-800 px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700">
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
