"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Company } from "@/types/company";
import { companyService } from "@/services/companyService";
import { CompanyForm } from "@/components/forms/CompanyForm";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";
import toast from "react-hot-toast";

export default function CompanyEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) loadCompany();
  }, [id, isEditMode]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyService.getCompany(Number(id));
      setCompany(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load company");
      toast.error(err.message ?? "Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/company-management");
  };

  const handleCancel = () => router.push("/company-management");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading company...</p>
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
          <p className="font-medium">Error loading company</p>
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
        <CompanyForm
          initialData={company || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isEditing={isEditMode}
        />
      </div>
    </div>
  );
}


