"use client";
import React, { useState } from 'react';
import { ThemedButton } from '@/components/ui/button/ThemedButton';
import { ThemedCard } from '@/components/ui/card/ThemedCard';
import { ThemedInput } from '@/components/ui/input/ThemedInput';
import { ThemedBadge } from '@/components/ui/badge/ThemedBadge';
import { useTheme } from '@/context/ThemeContext';

const ThemedFormExample: React.FC = () => {
  const { themeClasses } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form validation logic here
    console.log('Form submitted:', formData);
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <ThemedCard variant="elevated" className="p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Themed Form Example
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This form demonstrates the consistent purple theme across all components
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ThemedInput
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={errors.name}
            helperText="This will be displayed on your profile"
          />

          <ThemedInput
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={errors.email}
            helperText="We'll never share your email"
          />

          <ThemedInput
            label="Message"
            placeholder="Enter your message"
            value={formData.message}
            onChange={handleInputChange('message')}
            error={errors.message}
            helperText="Tell us what you think"
          />

          <div className="flex flex-wrap gap-2 mb-6">
            <ThemedBadge variant="primary">Primary</ThemedBadge>
            <ThemedBadge variant="success">Success</ThemedBadge>
            <ThemedBadge variant="warning">Warning</ThemedBadge>
            <ThemedBadge variant="error">Error</ThemedBadge>
            <ThemedBadge variant="info">Info</ThemedBadge>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <ThemedButton
              type="submit"
              variant="primary"
              size="lg"
            >
              Submit Form
            </ThemedButton>
            
            <ThemedButton
              type="button"
              variant="secondary"
              size="lg"
            >
              Cancel
            </ThemedButton>
            
            <ThemedButton
              type="button"
              variant="outline"
              size="lg"
            >
              Save Draft
            </ThemedButton>
          </div>
        </form>
      </ThemedCard>

      <ThemedCard variant="default" className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Theme Classes Usage
        </h3>
        <div className="space-y-4">
          <div className={themeClasses.primary.bg + ' p-4 rounded-lg'}>
            <p className="text-white">Primary background with theme classes</p>
          </div>
          
          <div className={themeClasses.card.elevated + ' p-4'}>
            <p className="text-gray-900 dark:text-white">Elevated card with theme classes</p>
          </div>
          
          <div className="flex gap-2">
            <span className={themeClasses.status.success + ' px-3 py-1 rounded-full text-sm'}>
              Success Status
            </span>
            <span className={themeClasses.status.warning + ' px-3 py-1 rounded-full text-sm'}>
              Warning Status
            </span>
          </div>
        </div>
      </ThemedCard>
    </div>
  );
};

export default ThemedFormExample;
