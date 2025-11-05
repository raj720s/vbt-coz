import { useDispatch, useSelector, useStore } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore = () => useStore<RootState>();


export const useAuth = () => {
  console.warn('⚠️ useAuth from store/hooks.ts is deprecated. Use AuthContext instead.');
  return undefined;
};

export const useUser = () => {
  console.warn('⚠️ useUser from store/hooks.ts is deprecated. Use AuthContext instead.');
  return undefined;
};

export const useIsAuthenticated = () => {
  console.warn('⚠️ useIsAuthenticated from store/hooks.ts is deprecated. Use AuthContext instead.');
  return false;
};

// Note: UI, User, and Role state are now managed by:
// - UI: Context APIs (ThemeContext, SidebarContext)
// - Users: userService
// - Roles: roleService
// - Customers: customerService
// These hooks are deprecated and removed.
