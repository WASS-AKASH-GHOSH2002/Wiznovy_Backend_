import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const fetchPages = createAsyncThunk(
  'pages/fetchPages',
  async (params = {}) => {
    const { limit = 50, offset = 0, keyword = '', pageType = '' } = params;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(keyword && { keyword }),
      ...(pageType && { pageType })
    });
    
    const response = await api.get(`/pages/list?${queryParams}`);
    return response.data;
  }
);

export const createPage = createAsyncThunk(
  'pages/createPage',
  async (pageData) => {
    const response = await api.post('/pages', pageData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
);

export const updatePage = createAsyncThunk(
  'pages/updatePage',
  async ({ id, pageData }) => {
    const response = await api.put(`/pages/update/${id}`, pageData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
);

export const updatePageDetails = createAsyncThunk(
  'pages/updatePageDetails',
  async ({ id, pageData }) => {
    const response = await api.patch(`/pages/update-details/${id}`, pageData);
    return response.data;
  }
);

export const deletePage = createAsyncThunk(
  'pages/deletePage',
  async (id) => {
    await api.delete(`/pages/${id}`);
    return id;
  }
);

const pageSlice = createSlice({
  name: 'pages',
  initialState: {
    pages: [],
    total: 0,
    loading: false,
    error: null,
    filters: {
      search: '',
      pageType: ''
    }
  },
  reducers: {
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    setPageTypeFilter: (state, action) => {
      state.filters.pageType = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPages.fulfilled, (state, action) => {
        state.loading = false;
        state.pages = action.payload.result || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchPages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createPage.fulfilled, (state, action) => {
        state.pages.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updatePage.fulfilled, (state, action) => {
        const index = state.pages.findIndex(page => page.id === action.payload.id);
        if (index !== -1) {
          state.pages[index] = action.payload;
        }
      })
      .addCase(updatePageDetails.fulfilled, (state, action) => {
        const index = state.pages.findIndex(page => page.id === action.payload.id);
        if (index !== -1) {
          state.pages[index] = action.payload;
        }
      })
      .addCase(deletePage.fulfilled, (state, action) => {
        state.pages = state.pages.filter(page => page.id !== action.payload);
        state.total -= 1;
      });
  }
});

export const { setSearch, setPageTypeFilter } = pageSlice.actions;
export default pageSlice.reducer;