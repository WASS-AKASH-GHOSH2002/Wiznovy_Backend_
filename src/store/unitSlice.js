import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const createUnit = createAsyncThunk(
  'units/createUnit',
  async (formData, { rejectWithValue }) => {
    try {
      console.log('Sending FormData to API:', formData);
      const response = await api.post('/unit/admin', formData);
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Create unit error:', error);
      console.error('Error response:', error.response?.data);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUnitStatus = createAsyncThunk(
  'units/updateUnitStatus',
  async ({ id, status }) => {
    const response = await api.put(`/unit/status/${id}`, { status });
    return response.data;
  }
);

export const updateUnit = createAsyncThunk(
  'units/updateUnit',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/unit/admin/${id}`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateUnitImage = createAsyncThunk(
  'units/updateUnitImage',
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.put(`/unit/admin/image/${id}`, formData);
      return response.data;
    } catch (error) {
      console.error('Update unit image error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const unitSlice = createSlice({
  name: 'units',
  initialState: {
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUnit.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateUnitStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUnitStatus.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUnitStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateUnitImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUnitImage.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUnit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUnit.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUnit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateUnitImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearError } = unitSlice.actions;
export default unitSlice.reducer;