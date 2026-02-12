import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import swcLogo from "../assets/WIZNOVY.png";

const ResetPassword = () => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  useEffect(() => {
    if (!email || !otp) {
      navigate('/forgot-password');
    }
  }, [email, otp, navigate]);

  const validatePassword = (password) => {
    const minLength = password.length >= 6;

    
    return minLength;
    
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'newPassword' && value) {
      if (!validatePassword(value)) {
        setErrors(prev => ({ 
          ...prev, 
          newPassword: 'Password must be 6+  character' 
        }));
      }
    }

    if (name === 'confirmPassword' && value) {
      if (value !== passwords.newPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const isFormValid = () => {
    return passwords.newPassword && 
           passwords.confirmPassword && 
           validatePassword(passwords.newPassword) && 
           passwords.newPassword === passwords.confirmPassword &&
           !errors.newPassword && 
           !errors.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/resetPass`, {
        email,
        newPassword: passwords.newPassword,
        role: 'ADMIN'
      });
      
      navigate('/login', { 
        state: { message: 'Password reset successfully! Please login with your new password.' }
      });
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Failed to reset password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#C4DAD2]">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img 
            src={swcLogo} 
            alt="SWC Logo" 
            className="w-36 h-36 mx-auto mt-4 mb-2 rounded-full object-cover"
          />
          <h2 className="text-3xl font-bold text-[#16423C]">Reset Password</h2>
          <p className="text-gray-500 mt-2">Create a new password for</p>
          <p className="text-[#16423C] font-medium">{email}</p>
        </div>

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 ring-[#C4DAD2]-400 relative">
              <Lock className="text-gray-400 mr-2" size={18} />
              <input
                type={showPasswords.newPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                className="w-full bg-transparent outline-none text-sm pr-8"
                value={passwords.newPassword}
                onChange={handleChange}
                required
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 text-gray-400 hover:text-gray-600"
                onClick={() => togglePasswordVisibility('newPassword')}
              >
                {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 ring-[#C4DAD2]-400 relative">
              <Lock className="text-gray-400 mr-2" size={18} />
              <input
                type={showPasswords.confirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm New Password"
                className="w-full bg-transparent outline-none text-sm pr-8"
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute right-3 text-gray-400 hover:text-gray-600"
                onClick={() => togglePasswordVisibility('confirmPassword')}
              >
                {showPasswords.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#16423C] hover:bg-[#C4DAD2] text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/verify-otp', { state: { email } })}
            className="flex items-center gap-2 text-[#16423C] hover:text-[#C4DAD2] mx-auto"
          >
            <ArrowLeft size={16} />
            Back to OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;