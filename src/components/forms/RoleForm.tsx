"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { CreateRoleRequest, UpdateRoleRequest, ModulePrivileges, roleService } from "@/services/roleService";
import { staticModuleDefinitions, StaticModule } from "@/config/staticModules";
import { simplifiedRBACService } from "@/services/simplifiedRBACService";
import toast from "react-hot-toast";

const roleSchema = z.object({
  role_name: z.string().min(2, "Role name must be at least 2 characters"),
  role_description: z.string().min(10, "Role description must be at least 10 characters"),
  privilege_names: z.array(z.string()).min(1, "At least one privilege must be selected"),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface PrivilegeApiResponse {
  count: number;
  results: ModulePrivileges[];
}

interface RoleFormProps {
  initialData?: {
    id: string | number;
    role_name: string;
    role_description: string;
    privilege_names?: string[];
  };
  privileges: PrivilegeApiResponse | null;
  rolesWithPrivileges?: any[]; // Preloaded roles with privilege data
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function RoleForm({ 
  initialData, 
  privileges: externalPrivileges, 
  rolesWithPrivileges,
  onSubmit, 
  isLoading = false, 
  onCancel 
}: RoleFormProps) {
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [privileges, setPrivileges] = useState<PrivilegeApiResponse | null>(null);
  const [privilegesLoading, setPrivilegesLoading] = useState(false);
  const [modulePrivileges, setModulePrivileges] = useState<ModulePrivileges[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      role_name: "",
      role_description: "",
      privilege_names: [],
    },
  });

  const isEditing = !!initialData;
  const roleName = watch("role_name");
  const roleDescription = watch("role_description");


  // Helper function to get current role's privileges from preloaded data
  const getCurrentRolePrivileges = useMemo(() => {
    if (!initialData || !rolesWithPrivileges) return null;
    
    const currentRole = rolesWithPrivileges.find(role => role.id === initialData.id);
    return currentRole?.privileges || null;
  }, [initialData, rolesWithPrivileges]);

  // Fetch privileges function
  const fetchPrivileges = async () => {
    try {
      setPrivilegesLoading(true);
      const response = await roleService.getPrivileges();
      console.log('🔍 RoleForm: Privileges fetched:', response);
      setPrivileges(response);
      
      // The API response already has the correct module structure
      const modulePrivileges = response.results || [];
      console.log('🔍 RoleForm: Module privileges from API:', modulePrivileges);
      setModulePrivileges(modulePrivileges);
    } catch (error) {
      console.error('❌ RoleForm: Error fetching privileges:', error);
      toast.error('Failed to fetch privileges');
    } finally {
      setPrivilegesLoading(false);
    }
  };

  // Get unique modules from static modules with API privilege data
  const modules = useMemo(() => {
    const staticModules = staticModuleDefinitions.modules;
    return Object.values(staticModules).map(staticModule => {
      // Find corresponding API data for this module
      const apiModuleData = modulePrivileges.find(mp => mp.module_id === staticModule.id.toString());
      return {
        module_id: staticModule.id.toString(),
        module_name: staticModule.name,
        privileges: apiModuleData ? apiModuleData.privileges : []
      };
    }).filter(module => module.privileges.length > 0); // Only show modules that have privileges
  }, [modulePrivileges]);

  // Fetch privileges on component mount
  useEffect(() => {
    if (externalPrivileges) {
      // Use external privileges if provided
      setPrivileges(externalPrivileges);
      
      // The external privileges should already have the correct module structure
      const modulePrivileges = externalPrivileges.results || [];
      console.log('🔍 RoleForm: External module privileges:', modulePrivileges);
      setModulePrivileges(modulePrivileges);
      setPrivilegesLoading(false);
    } else {
      // Fetch privileges from API
      fetchPrivileges();
    }
  }, [externalPrivileges]);

  // Set initial values when editing
  useEffect(() => {
    if (initialData) {
      reset({
        role_name: initialData.role_name,
        role_description: initialData.role_description,
        privilege_names: initialData.privilege_names || [],
      });
      
      // Set selected privileges from initial data
      if (initialData.privilege_names && initialData.privilege_names.length > 0) {
        // Create a copy to avoid read-only array issues
        const initialPrivileges = [...initialData.privilege_names];
        setSelectedPrivileges(initialPrivileges);
        console.log('🔍 RoleForm: Setting initial privileges from initialData:', initialPrivileges);
      } else {
        // If no privileges in initial data, try to get from preloaded data
        const currentRolePrivileges = getCurrentRolePrivileges;
        if (currentRolePrivileges && currentRolePrivileges.length > 0) {
          const privilegeNames = currentRolePrivileges.map((p: any) => p.privilege_name);
          setSelectedPrivileges([...privilegeNames]);
          console.log('🔍 RoleForm: Setting initial privileges from preloaded data:', privilegeNames);
        }
      }

    }
  }, [initialData, reset, getCurrentRolePrivileges]);

  // Update form when selected privileges change
  useEffect(() => {
    setValue("privilege_names", selectedPrivileges || []);
  }, [selectedPrivileges, setValue]);


  // Set selected privileges when privileges data is loaded and we have initial data
  useEffect(() => {
    if (privileges && privileges.results && initialData && initialData.privilege_names) {
      // Check if the privileges we have match the initial data
      const availablePrivilegeNames = privileges.results.flatMap(module => 
        module.privileges.map((p: any) => p.privilege_name)
      );
      const initialPrivileges = initialData.privilege_names;
      
      // Only set if we haven't already set them and if they're different
      // Create copies before sorting to avoid mutating read-only arrays
      if (selectedPrivileges.length === 0 || 
          JSON.stringify([...selectedPrivileges].sort()) !== JSON.stringify([...initialPrivileges].sort())) {
        console.log('🔍 RoleForm: Privileges loaded, setting selected privileges:', {
          available: availablePrivilegeNames.length,
          initial: initialPrivileges,
          current: selectedPrivileges
        });
        setSelectedPrivileges([...initialPrivileges]); // Create a copy to avoid read-only issues
      }
    }
  }, [privileges, initialData]); // Removed selectedPrivileges from dependencies to prevent infinite loop


  const togglePrivilege = (privilegeName: string) => {
    console.log('🔍 RoleForm: Toggling privilege:', privilegeName);
    
    setSelectedPrivileges(prev => {
      if (!prev) {
        return [privilegeName];
      }
      
      const newPrivileges = prev.includes(privilegeName)
        ? prev.filter(p => p !== privilegeName)
        : [...prev, privilegeName];
      
      console.log('🔍 RoleForm: New privileges:', newPrivileges);
      return newPrivileges;
    });
  };

  const selectAllPrivileges = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent form submission
    if (!modules.length) {
      toast.error('Privileges not loaded yet');
      return;
    }
    
    const allPrivilegeNames = modules.flatMap(module => 
      module.privileges.map((privilege: any) => privilege.privilege_name)
    );
    setSelectedPrivileges(allPrivilegeNames);
    toast.success(`Selected ${allPrivilegeNames.length} privileges`);
  };

  const clearAllPrivileges = (e?: React.MouseEvent) => {
    e?.preventDefault(); // Prevent form submission
    setSelectedPrivileges([]);
  };

  // Form submission handler
  const handleFormSubmit = (data: RoleFormData) => {
    console.log('🔍 RoleForm: Form submitted with data:', data);
    
    if (isEditing && initialData) {
      // Update existing role
      const updateData: UpdateRoleRequest = {
        role_name: data.role_name,
        role_description: data.role_description,
        privilege_names: data.privilege_names,
      };
      onSubmit(updateData);
    } else {
      // Create new role
      const createData: CreateRoleRequest = {
        role_name: data.role_name,
        role_description: data.role_description,
        privilege_names: data.privilege_names,
      };
      onSubmit(createData);
    }
  };

    // Filter privileges based on search and module
  const filteredPrivileges = useMemo(() => {
    if (!modules.length) return [];
    
    return modules.filter(module => {
      const matchesModule = selectedModule === "all" || module.module_id === selectedModule;
      return matchesModule;
    });
  }, [modules, selectedModule]);

         return (
     <div className="h-full flex flex-col">
       <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full space-y-4">
        {/* Basic Role Information */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="role_name">Role Name *</Label>
            <Input
              id="role_name"
              {...register("role_name")}
              placeholder="Enter role name (e.g., Admin, Manager, User)"
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

         {/* Module Selection */}
         <div className="space-y-4">
           <div className="flex items-center justify-between">
             <Label className="text-base font-semibold">Select Module</Label>
           </div>
           
           <div>
             <Label htmlFor="module-select" className="text-sm font-medium mb-2 block">Filter by Module</Label>
             <select
               id="module-select"
               value={selectedModule}
               onChange={(e) => setSelectedModule(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
               disabled={isLoading}
             >
               <option value="all">All Modules</option>
               {modules.map((module) => (
                 <option key={module.module_id} value={module.module_id}>
                   {module.module_name}
                 </option>
               ))}
             </select>
           </div>
         </div>

         {/* Privilege Selection */}
         <div className="space-y-4">
           <div className="flex items-center justify-between">
             <Label className="text-base font-semibold">Privileges *</Label>
             <div className="flex space-x-2">
               <Button
                 size="sm"
                 variant="outline"
                 onClick={fetchPrivileges}
                 disabled={privilegesLoading}
                 className="text-xs px-3 py-1.5"
               >
                 {privilegesLoading ? "Loading..." : "Refresh"}
               </Button>
               <Button
                 size="sm"
                 variant="outline"
                 onClick={selectAllPrivileges}
                 disabled={isLoading || !modules.length}
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

                                 

                      {/* Selected Privileges Summary */}
           {selectedPrivileges && selectedPrivileges.length > 0 && (
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
               <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto thin-scrollbar">
                 {selectedPrivileges.map((privilege) => (
                   <span
                     key={privilege}
                     className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                   >
                     <span className="truncate max-w-32">{privilege}</span>
                     <button
                       onClick={() => togglePrivilege(privilege)}
                       className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-1 hover:bg-blue-300 dark:hover:bg-blue-600 rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold"
                       disabled={isLoading}
                     >
                       ×
                     </button>
                   </span>
                 ))}
               </div>
             </div>
           )}


           {/* Privilege List - Module-wise Display */}
           <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
             <div className="max-h-80 overflow-y-auto thin-scrollbar">
               {privilegesLoading ? (
                 <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                   Loading privileges...
                 </div>
               ) : filteredPrivileges.length > 0 ? (
                 filteredPrivileges.map((module) => (
                   <div key={module.module_id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                     <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                       <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                         {module.module_name} ({module.privileges.length} privileges)
                       </h4>
                     </div>
                     <div className="p-3 space-y-1">
                       {module.privileges.map((privilege: any) => (
                         <label
                           key={privilege.id}
                           className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                         >
                           <input
                             type="checkbox"
                             checked={selectedPrivileges.includes(privilege.privilege_name)}
                             onChange={() => togglePrivilege(privilege.privilege_name)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                             disabled={isLoading}
                           />
                           <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                               {privilege.privilege_name}
                             </span>
                             <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                               {privilege.privilege_desc}
                             </span>
                           </div>
                         </label>
                       ))}
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                   {modules.length > 0 ? "No privileges available for selected module" : "No privileges loaded"}
                 </div>
               )}
             </div>
           </div>

           {errors.privilege_names && (
             <p className="text-xs text-red-500">{errors.privilege_names.message}</p>
           )}
         </div>

         {/* Form Actions */}
         <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
           {onCancel && (
             <Button
               data-form-action="cancel"
               variant="outline"
               onClick={onCancel}
               disabled={isLoading}
               className="px-6 py-2.5"
             >
               Cancel
             </Button>
           )}
           <Button
             data-form-action="submit"
             onClick={() => handleSubmit(handleFormSubmit)()}
             disabled={isLoading}
             className="min-w-[120px] px-6 py-2.5"
           >
             {isLoading ? (
               <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 {isEditing ? "Updating..." : "Creating..."}
               </div>
             ) : (
               isEditing ? "Update" : "Save"
             )}
           </Button>
         </div>
      </form>
    </div>
  );
}
