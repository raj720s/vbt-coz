"use client";
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { 
  ShipmentOrderFormData, 
  ShipmentOrderStatus,
  TransportationMode,
  ServiceType,
  CargoType,
  SHIPMENT_ORDER_STATUS_OPTIONS,
  TRANSPORTATION_MODE_OPTIONS,
  SERVICE_TYPE_OPTIONS,
  CARGO_TYPE_OPTIONS,
  CustomerDynamicField
} from "@/types/shipmentOrder";
import { ShipmentOrderInput, ShipmentFieldValue } from "@/services/shipmentOrderService";
import { 
  getCustomerDynamicFieldsById,
  type DynamicField 
} from "@/utils/customerDynamicFieldsUtils";
import { shipmentOrderService } from "@/services/shipmentOrderService";
import { 
  convertFormDataToApiFormat,
  convertApiResponseToFormFormat,
  getShipmentStatusText,
  getTransportModeText,
  getServiceTypeText,
  getCargoTypeText
} from "./statusUtils";
import { polService } from "@/services/polService";
import { podService } from "@/services/podService";
import { customerService } from "@/services/customerService";
import { POLResponse, PODResponse, CustomerResponse } from "@/types/api";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import { PlusIcon, TrashBinIcon } from "@/icons";

// Form validation schema
const shipmentOrderSchema = z.object({
  shipper: z.string().min(1, "Shipper is required"),
  consignee: z.string().min(1, "Consignee is required"),
  transportation_mode: z.enum(["ocean", "air", "road", "rail"]).optional(),
  cargo_readiness_date: z.string()
    .min(1, "Cargo readiness date is required")
    .refine((date) => {
      if (!date) return false;
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Please enter a valid date"),
  service_type: z.enum(["cy", "cfs"], { required_error: "Service type is required" }),
  volume: z.number().min(0.01, "Volume must be greater than 0"),
  weight: z.number().min(0.01, "Weight must be greater than 0"),
  hs_code: z.string().min(1, "HS Code is required"),
  cargo_description: z.string().optional(),
  marks_and_numbers: z.string().optional(),
  customer_reference: z.string().optional(),
  cargo_type: z.enum(["normal", "reefer", "dg"]).optional(),
  dangerous_goods_notes: z.string().optional(),
  place_of_receipt: z.string().optional(),
  place_of_delivery: z.string().optional(),
  carrier: z.string().optional(),
  carrier_booking_number: z.string().optional(),
  customer: z.number().min(1, "Customer is required"),
  custom_field_values: z.array(z.object({
    field: z.union([z.number(), z.string()]), // Accept both number and string
    value: z.string() // Allow empty values, will be filtered on submit
  })).optional(),
}).refine((data) => {
  if (data.cargo_type === "dg" && !data.dangerous_goods_notes?.trim()) {
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
      shipper: "",
      consignee: "",
      transportation_mode: "ocean",
      cargo_readiness_date: "",
      service_type: "cy",
      volume: 0,
      weight: 0,
      hs_code: "",
      cargo_description: "",
      marks_and_numbers: "",
      customer_reference: "",
      place_of_receipt: "",
      place_of_delivery: "",
      carrier: "",
      carrier_booking_number: "",
      customer: 0,
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
      return await customerService.searchCustomers(query);
    } catch (error) {
      console.error("Failed to search customers:", error);
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
    
    // Transform data for API using status utility
    const transformedData: ShipmentOrderInput = convertFormDataToApiFormat({
      ...data,
      cargo_readiness_date: data.cargo_readiness_date 
        ? new Date(data.cargo_readiness_date).toISOString()
        : data.cargo_readiness_date,
      cargo_description: data.cargo_description || null,
      marks_and_numbers: data.marks_and_numbers || null,
      dangerous_goods_notes: data.dangerous_goods_notes || null,
      place_of_receipt: data.place_of_receipt || null,
      place_of_delivery: data.place_of_delivery || null,
      carrier: data.carrier || null,
      carrier_booking_number: data.carrier_booking_number || null,
      custom_field_values: custom_field_values.length > 0 ? custom_field_values : undefined
    });
    
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

  const  handleUpdate = () => {
    console.log("Form submitted with data:", watch());
    console.log("Form errors:", errors);
    console.log("Current form values:", watch());
    console.log("Form state:", formState);
    
    // Filter out empty custom field values
    const custom_field_values: ShipmentFieldValue[] = (watch("custom_field_values") || [])
      .filter(cfv => cfv && cfv.field && cfv.value && cfv.value.trim().length > 0)
      .map(cfv => ({
        field: typeof cfv.field === 'string' ? parseInt(cfv.field) : cfv.field,
        value: cfv.value.trim()
      }));
    
    console.log("Filtered custom field values:", custom_field_values);
    
    // Transform data for API
    const transformedData: ShipmentOrderInput = {
        ...watch(),
      cargo_readiness_date: watch("cargo_readiness_date") 
        ? new Date(watch("cargo_readiness_date")).toISOString()
        : watch("cargo_readiness_date"),
      cargo_description: watch("cargo_description") || null,
      marks_and_numbers: watch("marks_and_numbers") || null,
      cargo_type: watch("cargo_type") || null,
      dangerous_goods_notes: watch("dangerous_goods_notes") || null,
      place_of_receipt: watch("place_of_receipt") || null,
      place_of_delivery: watch("place_of_delivery") || null,
      carrier: watch("carrier") || null,
      carrier_booking_number: watch("carrier_booking_number") || null,
      custom_field_values: custom_field_values.length > 0 ? custom_field_values : undefined
    };
    
    console.log("Transformed data for API:", transformedData);
    onSubmit(transformedData as ShipmentOrderFormData);
    console.log("Form submitted with data:", watch("place_of_delivery"));
  };


  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <Label htmlFor="transportation_mode" required>Transportation Mode</Label>
            <select
              id="transportation_mode"
              {...register("transportation_mode")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
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
            <Label htmlFor="cargo_readiness_date" required>Cargo Readiness Date</Label>
            <Input
              id="cargo_readiness_date"
              type="date"
              {...register("cargo_readiness_date")}
              error={errors.cargo_readiness_date?.message}
            />
          </div>
          <div>
            <Label htmlFor="service_type" required>Service Type</Label>
            <select
              id="service_type"
              {...register("service_type")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            >
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="volume" required>Volume</Label>
            <Input
              id="volume"
              type="number"
              step="0.01"
              {...register("volume", { valueAsNumber: true })}
              placeholder="Enter volume"
              error={errors.volume?.message}
            />
          </div>
          <div>
            <Label htmlFor="weight" required>Weight</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              {...register("weight", { valueAsNumber: true })}
              placeholder="Enter weight"
              error={errors.weight?.message}
            />
          </div>
        </div>
      </div>

      {/* Cargo Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cargo Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {...register("cargo_type")}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
            rows={3}
          />
          {errors.cargo_description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.cargo_description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <Label htmlFor="marks_and_numbers">Marks & Numbers</Label>
            <Input
              id="marks_and_numbers"
              {...register("marks_and_numbers")}
              placeholder="Enter marks and numbers"
              error={errors.marks_and_numbers?.message}
            />
          </div>
          <div>
            <Label htmlFor="customer_reference">Customer Reference</Label>
            <Input
              id="customer_reference"
              {...register("customer_reference")}
              placeholder="Enter customer reference"
              error={errors.customer_reference?.message}
            />
          </div>
        </div>

        {cargoType === "dg" && (
          <div className="mt-6">
            <Label htmlFor="dangerous_goods_notes" required>Dangerous Goods Notes</Label>
            <textarea
              id="dangerous_goods_notes"
              {...register("dangerous_goods_notes")}
              placeholder="Enter dangerous goods notes"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-theme-purple-500 focus:border-theme-purple-500 dark:bg-gray-700 dark:text-white"
              rows={3}
            />
            {errors.dangerous_goods_notes && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.dangerous_goods_notes.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Location Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SearchableSelect
            id="place_of_receipt"
            label="Place of Receipt"
            placeholder="Search for place of receipt"
            value={watch("place_of_receipt") || null}
            onChange={(value) => setValue("place_of_receipt", value as string)}
            onSearch={searchPOLs}
            error={errors.place_of_receipt?.message}
            displayFormat={(option) => `${option.name} (${option.code})`}
            searchPlaceholder="Search places of receipt..."
            valueExtractor={(option) => option.name}
          />
          <SearchableSelect
            id="place_of_delivery"
            label="Place of Delivery"
            placeholder="Search for place of delivery"
            value={watch("place_of_delivery") || null}
            onChange={(value) => setValue("place_of_delivery", value as string)}
            onSearch={searchPODs}
            error={errors.place_of_delivery?.message}
            displayFormat={(option) => `${option.name} (${option.code})`}
            searchPlaceholder="Search places of delivery..."
            valueExtractor={(option) => option.name}
          />
        </div>
      </div>

      {/* Carrier Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Carrier Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              {...register("carrier")}
              placeholder="Enter carrier name"
              error={errors.carrier?.message}
            />
          </div>
          <div>
            <Label htmlFor="carrier_booking_number">Carrier Booking Number</Label>
            <Input
              id="carrier_booking_number"
              {...register("carrier_booking_number")}
              placeholder="Enter carrier booking number"
              error={errors.carrier_booking_number?.message}
            />
          </div>
        </div>
      </div>

      {/* Master Data References */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Master Data References</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <SearchableSelect
            id="customer"
            label="Customer"
            required
            placeholder="Search for customer"
            value={selectedCustomer?.id || watch("customer") || null}
            onChange={(value) => {
              const customerObj = value as any;
              setValue("customer", customerObj?.id || 0);
              setSelectedCustomer(customerObj);
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
          />
        </div>
      </div>

      {/* Customer Dynamic Fields */}
      {isClient && customerDynamicFields.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Customer Custom Fields
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
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
              {isLoading ? 'Saving...' : 'Update Shipment Order'}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}  
            >
              {isLoading ? 'Saving...' : 'Create Shipment Order'}
            </Button>
          )
        }
        
      </div>
    </form>
  );
};

export default ShipmentOrderForm;
