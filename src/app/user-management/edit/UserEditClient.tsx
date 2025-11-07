"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserForm, type UserFormData } from "@/components/forms/UserForm";
import { userService } from "@/services/userService";
import { companyService } from "@/services/companyService";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";

export default function UserEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) loadUser();
  }, [id, isEditMode]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiData = await userService.getUser(Number(id));
      
      // Get company from company_dict if available
      let companyData = null;
      const companyId = (apiData as any).company_dict?.id || (apiData as any).company;
      
      if (companyId) {
        // If company_dict is provided, use it directly
        if ((apiData as any).company_dict) {
          companyData = {
            id: (apiData as any).company_dict.id,
            name: (apiData as any).company_dict.name,
          };
        } else {
          // Otherwise fetch company details
          try {
            companyData = await companyService.getCompany(companyId);
          } catch (companyErr) {
            console.warn("Failed to load company details:", companyErr);
          }
        }
      }
      
      // Transform API response to match User type expected by UserForm
      // Note: API returns 'role' property (not 'role_id') for GET /api/user/v1/{id}
      const transformedData = {
        id: apiData.id?.toString() || id?.toString() || "",
        firstName: apiData.first_name || "",
        lastName: apiData.last_name || "",
        email: apiData.email || "",
        role: (apiData as any).role != null ? (apiData as any).role : null, // Use 'role' property from API response
        status: apiData.status ? "active" : "inactive",
        // organisation_name: apiData.organisation_name || "",
        company: companyId || undefined,
        company_data: companyData,
      };
      
      setUserData(transformedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load user");
      toast.error(err.message ?? "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push("/user-management");
  };

  const handleCancel = () => router.push("/user-management");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading user...</p>
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
          <p className="font-medium">Error loading user</p>
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
        <UserForm
          initialData={userData || undefined}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          isEditing={isEditMode}
        />
      </div>
    </div>
  );
}


