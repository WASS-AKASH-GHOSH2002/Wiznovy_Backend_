import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../store/auth/authThunks';
import { Lock, User, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import swcLogo from "../assets/WIZNOVY.png";
import TextCaptcha from './TextCaptcha';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    loginId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(location.state?.from?.pathname || '/');
    }
    
    const params = new URLSearchParams(location.search);
    if (params.get('logout') === 'true') {
      setShowLogoutSuccess(true);
      navigate(location.pathname, { replace: true });
    }
    
    if (location.state?.message) {
      setLocalError('');
      // Show success message for password reset
    }
  }, [isAuthenticated, location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!credentials.loginId.trim() || !credentials.password.trim()) {
      setLocalError('Please enter both email ID and password');
      return;
    }

    // Email validation - only allow letters, numbers, dots, and @
    const emailRegex = /^[a-zA-Z0-9.]+@[a-zA-Z0-9.]+\.[a-zA-Z]+$/;
    if (!emailRegex.test(credentials.loginId)) {
      setLocalError('Please enter a valid email address (only letters, numbers, dots, and @ allowed)');
      return;
    }

    if (!isCaptchaValid) {
      setLocalError('Please complete the captcha correctly');
      return;
    }

    const result = await dispatch(loginUser(credentials));
    
    if (result?.success) {
      // Check if email is provided in response (indicates valid admin)
      if (result.email) {
        toast.success('OTP sent to your email. Please verify to continue.');
        navigate('/login-otp-verify', { state: { email: result.email } });
      } else {
        setLocalError('Invalid admin credentials. Please check your email and password.');
      }
    } else {
      // Handle specific error cases
      if (result?.error?.includes('unauthorized') || result?.error?.includes('Invalid')) {
        setLocalError('Invalid admin credentials. This email is not authorized for admin access.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For email field, only allow letters, numbers, dots, and @
    if (name === 'loginId') {
      const filteredValue = value.replace(/[^a-zA-Z0-9.@]/g, '');
      setCredentials({
        ...credentials,
        [name]: filteredValue
      });
    } else {
      setCredentials({
        ...credentials,
        [name]: value
      });
    }
  };

  const closeLogoutSuccess = () => {
    setShowLogoutSuccess(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#C4DAD2] relative">
      {showLogoutSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center w-full max-w-sm">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold mb-2 text-gray-800">Logged Out Successfully!</h3>
            <p className="text-gray-600 mb-6">You have been securely logged out of the system.</p>
            <button
              onClick={closeLogoutSuccess}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img 
            src={swcLogo} 
            alt="SWC Logo" 
            className="w-36 h-36 mx-auto mt-4 mb-2 rounded-full object-cover"
          />

          <h2 className="text-3xl font-bold text-[#16423C]">Admin Dashboard</h2>
          <p className="text-gray-500 mt-2">Sign in to your administrator account</p>
        </div>

        {location.state?.message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">
            {location.state.message}
          </div>
        )}
        
        {(localError || error) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
              <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 ring-[#C4DAD2]-400">
                <User className="text-gray-400 mr-2" size={18} />
                <input
                  type="email"
                  name="loginId"
                  placeholder="Enter your email address"
                  className="w-full bg-transparent outline-none text-sm"
                  value={credentials.loginId}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 focus-within:ring-2 ring-[#C4DAD2]-400 relative">
                <Lock className="text-gray-400 mr-2" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  className="w-full bg-transparent outline-none text-sm pr-8"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Captcha</label>
              <TextCaptcha onCaptchaChange={setIsCaptchaValid} />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-[#16423C] hover:bg-[#C4DAD2] text-white font-semibold py-2 rounded-lg transition disabled:opacity-70 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="ml-2">Logging in...</span>
                </div>
              ) : 'Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <button 
            type="button"
            className="text-[#16423C] hover:text-[#C4DAD2] underline mb-2"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot Password?
          </button>
          <p>For security reasons, please log out when finished</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;