import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';

export const createVideoLecture = createAsyncThunk(
  'videoLecture/createVideoLecture',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/video-lecture/admin', formData, {
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

const videoLectureSlice = createSlice({
  name: 'videoLecture',
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
      .addCase(createVideoLecture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVideoLecture.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createVideoLecture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError } = videoLectureSlice.actions;
export default videoLectureSlice.reducer;