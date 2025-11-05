"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerForm, type CustomerFormData } from "@/components/forms/CustomerForm";
import { CustomerResponse, CreateCustomerRequest, UpdateCustomerRequest } from "@/types/api";
import { customerService } from "@/services";
import { companyService } from "@/services/companyService";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";

export default function CustomerEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------------ Load
  useEffect(() => {
    if (isEditMode && id) loadCustomerData();
  }, [id, isEditMode]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomer(Number(id));
      
      // Fetch company details if company ID exists
      if (data.company) {
        try {
          const company = await companyService.getCompany(data.company);
          // Attach full company object to customer data for form
          (data as any).company_data = company;
        } catch (companyErr) {
          console.warn("Failed to load company details:", companyErr);
          // Continue without company data - form will handle it
        }
      }
      
      setCustomerData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load customer data");
      toast.error(err.message ?? "Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------ Submit
  const handleSubmit = async (formData: CustomerFormData) => {
    try {
      setSaving(true);
      setError(null);

      const payload: CreateCustomerRequest | UpdateCustomerRequest = {
        company: (formData as any).company,
        customer_code: formData.customer_code,
        name: formData.name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        country: formData.country,
        tax_id: formData.tax_id,
        is_active: formData.is_active,
        custom_fields: formData.custom_fields || [],
      };

      if (isEditMode && id) {
        await customerService.updateCustomer(Number(id), payload);
        toast.success("Customer updated successfully");
      } else {
        await customerService.createCustomer(payload as CreateCustomerRequest);
        toast.success("Customer created successfully");
      }

      router.push("/port-customer-master/customers");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to save customer");
      toast.error(err.message ?? "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.push("/port-customer-master/customers");

  // ------------------------------------------------------------------ UI
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading customer data...</p>
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
          <p className="font-medium">Error loading customer</p>
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
        <CustomerForm
          initialData={
            customerData
              ? {
                  id: customerData.id.toString(),
                  company: (customerData as any).company,
                  company_data: (customerData as any).company_data, // Pass full company object
                  customer_code: customerData.customer_code,
                  name: customerData.name,
                  contact_person: customerData.contact_person,
                  email: customerData.email,
                  phone: customerData.phone,
                  address: customerData.address,
                  country: customerData.country,
                  tax_id: customerData.tax_id,
                  is_active: customerData.is_active,
                  custom_fields: customerData.custom_fields || [],
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
        />
      </div>
    </div>
  );
}

