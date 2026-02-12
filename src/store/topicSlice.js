import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Topic API thunks
export const createTopic = createAsyncThunk(
  'topics/create',
  async (topicData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/topic`, topicData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllTopics = createAsyncThunk(
  'topics/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/topic/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getTopicById = createAsyncThunk(
  'topics/getById',
  async (topicId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/topic/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateTopic = createAsyncThunk(
  'topics/update',
  async ({ topicId, topicData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/topic/${topicId}`, topicData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateTopicStatus = createAsyncThunk(
  'topics/updateStatus',
  async ({ topicId, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/topic/status/${topicId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteTopic = createAsyncThunk(
  'topics/delete',
  async (topicId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/topic/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return topicId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  topics: [],
  currentTopic: null,
  loading: false,
  error: null
};

const topicSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTopic: (state) => {
      state.currentTopic = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Topic
      .addCase(createTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTopic.fulfilled, (state, action) => {
        state.loading = false;
        state.topics.push(action.payload);
      })
      .addCase(createTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get All Topics
      .addCase(getAllTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTopics.fulfilled, (state, action) => {
        state.loading = false;
        state.topics = action.payload.result || action.payload;
      })
      .addCase(getAllTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Topic By ID
      .addCase(getTopicById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTopicById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTopic = action.payload;
      })
      .addCase(getTopicById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Topic
      .addCase(updateTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTopic.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.topics.findIndex(topic => topic.id === action.payload.id);
        if (index !== -1) {
          state.topics[index] = action.payload;
        }
        if (state.currentTopic?.id === action.payload.id) {
          state.currentTopic = action.payload;
        }
      })
      .addCase(updateTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Topic Status
      .addCase(updateTopicStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTopicStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.topics.findIndex(topic => topic.id === action.payload.id);
        if (index !== -1) {
          state.topics[index] = action.payload;
        }
        if (state.currentTopic?.id === action.payload.id) {
          state.currentTopic = action.payload;
        }
      })
      .addCase(updateTopicStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Topic
      .addCase(deleteTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTopic.fulfilled, (state, action) => {
        state.loading = false;
        state.topics = state.topics.filter(topic => topic.id !== action.payload);
        if (state.currentTopic?.id === action.payload) {
          state.currentTopic = null;
        }
      })
      .addCase(deleteTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearCurrentTopic } = topicSlice.actions;
export default topicSlice.reducer;