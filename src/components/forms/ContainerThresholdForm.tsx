"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";

export interface ContainerThresholdFormData {
  container: number;
  port_of_loading: number;
  type: string;
  min_capacity: number;
  max_capacity: number;
  status: boolean;
}

interface ContainerType {
  id: number;
  code: string;
  name: string;
}

interface Port {
  id: number;
  name: string;
  code: string;
  country: string;
  city: string;
  timezone: string;
  is_active: boolean;
}

interface ContainerThresholdFormProps {
  initialData?: ContainerThresholdFormData;
  onSubmit: (data: ContainerThresholdFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  containerTypes: ContainerType[];
  portOfLoading: Port[];
  portOfDischarge: Port[];
}

export function ContainerThresholdForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  containerTypes = [],
  portOfLoading = [],
  portOfDischarge = [],
}: ContainerThresholdFormProps) {

  console.log(containerTypes);
  console.log({portOfLoading});
  console.log(portOfDischarge);


  const [formData, setFormData] = useState<ContainerThresholdFormData>({
    container: 0,
    port_of_loading: 0,
    type: "",
    min_capacity: 0,
    max_capacity: 0,
    status: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle container ID change - sync with container type
  const handleContainerChange = (containerId: number) => {
    const selectedContainer = containerTypes.find(type => type.id === containerId);
    setFormData({
      ...formData,
      container: containerId,
      type: selectedContainer ? selectedContainer.code : ""
    });
  };

  // Handle container type change - sync with container ID
  const handleContainerTypeChange = (containerCode: string) => {
    const selectedContainer = containerTypes.find(type => type.code === containerCode);
    setFormData({
      ...formData,
      container: selectedContainer ? selectedContainer.id : 0,
      type: containerCode
    });
  };

  const handlePortOfLoadingChange = (portOfLoadingId: number) => {
    setFormData({
      ...formData,
      port_of_loading: portOfLoadingId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Container ID *
          </label>

          <select
            value={formData.container}
            onChange={(e) => handleContainerChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select Container</option>
            {containerTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.code} 
              </option>
            ))}
          </select>
         
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Port of Loading ID
          </label>
          <select
            value={formData.port_of_loading}
            onChange={(e) => handlePortOfLoadingChange(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select Port of Loading</option>
            {portOfLoading.map((port) => (
              <option key={port.id} value={port.id}>
                {port.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Container Type *
          </label>

          <select
            value={formData.type}
            onChange={(e) => handleContainerTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">Select Container Type</option>
            {containerTypes.map((type) => (
              <option key={type.id} value={type.code}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={formData.status ? "true" : "false"}
            onChange={(e) => setFormData({ ...formData, status: e.target.value === "true" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Capacity *
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.min_capacity}
            onChange={(e) => setFormData({ ...formData, min_capacity: parseFloat(e.target.value) || 0 })}
            placeholder="0.0"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Capacity *
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.max_capacity}
            onChange={(e) => setFormData({ ...formData, max_capacity: parseFloat(e.target.value) || 0 })}
            placeholder="0.0"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : (initialData ? "Update Threshold" : "Create Threshold")}
        </Button>
      </div>
    </form>
  );
}
