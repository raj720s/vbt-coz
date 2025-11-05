"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { 
  CreateRoleRequestV2, 
  UpdateRoleRequestV2, 
  PrivilegeResponseV2, 
  PrivilegeItemV2,
  ModulePrivilegeMapping 
} from "@/services/roleService";
import { staticModuleDefinitions } from "@/config/staticModules";
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from "@/icons";
import toast from "react-hot-toast";

const enhancedRoleSchema = z.object({
  role_name: z.string().min(2, "Role name must be at least 2 characters"),
  role_description: z.string().min(10, "Role description must be at least 10 characters"),
  privilege_names: z.array(z.string()).min(1, "At least one privilege must be selected"),
});

type EnhancedRoleFormData = z.infer<typeof enhancedRoleSchema>;

interface EnhancedRoleFormProps {
  initialData?: {
    id: string;
    role_name: string;
    role_description: string;
    privilege_names: string[];
  };
  privileges: PrivilegeResponseV2 | null;
  onSubmit: (data: CreateRoleRequestV2 | UpdateRoleRequestV2) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function EnhancedRoleForm({ 
  initialData, 
  privileges, 
  onSubmit, 
  isLoading = false, 
  onCancel 
}: EnhancedRoleFormProps) {
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EnhancedRoleFormData>({
    resolver: zodResolver(enhancedRoleSchema),
    defaultValues: {
      role_name: initialData?.role_name || "",
      role_description: initialData?.role_description || "",
      privilege_names: initialData?.privilege_names || [],
    },
  });

  const isEditing = !!initialData;
  const roleName = watch("role_name");
  const roleDescription = watch("role_description");

  // Initialize selected privileges from initial data
  useEffect(() => {
    if (initialData?.privilege_names) {
      setSelectedPrivileges(initialData.privilege_names);
    }
  }, [initialData]);

  // Create module privilege mappings
  const modulePrivilegeMappings = useMemo((): ModulePrivilegeMapping[] => {
    if (!privileges?.results) return [];

    return Object.values(staticModuleDefinitions.modules).map(module => {
      const modulePrivileges = privileges.results.filter(
        privilege => privilege.module_id === module.id
      );
      
      const selectedModulePrivileges = selectedPrivileges.filter(privilegeName =>
        modulePrivileges.some(p => p.privilege_name === privilegeName)
      );

      return {
        module_id: module.id,
        module_name: module.name,
        module_description: module.description,
        module_icon: module.icon,
        module_color: module.color,
        available_privileges: modulePrivileges,
        selected_privileges: selectedModulePrivileges,
        is_expanded: expandedModules.has(module.id)
      };
    }).filter(mapping => mapping.available_privileges.length > 0);
  }, [privileges, selectedPrivileges, expandedModules]);

  // Filter modules based on search
  const filteredModuleMappings = useMemo(() => {
    if (!searchTerm && selectedModule === "all") {
      return modulePrivilegeMappings;
    }

    return modulePrivilegeMappings.filter(mapping => {
      const matchesSearch = searchTerm === "" || 
        mapping.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.module_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.available_privileges.some(p => 
          p.privilege_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.privilege_desc.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      const matchesModule = selectedModule === "all" || 
        mapping.module_id.toString() === selectedModule;

      return matchesSearch && matchesModule;
    });
  }, [modulePrivilegeMappings, searchTerm, selectedModule]);

  // Get unique modules for filter dropdown
  const availableModules = useMemo(() => {
    return modulePrivilegeMappings.map(mapping => ({
      id: mapping.module_id,
      name: mapping.module_name
    }));
  }, [modulePrivilegeMappings]);

  const toggleModuleExpansion = (moduleId: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const togglePrivilege = (privilegeName: string) => {
    setSelectedPrivileges(prev => {
      if (prev.includes(privilegeName)) {
        return prev.filter(p => p !== privilegeName);
      } else {
        return [...prev, privilegeName];
      }
    });
  };

  const selectAllModulePrivileges = (moduleId: number) => {
    const module = modulePrivilegeMappings.find(m => m.module_id === moduleId);
    if (!module) return;

    const modulePrivilegeNames = module.available_privileges.map(p => p.privilege_name);
    const newSelectedPrivileges = [...selectedPrivileges];
    
    modulePrivilegeNames.forEach(privilegeName => {
      if (!newSelectedPrivileges.includes(privilegeName)) {
        newSelectedPrivileges.push(privilegeName);
      }
    });

    setSelectedPrivileges(newSelectedPrivileges);
    toast.success(`Selected all ${modulePrivilegeNames.length} privileges for ${module.module_name}`);
  };

  const clearModulePrivileges = (moduleId: number) => {
    const module = modulePrivilegeMappings.find(m => m.module_id === moduleId);
    if (!module) return;

    const modulePrivilegeNames = module.available_privileges.map(p => p.privilege_name);
    const newSelectedPrivileges = selectedPrivileges.filter(
      p => !modulePrivilegeNames.includes(p)
    );

    setSelectedPrivileges(newSelectedPrivileges);
    toast.success(`Cleared all privileges for ${module.module_name}`);
  };

  const selectAllPrivileges = () => {
    const allPrivilegeNames = modulePrivilegeMappings.flatMap(
      mapping => mapping.available_privileges.map(p => p.privilege_name)
    );
    setSelectedPrivileges(allPrivilegeNames);
    toast.success(`Selected all ${allPrivilegeNames.length} privileges`);
  };

  const clearAllPrivileges = () => {
    setSelectedPrivileges([]);
    toast.success('Cleared all selected privileges');
  };

  const handleFormSubmit = (data: EnhancedRoleFormData) => {
    const finalData = {
      ...data,
      privilege_names: selectedPrivileges
    };

    onSubmit(finalData);
  };

  return (
    <div className="h-full flex flex-col">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full space-y-6">
        {/* Basic Role Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="role_name">Role Name *</Label>
            <Input
              id="role_name"
              {...register("role_name")}
              placeholder="Enter role name (e.g., Super Admin, Manager, User)"
              error={errors.role_name?.message}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="role_description">Role Description *</Label>
            <textarea
              id="role_description"
              {...register("role_description")}
              placeholder="Describe the role's purpose and responsibilities..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px] resize-vertical"
              disabled={isLoading}
            />
            {errors.role_description && (
              <p className="mt-1.5 text-xs text-red-500">{errors.role_description.message}</p>
            )}
          </div>
        </div>

        {/* Module-Based Privilege Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Module Privileges *</Label>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectAllPrivileges}
                disabled={isLoading || !privileges}
                className="text-xs px-3 py-1.5"
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllPrivileges}
                disabled={isLoading}
                className="text-xs px-3 py-1.5"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="privilege-search" className="text-sm font-medium mb-2 block">
                Search Modules & Privileges
              </Label>
              <Input
                id="privilege-search"
                placeholder="Search modules or privileges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="module-filter" className="text-sm font-medium mb-2 block">
                Filter by Module
              </Label>
              <select
                id="module-filter"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={isLoading}
              >
                <option value="all">All Modules</option>
                {availableModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Privileges Summary */}
          {selectedPrivileges.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Selected Privileges ({selectedPrivileges.length})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllPrivileges}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                {selectedPrivileges.map((privilege) => (
                  <span
                    key={privilege}
                    className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                  >
                    {privilege}
                    <button
                      type="button"
                      onClick={() => togglePrivilege(privilege)}
                      className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Module Privilege Selection */}
          <div className="space-y-4 max-h-96 overflow-y-auto thin-scrollbar">
            {filteredModuleMappings.map((mapping) => (
              <div
                key={mapping.module_id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Module Header */}
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => toggleModuleExpansion(mapping.module_id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {mapping.is_expanded ? (
                          <ChevronDownIcon className="w-5 h-5" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5" />
                        )}
                      </button>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: mapping.module_color }}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {mapping.module_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {mapping.module_description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {mapping.selected_privileges.length}/{mapping.available_privileges.length}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectAllModulePrivileges(mapping.module_id)}
                        disabled={isLoading}
                        className="text-xs px-2 py-1"
                      >
                        All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => clearModulePrivileges(mapping.module_id)}
                        disabled={isLoading}
                        className="text-xs px-2 py-1"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Module Privileges */}
                {mapping.is_expanded && (
                  <div className="p-4 bg-white dark:bg-gray-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mapping.available_privileges.map((privilege) => (
                        <label
                          key={privilege.id}
                          className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPrivileges.includes(privilege.privilege_name)}
                            onChange={() => togglePrivilege(privilege.privilege_name)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                            disabled={isLoading}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {privilege.privilege_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {privilege.privilege_desc}
                            </div>
                          </div>
                          {selectedPrivileges.includes(privilege.privilege_name) && (
                            <CheckIcon className="w-5 h-5 text-blue-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || selectedPrivileges.length === 0}
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  );
}
