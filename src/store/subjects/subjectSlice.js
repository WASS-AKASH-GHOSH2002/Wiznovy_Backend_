// src/store/slices/subjectSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

// Get token from localStorage
const getAuthToken = () => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.token;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }
  return null;
};

// Async thunks
export const fetchSubjects = createAsyncThunk(
  'subjects/fetchSubjects',
  async ({ page = 1, statusFilter = 'ACTIVE', search = '' }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const limit = 10;
      const offset = (page - 1) * limit;

      const response = await axios.get(`${API_BASE_URL}/subject-master/list`, {
        params: {
          limit,
          offset,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          keyword: search,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        subjects: response.data.result || [],
        total: response.data.total || 0,
        page,
        statusFilter,
        search,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subjects');
    }
  }
);

export const createSubject = createAsyncThunk(
  'subjects/createSubject',
  async (subjectData, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const response = await axios.post(`${API_BASE_URL}/subject-master`, subjectData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subject');
    }
  }
);

export const updateSubject = createAsyncThunk(
  'subjects/updateSubject',
  async ({ id, ...subjectData }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const response = await axios.patch(`${API_BASE_URL}/subject-master/update/${id}`, subjectData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update subject');
    }
  }
);

export const updateSubjectStatus = createAsyncThunk(
  'subjects/updateSubjectStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const response = await axios.put(`${API_BASE_URL}/subject-master/status/${id}`, { status }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { id, status };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update subject status');
    }
  }
);

export const uploadSubjectImage = createAsyncThunk(
  'subjects/uploadSubjectImage',
  async ({ id, imageFile }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await axios.put(`${API_BASE_URL}/subject-master/image/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload image');
    }
  }
);

// Subject slice
const subjectSlice = createSlice({
  name: 'subjects',
  initialState: {
    items: [],
    loading: false,
    error: null,
    currentPage: 1,
    total: 0,
    statusFilter: 'ACTIVE',
    search: '',
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.subjects;
        state.total = action.payload.total;
        state.currentPage = action.payload.page;
        state.statusFilter = action.payload.statusFilter;
        state.search = action.payload.search;
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create subject
      .addCase(createSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubject.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update subject
      .addCase(updateSubject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubject.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateSubject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update subject status
      .addCase(updateSubjectStatus.fulfilled, (state, action) => {
        const subject = state.items.find(item => item.id === action.payload.id);
        if (subject) {
          subject.status = action.payload.status;
        }
      })
      // Upload image
      .addCase(uploadSubjectImage.fulfilled, (state, action) => {
        const subject = state.items.find(item => item.id === action.payload.id);
        if (subject) {
          subject.image = action.payload.image;
        }
      });
  },
});

export const { clearError, setSearch, setStatusFilter, setCurrentPage } = subjectSlice.actions;
export default subjectSlice.reducer;