import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import swcLogo from "../assets/WIZNOVY.png";
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email) => {
    // Only allow letters, numbers, dots, and @
    const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.]+\.[a-zA-Z]+$/;
    return emailRegex.test(email);
  };

  const isValidEmail = email.trim() && validateEmail(email);

  const handleEmailChange = (e) => {
    // Filter input to only allow letters, numbers, dots, and @
    const filteredValue = e.target.value.replace(/[^a-zA-Z0-9.@]/g, '');
    setEmail(filteredValue);
    setEmailError('');
    setMessage('');
    
    if (filteredValue.trim() && !validateEmail(filteredValue)) {
      setEmailError('Please enter a valid email address (only letters, numbers, dots, and @ allowed)');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgotPass`, {
        email,
        role: 'ADMIN'
      });

      toast.success('Password reset link sent successfully to your email!');
      navigate('/verify-otp', { state: { email } });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send reset email. Please try again.');
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
          <h2 className="text-3xl font-bold text-[#16423C]">Forgot Password</h2>
          <p className="text-gray-500 mt-2">Enter your email to reset password</p>
        </div>

        {(message || emailError) && (
          <div className={`mb-4 p-3 rounded text-sm relative ${
            message && message.includes('sent') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <button
              onClick={() => {
                setMessage('');
                setEmailError('');
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={16} />
            </button>
            <div className="pr-6">{message || emailError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 ring-[#C4DAD2]-400">
            <Mail className="text-gray-400 mr-2" size={18} />
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full bg-transparent outline-none text-sm"
              value={email}
              onChange={handleEmailChange}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#16423C] hover:bg-[#C4DAD2] text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !isValidEmail}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-[#16423C] hover:text-[#C4DAD2] mx-auto"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;