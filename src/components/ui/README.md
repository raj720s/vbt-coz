# Message System

This component provides a persistent message box system that replaces toast notifications throughout the application.

## Features

- **Persistent Messages**: Messages stay visible until manually dismissed or auto-dismissed
- **Multiple Types**: Success, Error, Warning, and Info message types
- **Custom Actions**: Add custom action buttons to messages
- **Auto-dismiss**: Configurable auto-dismiss with smooth animations
- **Global Context**: Available throughout the app via React Context

## Usage

### Basic Usage

```tsx
import { useMessage } from '@/components/ui/MessageBox';

function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useMessage();

  const handleSuccess = () => {
    showSuccess('Success Title', 'Operation completed successfully!');
  };

  const handleError = () => {
    showError('Error Title', 'Something went wrong. Please try again.');
  };

  const handleWarning = () => {
    showWarning('Warning Title', 'Please review your input before proceeding.');
  };

  const handleInfo = () => {
    showInfo('Info Title', 'Here is some helpful information.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
}
```

### Advanced Usage with Actions

```tsx
const handleComplexMessage = () => {
  showError(
    'Validation Failed',
    'Please fix the following errors before proceeding.',
    {
      persistent: true, // Message won't auto-dismiss
      actions: [
        {
          label: 'View Details',
          onClick: () => console.log('View details clicked'),
          variant: 'primary'
        },
        {
          label: 'Dismiss',
          onClick: () => console.log('Dismiss clicked'),
          variant: 'secondary'
        }
      ]
    }
  );
};
```

### Message Options

```tsx
interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  content: string;
  persistent?: boolean; // If true, message won't auto-dismiss
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
}
```

## Migration from Toast

Replace toast calls with the new message system:

```tsx
// Old (toast)
import toast from 'react-hot-toast';
toast.success('Operation successful');
toast.error('Operation failed');

// New (message system)
import { useMessage } from '@/components/ui/MessageBox';
const { showSuccess, showError } = useMessage();
showSuccess('Success', 'Operation successful');
showError('Error', 'Operation failed');
```

## Styling

The message box automatically adapts to light/dark themes and includes:
- Color-coded backgrounds and borders for each message type
- Smooth slide-in/out animations
- Responsive design for mobile devices
- Proper z-index layering

## Auto-dismiss Behavior

- **Default**: Messages auto-dismiss after 5 seconds
- **Persistent**: Set `persistent: true` to prevent auto-dismiss
- **Custom Delay**: Configure `dismissDelay` in milliseconds
- **Manual Dismiss**: Users can click the X button to close messages
