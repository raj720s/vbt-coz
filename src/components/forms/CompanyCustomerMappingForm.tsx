"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/select/SelectField";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import SearchableMultiSelect from "@/components/form/input/SearchableMultiSelect";
import { companyService } from "@/services/companyService";
import { companyCustomerMappingService } from "@/services/companyCustomerMappingService";
import { COMPANY_TYPES } from "@/types/company";

const mappingSchema = z.object({
  company_type: z.number().min(1, "Company type is required"),
  company_id: z.number().min(1, "Company is required"),
  customer_ids: z.array(z.number()).min(1, "At least one customer is required"),
});

export type CompanyCustomerMappingFormData = z.infer<typeof mappingSchema>;

interface CompanyCustomerMappingFormProps {
  initialData?: CompanyCustomerMappingFormData & { id?: number; company_data?: any };
  onSubmit: (data: CompanyCustomerMappingFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CompanyCustomerMappingForm: React.FC<CompanyCustomerMappingFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedCompanyType, setSelectedCompanyType] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const prevCompanyTypeRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CompanyCustomerMappingFormData>({
    resolver: zodResolver(mappingSchema),
    defaultValues: {
      company_type: 0,
      company_id: 0,
      customer_ids: [],
    },
  });

  const isEditing = !!initialData;
  const watchedCompanyType = watch("company_type");

  // Initialize form data only once
  useEffect(() => {
    if (isInitialized) return;
    
    if (initialData) {
      const formData = {
        company_type: initialData.company_type || (initialData.company_data?.company_type) || 0,
        company_id: initialData.company_id || 0,
        customer_ids: initialData.customer_ids || [],
      };
      
      reset(formData);
      
      if (formData.company_type) {
        setSelectedCompanyType(formData.company_type);
      }
      
      // If company_data is provided, set it for SearchableSelect
      if (initialData.company_data) {
        setSelectedCompany(initialData.company_data);
      } else if (initialData.company_id) {
        // Fetch company if only ID is provided
        companyService.getCompany(initialData.company_id).then((company) => {
          setSelectedCompany(company);
          if (!formData.company_type && company.company_type) {
            setSelectedCompanyType(company.company_type);
            setValue("company_type", company.company_type, { shouldValidate: false });
          }
        }).catch((err) => {
          console.warn("Failed to fetch company:", err);
        });
      }
    } else {
      reset({
        company_type: 0,
        company_id: 0,
        customer_ids: [],
      });
      setSelectedCompany(null);
      setSelectedCompanyType(null);
    }
    
    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Reset company selection when company type changes (only if user changes it, not on init)
  useEffect(() => {
    if (!isInitialized) {
      prevCompanyTypeRef.current = watchedCompanyType;
      return;
    }
    
    // Only act if company type actually changed
    if (watchedCompanyType && watchedCompanyType !== prevCompanyTypeRef.current && watchedCompanyType > 0) {
      prevCompanyTypeRef.current = watchedCompanyType;
      setSelectedCompanyType(watchedCompanyType);
      
      // Clear company selection when type changes
      if (selectedCompany) {
        setValue("company_id", 0, { shouldValidate: false, shouldDirty: false });
        setSelectedCompany(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedCompanyType, isInitialized]); // Only watch company type to avoid loops

  const handleFormSubmit = (data: CompanyCustomerMappingFormData) => {
    onSubmit(data);
  };

  const searchCompanies = useCallback(async (query: string) => {
    try {
      const companyType = watchedCompanyType || selectedCompanyType;
      if (!companyType || companyType === 0) {
        return []; // Don't search if no company type selected
      }
      
      const response = await companyService.getCompanies({
        ...(query ? { name: query } : {}),
        is_active: true,
        company_type: companyType,
      });
      return response.results || [];
    } catch (e) {
      console.error("Failed to fetch companies:", e);
      return [];
    }
  }, [watchedCompanyType, selectedCompanyType]);

  const searchCustomers = async (query: string) => {
    try {
      const results = await companyCustomerMappingService.searchCustomers(query);
      return results;
    } catch (e) {
      console.error("Failed to fetch customers:", e);
      return [];
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
      {/* ---------- BASIC DETAILS ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Mapping Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Type */}
          <div>
            <Label>
              Company Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("company_type") || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const companyType = Number(e.target.value);
                if (companyType === watchedCompanyType) return; // Prevent unnecessary updates
                
                setValue("company_type", companyType, { shouldValidate: true, shouldDirty: true });
                setSelectedCompanyType(companyType);
                // Clear company selection when type changes
                setValue("company_id", 0, { shouldValidate: false, shouldDirty: false });
                setSelectedCompany(null);
              }}
              error={(errors as any).company_type?.message}
              placeholder="Select Company Type"
            >
              {COMPANY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Company */}
          <div>
            <SearchableSelect
              id="company_id"
              label="Company"
              required
              placeholder={watchedCompanyType ? "Search and select company" : "Select company type first"}
              value={selectedCompany?.id || watch("company_id") || null}
              onChange={async (value) => {
                const companyId = value as number;
                if (!companyId) {
                  setValue("company_id", 0, { shouldValidate: true, shouldDirty: true });
                  setSelectedCompany(null);
                  return;
                }
                
                try {
                  const companyObj = await companyService.getCompany(companyId);
                  setValue("company_id", companyId, { shouldValidate: true, shouldDirty: true });
                  setSelectedCompany(companyObj);
                } catch (err) {
                  console.error("Failed to fetch company:", err);
                  setValue("company_id", companyId, { shouldValidate: true, shouldDirty: true });
                  const results = await searchCompanies("");
                  const foundCompany = results.find((r: any) => r.id === companyId);
                  if (foundCompany) {
                    setSelectedCompany(foundCompany);
                  }
                }
              }}
              onSearch={async (query: string) => {
                if (!watchedCompanyType) {
                  return [];
                }
                const results = await searchCompanies(query);
                if (selectedCompany && !query && !results.find((r: any) => r.id === selectedCompany.id)) {
                  return [selectedCompany, ...results];
                }
                return results;
              }}
              error={(errors as any).company_id?.message}
              displayFormat={(option: any) => option.name}
              searchPlaceholder="Search companies..."
              disabled={!watchedCompanyType}
            />
          </div>

          {/* Customers - Multi-select */}
          <div>
            <SearchableMultiSelect
              id="customer_ids"
              label="Customers"
              required
              placeholder="Search and select customers"
              value={watch("customer_ids") || []}
              onChange={(value) => {
                setValue("customer_ids", value as number[], { shouldValidate: true, shouldDirty: true });
              }}
              onSearch={searchCustomers}
              error={(errors as any).customer_ids?.message}
              displayFormat={(option: any) => `${option.name} (${option.customer_code || option.code})`}
              searchPlaceholder="Search customers..."
            />
          </div>
        </div>
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

export default CompanyCustomerMappingForm;

