// src/store/authThunks.js
import axios from 'axios';
import { loginStart, loginSuccess, loginFailure, logout } from './authSlice';
import { API_BASE_URL } from '../../config/api';

export const loginUser = (credentials) => async (dispatch) => {
  dispatch(loginStart());
  
  try {
    // Convert to x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('loginId', credentials.loginId);
    params.append('password', credentials.password);

    const response = await axios.post('/auth/admin/login', params, {
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { token, email, role, user: userData } = response.data;
    const authUser = { ...userData, token, email };
    
    // Store temporarily for OTP verification
    localStorage.setItem('tempUser', JSON.stringify(authUser));
    localStorage.setItem('tempToken', token);
    localStorage.setItem('tempEmail', email);
    localStorage.setItem('tempRole', role);
    localStorage.setItem('tempLoginId', credentials.loginId);
    localStorage.setItem('tempPassword', credentials.password);
    
    return { success: true, email };
  } catch (err) {
    let errorMessage = 'Login failed. Please check your credentials.';
    
    if (err.response) {
      console.error('Login error response:', err.response.data);
      const status = err.response.status;
      const responseData = err.response.data;
      
      if (status === 401 || status === 403) {
        errorMessage = 'Invalid admin credentials. This email is not authorized for admin access.';
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (responseData?.error) {
        errorMessage = responseData.error;
      }
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
  localStorage.removeItem('email');
  localStorage.removeItem('role');
  delete axios.defaults.headers.common['Authorization'];
  dispatch(logout());
};
