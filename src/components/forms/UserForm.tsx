"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import SearchableSelect from "@/components/form/input/SearchableSelect";
import { companyService } from "@/services/companyService";
import Button from "@/components/ui/button/Button";
import { CreateUserRequest } from "@/types/api";
// Removed useRoles - using roleService directly
import { userService } from "@/services/userService";
import { roleService, RoleResponse } from "@/services/roleService";
// import { userCustomerMappingService } from "@/services/userCustomerMappingService";
import { useAuth } from "@/context/AuthContext";
// import CustomerSelector from "@/components/forms/CustomerSelector";
// import ConditionalRender from "@/components/shared/ConditionalRender";

import toast from "react-hot-toast";

const createUserSchema = (isEditing: boolean) => z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
  // organisation_name: z.string().min(1, "Organisation name is required"),
  company: z.number().optional(),
  password: isEditing ? z.string().optional() : z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: isEditing ? z.string().optional() : z.string().min(6, "Confirm password must be at least 6 characters"),
}).superRefine((data, ctx) => {
  // Password validation for new users only
  if (!isEditing) {
    if (data.password && data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 6 characters",
        path: ["password"],
      });
    }
    
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  }
});

type UserFormData = z.infer<ReturnType<typeof createUserSchema>>;

interface UserFormProps {
  initialData?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: number | null; // Changed from role_id to role to match form usage
    status?: string; // Optional - no longer used in form, status managed via restore in user management
    // organisation_name?: string;
    company?: number;
    company_data?: any;
  };
  onSuccess?: () => void; // Called when operation succeeds
  onCancel?: () => void;
  isEditing?: boolean; // Whether this is editing an existing user
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isEditing = false,
}) => {
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  // Use the roles hook to get roles from Redux state
  // State for roles
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  
  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setRolesLoading(true);
        const response = await roleService.getRoles();
        setRoles(response);
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setRolesLoading(false);
    }
    };
    fetchRoles();
  }, []);
  
  // Role options for dropdown
  const roleOptions = useMemo(() => {
    return roles.map(role => ({
      value: role.id,
      label: role.role_name,
      description: role.role_description
    }));
  }, [roles]);
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Customer assignment state - commented out for next version
  // const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  console.log("🔄 UserForm rendered with:", {
    initialData,
    isEditing,
    roles,
    rolesLoading,
    roleOptions,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(createUserSchema(isEditing)),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "",
      // organisation_name: "",
      company: undefined,
      password: "",
      confirmPassword: "",
    },
  });

  const role = watch("role");

  // Load existing customer assignments when editing - commented out for next version
  // useEffect(() => {
  //   if (isEditing && initialData?.id) {
  //     loadExistingCustomerAssignments(parseInt(initialData.id));
  //   }
  // }, [isEditing, initialData?.id]);

  // Set initial values when editing
  useEffect(() => {
    if (initialData) {
      // If company_data is provided, set it for SearchableSelect
      if (initialData.company_data) {
        setSelectedCompany(initialData.company_data);
      } else if (initialData.company) {
        // Fetch company if only ID is provided
        companyService.getCompany(initialData.company).then((company) => {
          setSelectedCompany(company);
        }).catch((err) => {
          console.warn("Failed to fetch company:", err);
        });
      }
      
      reset({
        first_name: initialData.firstName,
        last_name: initialData.lastName,
        email: initialData.email,
        role: initialData.role != null ? initialData.role.toString() : "", // Handle null/undefined role
        // organisation_name: initialData.organisation_name || "",
        company: initialData.company || undefined,
        password: "",
        confirmPassword: "",
      });
    } else {
      setSelectedCompany(null);
    }
  }, [initialData, reset, isEditing]);

  // Load existing customer assignments for editing - commented out for next version
  // const loadExistingCustomerAssignments = async (userId: number) => {
  //   try {
  //     const assignedCustomers = await userCustomerMappingService.getAssignedCustomers(userId);
  //     setSelectedCustomers(assignedCustomers);
  //   } catch (error) {
  //     console.error('Error loading customer assignments:', error);
  //   }
  // };

  const searchCompanies = async (query: string) => {
    try {
      const response = await companyService.getCompanies({ page: 1, page_size: 10, search: query });
      return response.results || [];
    } catch (e) {
      return [];
    }
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    console.log("🎯 Form submitted with data:", formData);
    
    // if (isSubmitting) {
    //   console.log("🚫 Form submission already in progress");
    //   return; // Prevent double submission
    // }
    
    // Find the selected role to get the role ID
    const selectedRole = roles.find(r => r.id.toString() === formData.role);
    if (!selectedRole) {
      console.log("🚫 No role selected or role not found");
      toast.error("Please select a valid role");
      return;
    }

    // Transform form data to match API requirements
    const apiData: CreateUserRequest = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      role: selectedRole.id, // Use the role ID directly
      status: true, // Always set to true, status is managed via restore in user management
      // organisation_name: formData.organisation_name,
      // Add password for new users
      ...(formData.password && { password: formData.password }),
      ...(formData.company ? { company: formData.company } : {}),
    };
    
    console.log("📦 Transformed API data:", apiData);
    
    try {
      setIsSubmitting(true);
      
      if (isEditing) {
        // Handle user update
        console.log("🔄 Updating existing user...");
        
        if (!initialData) {
          throw new Error("Initial data required for editing");
        }
        
        const userId = parseInt(initialData.id as any);
        
        // Update the user (company is included in the payload)
        const response = await userService.updateUser(userId, apiData);
        console.log("✅ User updated successfully:", response);
        toast.success("User updated successfully");
        
      } else {
        // Handle user creation
        console.log("🆕 Creating new user...");
        
        // Create the user (company is included in the payload)
        const response = await userService.createUser(apiData);
        console.log("✅ User created successfully:", response);
        toast.success("User created successfully");
      }
      
      // Call success callback to close modal and refresh data
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("❌ Form submission error:", error);
      toast.error(isEditing ? "Failed to update user" : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Access control removed - will be managed separately in Role Management

  return (
    <div className="space-y-6">
      {/* Form Content */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(handleFormSubmit)(e);
        }}
        className="p-6 space-y-8"
      >
        {/* Basic Details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              {...register("first_name")}
              placeholder="Enter first name"
              className="w-full"
            />
            {errors.first_name && (
              <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              {...register("last_name")}
              placeholder="Enter last name"
              className="w-full"
            />
            {errors.last_name && (
              <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
          </div>
        </section>

        {/* Role & Status */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Role & Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="Enter email address"
              className="w-full"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              options={[
                { value: "", label: "Select a role" },
                ...roleOptions.map((roleOption) => ({
                  value: roleOption.value.toString(),
                  label: roleOption.label
                }))
              ]}
              value={watch("role")}
              onChange={(value) => setValue("role", value)}
              placeholder="Select a role"
              className="w-full"
              disabled={rolesLoading}
            />
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
            {rolesLoading && (
              <p className="mt-1 text-sm text-gray-500">Loading roles...</p>
            )}
          </div>
          </div>
        </section>

        {/* Organization */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Organization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* <div>
            <Label htmlFor="organisation_name">Organisation Name</Label>
            <Input
              id="organisation_name"
              {...register("organisation_name")}
              placeholder="Enter organisation name"
              className="w-full"
              
            />
            {errors.organisation_name && (
              <p className="mt-1 text-sm text-red-600">{errors.organisation_name.message}</p>
            )}
          </div> */}

          {/* Company (Searchable) */}
          <div className="md:col-span-2">
            <SearchableSelect
              id="company"
              label="Company (optional)"
              placeholder="Search and select company"
              value={selectedCompany?.id || watch("company") || null}
              onChange={async (value) => {
                // value is the company ID from valueExtractor
                const companyId = value as number;
                if (!companyId) {
                  setValue("company", undefined, { shouldValidate: true, shouldDirty: true });
                  setSelectedCompany(null);
                  return;
                }
                
                // Fetch the full company object to update selectedCompany state
                try {
                  const companyObj = await companyService.getCompany(companyId);
                  setValue("company", companyId, { shouldValidate: true, shouldDirty: true });
                  setSelectedCompany(companyObj);
                } catch (err) {
                  console.error("Failed to fetch company:", err);
                  // Still update the form value even if fetch fails
                  setValue("company", companyId, { shouldValidate: true, shouldDirty: true });
                  // Try to find in recent search results
                  const results = await searchCompanies("");
                  const foundCompany = results.find((r: any) => r.id === companyId);
                  if (foundCompany) {
                    setSelectedCompany(foundCompany);
                  }
                }
              }}
              onSearch={async (query: string) => {
                const results = await searchCompanies(query);
                // If we have a selected company and it's not in results, add it
                if (selectedCompany && !query && !results.find((r: any) => r.id === selectedCompany.id)) {
                  return [selectedCompany, ...results];
                }
                return results;
              }}
              displayFormat={(option: any) => option.name}
              searchPlaceholder="Search companies..."
            />
          </div>
          </div>
        </section>

        {/* Customer Assignment Section - commented out for next version */}
        {/* <ConditionalRender privilege="ASSIGN_CUSTOMERS_TO_USER">
          <div className="space-y-4">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Customer Assignments
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select customers to assign to this user. Users can only see data for their assigned customers.
              </p>
              
              <CustomerSelector
                selectedCustomers={selectedCustomers}
                onSelectionChange={setSelectedCustomers}
              />
              
              {selectedCustomers.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>{selectedCustomers.length}</strong> customer{selectedCustomers.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          </div>
        </ConditionalRender> */}

        {!isEditing && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                {...register("password")}
                type="password"
                placeholder="Enter password"
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">Password is required for new users</p>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                placeholder="Confirm password"
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">Confirm your password</p>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
            </div>
          </section>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          {onCancel && (
            <Button
              data-form-action="cancel"
              onClick={onCancel}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            data-form-action="submit"
            onClick={() => handleSubmit(handleFormSubmit)()}
            disabled={isSubmitting || rolesLoading}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export type { UserFormData }; 