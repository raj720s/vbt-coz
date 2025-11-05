import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import Select from '@/components/form/Select';

// Schema for form validation
const containerPrioritySchema = z.object({
  type: z.number().min(1, 'Type is required'),
  priority: z.number().min(1, 'Priority is required'),
  max_capacity: z.number().min(0, 'Max capacity must be non-negative'),
  max_weight: z.number().min(0, 'Max weight must be non-negative'),
  description: z.string().min(1, 'Description is required'),
});

export type ContainerPriorityFormData = z.infer<typeof containerPrioritySchema>;

interface ContainerPriorityFormProps {
  initialData?: ContainerPriorityFormData;
  onSubmit: (data: ContainerPriorityFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  containerTypes: Array<{ id: number; code: string; name: string; capacity?: string }>;
}

export const ContainerPriorityForm: React.FC<ContainerPriorityFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  containerTypes,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ContainerPriorityFormData>({
    resolver: zodResolver(containerPrioritySchema),
    defaultValues: initialData || {
      type: 0,
      priority: 0,
      max_capacity: 0,
      max_weight: 0,
      description: '',
    },
  });

  const handleFormSubmit = async (data: ContainerPriorityFormData) => {
    try {
      await onSubmit(data);
      if (!initialData) {
        reset();
      }
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleContainerTypeChange = (value: string) => {
    const containerTypeId = parseInt(value) || 0;
    setValue('type', containerTypeId);
    
    // Auto-fill capacity fields based on selected container type
    if (containerTypeId > 0) {
      const selectedContainerType = containerTypes.find(ct => ct.id === containerTypeId);
      if (selectedContainerType?.capacity) {
        try {
          // Parse capacity string (assuming format like "20.5,25.0" for max_capacity,max_weight)
          const capacityParts = selectedContainerType.capacity.split(',');
          if (capacityParts.length >= 1) {
            const maxCapacity = parseFloat(capacityParts[0].trim());
            if (!isNaN(maxCapacity)) {
              setValue('max_capacity', maxCapacity);
            }
          }
          if (capacityParts.length >= 2) {
            const maxWeight = parseFloat(capacityParts[1].trim());
            if (!isNaN(maxWeight)) {
              setValue('max_weight', maxWeight);
            }
          }
        } catch (error) {
          console.warn('Error parsing container capacity:', error);
        }
      }
    }
  };

  const currentType = watch('type');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Container Type
          </label>
          <Select
            options={containerTypes.map(ct => ({ value: ct.id.toString(), label: `${ct.code} - ${ct.name}` }))}
            value={currentType ? currentType.toString() : ""}
            onChange={handleContainerTypeChange}
            placeholder="Select container type"
            error={errors.type?.message}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Selecting a container type will auto-fill capacity and weight fields
          </p>
        </div>
        
        <Input
          label="Priority"
          type="number"
          {...register('priority', { valueAsNumber: true })}
          error={errors.priority?.message}
          placeholder="Enter priority level"
          required
        />
        
        <Input
          label="Max Capacity"
          type="number"
          {...register('max_capacity', { valueAsNumber: true })}
          error={errors.max_capacity?.message}
          placeholder="Enter max capacity (auto-filled from container type)"
          required
        />
        
        <Input
          label="Max Weight"
          type="number"
          {...register('max_weight', { valueAsNumber: true })}
          error={errors.max_weight?.message}
          placeholder="Enter max weight (auto-filled from container type)"
          required
        />
      </div>
      
      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Enter description"
        required
      />
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isLoading || isSubmitting}
        >
          {initialData ? 'Update' : 'Create'} Container Priority
        </Button>
      </div>
    </form>
  );
};
