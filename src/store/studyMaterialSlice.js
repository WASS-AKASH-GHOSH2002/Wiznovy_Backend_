import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const createStudyMaterial = createAsyncThunk(
  'studyMaterial/createStudyMaterial',
  async (formData, { rejectWithValue }) => {
    try {
      // Check file size before upload (max 10MB)
      const pdfFile = formData.get('pdf');
      if (pdfFile && pdfFile.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }
      
      const response = await api.post('/study-material/admin', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateStudyMaterial = createAsyncThunk(
  'studyMaterial/updateStudyMaterial',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/study-material/${id}`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateStudyMaterialPdf = createAsyncThunk(
  'studyMaterial/updateStudyMaterialPdf',
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.put(`/study-material/admin/pdf/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const studyMaterialSlice = createSlice({
  name: 'studyMaterial',
  initialState: {
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createStudyMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStudyMaterial.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createStudyMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateStudyMaterial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudyMaterial.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateStudyMaterial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateStudyMaterialPdf.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStudyMaterialPdf.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateStudyMaterialPdf.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearError } = studyMaterialSlice.actions;
export default studyMaterialSlice.reducer;