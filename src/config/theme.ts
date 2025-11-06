// Theme Configuration
// This file defines the consistent color theme used throughout the application

export const theme = {
  // Primary Brand Colors (Purple Theme)
  primary: {
    25: '#faf5ff',
    50: '#f3e8ff',
    100: '#e9d5ff',
    200: '#ddd6fe',
    300: '#CAB8CD', // Selected Main Menu Color
    400: '#a78bfa',
    500: '#501358', // Main Theme Color - Headers, Buttons
    600: '#501358', // Main Theme Color - Headers, Buttons
    700: '#3d0f42', // Darker shade for hover
    800: '#2B0231', // Selected Menu Item Color
    900: '#1a011d',
    950: '#0f000f',
  },

  // Secondary Colors
  secondary: {
    25: '#f5fbff',
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#b9e6fe',
    300: '#7cd4fd',
    400: '#36bffa',
    500: '#0ba5ec',
    600: '#0086c9',
    700: '#026aa2',
    800: '#065986',
    900: '#0b4a6f',
    950: '#062c41',
  },

  // Neutral Colors
  neutral: {
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#e4e7ec',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1d2939',
    900: '#101828',
    950: '#0c111d',
  },

  // Status Colors
  success: {
    25: '#f6fef9',
    50: '#ecfdf3',
    100: '#d1fadf',
    200: '#a6f4c5',
    300: '#6ce9a6',
    400: '#32d583',
    500: '#12b76a',
    600: '#039855',
    700: '#027a48',
    800: '#05603a',
    900: '#054f31',
    950: '#053321',
  },

  warning: {
    25: '#fffcf5',
    50: '#fffaeb',
    100: '#fef0c7',
    200: '#fedf89',
    300: '#fec84b',
    400: '#fdb022',
    500: '#f79009',
    600: '#dc6803',
    700: '#b54708',
    800: '#93370d',
    900: '#7a2e0e',
    950: '#4e1d09',
  },

  error: {
    25: '#fffbfa',
    50: '#fef3f2',
    100: '#fee4e2',
    200: '#fecdca',
    300: '#fda29b',
    400: '#f97066',
    500: '#f04438',
    600: '#d92d20',
    700: '#b42318',
    800: '#912018',
    900: '#7a271a',
    950: '#55160c',
  },

  // Special Colors
  accent: {
    pink: '#ee46bc',
  },
} as const;

// Theme utility functions
export const getThemeColor = (color: keyof typeof theme, shade: number) => {
  return theme[color][shade as keyof typeof theme[typeof color]];
};

// Common theme classes for consistent usage
export const themeClasses = {
  // Primary theme classes
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

  // Button variants
  button: {
    primary: 'bg-brand-500 hover:bg-brand-700 text-white',
    secondary: 'bg-theme-purple-50 hover:bg-theme-purple-100 text-brand-500 dark:bg-theme-purple-900/20 dark:hover:bg-theme-purple-900/30 dark:text-theme-purple-400',
    outline: 'border-theme-purple-300 text-brand-500 hover:bg-theme-purple-50 dark:border-brand-500 dark:text-brand-500 dark:hover:bg-theme-purple-900/10',
  },

  // Input variants
  input: {
    focus: 'focus:ring-theme-purple-500 focus:border-theme-purple-500',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600',
  },

  // Card variants
  card: {
    default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-theme-md',
  },

  // Navigation variants
  nav: {
    active: 'bg-theme-purple-300 text-brand-800 dark:bg-brand-800 dark:text-white', // Selected Main Menu
    inactive: 'text-gray-700 hover:bg-theme-purple-300 dark:text-gray-300 dark:hover:bg-brand-800',
    icon: {
      active: 'text-brand-800 dark:text-white',
      inactive: 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300',
    },
  },

  // Status variants
  status: {
    success: 'bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-400',
    error: 'bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
} as const;

// Export theme configuration for use in components
export default theme;
