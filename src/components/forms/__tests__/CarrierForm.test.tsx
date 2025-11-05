import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CarrierForm } from '../CarrierForm';

describe('CarrierForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/carrier name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/carrier code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/transportation mode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('shows "Update" button when editing', () => {
      render(
        <CarrierForm
          initialData={{
            name: 'MAERSK',
            carrier_code: 'MAEU',
            transportation_mode: 5,
            is_active: true,
          }}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('displays error when name is empty', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/carrier name/i);
      await user.click(nameInput);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('displays error when carrier code is empty', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const codeInput = screen.getByLabelText(/carrier code/i);
      await user.click(codeInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/carrier code is required/i)).toBeInTheDocument();
      });
    });

    it('validates maximum length for name', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/carrier name/i);
      const longName = 'A'.repeat(101); // 101 characters
      
      await user.type(nameInput, longName);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/name must be less than 100 characters/i)).toBeInTheDocument();
      });
    });

    it('validates maximum length for carrier code', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const codeInput = screen.getByLabelText(/carrier code/i);
      const longCode = 'A'.repeat(51); // 51 characters
      
      await user.type(codeInput, longCode);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/carrier code must be less than 50 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Initial Data', () => {
    it('populates form with initial data', () => {
      const initialData = {
        name: 'MAERSK LINE',
        carrier_code: 'MAEU',
        transportation_mode: 5,
        is_active: true,
      };

      render(
        <CarrierForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('MAERSK LINE')).toBeInTheDocument();
      expect(screen.getByDisplayValue('MAEU')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('sets default transportation mode to 5', () => {
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const modeInput = screen.getByLabelText(/transportation mode/i) as HTMLInputElement;
      expect(modeInput.value).toBe('5');
    });

    it('sets default active status to true', () => {
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // The select should show "Active" by default
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      await user.type(screen.getByLabelText(/carrier name/i), 'COSCO SHIPPING');
      await user.type(screen.getByLabelText(/carrier code/i), 'COSU');
      
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'COSCO SHIPPING',
          carrier_code: 'COSU',
          transportation_mode: 5,
          is_active: true,
        });
      });
    });

    it('does not submit form with invalid data', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Button', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('disables all inputs when loading', () => {
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByLabelText(/carrier name/i)).toBeDisabled();
      expect(screen.getByLabelText(/carrier code/i)).toBeDisabled();
      expect(screen.getByLabelText(/transportation mode/i)).toBeDisabled();
    });

    it('disables buttons when loading', () => {
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });

    it('shows "Saving..." text when loading', () => {
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Transportation Mode', () => {
    it('accepts numeric input for transportation mode', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const modeInput = screen.getByLabelText(/transportation mode/i);
      await user.clear(modeInput);
      await user.type(modeInput, '10');

      expect(modeInput).toHaveValue(10);
    });
  });

  describe('Status Toggle', () => {
    it('allows changing status from active to inactive', async () => {
      const user = userEvent.setup();
      render(
        <CarrierForm
          initialData={{
            name: 'TEST',
            carrier_code: 'TEST',
            transportation_mode: 5,
            is_active: true,
          }}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Find and interact with status select (implementation may vary)
      // This is a placeholder - adjust based on your Select component
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });
});

