import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';
import { PlusIcon } from '@/icons';

/**
 * Button component for user interactions
 * 
 * Supports multiple sizes, variants, and icons
 */
const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible button component with multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'The size of the button',
    },
    variant: {
      control: 'select',
      options: ['primary', 'outline', 'danger', 'success', 'secondary'],
      description: 'The visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler function',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Primary button - default style
 */
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

/**
 * Outline button - secondary style
 */
export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

/**
 * Danger button - for destructive actions
 */
export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};

/**
 * Success button - for positive actions
 */
export const Success: Story = {
  args: {
    children: 'Save',
    variant: 'success',
  },
};

/**
 * Small size button
 */
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

/**
 * Button with start icon
 */
export const WithStartIcon: Story = {
  args: {
    children: 'Add Item',
    startIcon: <PlusIcon className="w-4 h-4" />,
  },
};

/**
 * Button with end icon
 */
export const WithEndIcon: Story = {
  args: {
    children: 'Next',
    endIcon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
  },
};

/**
 * Disabled button state
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
      <Button variant="secondary">Secondary</Button>
    </div>
  ),
};

/**
 * All sizes showcase
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
    </div>
  ),
};

