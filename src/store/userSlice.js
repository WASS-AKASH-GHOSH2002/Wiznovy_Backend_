import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../config/axios';
import { toast } from 'react-toastify';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ limit = 10, offset = 0, keyword = '', status = '' } = {}) => {
    const params = {
      limit: Math.min(Math.max(Number(limit) || 10, 1), 100),
      offset: Math.max(Number(offset) || 0, 0)
    };
    if (keyword) params.keyword = keyword;
    if (status) params.status = status;

    const response = await api.get('/account/users', { params });
    return {
      result: response.data.result || [],
      total: response.data.total || 0
    };
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ userId, status }) => {
    await api.put(`/account/user/status/${userId}`, { status });
    return { userId, status };
  }
);

export const bulkUpdateUserStatus = createAsyncThunk(
  'users/bulkUpdateUserStatus',
  async ({ ids, status }) => {
    await api.put('/account/users/bulk-status', { ids, status });
    return { ids, status };
  }
);

export const updateUserContact = createAsyncThunk(
  'users/updateUserContact',
  async ({ id, email, phoneNumber }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/account/update-contact/${id}`, {
        email,
        phoneNumber
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    total: 0,
    loading: false,
    error: null,
    filters: {
      search: '',
      status: ''
    }
  },
  reducers: {
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },
    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.result;
        state.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        // Don't update local state - let the refresh API call handle it
      })
      .addCase(bulkUpdateUserStatus.fulfilled, (state, action) => {
        // Don't update local state - let the refresh API call handle it
      })
      .addCase(updateUserContact.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        toast.success('User contact updated successfully!');
      })
      .addCase(updateUserContact.rejected, (state, action) => {
        toast.error('Failed to update user contact: ' + (action.payload?.message || 'Unknown error'));
      });
  }
});

export const { setSearch, setStatusFilter, clearError } = userSlice.actions;
export default userSlice.reducer;