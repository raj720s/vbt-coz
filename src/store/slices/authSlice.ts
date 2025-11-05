import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/services/authService';
import { privilegeService } from '@/services/privilegeService';
import { staticModules } from '@/config/staticModules';

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  accessControl?: string[];
  is_superuser: boolean;
  role_id?: number;
  role_name?: string;
  privileges?: string[];
  module_access?: number[];
  accessible_routes?: string[];
  privilege_version?: string;
  rbac_initialized?: boolean;
  rbac_last_updated?: string;
  first_name?: string;
  last_name?: string;
  organisation_name?: string;
  is_active?: boolean;
  status?: boolean;
  created_on?: string;
  updated_on?: string;
  phone_number?: string | null;
  country_code?: string | null;
  country?: string | null;
  timezone?: string | null;
  last_login?: string;
  modified_on?: string | null;
  created_by?: number | null;
  modified_by?: number | null;
  is_deleted?: boolean;
  announcement_read_flag?: number;
  assigned_customers?: number[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  contextAvailable: boolean;
  loading: {
    auth: boolean;
    profile: boolean;
    privileges: boolean;
  };
  errors: {
    auth: string | null;
    profile: string | null;
    privileges: string | null;
  };
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  contextAvailable: false,
  loading: {
    auth: false,
    profile: false,
    privileges: false,
  },
  errors: {
    auth: null,
    profile: null,
    privileges: null,
  },
};

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue, dispatch }) => {
    try {
      // Get tokens
      const tokenResponse = await authService.login({ email, password });

      if (!tokenResponse?.access || !tokenResponse?.refresh) {
        return rejectWithValue("Invalid credentials");
      }

      // Store tokens
      authService.storeTokens(tokenResponse.access, tokenResponse.refresh);

      // Get user profile
      const userProfile = await authService.verifyTokenAndGetProfile();
      
      if (!userProfile) {
        return rejectWithValue("Failed to fetch user profile");
      }

      const authUser: User = {
        id: userProfile.id?.toString() || '0',
        email: userProfile.email,
        name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'API User',
        role: userProfile.is_superuser ? "admin" : "user",
        company: userProfile.organisation_name || "API User",
        is_superuser: userProfile.is_superuser,
        role_id: userProfile.role?.[0]?.id || 0,
        role_name: userProfile.role?.[0]?.role_name || 'API User',
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        organisation_name: userProfile.organisation_name,
        is_active: userProfile.status,
        status: userProfile.status,
        phone_number: userProfile.phone_number,
        country_code: userProfile.country_code,
        country: userProfile.country,
        timezone: userProfile.timezone,
        last_login: userProfile.last_login,
        created_on: userProfile.created_on,
        updated_on: userProfile.updated_on,
        modified_on: userProfile.modified_on,
        created_by: userProfile.created_by,
        modified_by: userProfile.modified_by,
        is_deleted: userProfile.is_deleted,
        announcement_read_flag: userProfile.announcement_read_flag,
        privileges: [],
        module_access: [],
        accessible_routes: [],
        privilege_version: `api_${Date.now()}`,
        rbac_initialized: false,
        rbac_last_updated: new Date().toISOString(),
        assigned_customers: userProfile.assigned_customers || [],
      };

      const storedToken = authService.getStoredAccessToken();

      // Fetch privileges in the background after successful login
      if (authUser.role_id && authUser.role_id > 0) {
        dispatch(fetchUserPrivileges({ roleId: authUser.role_id, user: authUser }));
      }

      return { user: authUser, token: storedToken || '' };
    } catch (error: any) {
      return rejectWithValue(error.message || "Login failed");
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;
      
      if (!state.auth.token) {
        return rejectWithValue("No token available");
      }

      const userProfile = await authService.verifyTokenAndGetProfile();
      
      if (!userProfile || !currentUser) {
        return rejectWithValue("Failed to fetch user profile");
      }

      const updatedUser: User = {
        ...currentUser,
        id: userProfile.id?.toString() || currentUser.id,
        email: userProfile.email,
        name: `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || currentUser.name,
        role: userProfile.is_superuser ? "admin" : "user",
        company: userProfile.organisation_name || currentUser.company,
        is_superuser: userProfile.is_superuser,
        role_id: userProfile.role?.[0]?.id || currentUser.role_id,
        role_name: userProfile.role?.[0]?.role_name || currentUser.role_name,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        organisation_name: userProfile.organisation_name,
        is_active: userProfile.status,
        status: userProfile.status,
        phone_number: userProfile.phone_number,
        country_code: userProfile.country_code,
        country: userProfile.country,
        timezone: userProfile.timezone,
        last_login: userProfile.last_login,
        created_on: userProfile.created_on,
        updated_on: userProfile.updated_on,
        modified_on: userProfile.modified_on,
        created_by: userProfile.created_by,
        modified_by: userProfile.modified_by,
        is_deleted: userProfile.is_deleted,
        announcement_read_flag: userProfile.announcement_read_flag,
      };

      // Fetch privileges if role_id exists
      if (updatedUser.role_id && updatedUser.role_id > 0) {
        dispatch(fetchUserPrivileges({ roleId: updatedUser.role_id, user: updatedUser }));
      }

      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to refresh user profile");
    }
  }
);

export const fetchUserPrivileges = createAsyncThunk(
  'auth/fetchPrivileges',
  async ({ roleId, user }: { roleId: number; user?: User }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const targetUser = user || state.auth.user;

      if (!targetUser) {
        return rejectWithValue("No user available");
      }

      const privilegesResponse = await privilegeService.getPrivileges({ role_id: roleId });
      
      if (!privilegesResponse) {
        return rejectWithValue("Failed to fetch privileges");
      }

      const rolePrivileges: string[] = [];
      const accessibleModules: number[] = [];
      const accessibleRoutes: string[] = [];
      
      if (privilegesResponse.results) {
        privilegesResponse.results.forEach((moduleGroup: any) => {
          const moduleId = parseInt(moduleGroup.module_id);
          accessibleModules.push(moduleId);
          
          if (moduleGroup.privileges) {
            moduleGroup.privileges.forEach((privilege: any) => {
              rolePrivileges.push(privilege.privilege_name);
            });
          }
          
          const staticModule = staticModules[moduleId];
          if (staticModule) {
            accessibleRoutes.push(...staticModule.routes);
          }
        });
      }
      
      return {
        privileges: rolePrivileges,
        module_access: accessibleModules,
        accessible_routes: accessibleRoutes,
        privilege_version: `api_${Date.now()}_${rolePrivileges.length}`,
        rbac_initialized: true,
        rbac_last_updated: new Date().toISOString()
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to refresh user privileges");
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<{ key: keyof AuthState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    setError: (state, action: PayloadAction<{ key: keyof AuthState['errors']; value: string | null }>) => {
      state.errors[action.payload.key] = action.payload.value;
    },
    setAuthSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.contextAvailable = true;
      state.loading = { auth: false, profile: false, privileges: false };
      state.errors = { auth: null, profile: null, privileges: null };
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateUserPartial: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.contextAvailable = true;
      state.loading = { auth: false, profile: false, privileges: false };
      state.errors = { auth: null, profile: null, privileges: null };
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setContextAvailable: (state, action: PayloadAction<boolean>) => {
      state.contextAvailable = action.payload;
    },
    resetForInitialization: (state) => {
      state.loading.auth = true;
      state.errors = { auth: null, profile: null, privileges: null };
    },
    assignCustomersToUser: (state, action: PayloadAction<number[]>) => {
      if (state.user) {
        const currentAssignments = state.user.assigned_customers || [];
        state.user.assigned_customers = [...new Set([...currentAssignments, ...action.payload])];
      }
    },
    removeCustomersFromUser: (state, action: PayloadAction<number[]>) => {
      if (state.user) {
        state.user.assigned_customers = (state.user.assigned_customers || []).filter(
          id => !action.payload.includes(id)
        );
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading.auth = true;
        state.errors.auth = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.contextAvailable = true;
        state.isInitialized = true;
        state.loading.auth = false;
        state.errors.auth = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading.auth = false;
        state.errors.auth = action.payload as string;
      })
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading.profile = true;
        state.errors.profile = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading.profile = false;
        state.errors.profile = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.errors.profile = action.payload as string;
      })
      // Fetch Privileges
      .addCase(fetchUserPrivileges.pending, (state) => {
        state.loading.privileges = true;
        state.errors.privileges = null;
      })
      .addCase(fetchUserPrivileges.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
        state.loading.privileges = false;
        state.errors.privileges = null;
      })
      .addCase(fetchUserPrivileges.rejected, (state, action) => {
        if (state.user) {
          state.user.rbac_initialized = false;
          state.user.rbac_last_updated = new Date().toISOString();
        }
        state.loading.privileges = false;
        state.errors.privileges = action.payload as string;
      });
  },
});

// Export actions
export const {
  setLoading,
  setError,
  setAuthSuccess,
  setUser,
  updateUserPartial,
  logout: logoutAction,
  setInitialized,
  setContextAvailable,
  resetForInitialization,
  assignCustomersToUser,
  removeCustomersFromUser,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;
export const selectContextAvailable = (state: { auth: AuthState }) => state.auth.contextAvailable;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthErrors = (state: { auth: AuthState }) => state.auth.errors;

// RBAC Selectors
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role_id;
export const selectPermissions = (state: { auth: AuthState }) => state.auth.user?.privileges || [];
export const selectRoutes = (state: { auth: AuthState }) => state.auth.user?.accessible_routes || [];
export const selectModules = (state: { auth: AuthState }) => state.auth.user?.module_access || [];
export const selectIsSuperUser = (state: { auth: AuthState }) => state.auth.user?.is_superuser || false;
export const selectAssignedCustomers = (state: { auth: AuthState }) => state.auth.user?.assigned_customers || [];

export default authSlice.reducer;

