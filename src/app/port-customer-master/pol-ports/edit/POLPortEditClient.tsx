"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortForm, type PortFormData } from "@/components/forms/PortForm";
import { POLResponse, CreatePOLRequest, UpdatePOLRequest } from "@/types/api";
import { polService } from "@/services";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";

export default function POLPortEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [polData, setPolData] = useState<POLResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------------ Load
  useEffect(() => {
    if (isEditMode && id) loadPOLData();
  }, [id, isEditMode]);

  const loadPOLData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await polService.getPOL(Number(id));
      setPolData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load POL port data");
      toast.error(err.message ?? "Failed to load POL port data");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------ Submit
  const handleSubmit = async (formData: PortFormData) => {
    try {
      setSaving(true);
      setError(null);

      const payload: CreatePOLRequest | UpdatePOLRequest = {
        name: formData.name,
        code: formData.code,
        country: formData.country,
        unlocode: formData.unlocode || undefined,
        timezone: formData.timezone,
        is_active: formData.is_active,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address || undefined,
        description: formData.description || undefined,
      };

      // Debug: Log payload to verify city is not included
      console.log('POL Payload:', JSON.stringify(payload, null, 2));

      if (isEditMode && id) {
        await polService.updatePOL(Number(id), payload);
        toast.success("POL port updated successfully");
      } else {
        await polService.createPOL(payload as CreatePOLRequest);
        toast.success("POL port created successfully");
      }

      router.push("/port-customer-master/pol-ports");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to save POL port");
      toast.error(err.message ?? "Failed to save POL port");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.push("/port-customer-master/pol-ports");

  // ------------------------------------------------------------------ UI
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading POL port data...</p>
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
          <p className="font-medium">Error loading POL port</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0">
      {/* Header */}
      {/* <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? "Edit POL Port" : "Add New POL Port"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditMode ? "Update the Port of Loading information" : "Create a new Port of Loading port"}
          </p>
        </div>
        <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </Button>
      </div> */}

      {/* Global error (create mode) */}
      {error && !isEditMode && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <PortForm
          initialData={
            polData
              ? {
                  id: polData.id.toString(),
                  code: polData.code,
                  name: polData.name,
                  country: polData.country,
                  unlocode: polData.unlocode || "",
                  timezone: polData.timezone,
                  type: "POL" as const,
                  is_active: polData.is_active,
                  latitude: polData.latitude,
                  longitude: polData.longitude,
                  address: polData.address || "",
                  description: polData.description || "",
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
          portType="POL"
        />
      </div>
    </div>
  );
}