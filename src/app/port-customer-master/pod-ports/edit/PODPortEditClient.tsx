"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortForm, type PortFormData } from "@/components/forms/PortForm";
import { PODResponse, CreatePODRequest, UpdatePODRequest } from "@/types/api";
import { podService } from "@/services";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";

export default function PODPortEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [podData, setPodData] = useState<PODResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------------------ Load
  useEffect(() => {
    if (isEditMode && id) loadPODData();
  }, [id, isEditMode]);

  const loadPODData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await podService.getPOD(Number(id));
      setPodData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load POD port data");
      toast.error(err.message ?? "Failed to load POD port data");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------ Submit
  const handleSubmit = async (formData: PortFormData) => {
    try {
      setSaving(true);
      setError(null);

      const payload: CreatePODRequest | UpdatePODRequest = {
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
      console.log('POD Payload:', JSON.stringify(payload, null, 2));

      if (isEditMode && id) {
        await podService.updatePOD(Number(id), payload);
        toast.success("POD port updated successfully");
      } else {
        await podService.createPOD(payload as CreatePODRequest);
        toast.success("POD port created successfully");
      }

      router.push("/port-customer-master/pod-ports");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to save POD port");
      toast.error(err.message ?? "Failed to save POD port");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.push("/port-customer-master/pod-ports");

  // ------------------------------------------------------------------ UI
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading POD port data...</p>
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
          <p className="font-medium">Error loading POD port</p>
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
        <PortForm
          initialData={
            podData
              ? {
                  id: podData.id.toString(),
                  code: podData.code,
                  name: podData.name,
                  country: podData.country,
                  unlocode: podData.unlocode || "",
                  timezone: podData.timezone,
                  type: "POD" as const,
                  is_active: podData.is_active,
                  latitude: podData.latitude,
                  longitude: podData.longitude,
                  address: podData.address || "",
                  description: podData.description || "",
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
          portType="POD"
        />
      </div>
    </div>
  );
}

