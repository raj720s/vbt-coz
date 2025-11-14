"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShipmentOrderForm } from "@/components/forms/ShipmentOrderForm";
import { ShipmentOrderFormData } from "@/types/shipmentOrder";
import { ShipmentRead, shipmentOrderService } from "@/services/shipmentOrderService";
import { convertApiResponseToFormFormat, convertFormDataToApiFormat } from "@/components/forms/statusUtils";
import toast from "react-hot-toast";
import Button from "@/components/ui/button/Button";
import { ArrowLeftIcon } from "@/icons";

export default function ShipmentOrderEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [shipmentData, setShipmentData] = useState<ShipmentRead | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load shipment order data
  useEffect(() => {
    if (isEditMode && id) loadShipmentData();
  }, [id, isEditMode]);

  const loadShipmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await shipmentOrderService.getShipmentOrder(Number(id));
      setShipmentData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load shipment order data");
      toast.error(err.message ?? "Failed to load shipment order data");
    } finally {
      setLoading(false);
    }
  };

  // Submit handler
  const handleSubmit = async (formData: ShipmentOrderFormData) => {
    try {
      setSaving(true);
      setError(null);

      // Convert form data to API format
      const apiData = convertFormDataToApiFormat(formData);

      if (isEditMode && id) {
        await shipmentOrderService.updateShipmentOrder(Number(id), apiData);
        toast.success("Shipment order updated successfully");
      } else {
        await shipmentOrderService.createShipmentOrder(apiData);
        toast.success("Shipment order created successfully");
      }

      router.push("/shipment-orders");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to save shipment order");
      toast.error(err.message ?? "Failed to save shipment order");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.push("/shipment-orders");

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading shipment order data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (edit mode)
  if (error && isEditMode) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" /> Back to List
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading shipment order</p>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg">
        <ShipmentOrderForm
          initialData={
            shipmentData
              ? convertApiResponseToFormFormat(shipmentData)
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

