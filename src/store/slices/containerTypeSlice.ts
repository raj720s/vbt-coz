import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { containerTypeService } from '@/services/containerTypeService';
import { ContainerTypeResponse, ContainerTypeListResponse, ContainerTypeListRequest, CreateContainerTypeRequest, UpdateContainerTypeRequest } from '@/types/api';

interface ContainerTypeState {
  containerTypes: ContainerTypeResponse[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  selectedContainerType: ContainerTypeResponse | null;
  total: number;
  currentPage: number;
  pageSize: number;
}

const initialState: ContainerTypeState = {
  containerTypes: [],
  loading: false,
  error: null,
  lastFetched: null,
  selectedContainerType: null,
  total: 0,
  currentPage: 1,
  pageSize: 10,
};

// Async thunks
export const fetchContainerTypes = createAsyncThunk(
  'containerTypes/fetchContainerTypes',
  async (params: ContainerTypeListRequest = {}, { rejectWithValue }) => {
    try {
      console.log('🚀 Fetching container types with params:', params);
      const response = await containerTypeService.getContainerTypes(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch container types');
    }
  }
);

export const createContainerType = createAsyncThunk(
  'containerTypes/createContainerType',
  async (containerTypeData: CreateContainerTypeRequest, { rejectWithValue }) => {
    try {
      const response = await containerTypeService.createContainerType(containerTypeData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create container type');
    }
  }
);

export const updateContainerType = createAsyncThunk(
  'containerTypes/updateContainerType',
  async ({ id, containerTypeData }: { id: number; containerTypeData: UpdateContainerTypeRequest }, { rejectWithValue }) => {
    try {
      const response = await containerTypeService.updateContainerType(id, containerTypeData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update container type');
    }
  }
);

export const patchContainerType = createAsyncThunk(
  'containerTypes/patchContainerType',
  async ({ id, containerTypeData }: { id: number; containerTypeData: UpdateContainerTypeRequest }, { rejectWithValue }) => {
    try {
      const response = await containerTypeService.patchContainerType(id, containerTypeData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to patch container type');
    }
  }
);

export const deleteContainerType = createAsyncThunk(
  'containerTypes/deleteContainerType',
  async (id: number, { rejectWithValue }) => {
    try {
      await containerTypeService.deleteContainerType(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete container type');
    }
  }
);

export const fetchContainerTypeById = createAsyncThunk(
  'containerTypes/fetchContainerTypeById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await containerTypeService.getContainerType(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch container type');
    }
  }
);

export const searchContainerTypes = createAsyncThunk(
  'containerTypes/searchContainerTypes',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await containerTypeService.searchContainerTypes(query);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search container types');
    }
  }
);

export const fetchContainerTypesByStatus = createAsyncThunk(
  'containerTypes/fetchContainerTypesByStatus',
  async ({ status, params = {} }: { status: boolean; params?: Omit<ContainerTypeListRequest, 'status'> }, { rejectWithValue }) => {
    try {
      const response = await containerTypeService.getContainerTypesByStatus(status, params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch container types by status');
    }
  }
);

export const exportContainerTypes = createAsyncThunk(
  'containerTypes/exportContainerTypes',
  async (params: ContainerTypeListRequest = {}, { rejectWithValue }) => {
    try {
      const response = await containerTypeService.exportContainerTypes(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to export container types');
    }
  }
);

const containerTypeSlice = createSlice({
  name: 'containerTypes',
  initialState,
  reducers: {
    clearContainerTypes: (state) => {
      state.containerTypes = [];
      state.total = 0;
      state.currentPage = 1;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedContainerType: (state, action: PayloadAction<ContainerTypeResponse | null>) => {
      state.selectedContainerType = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    clearSelectedContainerType: (state) => {
      state.selectedContainerType = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch container types
      .addCase(fetchContainerTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainerTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.containerTypes = action.payload.results;
        state.total = action.payload.count;
        state.lastFetched = Date.now();
      })
      .addCase(fetchContainerTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create container type
      .addCase(createContainerType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createContainerType.fulfilled, (state, action) => {
        state.loading = false;
        state.containerTypes.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createContainerType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update container type
      .addCase(updateContainerType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateContainerType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.containerTypes.findIndex(ct => ct.id === action.payload.id);
        if (index !== -1) {
          state.containerTypes[index] = action.payload;
        }
      })
      .addCase(updateContainerType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Patch container type
      .addCase(patchContainerType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(patchContainerType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.containerTypes.findIndex(ct => ct.id === action.payload.id);
        if (index !== -1) {
          state.containerTypes[index] = action.payload;
        }
      })
      .addCase(patchContainerType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete container type
      .addCase(deleteContainerType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteContainerType.fulfilled, (state, action) => {
        state.loading = false;
        state.containerTypes = state.containerTypes.filter(ct => ct.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteContainerType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch container type by ID
      .addCase(fetchContainerTypeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainerTypeById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedContainerType = action.payload;
      })
      .addCase(fetchContainerTypeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Search container types
      .addCase(searchContainerTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchContainerTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.containerTypes = action.payload;
        state.total = action.payload.length;
      })
      .addCase(searchContainerTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch container types by status
      .addCase(fetchContainerTypesByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainerTypesByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.containerTypes = action.payload.results;
        state.total = action.payload.count;
      })
      .addCase(fetchContainerTypesByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Export container types
      .addCase(exportContainerTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportContainerTypes.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportContainerTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearContainerTypes,
  clearError,
  setSelectedContainerType,
  setCurrentPage,
  setPageSize,
  clearSelectedContainerType,
} = containerTypeSlice.actions;

// Selectors
export const selectContainerTypes = (state: { containerTypes: ContainerTypeState }) => state.containerTypes.containerTypes;
export const selectContainerTypesLoading = (state: { containerTypes: ContainerTypeState }) => state.containerTypes.loading;
export const selectContainerTypesError = (state: { containerTypes: ContainerTypeState }) => state.containerTypes.error;
export const selectContainerTypesTotal = (state: { containerTypes: ContainerTypeState }) => state.containerTypes.total;
export const selectSelectedContainerType = (state: { containerTypes: ContainerTypeState }) => state.containerTypes.selectedContainerType;
export const selectContainerTypesCurrentPage = (state: { containerTypes: ContainerTypeState }) => state.containerTypes.currentPage;
export const selectContainerTypesPageSize = (state: { containerTypes: ContainerTypeState }) => state.containerTypes.pageSize;

export default containerTypeSlice.reducer;
