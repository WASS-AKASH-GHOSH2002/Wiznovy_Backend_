import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const createCity = createAsyncThunk(
  'cities/create',
  async (cityData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/city`, cityData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCities = createAsyncThunk(
  'cities/fetchCities',
  async ({ limit = 20, offset = 0, keyword = '', status = '', stateId = '' } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
        offset: Math.max(Number(offset) || 0, 0)
      };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      if (stateId) params.stateId = stateId;

      const response = await axios.get(`${API_BASE_URL}/city/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return {
        result: response.data.result || [],
        total: response.data.total || 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCity = createAsyncThunk(
  'cities/update',
  async ({ cityId, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/city/${cityId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCityStatus = createAsyncThunk(
  'cities/updateStatus',
  async ({ cityId, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/city/${cityId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  cities: [],
  total: 0,
  loading: false,
  error: null,
  filters: {
    search: '',
    status: '',
    stateId: ''
  }
};

const citySlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    setStateFilter: (state, action) => {
      state.filters.stateId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCity.fulfilled, (state, action) => {
        state.loading = false;
        state.cities.push(action.payload);
      })
      .addCase(createCity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload.result;
        state.total = action.payload.total;
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCity.fulfilled, (state, action) => {
        const index = state.cities.findIndex(city => city.id === action.payload.id);
        if (index !== -1) {
          state.cities[index] = action.payload;
        }
      })
      .addCase(updateCityStatus.fulfilled, (state, action) => {
        const index = state.cities.findIndex(city => city.id === action.payload.id);
        if (index !== -1) {
          state.cities[index] = action.payload;
        }
      });
  }
});

export const { setSearch, setStatusFilter, setStateFilter, clearError } = citySlice.actions;
export default citySlice.reducer;