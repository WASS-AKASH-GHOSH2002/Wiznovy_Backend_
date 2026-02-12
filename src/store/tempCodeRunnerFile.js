import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Async thunks
export const fetchSubjectsAndCourses = createAsyncThunk(
  'mcqTest/fetchSubjectsAndCourses',
  async (_, { rejectWithValue }) => {
    try {
      const [subjectsRes, coursesRes] = await Promise.all([
        api.get('/subject/list', {
          params: { limit: 100, offset: 0, status: 'ACTIVE' }
        }),
        api.get('/course/admin', {
          params: { limit: 100, offset: 0, status: 'ACTIVE' }
        })
      ]);

      const subjectData = subjectsRes.data?.result || [];
      const courseData = coursesRes.data?.result || [];
      const allItems = [...subjectData, ...courseData];

      const filterOptions = {
        grades: [...new Set(allItems.map(item => item.grade?.name).filter(Boolean))],
        streams: [...new Set(allItems.map(item => item.stream?.name).filter(Boolean))],
        semesters: [...new Set(allItems.map(item => item.semester?.name).filter(Boolean))],
        degrees: [...new Set(allItems.map(item => item.degree?.name).filter(Boolean))],
        universities: [...new Set(allItems.map(item => item.university?.name).filter(Boolean))],
        names: [...new Set(allItems.map(item => item.subMaster?.name || item.name).filter(Boolean))],
        exams: [...new Set(allItems.map(item => item.exam?.name).filter(Boolean))]
      };

      return { subjects: subjectData, courses: courseData, filterOptions };
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch data');
    }
  }
);

export const fetchUnits = createAsyncThunk(
  'mcqTest/fetchUnits',
  async ({ id, type }, { rejectWithValue }) => {
    try {
      const endpoint = type === 'subjects' 
        ? `/unit/list?subjectId=${id}&limit=100&offset=0`
        : `/unit/list?courseId=${id}&limit=100&offset=0`;
      
      const res = await api.get(endpoint);
      return res.data?.result || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch units');
    }
  }
);

export const fetchMcqTests = createAsyncThunk(
  'mcqTest/fetchMcqTests',
  async ({ unitId, accessTypeFilter = "" }, { rejectWithValue }) => {
    try {
      const params = {};
      if (unitId) params.unitId = unitId;
      if (accessTypeFilter) params.accessTypes = accessTypeFilter;
      
      const res = await api.get('/mcq-test/list', { params });
      
      // Process the MCQ tests data - fix the thumbnail URLs
      const fixThumbnailUrl = (url) => {
        if (!url) return null;
        let fixedUrl = url.replace(/\\/g, '/');
        if (fixedUrl.includes('localhost') && !API_BASE_URL.includes('localhost')) {
          const urlPath = fixedUrl.split('/').slice(3).join('/');
          fixedUrl = `${API_BASE_URL}/${urlPath}`;
        }
        return fixedUrl;
      };
      
      return (res.data?.result || []).map(test => ({
        ...test,
        thumbnailUrl: fixThumbnailUrl(test.thumbnailUrl),
      }));
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch MCQ tests');
    }
  }
);

export const addMcqTest = createAsyncThunk(
  'mcqTest/addMcqTest',
  async (testData, { rejectWithValue }) => {
    try {
      const res = await api.post("/mcq-test", testData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to add MCQ test');
    }
  }
);

export const updateMcqTest = createAsyncThunk(
  'mcqTest/updateMcqTest',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/mcq-test/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to update MCQ test');
    }
  }
);

