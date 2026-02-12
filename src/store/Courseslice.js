// store/courseSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatCourseImages } from '../utils/imageUtils';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) queryParams.append('status', params.status);
      if (params.accessType) queryParams.append('accessType', params.accessType);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.tutorId) queryParams.append('tutorId', params.tutorId);
      if (params.subjectId) queryParams.append('subjectId', params.subjectId);
      if (params.languageId) queryParams.append('languageId', params.languageId);
      
      const queryString = queryParams.toString();
      const url = `/course/admin${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/createCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await api.post('/course/admin', courseData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/updateCourse',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/course/admin/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/course/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteCourseWithReason = createAsyncThunk(
  'courses/deleteCourseWithReason',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/course/admin/${id}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const searchCourses = createAsyncThunk(
  'courses/searchCourses',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.get(`/course/search?q=${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  'courses/fetchCourseById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/course/${courseId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



export const updateCourseStatus = createAsyncThunk(
  'courses/updateCourseStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/course/status/${id}`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const courseSlice = createSlice({
  name: 'courses',
  initialState: {
    courses: [],
    loading: false,
    error: null,
    totalCount: 0,
    selectedCourseDetails: null,
    detailsLoading: false,
    filters: {
      status: '',
      accessType: '',
      limit: 10,
      offset: 0,
      keyword: '',
      tutorId: '',
      subjectId: '',
      languageId: ''
    },
    thumbnailUpdating: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setThumbnailUpdating: (state, action) => {
      state.thumbnailUpdating = action.payload;
    },
    clearCourseDetails: (state) => {
      state.selectedCourseDetails = null;
      state.detailsLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        const courses = action.payload.result || action.payload;
        // Format image URLs for all courses
        state.courses = courses.map(course => formatCourseImages(course));
        state.totalCount = action.payload.total || action.payload.totalCount || courses.length;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        const newCourse = formatCourseImages(action.payload);
        
        state.courses.unshift(newCourse); // Add to beginning of array
        state.totalCount += 1;
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
     
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCourse = formatCourseImages(action.payload);
        
        const index = state.courses.findIndex(course => course.id === updatedCourse.id);
        if (index !== -1) {
          state.courses[index] = updatedCourse;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter(course => course.id !== action.payload);
        state.totalCount -= 1;
        toast.success('Course deleted successfully!');
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        toast.error('Failed to delete course: ' + (action.payload?.message || 'Unknown error'));
      })
      
      .addCase(searchCourses.fulfilled, (state, action) => {
        state.courses = action.payload.result || action.payload;
        state.totalCount = action.payload.totalCount || action.payload.length;
      })
      

      
      .addCase(updateCourseStatus.fulfilled, (state, action) => {
        const updatedCourse = formatCourseImages(action.payload);
        const index = state.courses.findIndex(course => course.id === updatedCourse.id);
        if (index !== -1) {
          state.courses[index] = updatedCourse;
        }
      })
      .addCase(updateCourseStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      .addCase(deleteCourseWithReason.fulfilled, (state, action) => {
        const updatedCourse = formatCourseImages(action.payload);
        const index = state.courses.findIndex(course => course.id === updatedCourse.id);
        if (index !== -1) {
          state.courses[index] = updatedCourse;
        }
      })
      .addCase(deleteCourseWithReason.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      .addCase(fetchCourseById.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedCourseDetails = formatCourseImages(action.payload);
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setFilters, setThumbnailUpdating, clearCourseDetails } = courseSlice.actions;
export default courseSlice.reducer;