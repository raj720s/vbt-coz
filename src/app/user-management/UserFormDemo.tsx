"use client";

import React, { useState } from 'react';
import { withSimplifiedRBAC, SimplifiedRBACContext } from "@/components/auth/withSimplifiedRBAC";
import { UserForm } from "@/components/forms/UserForm";
import { FormModal } from "@/components/ui/modal/FormModal";
import Button from "@/components/ui/button/Button";
import { PlusIcon, PencilIcon } from "@/icons";
import { ConditionalRender } from "@/components/rbac/SimplifiedRBACComponents";
import toast from "react-hot-toast";

interface UserFormDemoProps {
  rbacContext?: SimplifiedRBACContext;
}

function UserFormDemo({ rbacContext }: UserFormDemoProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Sample user data for editing demo
  const sampleUser = {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    role: 1,
    status: "active",
    organisation_name: "Acme Corporation"
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    toast.success("User created successfully!");
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    toast.success("User updated successfully!");
  };

  const handleEditUser = () => {
    setEditingUser(sampleUser);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Form with Customer Assignment Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This demo shows the integrated UserForm with customer assignment functionality using local storage.
        </p>
      </div>

      {/* Demo Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
          Demo Features
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Create new users with customer assignments</li>
          <li>• Edit existing users and update customer assignments</li>
          <li>• All data stored in browser localStorage (no API calls)</li>
          <li>• RBAC-protected customer assignment section</li>
          <li>• Sample customers pre-loaded for testing</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <ConditionalRender privilege="CREATE_USER">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create New User
          </Button>
        </ConditionalRender>

        <ConditionalRender privilege="UPDATE_USER">
          <Button 
            onClick={handleEditUser}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit Sample User
          </Button>
        </ConditionalRender>
      </div>

      {/* Sample Data Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sample Data Available
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Sample Customers:</strong> Acme Corporation, Global Logistics Ltd, Tech Solutions Inc</p>
          <p><strong>Sample User for Editing:</strong> John Doe (john.doe@example.com)</p>
          <p><strong>Storage:</strong> All data is stored in browser localStorage under keys like 'customers_data' and 'user_customer_assignments'</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-2">
          How to Test
        </h3>
        <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
          <li>Click "Create New User" to see the form with customer assignment section</li>
          <li>Fill in user details and select customers from the dropdown</li>
          <li>Submit the form to create a user with customer assignments</li>
          <li>Click "Edit Sample User" to see how editing works with existing assignments</li>
          <li>Check browser localStorage to see the stored data</li>
        </ol>
      </div>

      {/* Create User Modal */}
      <FormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User with Customer Assignment"
        size="lg"
      >
        <UserForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
          isEditing={false}
        />
      </FormModal>

      {/* Edit User Modal */}
      <FormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User with Customer Assignment"
        size="lg"
      >
        <UserForm
          initialData={editingUser}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          isEditing={true}
        />
      </FormModal>
    </div>
  );
}

export default withSimplifiedRBAC(UserFormDemo, {
  privilege: "VIEW_USER_MANAGEMENT",
  role: ["1", "2"], // Admin and Manager roles
  allowSuperUserBypass: true,
  redirectTo: "/user/dashboard"
});

