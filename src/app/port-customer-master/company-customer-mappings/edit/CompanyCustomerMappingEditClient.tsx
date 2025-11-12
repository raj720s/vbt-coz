"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompanyCustomerMappingResponse } from "@/types/companyCustomerMapping";
import { companyCustomerMappingService } from "@/services/companyCustomerMappingService";
import { CompanyCustomerMappingForm } from "@/components/forms/CompanyCustomerMappingForm";
import { customerService } from "@/services/customerService";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";
import toast from "react-hot-toast";

export default function CompanyCustomerMappingEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [mapping, setMapping] = useState<CompanyCustomerMappingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) loadMapping();
  }, [id, isEditMode]);

  const loadMapping = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyCustomerMappingService.getMapping(Number(id));
      setMapping(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load mapping");
      toast.error(err.message ?? "Failed to load mapping");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert customer IDs to customer names
  const getCustomerNames = async (customerIds: number[]): Promise<string[]> => {
    const customerNames: string[] = [];
    for (const customerId of customerIds) {
      try {
        const customer = await customerService.getCustomer(customerId);
        customerNames.push(customer.name);
      } catch (error) {
        console.warn(`Failed to fetch customer ${customerId}:`, error);
      }
    }
    return customerNames;
  };

  const handleSubmit = async (formData: { company_type: number; company_id: number; customer_ids: number[] }) => {
    try {
      setSaving(true);
      setError(null);

      // Convert customer IDs to customer names for API
      const customerNames = await getCustomerNames(formData.customer_ids);

      if (isEditMode && id) {
        await companyCustomerMappingService.updateMapping(Number(id), {
          company_id: formData.company_id,
          customer_names: customerNames,
        });
        toast.success("Mapping updated successfully");
      } else {
        await companyCustomerMappingService.createMapping({
          company_id: formData.company_id,
          customer_names: customerNames,
        });
        toast.success("Mapping created successfully");
      }

      router.push("/port-customer-master/company-customer-mappings");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? `Failed to ${isEditMode ? "update" : "create"} mapping`);
      toast.error(err.message ?? `Failed to ${isEditMode ? "update" : "create"} mapping`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.push("/port-customer-master/company-customer-mappings");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading mapping...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && isEditMode) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" /> Back to List
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading mapping</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Global error (create mode) */}
      {error && !isEditMode && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <CompanyCustomerMappingForm
          initialData={mapping ? {
            company_type: mapping.company_type,
            company_id: mapping.company_id,
            customer_ids: mapping.customer_ids,
            id: mapping.id,
            company_data: mapping.company_name ? { 
              id: mapping.company_id, 
              name: mapping.company_name,
              company_type: mapping.company_type 
            } : undefined,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
        />
      </div>
    </div>
  );
}

