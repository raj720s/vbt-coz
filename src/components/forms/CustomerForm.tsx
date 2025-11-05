"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { CustomField } from "@/types/api";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import { companyService } from "@/services/companyService";

const customFieldSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Field name is required"),
});

const customerSchema = z.object({
  company: z.number().min(1, "Company is required"),
  customer_code: z.string().min(1, "Customer code is required"),
  name: z.string().min(1, "Customer name is required"), // Customer name field
  contact_person: z.string().min(1, "Contact person is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  tax_id: z.string().min(1, "Tax ID is required"),
  is_active: z.boolean(),
  custom_fields: z.array(customFieldSchema).max(5).optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  initialData?: CustomerFormData & { id?: string; company_data?: any };
  onSubmit: (data: CustomerFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

/* ------------------------------------------------------------------ Options */
const countryOptions = [
  { value: "China", label: "China" },
  { value: "USA", label: "United States" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Germany", label: "Germany" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Singapore", label: "Singapore" },
  { value: "Japan", label: "Japan" },
  { value: "South Korea", label: "South Korea" },
  { value: "India", label: "India" },
  { value: "Vietnam", label: "Vietnam" },
  { value: "Thailand", label: "Thailand" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Philippines", label: "Philippines" },
  { value: "France", label: "France" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "Belgium", label: "Belgium" },
  { value: "Denmark", label: "Denmark" },
  { value: "Sweden", label: "Sweden" },
  { value: "Norway", label: "Norway" },
  { value: "Finland", label: "Finland" },
  { value: "Canada", label: "Canada" },
  { value: "Mexico", label: "Mexico" },
  { value: "Brazil", label: "Brazil" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chile", label: "Chile" },
  { value: "Peru", label: "Peru" },
  { value: "Colombia", label: "Colombia" },
  { value: "Venezuela", label: "Venezuela" },
  { value: "South Africa", label: "South Africa" },
  { value: "Egypt", label: "Egypt" },
  { value: "Morocco", label: "Morocco" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Kenya", label: "Kenya" },
  { value: "Ghana", label: "Ghana" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Uganda", label: "Uganda" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "UAE", label: "United Arab Emirates" },
  { value: "Qatar", label: "Qatar" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Bahrain", label: "Bahrain" },
  { value: "Oman", label: "Oman" },
  { value: "Jordan", label: "Jordan" },
  { value: "Lebanon", label: "Lebanon" },
  { value: "Israel", label: "Israel" },
  { value: "Turkey", label: "Turkey" },
  { value: "Iran", label: "Iran" },
  { value: "Iraq", label: "Iraq" },
  { value: "Syria", label: "Syria" },
  { value: "Yemen", label: "Yemen" },
  { value: "Australia", label: "Australia" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Other", label: "Other" },
];

/* ------------------------------------------------------------------ Component */
export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company: 0,
      customer_code: "",
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      country: "",
      tax_id: "",
      is_active: true,
      custom_fields: [],
    },
  });

  const isActive = watch("is_active");
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      // If company_data is provided, set it for SearchableSelect
      if (initialData.company_data) {
        setSelectedCompany(initialData.company_data);
      } else if (initialData.company) {
        // Fetch company if only ID is provided
        companyService.getCompany(initialData.company).then((company) => {
          setSelectedCompany(company);
        }).catch((err) => {
          console.warn("Failed to fetch company:", err);
        });
      }
      
      reset(initialData);
      if (initialData.custom_fields) {
        setCustomFields(initialData.custom_fields);
      }
    } else {
      reset({
        company: 0,
        customer_code: "",
        name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        tax_id: "",
        is_active: true,
        custom_fields: [],
      });
      setCustomFields([]);
      setSelectedCompany(null);
    }
    // Only run when initialData changes (use a stable reference check)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id, initialData?.company]);

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

  const handleFormSubmit = (data: CustomerFormData) => {
    const formData = {
      ...data,
      custom_fields: customFields.filter((field) => field.name.trim() !== ""),
    };
    onSubmit(formData);
  };

  const searchCompanies = async (query: string) => {
    try {
      const response = await companyService.getCompanies({ page: 1, page_size: 10, search: query });
      return response.results || [];
    } catch (e) {
      return [];
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
      {/* ---------- BASIC DETAILS ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Basic Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company */}
          <div>
            <SearchableSelect
              id="company"
              label="Company"
              required
              placeholder="Search and select company"
              value={selectedCompany?.id || watch("company") || null}
              onChange={async (value) => {
                // value is the company ID from valueExtractor
                const companyId = value as number;
                if (!companyId) {
                  setValue("company", 0, { shouldValidate: true, shouldDirty: true });
                  setSelectedCompany(null);
                  return;
                }
                
                // Fetch the full company object to update selectedCompany state
                try {
                  const companyObj = await companyService.getCompany(companyId);
                  setValue("company", companyId, { shouldValidate: true, shouldDirty: true });
                  setSelectedCompany(companyObj);
                  // Auto-populate name from selected company if name field is empty
                  if (companyObj?.name && !watch("name")) {
                    setValue("name", companyObj.name, { shouldValidate: true });
                  }
                } catch (err) {
                  console.error("Failed to fetch company:", err);
                  // Still update the form value even if fetch fails
                  setValue("company", companyId, { shouldValidate: true, shouldDirty: true });
                  // Try to find in recent search results
                  const results = await searchCompanies("");
                  const foundCompany = results.find((r: any) => r.id === companyId);
                  if (foundCompany) {
                    setSelectedCompany(foundCompany);
                  }
                }
              }}
              onSearch={async (query: string) => {
                const results = await searchCompanies(query);
                // If we have a selected company and it's not in results, add it
                if (selectedCompany && !query && !results.find((r: any) => r.id === selectedCompany.id)) {
                  return [selectedCompany, ...results];
                }
                return results;
              }}
              error={(errors as any).company?.message}
              displayFormat={(option: any) => option.name}
              searchPlaceholder="Search companies..."
            />
          </div>
          
          {/* Customer Name */}
          <div>
            <Label>
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., Global Freight Solutions Ltd"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
          
          {/* Customer Code */}
          <div>
            <Label>
              Customer Code <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., CUST001"
              {...register("customer_code")}
              error={errors.customer_code?.message}
            />
          </div>
        </div>
        
        {/* Second row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tax ID */}
          <div>
            <Label>
              Tax ID <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., 12-3456789"
              {...register("tax_id")}
              error={errors.tax_id?.message}
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
            <Label>
              Contact Person <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., John Doe"
              {...register("contact_person")}
              error={errors.contact_person?.message}
            />
          </div>

          {/* Email */}
          <div>
            <Label>
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              placeholder="e.g., john@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          {/* Phone */}
          <div>
            <Label>
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., +1-555-123-4567"
              {...register("phone")}
              error={errors.phone?.message}
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
            <Label>
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., 123 Business St, City, State, ZIP"
              {...register("address")}
              error={errors.address?.message}
            />
          </div>

          {/* Country */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                options={countryOptions}
                placeholder="Select Country"
                value={watch("country")}
                onChange={(value) => setValue("country", value)}
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.country.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CUSTOM FIELDS ---------- */}
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
            disabled={isLoading || customFields.length >= 5}
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
                disabled={isLoading}
                className="text-red-600 self-end hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- STATUS ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Status
        </h2>

        {/* Radio – Active / Inactive */}
        <div className="flex items-center gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="true"
              checked={isActive === true}
              onChange={() => setValue("is_active", true)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active
            </span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="false"
              checked={isActive === false}
              onChange={() => setValue("is_active", false)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Inactive
            </span>
          </label>
        </div>

        {errors.is_active && (
          <p className="text-xs text-red-500 mt-2">
            {errors.is_active.message}
          </p>
        )}
      </section>

      {/* ---------- BUTTONS ---------- */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="min-w-[100px]">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : isEditing ? (
            "Update"
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
