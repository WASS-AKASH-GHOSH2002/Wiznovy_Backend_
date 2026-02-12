import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const fetchCourseUnits = createAsyncThunk(
  'courseDetails/fetchCourseUnits',
  async (courseId) => {
    const response = await api.get('/unit/admin/by-course', {
      params: { courseId }
    });

    return {
      units: response.data.result || [],
      courseName: response.data.result?.[0]?.course?.name || ''
    };
  }
);

export const fetchStudyMaterials = createAsyncThunk(
  'courseDetails/fetchStudyMaterials',
  async ({ unitId, limit = 20, offset = 0 }) => {
    const response = await api.get('/study-material/list', {
      params: { unitId, limit, offset }
    });

    return {
      unitId,
      materials: response.data.result || [],
      total: response.data.total || 0
    };
  }
);

export const fetchVideoLectures = createAsyncThunk(
  'courseDetails/fetchVideoLectures',
  async ({ unitId, limit = 20, offset = 0 }) => {
    const response = await api.get('/video-lecture/list', {
      params: { unitId, limit, offset, keyword: '', courseId: '' }
    });

    return {
      unitId,
      videos: response.data.result || [],
      total: response.data.total || 0
    };
  }
);

// Video lecture study materials
export const fetchVideoStudyMaterials = createAsyncThunk(
  'courseDetails/fetchVideoStudyMaterials',
  async ({ videoLectureId, limit = 20, offset = 0 }) => {
    const response = await api.get('/study-material/list', {
      params: { videoLectureId, limit, offset }
    });

    return {
      videoLectureId,
      materials: response.data.result || [],
      total: response.data.total || 0
    };
  }
);

const courseDetailsSlice = createSlice({
  name: 'courseDetails',
  initialState: {
    units: [],
    courseName: '',
    loading: false,
    error: null,
    expandedUnits: {},
    expandedMaterials: {},
    expandedVideos: {},
    studyMaterials: {},
    materialsLoading: {},
    videoLectures: {},
    videosLoading: {},
    videoStudyMaterials: {},
    videoMaterialsLoading: {},
    expandedVideoMaterials: {}
  },
  reducers: {
    toggleUnit: (state, action) => {
      const unitId = action.payload;
      state.expandedUnits[unitId] = !state.expandedUnits[unitId];
    },
    toggleMaterials: (state, action) => {
      const unitId = action.payload;
      state.expandedMaterials[unitId] = !state.expandedMaterials[unitId];
    },
    toggleVideos: (state, action) => {
      const unitId = action.payload;
      state.expandedVideos[unitId] = !state.expandedVideos[unitId];
    },
    toggleVideoMaterials: (state, action) => {
      const videoId = action.payload;
      state.expandedVideoMaterials[videoId] = !state.expandedVideoMaterials[videoId];
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourseUnits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.units = action.payload.units;
        state.courseName = action.payload.courseName;
      })
      .addCase(fetchCourseUnits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchStudyMaterials.pending, (state, action) => {
        const unitId = action.meta.arg.unitId;
        state.materialsLoading[unitId] = true;
      })
      .addCase(fetchStudyMaterials.fulfilled, (state, action) => {
        const { unitId, materials } = action.payload;
        state.studyMaterials[unitId] = materials;
        state.materialsLoading[unitId] = false;
      })
      .addCase(fetchStudyMaterials.rejected, (state, action) => {
        const unitId = action.meta.arg.unitId;
        state.materialsLoading[unitId] = false;
      })
      .addCase(fetchVideoLectures.pending, (state, action) => {
        const unitId = action.meta.arg.unitId;
        state.videosLoading[unitId] = true;
      })
      .addCase(fetchVideoLectures.fulfilled, (state, action) => {
        const { unitId, videos } = action.payload;
        state.videoLectures[unitId] = videos;
        state.videosLoading[unitId] = false;
      })
      .addCase(fetchVideoLectures.rejected, (state, action) => {
        const unitId = action.meta.arg.unitId;
        state.videosLoading[unitId] = false;
      })
      .addCase(fetchVideoStudyMaterials.pending, (state, action) => {
        const videoLectureId = action.meta.arg.videoLectureId;
        state.videoMaterialsLoading[videoLectureId] = true;
      })
      .addCase(fetchVideoStudyMaterials.fulfilled, (state, action) => {
        const { videoLectureId, materials } = action.payload;
        state.videoStudyMaterials[videoLectureId] = materials;
        state.videoMaterialsLoading[videoLectureId] = false;
      })
      .addCase(fetchVideoStudyMaterials.rejected, (state, action) => {
        const videoLectureId = action.meta.arg.videoLectureId;
        state.videoMaterialsLoading[videoLectureId] = false;
      });
  }
});

export const { toggleUnit, toggleMaterials, toggleVideos, toggleVideoMaterials, clearError } = courseDetailsSlice.actions;
export default courseDetailsSlice.reducer;