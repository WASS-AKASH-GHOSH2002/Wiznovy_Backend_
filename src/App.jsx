import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import DashboardLayout from './components/DashboardLayout';
import LoginPage from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import VerifyOTP from './components/VerifyOTP';
import ResetPassword from './components/ResetPassword';
import LoginOTPVerify from './components/LoginOTPVerify';
import ProtectedRoute from './components/ProtectecRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect } from 'react';
import { initializeAuth } from './store/auth/authThunks';
import './App.css'; 
function App() {
  
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login-otp-verify" element={<LoginOTPVerify />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } />
            </Routes>
            <ToastContainer position="top-right" autoClose={3000} />
          </Router>
     
  );
}

export default App;