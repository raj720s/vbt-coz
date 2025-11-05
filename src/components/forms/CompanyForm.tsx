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
import { Company, CompanyFormData, COMPANY_TYPES, COUNTRIES } from "@/types/company";
import { companyService } from "@/services/companyService";

// Validation schema
const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255, "Company name must be less than 255 characters"),
  short_name: z.string().max(50, "Short name must be less than 50 characters").optional(),
  company_type: z.union([z.literal(5), z.literal(10)]).refine(val => val === 5 || val === 10, {
    message: "Company type must be either 2PL (5) or 3PL (10)"
  }),
  country: z.string().max(100, "Country must be less than 100 characters").optional(),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().max(50, "Phone must be less than 50 characters").optional(),
  parent_company: z.string().max(50, "Parent company must be less than 50 characters").optional(),
  is_third_party: z.boolean(),
  is_active: z.boolean(),
});

type CompanyFormSchema = z.infer<typeof companySchema>;

interface CompanyFormProps {
  initialData?: Company;
  onSuccess: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function CompanyForm({ initialData, onSuccess, onCancel, isEditing = false }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      parent_company: "",
      is_third_party: false,
      is_active: true,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        short_name: initialData.short_name || "",
        company_type: (initialData.company_type === 5 || initialData.company_type === 10) ? initialData.company_type : 5,
        country: initialData.country || "",
        email: initialData.email,
        phone: initialData.phone || "",
        parent_company: initialData.parent_company || "",
        is_third_party: initialData.is_third_party,
        is_active: initialData.is_active,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: CompanyFormSchema) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await companyService.updateCompany(initialData.id, data);
        toast.success("Company updated successfully");
      } else {
        await companyService.createCompany(data);
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

          {/* Short Name */}
          <div>
            <Label>Short Name</Label>
            <Input
              placeholder="Enter short name"
              {...register("short_name")}
              error={errors.short_name?.message}
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
            <Label>Parent Company</Label>
            <Input
              placeholder="Enter parent company"
              {...register("parent_company")}
              error={errors.parent_company?.message}
            />
          </div>
        </div>
      </section>

      {/* ---------- STATUS & SETTINGS ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Status & Settings
        </h2>

        <div className="space-y-4">
          <div>
            <CheckboxField
              label="Third Party Company"
              {...register("is_third_party")}
              error={errors.is_third_party?.message}
            />
          </div>
          <div>
            <Label>Status</Label>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  checked={watch("is_active") === true}
                  onChange={() => setValue("is_active", true)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  checked={watch("is_active") === false}
                  onChange={() => setValue("is_active", false)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Inactive</span>
              </label>
            </div>
            {errors.is_active && (
              <p className="mt-1 text-sm text-red-600">{errors.is_active?.message}</p>
            )}
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
