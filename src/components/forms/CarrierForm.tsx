"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";

// Form validation schema
const carrierSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  carrier_code: z.string().min(1, "Carrier code is required").max(50, "Carrier code must be less than 50 characters"),
  transportation_mode: z.number().int().default(5),
  is_active: z.boolean(),
});

export type CarrierFormData = z.infer<typeof carrierSchema>;

interface CarrierFormProps {
  initialData?: Partial<CarrierFormData>;
  onSubmit: (data: CarrierFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CarrierForm: React.FC<CarrierFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CarrierFormData>({
    resolver: zodResolver(carrierSchema),
    defaultValues: {
      name: "",
      carrier_code: "",
      transportation_mode: 5,
      is_active: true,
    },
  });

  const isActive = watch("is_active");
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name ?? "",
        carrier_code: initialData.carrier_code ?? "",
        transportation_mode: initialData.transportation_mode ?? 5,
        is_active: initialData.is_active ?? true,
      });
    } else {
      reset({
        name: "",
        carrier_code: "",
        transportation_mode: 5,
        is_active: true,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: CarrierFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
      {/* ---------- BASIC DETAILS ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Basic Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Carrier Name */}
          <div>
            <Label>
              Carrier Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter carrier name"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>

          {/* Carrier Code */}
          <div>
            <Label>
              Carrier Code <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter carrier code"
              {...register("carrier_code")}
              error={errors.carrier_code?.message}
            />
          </div>

          {/* Transportation Mode */}
          <div>
            <Label>Transportation Mode</Label>
            <Select
              options={[
                { value: '5', label: 'Ocean' },
                { value: '10', label: 'Air' },
                { value: '15', label: 'Road' },
                { value: '20', label: 'Rail' },
              ]}
              placeholder="Select mode"
              value={String(watch('transportation_mode'))}
              onChange={(value) => setValue('transportation_mode', Number(value))}
            />
          </div>
        </div>
      </section>

      {/* ---------- STATUS & NOTES ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Status & Notes
        </h2>

        {/* Radio - Active / Inactive */}
        <div className="flex items-center gap-6 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="true"
              checked={isActive === true}
              onChange={() => setValue('is_active', true)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="false"
              checked={isActive === false}
              onChange={() => setValue('is_active', false)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Inactive</span>
          </label>
        </div>

        {/* Description */}
        <div>
          <Label>Description</Label>
          <textarea
            rows={3}
            placeholder="Enter Description"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
      </section>

      {/* ---------- BUTTONS ---------- */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="min-w-[100px]"
        >
          {isEditing ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
};

