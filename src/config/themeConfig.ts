// Comprehensive Theme Configuration
// This file provides a centralized theme configuration for the entire application

export const themeConfig = {
  // Brand Identity
  brand: {
    name: 'Vendor Booking Tool',
    primaryColor: 'purple',
    logo: {
      text: 'VB',
      fullText: 'Vendor Booking Tool',
    },
  },

  // Color System
  colors: {
    primary: {
      25: '#faf5ff',
      50: '#f3e8ff',
      100: '#e9d5ff',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
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
  },

  // Typography
  typography: {
    fontFamily: {
      primary: 'Outfit, sans-serif',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
      '7xl': '72px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '96px',
  },

  // Border Radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    md: '0px 4px 8px -2px rgba(16, 24, 40, 0.1), 0px 2px 4px -2px rgba(16, 24, 40, 0.06)',
    lg: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
    xl: '0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)',
  },

  // Component Themes
  components: {
    button: {
      primary: {
        background: 'bg-theme-purple-600',
        hover: 'hover:bg-theme-purple-700',
        text: 'text-white',
        focus: 'focus:ring-theme-purple-500',
      },
      secondary: {
        background: 'bg-theme-purple-50',
        hover: 'hover:bg-theme-purple-100',
        text: 'text-theme-purple-600',
        focus: 'focus:ring-theme-purple-500',
        dark: 'dark:bg-theme-purple-900/20 dark:hover:bg-theme-purple-900/30 dark:text-theme-purple-400',
      },
      outline: {
        background: 'bg-transparent',
        border: 'border-theme-purple-300',
        text: 'text-theme-purple-600',
        hover: 'hover:bg-theme-purple-50',
        focus: 'focus:ring-theme-purple-500',
        dark: 'dark:border-theme-purple-600 dark:text-theme-purple-400 dark:hover:bg-theme-purple-900/10',
      },
    },
    card: {
      default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-theme-md',
    },
    input: {
      default: 'border-gray-300 dark:border-gray-600 focus:ring-theme-purple-500 focus:border-theme-purple-500',
      error: 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500',
    },
    navigation: {
      active: 'bg-theme-purple-50 text-theme-purple-600 dark:bg-theme-purple-900/20 dark:text-theme-purple-400',
      inactive: 'text-gray-700 hover:bg-theme-purple-50 dark:text-gray-300 dark:hover:bg-theme-purple-900/10',
      icon: {
        active: 'text-theme-purple-600 dark:text-theme-purple-400',
        inactive: 'text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300',
      },
    },
  },

  // Layout
  layout: {
    header: {
      height: '64px',
      background: 'bg-white dark:bg-gray-900',
      border: 'border-gray-200 dark:border-gray-800',
    },
    sidebar: {
      width: {
        collapsed: '80px',
        expanded: '280px',
      },
      background: 'bg-white dark:bg-gray-900',
      border: 'border-gray-200 dark:border-gray-800',
    },
    content: {
      background: 'bg-gray-50 dark:bg-gray-900',
      padding: 'p-6',
    },
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
} as const;

export default themeConfig;
