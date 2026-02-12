// src/store/authThunks.js
import axios from 'axios';
import { loginStart, loginSuccess, loginFailure, logout } from './authSlice';
import { API_BASE_URL } from '../config/api';

export const loginUser = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  
  try {
    
    const params = new URLSearchParams();
    params.append('loginId', credentials.loginId);
    params.append('password', credentials.password);

    const response = await axios.post('/auth/admin/login', params, {
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { token, user: userData } = response.data;
    const authUser = { ...userData, token };
    
    localStorage.setItem('user', JSON.stringify(authUser));
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    dispatch(loginSuccess({ user: authUser }));
    return { success: true };
  } catch (err) {
    let errorMessage = 'Login failed. Please check your credentials.';
    
    if (err.response) {
      console.error('Login error response:', err.response.data);
      errorMessage = err.response.data?.message || 
                     err.response.data?.error || 
                     errorMessage;
    } else if (err.request) {
      console.error('No response received:', err.request);
      errorMessage = 'No response from server. Please try again.';
    } else {
      console.error('Request setup error:', err.message);
    }
    
    dispatch(loginFailure(errorMessage));
    return { success: false, error: errorMessage };
  }
};

export const initializeAuth = () => (dispatch) => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  
  if (storedUser && storedToken) {
    const user = { ...JSON.parse(storedUser), token: storedToken };
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    dispatch(loginSuccess({ user }));
  }
};

export const logoutUser = () => (dispatch) => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  delete axios.defaults.headers.common['Authorization'];
  dispatch(logout());
};
