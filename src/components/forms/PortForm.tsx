"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";

const portSchema = z.object({
  code: z.string().min(1, "Port code is required"),
  name: z.string().min(1, "Port name is required"),
  country: z.string().min(1, "Country is required"),
  unlocode: z.string().min(1, "UNLOCODE is required"),
  timezone: z.string().min(1, "Timezone is required"),
  type: z.enum(["POL", "POD"], { required_error: "Port type is required" }),
  is_active: z.boolean(),
  latitude: z.string().min(1, "Latitude is required"),
  longitude: z.string().min(1, "Longitude is required"),
  address: z.string().optional(),
  description: z.string().optional(),
});

export type PortFormData = z.infer<typeof portSchema>;

interface PortFormProps {
  initialData?: PortFormData & { id?: string };
  onSubmit: (data: PortFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  portType?: "POL" | "POD";
}

/* ------------------------------------------------------------------ Options */
const timezoneOptions = [
  { value: "UTC", label: "UTC" },
  { value: "UTC+01:00", label: "UTC+01:00 (CET)" },
  { value: "UTC+02:00", label: "UTC+02:00 (EET)" },
  { value: "UTC+03:00", label: "UTC+03:00 (MSK)" },
  { value: "UTC+04:00", label: "UTC+04:00 (GST)" },
  { value: "UTC+05:00", label: "UTC+05:00" },
  { value: "UTC+05:30", label: "UTC+05:30 (IST)" },
  { value: "UTC+06:00", label: "UTC+06:00" },
  { value: "UTC+07:00", label: "UTC+07:00 (ICT)" },
  { value: "UTC+08:00", label: "UTC+08:00 (CST)" },
  { value: "UTC+09:00", label: "UTC+09:00 (JST)" },
  { value: "UTC+10:00", label: "UTC+10:00 (AEST)" },
  { value: "UTC+11:00", label: "UTC+11:00" },
  { value: "UTC+12:00", label: "UTC+12:00 (NZST)" },
  { value: "UTC-01:00", label: "UTC-01:00" },
  { value: "UTC-02:00", label: "UTC-02:00" },
  { value: "UTC-03:00", label: "UTC-03:00" },
  { value: "UTC-04:00", label: "UTC-04:00 (AST)" },
  { value: "UTC-05:00", label: "UTC-05:00 (EST)" },
  { value: "UTC-06:00", label: "UTC-06:00 (CST)" },
  { value: "UTC-07:00", label: "UTC-07:00 (MST)" },
  { value: "UTC-08:00", label: "UTC-08:00 (PST)" },
  { value: "UTC-09:00", label: "UTC-09:00" },
  { value: "UTC-10:00", label: "UTC-10:00" },
  { value: "UTC-11:00", label: "UTC-11:00" },
  { value: "UTC-12:00", label: "UTC-12:00" },
];

const countryOptions = [
  { value: "China", label: "China" },
  { value: "USA", label: "United States" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Germany", label: "Germany" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Singapore", label: "Singapore" },
  { value: "Japan", label: "Japan" },
  { value: "South Korea", label: "South Korea" },
  { value: "India", label: "India" },
  { value: "Vietnam", label: "Vietnam" },
  { value: "Thailand", label: "Thailand" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Philippines", label: "Philippines" },
  { value: "France", label: "France" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "Belgium", label: "Belgium" },
  { value: "Denmark", label: "Denmark" },
  { value: "Sweden", label: "Sweden" },
  { value: "Norway", label: "Norway" },
  { value: "Finland", label: "Finland" },
  { value: "Canada", label: "Canada" },
  { value: "Mexico", label: "Mexico" },
  { value: "Brazil", label: "Brazil" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chile", label: "Chile" },
  { value: "Peru", label: "Peru" },
  { value: "Colombia", label: "Colombia" },
  { value: "Venezuela", label: "Venezuela" },
  { value: "South Africa", label: "South Africa" },
  { value: "Egypt", label: "Egypt" },
  { value: "Morocco", label: "Morocco" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Kenya", label: "Kenya" },
  { value: "Ghana", label: "Ghana" },
  { value: "Ethiopia", label: "Ethiopia" },
  { value: "Tanzania", label: "Tanzania" },
  { value: "Uganda", label: "Uganda" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "UAE", label: "United Arab Emirates" },
  { value: "Qatar", label: "Qatar" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Bahrain", label: "Bahrain" },
  { value: "Oman", label: "Oman" },
  { value: "Jordan", label: "Jordan" },
  { value: "Lebanon", label: "Lebanon" },
  { value: "Israel", label: "Israel" },
  { value: "Turkey", label: "Turkey" },
  { value: "Iran", label: "Iran" },
  { value: "Iraq", label: "Iraq" },
  { value: "Syria", label: "Syria" },
  { value: "Yemen", label: "Yemen" },
  { value: "Australia", label: "Australia" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Fiji", label: "Fiji" },
  { value: "Papua New Guinea", label: "Papua New Guinea" },
  { value: "Solomon Islands", label: "Solomon Islands" },
  { value: "Vanuatu", label: "Vanuatu" },
  { value: "New Caledonia", label: "New Caledonia" },
  { value: "French Polynesia", label: "French Polynesia" },
  { value: "Samoa", label: "Samoa" },
  { value: "Tonga", label: "Tonga" },
  { value: "Cook Islands", label: "Cook Islands" },
  { value: "Niue", label: "Niue" },
  { value: "Tokelau", label: "Tokelau" },
  { value: "Tuvalu", label: "Tuvalu" },
  { value: "Kiribati", label: "Kiribati" },
  { value: "Marshall Islands", label: "Marshall Islands" },
  { value: "Micronesia", label: "Micronesia" },
  { value: "Palau", label: "Palau" },
  { value: "Nauru", label: "Nauru" },
  { value: "Other", label: "Other" },
];

/* ------------------------------------------------------------------ Component */
export const PortForm: React.FC<PortFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  portType,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PortFormData>({
    resolver: zodResolver(portSchema),
    defaultValues: {
      code: "",
      name: "",
      country: "",
      unlocode: "",
      timezone: "",
      type: portType ?? "POL",
      is_active: true,
      latitude: "",
      longitude: "",
      address: "",
      description: "",
    },
  });

  const isActive = watch("is_active");
  const isEditing = !!initialData;
  const currentPortType = watch("type");

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        code: "",
        name: "",
        country: "",
        unlocode: "",
        timezone: "",
        type: portType || "POL",
        is_active: true,
        latitude: "",
        longitude: "",
        address: "",
        description: "",
      });
    }
  }, [initialData, reset, portType]);

