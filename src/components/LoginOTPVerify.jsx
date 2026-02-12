import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ArrowLeft, Shield } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { loginSuccess } from '../store/auth/authSlice';
import swcLogo from "../assets/WIZNOVY.png";
import { toast } from 'react-toastify';

const LoginOTPVerify = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const inputRefs = useRef([]);
  
  const email = location.state?.email || localStorage.getItem('tempEmail') || '';

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => {
          if (prev === 1) {
            setCanResend(true);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1 || !/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setMessage('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    try {
      const tempLoginId = localStorage.getItem('tempLoginId');
      const tempPassword = localStorage.getItem('tempPassword');
      
      if (tempLoginId && tempPassword) {
        const params = new URLSearchParams();
        params.append('loginId', tempLoginId);
        params.append('password', tempPassword);

        await axios.post('/auth/admin/login', params, {
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        
        setMessage('New OTP has been sent to your email.');
        setCanResend(false);
        setCountdown(120);
      }
    } catch (error) {
      setMessage('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOtpComplete) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/admin/verify-login`, {
        email,
        otp: otp.join('')
      });

      // Use response data from OTP verification
      const { token, email: verifiedEmail, role } = response.data;
      const tempUser = JSON.parse(localStorage.getItem('tempUser') || '{}');
      const authUser = { ...tempUser, token, email: verifiedEmail, role };

      // Store verified data
      localStorage.setItem('user', JSON.stringify(authUser));
      localStorage.setItem('token', token);
      localStorage.setItem('email', verifiedEmail);
      localStorage.setItem('role', role);

      // Clear temp data
      localStorage.removeItem('tempUser');
      localStorage.removeItem('tempToken');
      localStorage.removeItem('tempEmail');
      localStorage.removeItem('tempRole');
      localStorage.removeItem('tempLoginId');
      localStorage.removeItem('tempPassword');

      // Set auth header and dispatch login success
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      dispatch(loginSuccess({ user: authUser }));

      toast.success('Login successful! Welcome to the admin dashboard.');
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Invalid OTP. Please try again.');
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
          <h2 className="text-3xl font-bold text-[#16423C]">Verify Login OTP</h2>
          <p className="text-gray-500 mt-2">Enter the 6-digit code sent to</p>
          <p className="text-[#16423C] font-medium">{email}</p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="1"
                className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:border-[#16423C] focus:outline-none"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            className="w-full bg-[#16423C] hover:bg-[#C4DAD2] text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !isOtpComplete}
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
          {canResend ? (
            <button
              onClick={handleResendOtp}
              className="text-[#16423C] hover:text-[#C4DAD2] underline disabled:opacity-50 mb-4"
              disabled={resendLoading}
            >
              {resendLoading ? 'Sending...' : 'Resend OTP'}
            </button>
          ) : (
            <p className="text-gray-500 text-sm mb-4">
              Resend OTP in <span className="font-semibold text-[#16423C]">{countdown}</span> seconds
            </p>
          )}
        </div>

        <div className="mt-4 text-center">
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

export default LoginOTPVerify;