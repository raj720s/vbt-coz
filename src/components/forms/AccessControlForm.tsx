"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { AVAILABLE_ROUTES, DEFAULT_ROLE_ACCESS, RouteKey } from "@/types/user";

const accessControlSchema = z.object({
  accessControl: z.array(z.string()).min(1, "At least one route must be selected"),
});

type AccessControlFormData = z.infer<typeof accessControlSchema>;

interface AccessControlFormProps {
  initialData?: {
    role: "admin" | "user";
    accessControl: string[];
  };
  onSubmit: (data: AccessControlFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const AccessControlForm: React.FC<AccessControlFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">(initialData?.role || "user");
  const [availableRoutes, setAvailableRoutes] = useState<RouteKey[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccessControlFormData>({
    resolver: zodResolver(accessControlSchema),
    defaultValues: {
      accessControl: initialData?.accessControl || DEFAULT_ROLE_ACCESS.user,
    },
  });

  const selectedRoutes = watch("accessControl");

  // Update available routes when role changes
  useEffect(() => {
    const routes = Object.keys(AVAILABLE_ROUTES) as RouteKey[];
    setAvailableRoutes(routes);
  }, []);

  // Update default access control when role changes
  useEffect(() => {
    const defaultRoutes = DEFAULT_ROLE_ACCESS[selectedRole];
    setValue("accessControl", defaultRoutes);
  }, [selectedRole, setValue]);

  const handleRoleChange = (role: "admin" | "user") => {
    setSelectedRole(role);
    const defaultRoutes = DEFAULT_ROLE_ACCESS[role];
    setValue("accessControl", defaultRoutes);
  };

  const handleRouteToggle = (route: string, checked: boolean) => {
    const currentRoutes = watch("accessControl");
    if (checked) {
      setValue("accessControl", [...currentRoutes, route]);
    } else {
      setValue("accessControl", currentRoutes.filter(r => r !== route));
    }
  };

  const handleSelectAll = () => {
    setValue("accessControl", availableRoutes);
  };

  const handleClearAll = () => {
    setValue("accessControl", []);
  };

  const handleSelectDefault = () => {
    const defaultRoutes = DEFAULT_ROLE_ACCESS[selectedRole];
    setValue("accessControl", defaultRoutes);
  };

  const handleFormSubmit = (data: AccessControlFormData) => {
    onSubmit(data);
  };

  const groupedRoutes = {
    admin: availableRoutes.filter(route => route.startsWith("admin/")),
    user: availableRoutes.filter(route => route.startsWith("user/")),
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Role Selection */}
      <div>
        <Label>User Role</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="user"
              checked={selectedRole === "user"}
              onChange={() => handleRoleChange("user")}
              className="mr-2"
            />
            <span className="text-sm">User</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="role"
              value="admin"
              checked={selectedRole === "admin"}
              onChange={() => handleRoleChange("admin")}
              className="mr-2"
            />
            <span className="text-sm">Admin</span>
          </label>
        </div>
      </div>

      {/* Access Control Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
        >
          Clear All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectDefault}
        >
          Default for {selectedRole}
        </Button>
      </div>

      {/* Route Selection */}
      <div>
        <Label>Route Access Control</Label>
        <div className="mt-2 space-y-4">
          {/* Admin Routes */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Admin Routes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groupedRoutes.admin.map((route) => (
                <div key={route} className="flex items-center">
                  <Checkbox
                    checked={selectedRoutes.includes(route)}
                    onChange={(e) => handleRouteToggle(route, e.target.checked)}
                    label={AVAILABLE_ROUTES[route]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* User Routes */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Routes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {groupedRoutes.user.map((route) => (
                <div key={route} className="flex items-center">
                  <Checkbox
                    checked={selectedRoutes.includes(route)}
                    onChange={(e) => handleRouteToggle(route, e.target.checked)}
                    label={AVAILABLE_ROUTES[route]}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {errors.accessControl && (
          <p className="mt-1.5 text-xs text-red-500">{errors.accessControl.message}</p>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Access Summary</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Selected Routes: {selectedRoutes.length}</p>
          <p>Role: {selectedRole}</p>
          <p className="mt-2">
            <strong>Selected Routes:</strong>
          </p>
          <div className="mt-1 max-h-20 overflow-y-auto">
            {selectedRoutes.map((route) => (
              <div key={route} className="text-xs">
                • {AVAILABLE_ROUTES[route as RouteKey]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Actions */}
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
          disabled={isLoading}
          className="min-w-[100px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </div>
          ) : (
            "Save Access Control"
          )}
        </Button>
      </div>
    </form>
  );
}; 