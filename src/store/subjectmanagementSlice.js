import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Set up axios instance with base URL and interceptors
const api = axios.create({
  baseURL: API_BASE_URL
});

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user'))?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

// Async thunks
export const fetchSubjects = createAsyncThunk(
  'subject/fetchSubjects',
  async ({ filters, page, rowsPerPage, searchKeyword, isUserView = false }, { rejectWithValue }) => {
    try {
      const endpoint = isUserView ? '/subject/user' : '/subject/list';
      
      // Sanitize filter data - convert empty strings to null
      const sanitizedFilters = { ...filters };
      const optionalFilterFields = ['boardId', 'gradeId', 'streamId', 'semesterId', 'degreeId', 'universityId', 'subMasterId', 'examId'];
      optionalFilterFields.forEach(field => {
        if (sanitizedFilters[field] === '') {
          sanitizedFilters[field] = null;
        }
      });
      
      const params = {
        ...sanitizedFilters,
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        keyword: searchKeyword
      };
      
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch subjects');
    }
  }
);

export const fetchRelatedEntities = createAsyncThunk(
  'subject/fetchRelatedEntities',
  async (_, { rejectWithValue }) => {
    try {
      const entityLimit = 100;
      
      const [
        boardsRes,
        gradesRes,
        streamsRes,
        semestersRes,
        degreesRes,
        universitiesRes,
        examsRes
      ] = await Promise.all([
        api.get('/board/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/grade/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/stream/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/semester/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/degree/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/university/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        }),
        api.get('/exam/list', {
          params: {
            limit: entityLimit,
            offset: 0,
            status: 'ACTIVE'
          }
        })
      ]);

      const subjectMastersRes = await api.get('/subject-master/list', {
        params: {
          limit: entityLimit,
          offset: 0,
          status: 'ACTIVE'
        }
      });

      return {
        boards: boardsRes.data.result || [],
        grades: gradesRes.data.result || [],
        streams: streamsRes.data.result || [],
        semesters: semestersRes.data.result || [],
        degrees: degreesRes.data.result || [],
        universities: universitiesRes.data.result || [],
        exams: examsRes.data.result || [],
        subjectMasters: subjectMastersRes.data.result || []
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch related entities');
    }
  }
);

export const createSubject = createAsyncThunk(
  'subject/createSubject',
  async (formData, { rejectWithValue }) => {
    try {
      // Sanitize form data - convert empty strings to null for optional fields
      const sanitizedData = { ...formData };
      const optionalFields = ['boardId', 'streamId', 'semesterId', 'degreeId', 'universityId', 'examId', 'gradeId'];
      optionalFields.forEach(field => {
        if (sanitizedData[field] === '') {
          sanitizedData[field] = null;
        }
      });
      
      const response = await api.post('/subject', sanitizedData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create subject');
    }
  }
);

export const updateSubject = createAsyncThunk(
  'subject/updateSubject',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      // Sanitize form data - convert empty strings to null for optional fields
      const sanitizedData = { ...formData };
      const optionalFields = ['boardId', 'streamId', 'semesterId', 'degreeId', 'universityId', 'examId', 'gradeId'];
      optionalFields.forEach(field => {
        if (sanitizedData[field] === '') {
          sanitizedData[field] = null;
        }
      });
      
      const response = await api.patch(`/subject/update/${id}`, sanitizedData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update subject');
    }
  }
);

export const deleteSubject = createAsyncThunk(
  'subject/deleteSubject',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/subject/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete subject');
    }
  }
);

export const toggleSubjectStatus = createAsyncThunk(
  'subject/toggleSubjectStatus',
  async ({ id, currentStatus }, { rejectWithValue }) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await api.patch(`/subject/update/${id}`, { status: newStatus });
      return { id, status: newStatus };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update subject status');
    }
  }
);

// Initial state
const initialState = {
  subjects: [],
  loading: false,
  error: '',
  snackbar: {
    open: false,
    message: '',
    severity: 'error'
  },
  
  // Related entities
  boards: [],
  grades: [],
  streams: [],
  semesters: [],
  degrees: [],
  universities: [],
  subjectMasters: [],
  exams: [],
  
  // Loading states for related entities
  loadingBoards: false,
  loadingGrades: false,
  loadingStreams: false,
  loadingSemesters: false,
  loadingDegrees: false,
  loadingUniversities: false,
  loadingSubjectMasters: false,
  loadingExams: false,
  
  // Pagination
  page: 0,
  rowsPerPage: 10,
  totalCount: 0,
  
  // Filter state
  filters: {
    boardId: '',
    gradeId: '',
    streamId: '',
    semesterId: '',
    degreeId: '',
    universityId: '',
    subMasterId: '',
    examId: '',
    status: 'ACTIVE'
  },
  
  // Search state
  searchKeyword: '',
  
  // Form state
  formData: {
    subMasterId: '',
    boardId: '',
    gradeId: '',
    streamId: '',
    semesterId: '',
    degreeId: '',
    universityId: '',
    examId: '',
    status: 'ACTIVE'
  },
  
  // Dialog state
  openDialog: false,
  isEditMode: false,
  currentSubjectId: null,
  
  // Refetch flag
  shouldRefetch: false
};

