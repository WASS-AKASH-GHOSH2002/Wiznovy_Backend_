import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';
import { toast } from 'react-toastify';

export const fetchTutors = createAsyncThunk(
  'tutors/fetchTutors',
  async ({ limit = 10, offset = 0, keyword = '', status = '', countryId = '', subjectId = '' } = {}) => {
    const params = {
      limit: Math.min(Math.max(Number(limit) || 50, 1), 100),
      offset: Math.max(Number(offset) || 0, 0)
    };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;
    if (countryId) params.countryId = countryId;
    if (subjectId) params.subjectId = subjectId;

    const response = await api.get('/account/tutors', { params });
    return {
      result: response.data.result || [],
      total: response.data.total || 0
    };
  }
);

export const updateTutorStatus = createAsyncThunk(
  'tutors/updateTutorStatus',
  async ({ tutorId, status }) => {
    await api.put(`/account/tutor/status/${tutorId}`, { status });
    return { tutorId, status };
  }
);

export const bulkUpdateTutorStatus = createAsyncThunk(
  'tutors/bulkUpdateTutorStatus',
  async ({ ids, status }) => {
    await api.put('/account/tutors/bulk-status', { ids, status });
    return { ids, status };
  }
);

export const updateTutorContact = createAsyncThunk(
  'tutors/updateTutorContact',
  async ({ id, email, phoneNumber }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/account/update-contact/${id}`, {
        email,
        phoneNumber
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchTutorDetails = createAsyncThunk(
  'tutors/fetchTutorDetails',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tutor-details/${accountId}`);
      console.log('Tutor details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Tutor details error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const tutorSlice = createSlice({
  name: 'tutors',
  initialState: {
    tutors: [],
    total: 0,
    loading: false,
    error: null,
    selectedTutorDetails: null,
    detailsLoading: false,
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
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTutors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTutors.fulfilled, (state, action) => {
        state.loading = false;
        state.tutors = action.payload.result;
        state.total = action.payload.total;
      })
      .addCase(fetchTutors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateTutorStatus.fulfilled, (state, action) => {
        // Don't update local state - let the refresh API call handle it
      })
      .addCase(bulkUpdateTutorStatus.fulfilled, (state, action) => {
        // Don't update local state - let the refresh API call handle it
      })
      .addCase(updateTutorContact.fulfilled, (state, action) => {
        const index = state.tutors.findIndex(tutor => tutor.id === action.payload.id);
        if (index !== -1) {
          state.tutors[index] = action.payload;
        }
        toast.success('Tutor contact updated successfully!');
      })
      .addCase(updateTutorContact.rejected, (state, action) => {
        toast.error('Failed to update tutor contact: ' + (action.payload?.message || 'Unknown error'));
      })
      .addCase(fetchTutorDetails.pending, (state) => {
        state.detailsLoading = true;
      })
      .addCase(fetchTutorDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedTutorDetails = action.payload;
      })
      .addCase(fetchTutorDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        toast.error('Failed to fetch tutor details: ' + (action.payload?.message || 'Unknown error'));
      });
  }
});

export const { setSearch, setStatusFilter, clearError } = tutorSlice.actions;
export default tutorSlice.reducer;