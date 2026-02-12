import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const fetchQualifications = createAsyncThunk(
  'qualifications/fetchQualifications',
  async (params = {}) => {
    const { limit = 50, offset = 0, keyword = '', status = '' } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(keyword && { keyword }),
      ...(status && { status })
    });
    
    const response = await api.get(`/qualification/list?${queryParams}`);
    return response.data;
  }
);

export const createQualification = createAsyncThunk(
  'qualifications/createQualification',
  async (qualificationData) => {
    const response = await api.post('/qualification', qualificationData);
    return response.data;
  }
);

export const updateQualification = createAsyncThunk(
  'qualifications/updateQualification',
  async ({ qualificationId, qualificationData }) => {
    const response = await api.patch(`/qualification/${qualificationId}`, qualificationData);
    return response.data;
  }
);

export const updateQualificationStatus = createAsyncThunk(
  'qualifications/updateQualificationStatus',
  async ({ qualificationId, status }) => {
    const response = await api.put(`/qualification/status/${qualificationId}`, { status });
    return response.data;
  }
);

const qualificationSlice = createSlice({
  name: 'qualifications',
  initialState: {
    qualifications: [],
    total: 0,
    loading: false,
    error: null,
    filters: {
      search: '',
      status: ''
    }
  },
  reducers: {
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQualifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualifications.fulfilled, (state, action) => {
        state.loading = false;
        state.qualifications = action.payload.result;
        state.total = action.payload.total;
      })
      .addCase(fetchQualifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createQualification.fulfilled, (state, action) => {
        state.qualifications.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateQualification.fulfilled, (state, action) => {
        const index = state.qualifications.findIndex(qual => qual.id === action.payload.id);
        if (index !== -1) {
          state.qualifications[index] = action.payload;
        }
      })
      .addCase(updateQualificationStatus.fulfilled, (state, action) => {
        const index = state.qualifications.findIndex(qual => qual.id === action.payload.id);
        if (index !== -1) {
          state.qualifications[index] = action.payload;
        }
      });
  }
});

export const { setSearch, setStatusFilter } = qualificationSlice.actions;
export default qualificationSlice.reducer;