// Subject slice
const subjectmasterSlice = createSlice({
  name: 'subject',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setRowsPerPage: (state, action) => {
      state.rowsPerPage = action.payload;
      state.page = 0;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setSearchKeyword: (state, action) => {
      state.searchKeyword = action.payload;
    },
    setFormData: (state, action) => {
      state.formData = action.payload;
    },
    setOpenDialog: (state, action) => {
      state.openDialog = action.payload;
    },
    setIsEditMode: (state, action) => {
      state.isEditMode = action.payload;
    },
    setCurrentSubjectId: (state, action) => {
      state.currentSubjectId = action.payload;
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'error'
      };
    },
    closeSnackbar: (state) => {
      state.snackbar.open = false;
    },
    resetFormData: (state) => {
      state.formData = {
        subMasterId: '',
        boardId: '',
        gradeId: '',
        streamId: '',
        semesterId: '',
        degreeId: '',
        universityId: '',
        examId: '',
        status: 'ACTIVE'
      };
    },
    clearRefetchFlag: (state) => {
      state.shouldRefetch = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch subjects
      .addCase(fetchSubjects.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload.result || [];
        state.totalCount = action.payload.total || 0;
      })
      .addCase(fetchSubjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      // Fetch related entities
      .addCase(fetchRelatedEntities.pending, (state) => {
        state.loadingBoards = true;
        state.loadingGrades = true;
        state.loadingStreams = true;
        state.loadingSemesters = true;
        state.loadingDegrees = true;
        state.loadingUniversities = true;
        state.loadingSubjectMasters = true;
        state.loadingExams = true;
      })
      .addCase(fetchRelatedEntities.fulfilled, (state, action) => {
        state.boards = action.payload.boards;
        state.grades = action.payload.grades;
        state.streams = action.payload.streams;
        state.semesters = action.payload.semesters;
        state.degrees = action.payload.degrees;
        state.universities = action.payload.universities;
        state.exams = action.payload.exams;
        state.subjectMasters = action.payload.subjectMasters;
        state.loadingBoards = false;
        state.loadingGrades = false;
        state.loadingStreams = false;
        state.loadingSemesters = false;
        state.loadingDegrees = false;
        state.loadingUniversities = false;
        state.loadingSubjectMasters = false;
        state.loadingExams = false;
      })
      .addCase(fetchRelatedEntities.rejected, (state, action) => {
        state.loadingBoards = false;
        state.loadingGrades = false;
        state.loadingStreams = false;
        state.loadingSemesters = false;
        state.loadingDegrees = false;
        state.loadingUniversities = false;
        state.loadingSubjectMasters = false;
        state.loadingExams = false;
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      // Create subject
      .addCase(createSubject.fulfilled, (state) => {
        state.snackbar = {
          open: true,
          message: 'Subject created successfully',
          severity: 'success'
        };
        state.openDialog = false;
        state.shouldRefetch = true;
      })
      .addCase(createSubject.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      // Update subject
      .addCase(updateSubject.fulfilled, (state) => {
        state.snackbar = {
          open: true,
          message: 'Subject updated successfully',
          severity: 'success'
        };
        state.openDialog = false;
        state.shouldRefetch = true;
      })
      .addCase(updateSubject.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      // Delete subject
      .addCase(deleteSubject.fulfilled, (state) => {
        state.snackbar = {
          open: true,
          message: 'Subject deleted successfully',
          severity: 'success'
        };
      })
      .addCase(deleteSubject.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      })
      // Toggle subject status
      .addCase(toggleSubjectStatus.fulfilled, (state, action) => {
        const subject = state.subjects.find(s => s.id === action.payload.id);
        if (subject) {
          subject.status = action.payload.status;
        }
        state.snackbar = {
          open: true,
          message: `Subject ${action.payload.status.toLowerCase()}d successfully`,
          severity: 'success'
        };
      })
      .addCase(toggleSubjectStatus.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload,
          severity: 'error'
        };
      });
  }
});

export const {
  setPage,
  setRowsPerPage,
  setFilters,
  setSearchKeyword,
  setFormData,
  setOpenDialog,
  setIsEditMode,
  setCurrentSubjectId,
  showSnackbar,
  closeSnackbar,
  resetFormData,
  clearRefetchFlag
} = subjectmasterSlice.actions;

export default subjectmasterSlice.reducer;