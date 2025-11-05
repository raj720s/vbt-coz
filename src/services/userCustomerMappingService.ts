"use client";

// Local storage keys
const STORAGE_KEYS = {
  USER_CUSTOMER_MAPPINGS: 'user_customer_mappings'
};

// Types for user-customer mappings
export interface UserCustomerMapping {
  user_id: number;
  customer_ids: number[];
  assigned_by: number;
  assigned_on: string;
  updated_on?: string;
}

export interface UserCustomerMappingsData {
  [userId: string]: UserCustomerMapping;
}

class UserCustomerMappingService {
  // Get all user-customer mappings
  async getUserCustomerMappings(): Promise<UserCustomerMappingsData> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_CUSTOMER_MAPPINGS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting user customer mappings from storage:', error);
      return {};
    }
  }

  // Save user-customer mappings
  async saveUserCustomerMappings(mappings: UserCustomerMappingsData): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_CUSTOMER_MAPPINGS, JSON.stringify(mappings));
    } catch (error) {
      console.error('Error saving user customer mappings to storage:', error);
      throw error;
    }
  }

  // Get customer assignments for a specific user
  async getAssignedCustomers(userId: number): Promise<number[]> {
    const mappings = await this.getUserCustomerMappings();
    const userMapping = mappings[userId.toString()];
    return userMapping ? userMapping.customer_ids : [];
  }

  // Assign customers to a user
  async assignCustomersToUser(userId: number, customerIds: number[], assignedBy: number): Promise<void> {
    const mappings = await this.getUserCustomerMappings();
    const userKey = userId.toString();
    
    const existingMapping = mappings[userKey];
    const currentCustomerIds = existingMapping ? existingMapping.customer_ids : [];
    
    // Add new assignments (avoid duplicates)
    const newCustomerIds = [...new Set([...currentCustomerIds, ...customerIds])];
    
    const userMapping: UserCustomerMapping = {
      user_id: userId,
      customer_ids: newCustomerIds,
      assigned_by: assignedBy,
      assigned_on: existingMapping ? existingMapping.assigned_on : new Date().toISOString(),
      updated_on: new Date().toISOString()
    };
    
    mappings[userKey] = userMapping;
    await this.saveUserCustomerMappings(mappings);
    
    console.log(`✅ Assigned customers ${customerIds.join(', ')} to user ${userId}`);
  }

  // Remove customers from a user
  async removeCustomersFromUser(userId: number, customerIds: number[], removedBy: number): Promise<void> {
    const mappings = await this.getUserCustomerMappings();
    const userKey = userId.toString();
    
    const existingMapping = mappings[userKey];
    if (!existingMapping) return;
    
    // Remove specified customers
    const newCustomerIds = existingMapping.customer_ids.filter(id => !customerIds.includes(id));
    
    if (newCustomerIds.length === 0) {
      // Remove the entire mapping if no customers left
      delete mappings[userKey];
    } else {
      // Update the mapping
      mappings[userKey] = {
        ...existingMapping,
        customer_ids: newCustomerIds,
        updated_on: new Date().toISOString()
      };
    }
    
    await this.saveUserCustomerMappings(mappings);
    
    console.log(`✅ Removed customers ${customerIds.join(', ')} from user ${userId}`);
  }

  // Replace all customer assignments for a user
  async replaceCustomerAssignments(userId: number, customerIds: number[], assignedBy: number): Promise<void> {
    const mappings = await this.getUserCustomerMappings();
    const userKey = userId.toString();
    
    const userMapping: UserCustomerMapping = {
      user_id: userId,
      customer_ids: customerIds,
      assigned_by: assignedBy,
      assigned_on: new Date().toISOString(),
      updated_on: new Date().toISOString()
    };
    
    mappings[userKey] = userMapping;
    await this.saveUserCustomerMappings(mappings);
    
    console.log(`✅ Replaced customer assignments for user ${userId} with customers: ${customerIds.join(', ')}`);
  }

  // Get users assigned to a specific customer
  async getAssignedUsers(customerId: number): Promise<number[]> {
    const mappings = await this.getUserCustomerMappings();
    const assignedUsers: number[] = [];
    
    Object.values(mappings).forEach(mapping => {
      if (mapping.customer_ids.includes(customerId)) {
        assignedUsers.push(mapping.user_id);
      }
    });
    
    return assignedUsers;
  }

  // Get mapping details for a user
  async getUserMapping(userId: number): Promise<UserCustomerMapping | null> {
    const mappings = await this.getUserCustomerMappings();
    return mappings[userId.toString()] || null;
  }

  // Get all mappings
  async getAllMappings(): Promise<UserCustomerMapping[]> {
    const mappings = await this.getUserCustomerMappings();
    return Object.values(mappings);
  }

  // Clear all mappings (for testing/reset purposes)
  async clearAllMappings(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_CUSTOMER_MAPPINGS);
      console.log('✅ Cleared all user-customer mappings');
    } catch (error) {
      console.error('Error clearing user customer mappings:', error);
      throw error;
    }
  }

  // Export mappings data
  async exportMappings(): Promise<UserCustomerMappingsData> {
    return await this.getUserCustomerMappings();
  }

  // Import mappings data
  async importMappings(mappings: UserCustomerMappingsData): Promise<void> {
    await this.saveUserCustomerMappings(mappings);
    console.log('✅ Imported user-customer mappings');
  }

  // Get statistics
  async getStatistics(): Promise<{
    total_mappings: number;
    users_with_assignments: number;
    customers_with_assignments: number;
    total_assignments: number;
  }> {
    const mappings = await this.getUserCustomerMappings();
    const mappingValues = Object.values(mappings);
    
    const usersWithAssignments = mappingValues.length;
    const totalAssignments = mappingValues.reduce((sum, mapping) => sum + mapping.customer_ids.length, 0);
    
    // Get unique customers
    const uniqueCustomers = new Set<number>();
    mappingValues.forEach(mapping => {
      mapping.customer_ids.forEach(customerId => uniqueCustomers.add(customerId));
    });
    
    return {
      total_mappings: mappingValues.length,
      users_with_assignments: usersWithAssignments,
      customers_with_assignments: uniqueCustomers.size,
      total_assignments: totalAssignments
    };
  }
}

// Export singleton instance
export const userCustomerMappingService = new UserCustomerMappingService();

// Export types
// export type { UserCustomerMapping, UserCustomerMappingsData };
