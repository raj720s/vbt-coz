"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Supplier } from "@/types/supplier";
import { supplierService } from "@/services/supplierService";
import { companyService } from "@/services/companyService";
import { SupplierForm } from "@/components/forms/SupplierForm";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";
import toast from "react-hot-toast";

export default function SupplierEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) loadSupplier();
  }, [id, isEditMode]);

  const loadSupplier = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.getSupplier(Number(id));
      
      // Fetch company details if company ID exists
      if (data.company) {
        try {
          const company = await companyService.getCompany(data.company);
          // Attach full company object to supplier data for form
          (data as any).company_data = company;
        } catch (companyErr) {
          console.warn("Failed to load company details:", companyErr);
          // Continue without company data - form will handle it
        }
      }
      
      setSupplier(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load supplier");
      toast.error(err.message ?? "Failed to load supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/supplier-management");
  };

  const handleCancel = () => router.push("/supplier-management");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading supplier...</p>
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
          <p className="font-medium">Error loading supplier</p>
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
        <SupplierForm
          initialData={supplier ? { ...supplier, company_data: (supplier as any).company_data } : undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isEditing={isEditMode}
        />
      </div>
    </div>
  );
}

