# Theme Configuration Guide

This guide explains how to use the consistent purple theme configuration throughout the application.

## Overview

The application uses a comprehensive theme system built around a purple color palette. The theme is defined in `src/config/theme.ts` and provides consistent styling across all components.

## Theme Structure

### Color Palette

The theme includes the following color categories:

- **Primary (Purple)**: Main brand colors used for primary actions and highlights
- **Secondary (Blue)**: Supporting colors for secondary actions
- **Neutral (Gray)**: Base colors for text, backgrounds, and borders
- **Status Colors**: Success, warning, error, and info states
- **Accent**: Special colors like pink for highlights

### Theme Classes

The `themeClasses` object provides pre-configured class combinations for common UI patterns:

```typescript
themeClasses = {
  primary: {
    bg: 'bg-theme-purple-500',
    bgHover: 'hover:bg-theme-purple-600',
    bgLight: 'bg-theme-purple-50',
    bgDark: 'dark:bg-theme-purple-900/20',
    text: 'text-theme-purple-600',
    textDark: 'dark:text-theme-purple-400',
    border: 'border-theme-purple-500',
    ring: 'ring-theme-purple-500',
    focus: 'focus:ring-theme-purple-500 focus:border-theme-purple-500',
  },
  // ... more patterns
}
```

## Usage

### 1. Using Theme Context

```tsx
import { useTheme } from '@/context/ThemeContext';

const MyComponent = () => {
  const { themeClasses, themeConfig, isDark } = useTheme();
  
  return (
    <div className={themeClasses.primary.bg}>
      <button className={themeClasses.button.primary}>
        Primary Button
      </button>
    </div>
  );
};
```

### 2. Using Themed Components

```tsx
import { ThemedButton } from '@/components/ui/button/ThemedButton';
import { ThemedCard } from '@/components/ui/card/ThemedCard';
import { ThemedBadge } from '@/components/ui/badge/ThemedBadge';

const MyComponent = () => {
  return (
    <ThemedCard variant="elevated">
      <ThemedButton variant="primary" size="md">
        Click me
      </ThemedButton>
      <ThemedBadge variant="success">Success</ThemedBadge>
    </ThemedCard>
  );
};
```

### 3. Direct Class Usage

```tsx
// Using theme classes directly
<div className="bg-theme-purple-500 text-white">
  Purple background
</div>

// Using theme utilities
<button className="bg-theme-purple-600 hover:bg-theme-purple-700 text-white px-4 py-2 rounded-lg">
  Themed Button
</button>
```

## Available Components

### ThemedButton
- **Variants**: `primary`, `secondary`, `outline`, `ghost`, `danger`
- **Sizes**: `sm`, `md`, `lg`

### ThemedCard
- **Variants**: `default`, `elevated`, `outlined`

### ThemedInput
- **Features**: Label, error states, helper text, left/right icons
- **Auto-focus styling** with theme colors

### ThemedBadge
- **Variants**: `default`, `primary`, `success`, `warning`, `error`, `info`
- **Sizes**: `sm`, `md`, `lg`

## Navigation Theme Classes

For navigation components, use these predefined classes:

```tsx
// Active navigation item
className={themeClasses.nav.active}

// Inactive navigation item
className={themeClasses.nav.inactive}

// Active navigation icon
className={themeClasses.nav.icon.active}

// Inactive navigation icon
className={themeClasses.nav.icon.inactive}
```

## Status Classes

For status indicators:

```tsx
// Success state
className={themeClasses.status.success}

// Warning state
className={themeClasses.status.warning}

// Error state
className={themeClasses.status.error}

// Info state
className={themeClasses.status.info}
```

## Dark Mode Support

All theme classes include dark mode variants:

```tsx
// Automatically includes dark mode styles
<div className="bg-theme-purple-50 dark:bg-theme-purple-900/20">
  Light purple background, dark purple in dark mode
</div>
```

## Best Practices

1. **Use Theme Classes**: Always use `themeClasses` for consistent styling
2. **Use Themed Components**: Prefer themed components over custom styling
3. **Consistent Colors**: Use the defined color palette instead of arbitrary colors
4. **Dark Mode**: Ensure all components work in both light and dark modes
5. **Accessibility**: Maintain proper contrast ratios for all color combinations

## Customization

To modify the theme:

1. Update color values in `src/config/theme.ts`
2. Add new theme classes to the `themeClasses` object
3. Update component variants as needed
4. Test in both light and dark modes

## Examples

### Header Component
```tsx
<header className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
  <button className="hover:bg-theme-purple-50 dark:hover:bg-theme-purple-900/10">
    Menu
  </button>
</header>
```

### Sidebar Component
```tsx
<aside className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
  <nav>
    <Link className={themeClasses.nav.active}>
      Active Item
    </Link>
    <Link className={themeClasses.nav.inactive}>
      Inactive Item
    </Link>
  </nav>
</aside>
```

### Form Component
```tsx
<form>
  <ThemedInput
    label="Email"
    placeholder="Enter your email"
    error={errors.email?.message}
  />
  <ThemedButton variant="primary" type="submit">
    Submit
  </ThemedButton>
</form>
```

This theme system ensures consistency across the entire application while providing flexibility for customization.