export const uploadThumbnail = createAsyncThunk(
  'mcqTest/uploadThumbnail',
  async ({ testId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.put(`/mcq-test/thumbnail/${testId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to upload thumbnail');
    }
  }
);

// Initial state
const initialState = {
  // Data
  subjects: [],
  courses: [],
  subjectUnits: [],
  courseUnits: [],
  subjectMcqTests: [],
  courseMcqTests: [],
  
  // UI State
  activeTab: "subjects",
  selectedSubject: "",
  selectedCourse: "",
  selectedSubjectUnit: "",
  selectedCourseUnit: "",
  loading: false,
  message: "",
  
  // Form State
  title: "",
  description: "",
  timeLimit: 30,
  price: 0,
  accessTypes: "FREE",
  editingTest: null,
  
  // Filters
  filters: {
    grade: "",
    stream: "",
    semester: "",
    degree: "",
    university: "",
    name: "",
    accessTypes: "",
    exam: ""
  },
  
  // Filter options
  filterOptions: {
    grades: [],
    streams: [],
    semesters: [],
    degrees: [],
    universities: [],
    names: [],
    exams: []
  },
  
  // Filtered Data
  filteredSubjects: [],
  filteredCourses: []
};

// Slice
const mcqTestSlice = createSlice({
  name: 'mcqTest',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
      // Reset selections when changing tabs
      state.selectedSubject = "";
      state.selectedCourse = "";
      state.selectedSubjectUnit = "";
      state.selectedCourseUnit = "";
      state.subjectMcqTests = [];
      state.courseMcqTests = [];
    },
    setSelectedSubject: (state, action) => {
      state.selectedSubject = action.payload;
      state.selectedSubjectUnit = "";
      state.subjectMcqTests = [];
    },
    setSelectedCourse: (state, action) => {
      state.selectedCourse = action.payload;
      state.selectedCourseUnit = "";
      state.courseMcqTests = [];
    },
    setSelectedSubjectUnit: (state, action) => {
      state.selectedSubjectUnit = action.payload;
    },
    setSelectedCourseUnit: (state, action) => {
      state.selectedCourseUnit = action.payload;
    },
    setTitle: (state, action) => {
      state.title = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    setTimeLimit: (state, action) => {
      state.timeLimit = action.payload;
    },
    setPrice: (state, action) => {
      state.price = action.payload;
    },
    setAccessTypes: (state, action) => {
      state.accessTypes = action.payload;
    },
    setEditingTest: (state, action) => {
      state.editingTest = action.payload;
      if (action.payload) {
        state.title = action.payload.title;
        state.description = action.payload.description || "";
        state.timeLimit = action.payload.timeLimit || 30;
        state.accessTypes = action.payload.accessTypes;
        state.price = action.payload.price || 0;
      }
    },
    setFilter: (state, action) => {
      const { filterType, value } = action.payload;
      state.filters[filterType] = value;
      
      // Apply filters to subjects or courses based on active tab
      if (state.activeTab === "subjects") {
        let filtered = [...state.subjects];
        
        if (state.filters.grade) {
          filtered = filtered.filter(item => item.grade?.name === state.filters.grade);
        }
        
        if (state.filters.stream) {
          filtered = filtered.filter(item => item.stream?.name === state.filters.stream);
        }
        
        if (state.filters.semester) {
          filtered = filtered.filter(item => item.semester?.name === state.filters.semester);
        }
        
        if (state.filters.degree) {
          filtered = filtered.filter(item => item.degree?.name === state.filters.degree);
        }
        
        if (state.filters.university) {
          filtered = filtered.filter(item => item.university?.name === state.filters.university);
        }
        
        if (state.filters.name) {
          filtered = filtered.filter(item => item.subMaster?.name === state.filters.name);
        }
        
        if (state.filters.exam) {
          filtered = filtered.filter(item => item.exam?.name === state.filters.exam);
        }
        
        state.filteredSubjects = filtered;
      } else {
        let filtered = [...state.courses];
        
        if (state.filters.grade) {
          filtered = filtered.filter(item => item.grade?.name === state.filters.grade);
        }
        
        if (state.filters.stream) {
          filtered = filtered.filter(item => item.stream?.name === state.filters.stream);
        }
        
        if (state.filters.semester) {
          filtered = filtered.filter(item => item.semester?.name === state.filters.semester);
        }
        
        if (state.filters.degree) {
          filtered = filtered.filter(item => item.degree?.name === state.filters.degree);
        }
        
        if (state.filters.university) {
          filtered = filtered.filter(item => item.university?.name === state.filters.university);
        }
        
        if (state.filters.name) {
          filtered = filtered.filter(item => item.name === state.filters.name);
        }
        
        if (state.filters.exam) {
          filtered = filtered.filter(item => item.exam?.name === state.filters.exam);
        }
        
        state.filteredCourses = filtered;
      }
    },
    clearFilters: (state) => {
      state.filters = {
        grade: "",
        stream: "",
        semester: "",
        degree: "",
        university: "",
        name: "",
        accessTypes: "",
        exam: ""
      };
      
      // Reset filtered data
      state.filteredSubjects = [...state.subjects];
      state.filteredCourses = [...state.courses];
    },
    setMessage: (state, action) => {
      state.message = action.payload;
    },
    resetForm: (state) => {
      state.title = "";
      state.description = "";
      state.timeLimit = 30;
      state.accessTypes = "FREE";
      state.price = 0;
      state.editingTest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subjects and courses
      .addCase(fetchSubjectsAndCourses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSubjectsAndCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.subjects = action.payload.subjects;
        state.courses = action.payload.courses;
        state.filteredSubjects = action.payload.subjects;
        state.filteredCourses = action.payload.courses;
        state.filterOptions = action.payload.filterOptions;
      })
      .addCase(fetchSubjectsAndCourses.rejected, (state) => {
        state.loading = false;
        state.message = "Failed to load data.";
      })
      // Fetch units
      .addCase(fetchUnits.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeTab === "subjects") {
          state.subjectUnits = action.payload;
        } else {
          state.courseUnits = action.payload;
        }
      })
      .addCase(fetchUnits.rejected, (state) => {
        state.loading = false;
        state.message = "Failed to load units.";
      })
      // Fetch MCQ tests
      .addCase(fetchMcqTests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMcqTests.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeTab === "subjects") {
          state.subjectMcqTests = action.payload;
        } else {
          state.courseMcqTests = action.payload;
        }
      })
      .addCase(fetchMcqTests.rejected, (state) => {
        state.loading = false;
        state.message = "Failed to load MCQ tests.";
      })
      // Add MCQ test
      .addCase(addMcqTest.fulfilled, (state) => {
        state.message = "✅ MCQ test added successfully!";
        state.title = "";
        state.description = "";
        state.timeLimit = 30;
        state.accessTypes = "FREE";
        state.price = 0;
      })
      .addCase(addMcqTest.rejected, (state) => {
        state.message = "❌ Failed to add MCQ test.";
      })
      // Update MCQ test
      .addCase(updateMcqTest.fulfilled, (state) => {
        state.message = "✅ MCQ test updated successfully!";
        state.editingTest = null;
        state.title = "";
        state.description = "";
        state.timeLimit = 30;
        state.accessTypes = "FREE";
        state.price = 0;
      })
      .addCase(updateMcqTest.rejected, (state) => {
        state.message = "❌ Failed to update MCQ test.";
      })
      // Upload thumbnail
      .addCase(uploadThumbnail.fulfilled, (state) => {
        state.message = "✅ Thumbnail uploaded successfully!";
      })
      .addCase(uploadThumbnail.rejected, (state) => {
        state.message = "❌ Failed to upload thumbnail.";
      });
  },
});

export const {
  setActiveTab,
  setSelectedSubject,
  setSelectedCourse,
  setSelectedSubjectUnit,
  setSelectedCourseUnit,
  setTitle,
  setDescription,
  setTimeLimit,
  setPrice,
  setAccessTypes,
  setEditingTest,
  setFilter,
  clearFilters,
  setMessage,
  resetForm,
} = mcqTestSlice.actions;

export default mcqTestSlice.reducer;