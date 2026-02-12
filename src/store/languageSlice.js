import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const fetchLanguages = createAsyncThunk(
  'languages/fetchLanguages',
  async (params = {}) => {
    const { limit = 50, offset = 0, keyword = '', status = '' } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(keyword && { keyword }),
      ...(status && { status })
    });
    
    const response = await api.get(`/languages/all?${queryParams}`);
    return response.data;
  }
);

export const createLanguage = createAsyncThunk(
  'languages/createLanguage',
  async (languageData) => {
    const response = await api.post('/languages', languageData);
    return response.data;
  }
);

export const updateLanguageStatus = createAsyncThunk(
  'languages/updateLanguageStatus',
  async ({ languageId, status }) => {
    const response = await api.patch(`/languages/${languageId}/status`, { status });
    return response.data;
  }
);

const languageSlice = createSlice({
  name: 'languages',
  initialState: {
    languages: [],
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
      .addCase(fetchLanguages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLanguages.fulfilled, (state, action) => {
        state.loading = false;
        state.languages = action.payload.result;
        state.total = action.payload.total;
      })
      .addCase(fetchLanguages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createLanguage.fulfilled, (state, action) => {
        state.languages.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateLanguageStatus.fulfilled, (state, action) => {
        const index = state.languages.findIndex(lang => lang.id === action.payload.id);
        if (index !== -1) {
          state.languages[index] = action.payload;
        }
      });
  }
});

export const { setSearch, setStatusFilter } = languageSlice.actions;
export default languageSlice.reducer;