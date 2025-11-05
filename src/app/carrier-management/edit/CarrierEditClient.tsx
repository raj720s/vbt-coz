"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CarrierForm, type CarrierFormData } from "@/components/forms/CarrierForm";
import { CarrierResponse, CreateCarrierRequest, UpdateCarrierRequest } from "@/types/api";
import { carrierService } from "@/services";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";

export default function CarrierEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [carrier, setCarrier] = useState<CarrierResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) loadCarrier();
  }, [id, isEditMode]);

  const loadCarrier = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await carrierService.getCarrier(Number(id));
      setCarrier(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load carrier");
      toast.error(err.message ?? "Failed to load carrier");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: CarrierFormData) => {
    try {
      setSaving(true);
      setError(null);

      const payload: CreateCarrierRequest | UpdateCarrierRequest = {
        name: formData.name,
        carrier_code: formData.carrier_code,
        transportation_mode: formData.transportation_mode,
        is_active: formData.is_active,
      };

      if (isEditMode && id) {
        await carrierService.updateCarrier(Number(id), payload);
        toast.success("Carrier updated successfully");
      } else {
        await carrierService.createCarrier(payload as CreateCarrierRequest);
        toast.success("Carrier created successfully");
      }

      router.push("/carrier-management");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to save carrier");
      toast.error(err.message ?? "Failed to save carrier");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.push("/carrier-management");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading carrier...</p>
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
          <p className="font-medium">Error loading carrier</p>
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
        <CarrierForm
          initialData={carrier ? {
            name: carrier.name,
            carrier_code: carrier.carrier_code,
            transportation_mode: carrier.transportation_mode,
            is_active: carrier.is_active,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={saving}
        />
      </div>
    </div>
  );
}


