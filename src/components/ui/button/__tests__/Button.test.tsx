import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Styled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('applies primary variant classes', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-brand-500');
    });

    it('applies outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
    });

    it('applies danger variant classes', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('applies success variant classes', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-500');
    });

    it('applies secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-500');
    });
  });

  describe('Sizes', () => {
    it('applies small size classes', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-3', 'text-sm');
    });

    it('applies medium size classes by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-5', 'py-3.5', 'text-sm');
    });
  });

  describe('Icons', () => {
    it('renders with start icon', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      render(
        <Button startIcon={<StartIcon />}>
          With Start Icon
        </Button>
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    });

    it('renders with end icon', () => {
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      render(
        <Button endIcon={<EndIcon />}>
          With End Icon
        </Button>
      );
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });

    it('renders with both start and end icons', () => {
      const StartIcon = () => <span data-testid="start-icon">→</span>;
      const EndIcon = () => <span data-testid="end-icon">←</span>;
      render(
        <Button startIcon={<StartIcon />} endIcon={<EndIcon />}>
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('applies disabled attribute', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled variant classes', () => {
      render(<Button disabled variant="primary">Disabled Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:bg-brand-300');
    });
  });

  describe('Button Types', () => {
    it('renders as submit button', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('renders as reset button', () => {
      render(<Button type="reset">Reset</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });

    it('renders as button by default', () => {
      render(<Button>Default Type</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Accessibility', () => {
    it('is keyboard accessible', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Accessible Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has proper button role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