  const handleFormSubmit = (data: PortFormData) => {
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
          {/* Port Name */}
          <div>
            <Label>
              Port Name <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter Port Name"
              {...register("name")}
              error={errors.name?.message}
            />
          </div>

          {/* Code */}
          <div>
            <Label>
              Code <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter Code"
              {...register("code")}
              error={errors.code?.message}
            />
          </div>

          {/* Country */}
          <div>
            <Label>
              Country <span className="text-red-500">*</span>
            </Label>
            <Select
              options={countryOptions}
              placeholder="Select Country"
              value={watch("country")}
              onChange={(value) => setValue("country", value)}
              className={errors.country ? "border-red-500" : ""}
            />
            {errors.country && (
              <p className="mt-1.5 text-xs text-red-500">{errors.country.message}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <Label>
              Timezone <span className="text-red-500">*</span>
            </Label>
            <Select
              options={timezoneOptions}
              placeholder="Select Timezone"
              value={watch("timezone")}
              onChange={(value) => setValue("timezone", value)}
              className={errors.timezone ? "border-red-500" : ""}
            />
            {errors.timezone && (
              <p className="mt-1.5 text-xs text-red-500">{errors.timezone.message}</p>
            )}
          </div>
        </div>

        {/* Second row - UNLOCODE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <Label>UNLOCODE</Label>
            <Input
              placeholder="Enter UNLOCODE"
              {...register("unlocode")}
              error={errors.unlocode?.message}
            />
          </div>
        </div>
      </section>

      {/* ---------- LOCATION ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Location
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>
              Latitude <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., 31.2304"
              {...register("latitude")}
              error={errors.latitude?.message}
            />
          </div>

          <div>
            <Label>
              Longitude <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="e.g., 121.4737"
              {...register("longitude")}
              error={errors.longitude?.message}
            />
          </div>

          <div>
            <Label>Address</Label>
            <Input
              placeholder="Enter Address"
              {...register("address")}
              error={errors.address?.message}
            />
          </div>
        </div>
      </section>

      {/* ---------- STATUS & NOTES ---------- */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Status & Notes
        </h2>

        {/* Radio – Active / Inactive */}
        <div className="flex items-center gap-6 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="true"
              checked={isActive === true}
              onChange={() => setValue("is_active", true)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
          </label>

          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="false"
              checked={isActive === false}
              onChange={() => setValue("is_active", false)}
              className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Inactive</span>
          </label>
        </div>

        {errors.is_active && (
          <p className="text-xs text-red-500 mb-4">{errors.is_active.message}</p>
        )}

        {/* Description */}
        <div>
          <Label>Description</Label>
          <textarea
            rows={3}
            placeholder="Enter Description"
            {...register("description")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
        </div>
      </section>

      {/* ---------- BUTTONS ---------- */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            isEditing ? "Update" : "Save"
          )}
        </Button>
      </div>
    </form>
  );
};