import type { Meta, StoryObj } from '@storybook/react';
import { CarrierForm } from './CarrierForm';

/**
 * Carrier Form Component
 * 
 * Form for creating and editing carrier information including name, code,
 * transportation mode, and active status.
 */
const meta = {
  title: 'Forms/CarrierForm',
  component: CarrierForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A form component for managing carrier data with validation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSubmit: {
      action: 'submitted',
      description: 'Form submission handler',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Form cancellation handler',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state of the form',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] p-6 bg-white dark:bg-gray-800 rounded-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CarrierForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty form for creating a new carrier
 */
export const CreateNew: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log('Form cancelled'),
    isLoading: false,
  },
};

/**
 * Form with initial data for editing
 */
export const EditExisting: Story = {
  args: {
    initialData: {
      name: 'MAERSK LINE',
      carrier_code: 'MAEU',
      transportation_mode: 5,
      is_active: true,
    },
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log('Form cancelled'),
    isLoading: false,
  },
};

/**
 * Form in loading state
 */
export const Loading: Story = {
  args: {
    initialData: {
      name: 'COSCO SHIPPING',
      carrier_code: 'COSU',
      transportation_mode: 5,
      is_active: true,
    },
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
    },
    onCancel: () => console.log('Form cancelled'),
    isLoading: true,
  },
};

/**
 * Form with inactive carrier
 */
export const InactiveCarrier: Story = {
  args: {
    initialData: {
      name: 'OLD CARRIER',
      carrier_code: 'OLD',
      transportation_mode: 3,
      is_active: false,
    },
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log('Form cancelled'),
    isLoading: false,
  },
};

/**
 * Interactive form demo
 */
export const Interactive: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Submitting carrier data:', data);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Carrier "${data.name}" saved successfully!`);
    },
    onCancel: () => {
      console.log('Form cancelled');
      alert('Form cancelled');
    },
  },
};

