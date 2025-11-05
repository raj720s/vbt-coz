import { ContainerPriorityResponse } from '@/types/api';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ContainerTypeResponse, PODListResponse , POLListResponse, UserJsonInfoResponse, CompanyJsonInfoResponse } from '@/types/api';
import superAxios from '@/utils/superAxios';
// Removed userInfoSlice dependency - using AuthContext instead
import { RootState } from '@reduxjs/toolkit/query/react';
import podService, { PODService } from '@/services/podService';
import { polService } from '@/services';
import { userService } from '@/services/userService';
import { companyService } from '@/services/companyService';

interface CommonDataState {
  
  polList: any[]; // Using any[] to match actual API response structure
  podList: any[]; // Using any[] to match actual API response structure
  usersJson: Record<string, string>; // Key: user_id, Value: user_name
  companiesJson: Record<string, string>; // Key: company_id, Value: company_name
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  isInitialized: boolean;
}

const  initialState: CommonDataState = {
  
  polList: [],
  podList: [],
  usersJson: {},
  companiesJson: {},
  isLoading: false,
  error: null,
  lastFetched: null,
  isInitialized: false,
};



  export const fetchPortOfLoading = createAsyncThunk(
    'commonData/fetchPortOfLoading',
    async (_, { rejectWithValue }) => {
      try {

        const response = await polService.getPOLs({
          page: 1,
          page_size: 1000,
          order_by: "created_on",
          order_type: "desc"
        });

        return response.results;
        // return response.data;
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.detail || error.message || 'Failed to fetch port of loading'
        );
      }
    }
  );

  export const fetchPortOfDischarge = createAsyncThunk(
    'commonData/fetchPortOfDischarge',
    async (_, { rejectWithValue }) => {
      try {
        const response = await podService.getPODs({
            page: 1,
            page_size: 1000,
            order_by: "created_on",
            order_type: "desc"
          });

          return response.results;
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.detail || error.message || 'Failed to fetch port of discharge'
        );
      }
    }
  );

  export const fetchUsersJson = createAsyncThunk(
    'commonData/fetchUsersJson',
    async (_, { rejectWithValue }) => {
      try {
        const response = await userService.getUserJsonInfo();
        return response.results;
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.detail || error.message || 'Failed to fetch users JSON info'
        );
      }
    }
  );

  export const fetchCompaniesJson = createAsyncThunk(
    'commonData/fetchCompaniesJson',
    async (_, { rejectWithValue }) => {
      try {
        // Fetch all companies using the list API with a large page size
        const response = await companyService.getCompanies({
          page: 1,
          page_size: 10000, // Large page size to get all companies
          order_by: 'name',
          order_type: 'asc'
        });
        
        // Transform the results array into a Record<string, string> mapping company IDs to names
        const companiesJson: Record<string, string> = {};
        if (response.results && Array.isArray(response.results)) {
          response.results.forEach((company) => {
            if (company.id && company.name) {
              companiesJson[company.id.toString()] = company.name;
            }
          });
        }
        
        return companiesJson;
      } catch (error: any) {
        return rejectWithValue(
          error.response?.data?.detail || error.message || 'Failed to fetch companies JSON info'
        );
      }
    }
  );


const commonDataSlice = createSlice({
  name: 'commonData',
  initialState,
  reducers: {
  
  

    setPortOfLoading: (state, action: PayloadAction<POLListResponse[]>) => {
      state.polList = action.payload;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      state.error = null;
    },
    
    setPortOfDischarge: (state, action: PayloadAction<PODListResponse[]>) => {
      state.podList = action.payload;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      state.error = null;
    },
    
    setUsersJson: (state, action: PayloadAction<Record<string, string>>) => {
      state.usersJson = action.payload;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      state.error = null;
    },
    
    setCompaniesJson: (state, action: PayloadAction<Record<string, string>>) => {
      state.companiesJson = action.payload;
      state.isInitialized = true;
      state.lastFetched = Date.now();
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch Container Types
    
      .addCase(fetchPortOfLoading.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortOfLoading.fulfilled, (state, action) => {
        state.isLoading = false;
        state.polList = action.payload;
        state.isInitialized = true;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchPortOfLoading.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      .addCase(fetchPortOfDischarge.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortOfDischarge.fulfilled, (state, action) => {
        state.isLoading = false;
        state.podList = action.payload;
        state.isInitialized = true;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchPortOfDischarge.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      .addCase(fetchUsersJson.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsersJson.fulfilled, (state, action: PayloadAction<Record<string, string>>) => {
        state.isLoading = false;
        state.usersJson = action.payload;
        state.isInitialized = true;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchUsersJson.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      .addCase(fetchCompaniesJson.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompaniesJson.fulfilled, (state, action: PayloadAction<Record<string, string>>) => {
        state.isLoading = false;
        state.companiesJson = action.payload;
        state.isInitialized = true;
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchCompaniesJson.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      });
  },
});

export const {  setPortOfLoading, setPortOfDischarge, setUsersJson, setCompaniesJson } = commonDataSlice.actions;
export const selectPortOfLoading = (state: { commonData: CommonDataState }) => state.commonData.polList;
export const selectPortOfDischarge = (state: { commonData: CommonDataState }) => state.commonData.podList;
export const selectUsersJson = (state: { commonData: CommonDataState }) => state.commonData.usersJson;
export const selectPortOfLoadingLoading = (state: { commonData: CommonDataState }) => state.commonData.isLoading;
export const selectPortOfDischargeLoading = (state: { commonData: CommonDataState }) => state.commonData.isLoading;
export const selectUsersJsonLoading = (state: { commonData: CommonDataState }) => state.commonData.isLoading;
export const selectPortOfLoadingError = (state: { commonData: CommonDataState }) => state.commonData.error;
export const selectPortOfDischargeError = (state: { commonData: CommonDataState }) => state.commonData.error;
export const selectUsersJsonError = (state: { commonData: CommonDataState }) => state.commonData.error;
export const selectPortOfLoadingInitialized = (state: { commonData: CommonDataState }) => state.commonData.isInitialized;
export const selectPortOfDischargeInitialized = (state: { commonData: CommonDataState }) => state.commonData.isInitialized;
export const selectUsersJsonInitialized = (state: { commonData: CommonDataState }) => state.commonData.isInitialized;

export default commonDataSlice.reducer;