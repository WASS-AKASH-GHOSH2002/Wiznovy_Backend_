import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const fetchStates = createAsyncThunk(
  'states/fetchStates',
  async ({ limit = 20, offset = 0, keyword = '', status = '', countryId = '' } = {}) => {
    const params = {
      limit: Math.min(Math.max(Number(limit) || 20, 1), 100),
      offset: Math.max(Number(offset) || 0, 0)
    };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;
    if (countryId) params.countryId = countryId;

    const response = await api.get('/state', { params });
    return {
      result: response.data.result || [],
      total: response.data.total || 0
    };
  }
);

export const createState = createAsyncThunk(
  'states/createState',
  async (stateData) => {
    const response = await api.post('/state', stateData);
    return response.data;
  }
);

export const updateStateStatus = createAsyncThunk(
  'states/updateStateStatus',
  async ({ stateId, status }) => {
    await api.put(`/state/status/${stateId}`, { status });
    return { stateId, status };
  }
);

const stateSlice = createSlice({
  name: 'states',
  initialState: {
    states: [],
    total: 0,
    loading: false,
    error: null,
    filters: {
      search: '',
      status: '',
      countryId: ''
    }
  },
  reducers: {
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    setCountryFilter: (state, action) => {
      state.filters.countryId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStates.fulfilled, (state, action) => {
        state.loading = false;
        state.states = action.payload.result;
        state.total = action.payload.total;
      })
      .addCase(fetchStates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createState.fulfilled, (state, action) => {
        state.states.push(action.payload);
        state.total += 1;
      })
      .addCase(updateStateStatus.fulfilled, (state, action) => {
        const { stateId, status } = action.payload;
        const stateItem = state.states.find(s => s.id === stateId);
        if (stateItem) {
          stateItem.status = status;
        }
      });
  }
});

export const { setSearch, setStatusFilter, setCountryFilter, clearError } = stateSlice.actions;
export default stateSlice.reducer;