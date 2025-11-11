"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import CheckboxField from "@/components/form/checkbox/CheckboxField";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import { Company, CompanyFormData, COMPANY_TYPES, COUNTRIES } from "@/types/company";
import { companyService } from "@/services/companyService";

// Validation schema
const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255, "Company name must be less than 255 characters"),
  short_name: z.string().max(50, "Short name must be less than 50 characters").optional(),
  company_type: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20), z.literal(25)]).refine(
    val => [5, 10, 15, 20, 25].includes(val),
    { message: "Invalid company type" }
  ),
  country: z.string().max(100, "Country must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().max(50, "Phone must be less than 50 characters").optional(),
  parent_company_id: z.number().nullable().optional(),
  is_third_party: z.boolean(),
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

export function CompanyForm({ initialData, onSuccess, onCancel, isEditing = false }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParentCompany, setSelectedParentCompany] = useState<{ id: number; name: string } | null>(null);

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
      company_type: 5,
      country: "",
      email: "",
      phone: "",
      parent_company_id: null,
      is_third_party: false,
    },
  });

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
        is_third_party: initialData.is_third_party,
      });
      
      // Load parent company details if ID exists
      if (parentCompanyId) {
        loadParentCompany(parentCompanyId);
      }
    }
  }, [initialData, reset]);

  const onSubmit = async (data: CompanyFormSchema) => {
    // Validate that company is not its own parent
    if (isEditing && initialData && data.parent_company_id === initialData.id) {
      toast.error("A company cannot be its own parent");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert parent_company_id to string for API and always set is_active to true
      const submitData: any = {
        ...data,
        parent_company: data.parent_company_id ? data.parent_company_id.toString() : undefined,
        is_active: true, // Always set to true, status is managed via restore in data manager
      };
      delete submitData.parent_company_id;

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
            <Select
              placeholder="Select company type"
              {...register("company_type", { valueAsNumber: true })}
              error={errors.company_type?.message}
            >
              {COMPANY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
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
              placeholder="Select country"
              {...register("country")}
              error={errors.country?.message}
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </Select>
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

      {/* ---------- SETTINGS ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Settings
        </h2>

        <div className="space-y-4">
          <div>
            <CheckboxField
              label="Third Party Company"
              {...register("is_third_party")}
              error={errors.is_third_party?.message}
            />
          </div>
        </div>
      </section>

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
