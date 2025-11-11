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
import { Supplier, SupplierFormData, COUNTRIES } from "@/types/supplier";
import { supplierService } from "@/services/supplierService";
import { companyService } from "@/services/companyService";

// Validation schema
const supplierSchema = z.object({
  company: z.number().min(1, "Company is required"),
  name: z.string().min(1, "Supplier name is required").max(255, "Supplier name must be less than 255 characters"),
  code: z.string().min(1, "Supplier code is required").max(50, "Supplier code must be less than 50 characters"),
  country: z.string().max(100, "Country must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().max(50, "Phone must be less than 50 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

type SupplierFormSchema = z.infer<typeof supplierSchema>;

interface SupplierFormProps {
  initialData?: Supplier & { company_data?: any };
  onSuccess: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function SupplierForm({ initialData, onSuccess, onCancel, isEditing = false }: SupplierFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SupplierFormSchema>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      company: 0,
      name: "",
      code: "",
      country: "",
      email: "",
      phone: "",
      description: "",
    },
  });

  // Reset form when initialData changes
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
      
      reset({
        company: initialData.company,
        name: initialData.name,
        code: initialData.code,
        country: initialData.country || "",
        email: initialData.email,
        phone: initialData.phone || "",
        description: initialData.description || "",
      });
    } else {
      setSelectedCompany(null);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: SupplierFormSchema) => {
    setIsSubmitting(true);
    try {
      // Always set is_active to true, status is managed via restore in data manager
      const submitData = {
        ...data,
        is_active: true,
      };
      
      if (isEditing && initialData) {
        await supplierService.updateSupplier(initialData.id, submitData);
        toast.success("Supplier updated successfully");
      } else {
        await supplierService.createSupplier(submitData);
        toast.success("Supplier created successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      toast.error(error?.response?.data?.message || "Failed to save supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Search companies function for SearchableSelect
  const searchCompanies = async (query: string) => {
    try {
      const response = await companyService.getCompanies({ 
        page: 1, 
        page_size: 10, 
        search: query 
      });
      return response.results || [];
    } catch (e) {
      return [];
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
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
              onChange={(value) => {
                const companyObj = value as any;
                setValue("company", companyObj?.id || 0, { shouldValidate: true, shouldDirty: true });
                setSelectedCompany(companyObj);
              }}
              onSearch={async (query: string) => {
                const results = await searchCompanies(query);
                // If we have a selected company and it's not in results, add it
                if (selectedCompany && !query && !results.find((r: any) => r.id === selectedCompany.id)) {
                  return [selectedCompany, ...results];
                }
                return results;
              }}
              error={errors.company?.message}
              displayFormat={(option: any) => option.name}
              searchPlaceholder="Search companies..."
            />
          </div>

          {/* Supplier Name */}
          <div>
            <Label>
              Supplier Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter supplier name"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>

          {/* Supplier Code */}
          <div>
            <Label>
              Supplier Code <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter supplier code"
              {...register("code")}
              error={errors.code?.message}
            />
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
        </div>

        {/* Description */}
        <div className="mt-4">
          <Label>Description</Label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter supplier description"
            rows={3}
            {...register("description")}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
          )}
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

export type { SupplierFormData };

