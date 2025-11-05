// Customer Dynamic Fields Utilities
// Manages dynamic fields for customers stored in localStorage

export interface DynamicField {
  id: string;
  label: string;
  value: string;
}

export interface CustomerDynamicFields {
  [customerId: string]: DynamicField[];
}

const CUSTOMER_DYNAMIC_FIELDS_KEY = 'customer_dynamic_fields';

/**
 * Get all customer dynamic fields from localStorage
 */
export const getCustomerDynamicFields = (): CustomerDynamicFields => {
  try {
    const stored = localStorage.getItem(CUSTOMER_DYNAMIC_FIELDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get customer dynamic fields:', error);
    return {};
  }
};

/**
 * Save all customer dynamic fields to localStorage
 */
export const saveCustomerDynamicFields = (fields: CustomerDynamicFields): void => {
  try {
    localStorage.setItem(CUSTOMER_DYNAMIC_FIELDS_KEY, JSON.stringify(fields));
  } catch (error) {
    console.error('Failed to save customer dynamic fields:', error);
  }
};

/**
 * Get dynamic fields for a specific customer
 */
export const getCustomerDynamicFieldsById = (customerId: string): DynamicField[] => {
  const allFields = getCustomerDynamicFields();
  return allFields[customerId] || [];
};

/**
 * Save dynamic fields for a specific customer
 */
export const saveCustomerDynamicFieldsById = (customerId: string, fields: DynamicField[]): void => {
  const allFields = getCustomerDynamicFields();
  allFields[customerId] = fields;
  saveCustomerDynamicFields(allFields);
};

/**
 * Add a new dynamic field to a customer
 */
export const addCustomerDynamicField = (customerId: string, field: DynamicField): void => {
  const existingFields = getCustomerDynamicFieldsById(customerId);
  if (existingFields.length < 5) {
    const updatedFields = [...existingFields, field];
    saveCustomerDynamicFieldsById(customerId, updatedFields);
  }
};

/**
 * Update a dynamic field for a customer
 */
export const updateCustomerDynamicField = (customerId: string, fieldId: string, updates: Partial<DynamicField>): void => {
  const existingFields = getCustomerDynamicFieldsById(customerId);
  const updatedFields = existingFields.map(field => 
    field.id === fieldId ? { ...field, ...updates } : field
  );
  saveCustomerDynamicFieldsById(customerId, updatedFields);
};

/**
 * Remove a dynamic field from a customer
 */
export const removeCustomerDynamicField = (customerId: string, fieldId: string): void => {
  const existingFields = getCustomerDynamicFieldsById(customerId);
  const updatedFields = existingFields.filter(field => field.id !== fieldId);
  saveCustomerDynamicFieldsById(customerId, updatedFields);
};

/**
 * Clear all dynamic fields for a customer
 */
export const clearCustomerDynamicFields = (customerId: string): void => {
  saveCustomerDynamicFieldsById(customerId, []);
};

/**
 * Get dynamic fields count for a customer
 */
export const getCustomerDynamicFieldsCount = (customerId: string): number => {
  return getCustomerDynamicFieldsById(customerId).length;
};

/**
 * Check if customer can add more dynamic fields
 */
export const canAddMoreDynamicFields = (customerId: string): boolean => {
  return getCustomerDynamicFieldsCount(customerId) < 5;
};
