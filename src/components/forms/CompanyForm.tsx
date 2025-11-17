"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import SelectField from "@/components/form/select/SelectField";
import CheckboxField from "@/components/form/checkbox/CheckboxField";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import { Company, CompanyFormData, COMPANY_TYPES, COUNTRIES } from "@/types/company";
import { companyService } from "@/services/companyService";
import { CustomField } from "@/types/api";

const customFieldSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Field name is required"),
});

// Validation schema
const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255, "Company name must be less than 255 characters"),
  short_name: z.string().max(50, "Short name must be less than 50 characters").optional(),
  company_type: z.union([
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
    z.literal(25),
  ]),
  country: z.string().max(100, "Country must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().max(50, "Phone must be less than 50 characters").optional(),
  parent_company_id: z.number().nullable().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  custom_fields: z.array(customFieldSchema).max(5).optional(),
  // Optional fields array for customer type (company_type === 20)
  optional: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Validation will be done in the component to access initialData
    return true;
  },
  { message: "Company cannot be its own parent" }
);

type CompanyFormSchema = z.infer<typeof companySchema>;

interface CompanyFormProps {
  initialData?: Company;
  onSuccess: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

// List of optional field names
const OPTIONAL_FIELDS = [
  "notify_party1",
  "notify_party2",
  "hscode",
  "cargo_description",
  "marks_and_numbers",
  "payment_terms",
  "customer_reference",
  "vendor_reference",
  "agent_reference",
  "place_of_receipt",
  "port_of_loading",
  "port_of_discharge",
  "port_of_delivery",
  "carrier",
  "vessel_name",
  "carrier_service_contract",
];

export function CompanyForm({ initialData, onSuccess, onCancel, isEditing = false }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParentCompany, setSelectedParentCompany] = useState<{ id: number; name: string } | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [selectedOptionalFields, setSelectedOptionalFields] = useState<string[]>(OPTIONAL_FIELDS);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CompanyFormSchema>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      short_name: "",
      company_type: 5 as 5 | 10 | 15 | 20 | 25,
      country: "",
      email: "",
      phone: "",
      parent_company_id: null,
      address: "",
      contact_person: "",
      custom_fields: [],
      optional: OPTIONAL_FIELDS,
    },
  });

  const companyType = watch("company_type");
  const isCustomerType = companyType === 20;

  // Load parent company details
  const loadParentCompany = async (id: number) => {
    try {
      const company = await companyService.getCompany(id);
      setSelectedParentCompany({ id: company.id, name: company.name });
    } catch (error) {
      console.error("Failed to load parent company:", error);
    }
  };

  // Search companies function for SearchableSelect
  const searchCompanies = async (query: string) => {
    try {
      const response = await companyService.getCompanies({ 
        page: 1, 
        page_size: 10, 
        name: query || undefined
      });
      // Filter out the current company if editing
      const filteredResults = isEditing && initialData
        ? response.results.filter(company => company.id !== initialData.id)
        : response.results;
      return filteredResults.map(company => ({
        id: company.id,
        name: company.name,
      }));
    } catch (e) {
      return [];
    }
  };

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      // Parse parent_company if it's a string ID
      const parentCompanyId = initialData.parent_company 
        ? (typeof initialData.parent_company === 'string' && !isNaN(Number(initialData.parent_company)) 
            ? Number(initialData.parent_company) 
            : null)
        : null;
      
      reset({
        name: initialData.name,
        short_name: initialData.short_name || "",
        company_type: ([5, 10, 15, 20, 25].includes(initialData.company_type) ? initialData.company_type : 5) as 5 | 10 | 15 | 20 | 25,
        country: initialData.country || "",
        email: initialData.email,
        phone: initialData.phone || "",
        parent_company_id: parentCompanyId,
        address: (initialData as any).address || "",
        contact_person: (initialData as any).contact_person || "",
        custom_fields: (initialData as any).custom_fields || [],
        optional: (initialData as any).optional || OPTIONAL_FIELDS,
      });
      
      // Load parent company details if ID exists
      if (parentCompanyId) {
        loadParentCompany(parentCompanyId);
      }

      // Set custom fields if they exist
      if ((initialData as any).custom_fields) {
        setCustomFields((initialData as any).custom_fields);
      }

      // Set optional fields if they exist, otherwise default to all checked
      if ((initialData as any).optional && Array.isArray((initialData as any).optional)) {
        setSelectedOptionalFields((initialData as any).optional);
      } else {
        setSelectedOptionalFields(OPTIONAL_FIELDS);
      }
    } else {
      setCustomFields([]);
      setSelectedOptionalFields(OPTIONAL_FIELDS);
    }
  }, [initialData, reset]);

  const addCustomField = () => {
    if (customFields.length >= 5) {
      return; // Maximum 5 custom fields allowed
    }
    const newField: CustomField = { name: "" };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (index: number) => {
    const updatedFields = customFields.filter((_, i) => i !== index);
    setCustomFields(updatedFields);
    setValue("custom_fields", updatedFields);
  };

  const updateCustomField = (index: number, fieldName: string) => {
    const updatedFields = customFields.map((field, i) =>
      i === index ? { ...field, name: fieldName } : field
    );
    setCustomFields(updatedFields);
    setValue("custom_fields", updatedFields);
  };

  const handleOptionalFieldToggle = (fieldName: string) => {
    setSelectedOptionalFields((prev) => {
      if (prev.includes(fieldName)) {
        return prev.filter((f) => f !== fieldName);
      } else {
        return [...prev, fieldName];
      }
    });
  };

  const onSubmit = async (data: CompanyFormSchema) => {
    // Validate that company is not its own parent
    if (isEditing && initialData && data.parent_company_id === initialData.id) {
      toast.error("A company cannot be its own parent");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert parent_company_id to string for API and always set is_active to true
      // Include optional fields array if company type is customer
      const submitData: any = {
        name: data.name,
        short_name: data.short_name,
        company_type: data.company_type,
        country: data.country,
        email: data.email,
        phone: data.phone,
        parent_company: data.parent_company_id ? data.parent_company_id.toString() : undefined,
        is_active: true, // Always set to true, status is managed via restore in data manager
      };

      // Add optional fields array if company type is customer
      if (isCustomerType && selectedOptionalFields.length > 0) {
        submitData.optional = selectedOptionalFields;
      }

      if (isEditing && initialData) {
        await companyService.updateCompany(initialData.id, submitData);
        toast.success("Company updated successfully");
      } else {
        await companyService.createCompany(submitData);
        toast.success("Company created successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving company:", error);
      toast.error(error?.response?.data?.message || "Failed to save company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
      {/* ---------- BASIC DETAILS ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Basic Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Company Name */}
          <div>
            <Label>
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter company name"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>

          {/* Company Type */}
          <div>
            <Label>
              Company Type <span className="text-red-500">*</span>
            </Label>
            <SelectField
              placeholder="Select company type"
              {...register("company_type", { valueAsNumber: true })}
              error={errors.company_type?.message}
            >
              {COMPANY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </SelectField>
          </div>

          {/* Short Name */}
          <div>
            <Label>Short Name</Label>
            <Input
              placeholder="Enter short name"
              {...register("short_name")}
              error={errors.short_name?.message}
            />
          </div>

          {/* Email */}
          <div>
            <Label>
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="Enter email address"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {/* Phone */}
          <div>
            <Label>Phone</Label>
            <Input
              placeholder="Enter phone number"
              {...register("phone")}
              error={errors.phone?.message}
            />
          </div>

          {/* Country */}
          <div>
            <Label>Country</Label>
            <Select
              options={COUNTRIES.map(c => ({ value: c.value, label: c.label }))}
              placeholder="Select country"
              value={watch("country") || ""}
              onChange={(value) => setValue("country", value)}
              className={errors.country ? "border-red-500" : ""}
            />
            {errors.country && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.country.message}
              </p>
            )}
          </div>

          {/* Parent Company */}
          <div>
            <SearchableSelect
              id="parent_company"
              label="Parent Company"
              placeholder="Search and select parent company"
              value={watch("parent_company_id") || null}
              onChange={(value) => {
                const companyId = value as number | null;
                
                // Validate that company is not its own parent
                if (isEditing && initialData && companyId === initialData.id) {
                  toast.error("A company cannot be its own parent");
                  setValue("parent_company_id", null, { shouldValidate: true });
                  setSelectedParentCompany(null);
                  return;
                }
                
                setValue("parent_company_id", companyId, { shouldValidate: true });
                if (companyId && selectedParentCompany?.id !== companyId) {
                  // Find the company in the options or load it
                  loadParentCompany(companyId);
                } else if (!companyId) {
                  setSelectedParentCompany(null);
                }
              }}
              onSearch={async (query: string) => {
                const results = await searchCompanies(query);
                // If we have a selected parent company and it's not in results, add it
                if (selectedParentCompany && !query && !results.find((r: any) => r.id === selectedParentCompany.id)) {
                  return [selectedParentCompany, ...results];
                }
                return results;
              }}
              error={errors.parent_company_id?.message}
              displayFormat={(option: any) => option.name}
              searchPlaceholder="Search companies..."
            />
          </div>
        </div>
      </section>

      {/* ---------- CONTACT INFORMATION ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contact Person */}
          <div>
            <Label>Contact Person</Label>
            <Input
              placeholder="Enter contact person name"
              {...register("contact_person")}
              error={errors.contact_person?.message}
            />
          </div>
        </div>
      </section>

      {/* ---------- ADDRESS & LOCATION ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Address & Location
        </h2>

        <div className="space-y-4">
          {/* Address */}
          <div>
            <Label>Address</Label>
            <Input
              placeholder="Enter company address"
              {...register("address")}
              error={errors.address?.message}
            />
          </div>
        </div>
      </section>

      {/* ---------- OPTIONAL FIELDS (Customer Type Only) ---------- */}
      {isCustomerType && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Optional Fields
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OPTIONAL_FIELDS.map((fieldName) => {
              const fieldLabel = fieldName
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
              
              return (
                <div key={fieldName}>
                  <CheckboxField
                    label={fieldLabel}
                    checked={selectedOptionalFields.includes(fieldName)}
                    onChange={() => handleOptionalFieldToggle(fieldName)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- CUSTOM FIELDS (Customer Type Only) ---------- */}
      {isCustomerType && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Custom Fields
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {customFields.length}/5 fields added
                {customFields.length >= 5 && " (Maximum reached)"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addCustomField}
              disabled={isSubmitting || customFields.length >= 5}
              className="text-sm"
            >
              + Add Field
            </Button>
          </div>

          {customFields.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              No custom fields added yet. Click "Add Field" to add custom fields
              (max 5).
            </p>
          )}

          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    Field Name {index + 1}
                    {field.id && (
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                        (ID: {field.id})
                      </span>
                    )}
                  </Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateCustomField(index, e.target.value)}
                    placeholder="e.g., Length, Width, Height"
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeCustomField(index)}
                  disabled={isSubmitting}
                  className="text-red-600 self-end hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- BUTTONS ---------- */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            isEditing ? "Update" : "Save"
          )}
        </Button>
      </div>
    </form>
  );
}

export type { CompanyFormData };
