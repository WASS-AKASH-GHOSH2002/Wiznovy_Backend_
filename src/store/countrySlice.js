import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const fetchCountries = createAsyncThunk(
  'countries/fetchCountries',
  async ({ limit = 20, offset = 0, keyword = '', status = '' } = {}) => {
    const params = {
      limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
      offset: Math.max(Number(offset) || 0, 0)
    };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;

    const response = await api.get('/country/list', { params });
    return {
      result: response.data.result || [],
      total: response.data.total || 0
    };
  }
);

export const createCountry = createAsyncThunk(
  'countries/createCountry',
  async ({ name, code }) => {
    const response = await api.post('/country', { name, code });
    return response.data;
  }
);

export const updateCountryStatus = createAsyncThunk(
  'countries/updateCountryStatus',
  async ({ countryId, status }) => {
    await api.put(`/country/status/${countryId}`, { status });
    return { countryId, status };
  }
);

export const updateCountry = createAsyncThunk(
  'countries/updateCountry',
  async ({ countryId, name, code }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/country/${countryId}`, { name, code });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkUpdateCountryStatus = createAsyncThunk(
  'countries/bulkUpdateCountryStatus',
  async ({ ids, status }) => {
    await api.put('/country/bulk-status', { ids, status });
    return { ids, status };
  }
);

const countrySlice = createSlice({
  name: 'countries',
  initialState: {
    countries: [],
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
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loading = false;
        state.countries = action.payload.result;
        state.total = action.payload.total;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createCountry.fulfilled, (state, action) => {
        state.countries.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateCountryStatus.fulfilled, (state, action) => {
        // Don't update local state - let the refresh API call handle it
      })
      .addCase(updateCountry.fulfilled, (state, action) => {
        const index = state.countries.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.countries[index] = action.payload;
        }
      })
      .addCase(bulkUpdateCountryStatus.fulfilled, (state, action) => {
        // Don't update local state - let the refresh API call handle it
      });
  }
});

export const { setSearch, setStatusFilter, clearError } = countrySlice.actions;
export default countrySlice.reducer;