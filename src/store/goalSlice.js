import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Goal API thunks
export const createGoal = createAsyncThunk(
  'goals/create',
  async (goalData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/goal`, goalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getAllGoals = createAsyncThunk(
  'goals/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/goal/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getGoalById = createAsyncThunk(
  'goals/getById',
  async (goalId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/goal/${goalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/update',
  async ({ goalId, goalData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/goal/${goalId}`, goalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateGoalStatus = createAsyncThunk(
  'goals/updateStatus',
  async ({ goalId, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/goal/status/${goalId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'goals/delete',
  async (goalId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/goal/${goalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return goalId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  goals: [],
  currentGoal: null,
  loading: false,
  error: null
};

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentGoal: (state) => {
      state.currentGoal = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Goal
      .addCase(createGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals.push(action.payload);
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get All Goals
      .addCase(getAllGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload.result || action.payload;
      })
      .addCase(getAllGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Goal By ID
      .addCase(getGoalById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGoalById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGoal = action.payload;
      })
      .addCase(getGoalById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Goal
      .addCase(updateGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.goals.findIndex(goal => goal.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
        if (state.currentGoal?.id === action.payload.id) {
          state.currentGoal = action.payload;
        }
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Goal Status
      .addCase(updateGoalStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGoalStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.goals.findIndex(goal => goal.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
        if (state.currentGoal?.id === action.payload.id) {
          state.currentGoal = action.payload;
        }
      })
      .addCase(updateGoalStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Goal
      .addCase(deleteGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = state.goals.filter(goal => goal.id !== action.payload);
        if (state.currentGoal?.id === action.payload) {
          state.currentGoal = null;
        }
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearCurrentGoal } = goalSlice.actions;
export default goalSlice.reducer;