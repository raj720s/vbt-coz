import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { containerThresholdService } from '@/services/containerThresholdService';
import {
  ContainerThresholdResponse,
  CreateContainerThresholdRequest,
  UpdateContainerThresholdRequest,
  ContainerThresholdListRequest,
  ContainerThresholdListResponse,
} from '@/types/api';

// Async thunks
export const fetchContainerThresholds = createAsyncThunk(
  'containerThreshold/fetchContainerThresholds',
  async (params: ContainerThresholdListRequest) => {
    const response = await containerThresholdService.getContainerThresholds(params);
    return response;
  }
);

export const createContainerThreshold = createAsyncThunk(
  'containerThreshold/createContainerThreshold',
  async (data: CreateContainerThresholdRequest) => {
    const response = await containerThresholdService.createContainerThreshold(data);
    return response;
  }
);

export const updateContainerThreshold = createAsyncThunk(
  'containerThreshold/updateContainerThreshold',
  async ({ id, data }: { id: number; data: UpdateContainerThresholdRequest }) => {
    const response = await containerThresholdService.updateContainerThreshold(id, data);
    return response;
  }
);

export const patchContainerThreshold = createAsyncThunk(
  'containerThreshold/patchContainerThreshold',
  async ({ id, data }: { id: number; data: Partial<UpdateContainerThresholdRequest> }) => {
    const response = await containerThresholdService.patchContainerThreshold(id, data);
    return response;
  }
);

export const deleteContainerThreshold = createAsyncThunk(
  'containerThreshold/deleteContainerThreshold',
  async (id: number) => {
    await containerThresholdService.deleteContainerThreshold(id);
    return id;
  }
);

// State interface
interface ContainerThresholdState {
  containerThresholds: ContainerThresholdResponse[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: ContainerThresholdState = {
  containerThresholds: [],
  total: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 10,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Slice
const containerThresholdSlice = createSlice({
  name: 'containerThreshold',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch container thresholds
      .addCase(fetchContainerThresholds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContainerThresholds.fulfilled, (state, action: PayloadAction<ContainerThresholdListResponse>) => {
        state.loading = false;
        state.containerThresholds = action.payload.results;
        state.total = action.payload.count;
        state.totalPages = Math.ceil(action.payload.count / state.pageSize);
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchContainerThresholds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch container thresholds';
      })
      // Create container threshold
      .addCase(createContainerThreshold.fulfilled, (state, action: PayloadAction<ContainerThresholdResponse>) => {
        state.containerThresholds.unshift(action.payload);
        state.total += 1;
        state.lastUpdated = Date.now();
      })
      // Update container threshold
      .addCase(updateContainerThreshold.fulfilled, (state, action: PayloadAction<ContainerThresholdResponse>) => {
        const index = state.containerThresholds.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.containerThresholds[index] = action.payload;
        }
        state.lastUpdated = Date.now();
      })
      // Patch container threshold
      .addCase(patchContainerThreshold.fulfilled, (state, action: PayloadAction<ContainerThresholdResponse>) => {
        const index = state.containerThresholds.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.containerThresholds[index] = { ...state.containerThresholds[index], ...action.payload };
        }
        state.lastUpdated = Date.now();
      })
      // Delete container threshold
      .addCase(deleteContainerThreshold.fulfilled, (state, action: PayloadAction<number>) => {
        state.containerThresholds = state.containerThresholds.filter(item => item.id !== action.payload);
        state.total -= 1;
        state.lastUpdated = Date.now();
      });
  },
});

// Export actions
export const { clearError, setPage, setPageSize } = containerThresholdSlice.actions;

// Export selectors
export const selectContainerThresholds = (state: { containerThresholds: ContainerThresholdState }) => state.containerThresholds?.containerThresholds || [];
export const selectContainerThresholdsLoading = (state: { containerThresholds: ContainerThresholdState }) => state.containerThresholds?.loading || false;
export const selectContainerThresholdsError = (state: { containerThresholds: ContainerThresholdState }) => state.containerThresholds?.error || null;
export const selectContainerThresholdsTotal = (state: { containerThresholds: ContainerThresholdState }) => state.containerThresholds?.total || 0;
export const selectContainerThresholdsTotalPages = (state: { containerThresholds: ContainerThresholdState }) => state.containerThresholds?.totalPages || 0;
export const selectContainerThresholdCurrentPage = (state: { containerThresholds: ContainerThresholdState }) => state.containerThresholds?.currentPage || 1;
export const selectContainerThresholdPageSize = (state: { containerThresholds: ContainerThresholdState }) => state.containerThresholds?.pageSize || 10;

// Export reducer
export default containerThresholdSlice.reducer;
