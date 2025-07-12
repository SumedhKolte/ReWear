import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaFacebook, FaLeaf, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdRecycling } from "react-icons/md";

const Input = ({ label, error, ...props }) => (
  <div className="mb-4">
    <label className="block text-slate-700 font-semibold mb-1">{label}</label>
    <input
      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition ${
        error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
      }`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const PasswordInput = ({ label, error, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="mb-4">
      <label className="block text-slate-700 font-semibold mb-1">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition ${
            error ? 'border-red-300 focus:ring-red-500' : 'border-slate-300'
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const SocialButton = ({ icon, children, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center w-full py-2 mb-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition ${color}`}
  >
    {icon}
    <span className="ml-2 font-medium">{children}</span>
  </button>
);

const LoginSignupPage = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    displayName: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Enhanced validation function
  const validateForm = () => {
    const newErrors = {};

    if (isRegister) {
      // Display Name validation
      if (!form.displayName.trim()) {
        newErrors.displayName = "Display name is required";
      } else if (form.displayName.trim().length < 2) {
        newErrors.displayName = "Display name must be at least 2 characters";
      } else if (form.displayName.trim().length > 50) {
        newErrors.displayName = "Display name must be less than 50 characters";
      } else if (!/^[a-zA-Z\s'-]+$/.test(form.displayName.trim())) {
        newErrors.displayName = "Display name can only contain letters, spaces, hyphens, and apostrophes";
      }

      // Email validation for registration
      if (!form.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      // Confirm password validation
      if (!form.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (form.password !== form.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // Email validation for login (using username field)
    if (!isRegister) {
      if (!form.username.trim()) {
        newErrors.username = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) {
        newErrors.username = "Please enter a valid email address";
      }
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (isRegister && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");
    setLoading(true);

    // Client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegister ? '/api/auth/signup' : '/api/auth/login';
      const payload = isRegister 
        ? {
            email: form.email.trim().toLowerCase(),
            password: form.password,
            displayName: form.displayName.trim()
          }
        : {
            email: form.username.trim().toLowerCase(),
            password: form.password
          };

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (isRegister) {
          setSuccess("Registration successful! Please login with your credentials.");
          setIsRegister(false);
          setForm({
            username: payload.email, // Pre-fill email for login
            password: "",
            email: "",
            displayName: "",
            confirmPassword: "",
          });
        } else {
          // Login successful - store user data and token
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userData', JSON.stringify({
            email: payload.email,
            displayName: data.user?.displayName || payload.email.split('@')[0],
            userId: data.user?.userId
          }));
          
          setSuccess("Login successful! Welcome back!");
          
          // Redirect to home page using navigate
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        }
      } else {
        // Handle different error types from backend
        if (data.errors && Array.isArray(data.errors)) {
          const backendErrors = {};
          data.errors.forEach(error => {
            if (error.path) {
              backendErrors[error.path] = error.msg;
            }
          });
          setErrors(backendErrors);
        } else {
          setErrors({ general: data.error || 'An error occurred. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    alert(`${provider} login coming soon! We're working on integrating social authentication.`);
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setErrors({});
    setSuccess("");
    setForm({
      username: "",
      password: "",
      email: "",
      displayName: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-lime-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <MdRecycling className="text-emerald-600 text-5xl mb-2" />
          <h1 className="text-3xl font-bold text-slate-800 mb-1">ReWear</h1>
          <span className="text-emerald-600 font-medium">Sustainable Fashion</span>
        </div>
        
        <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
          {isRegister ? "Create your account" : "Welcome back! Login"}
        </h2>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {success}
          </div>
        )}

        {/* General Error Message */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <>
              <Input
                label="Display Name"
                name="displayName"
                type="text"
                placeholder="Your display name"
                value={form.displayName}
                onChange={handleChange}
                error={errors.displayName}
                disabled={loading}
                required
              />
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                disabled={loading}
                required
              />
            </>
          )}
          
          <Input
            label="Email"
            name="username"
            type="email"
            placeholder="Enter your email"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            disabled={loading}
            required
          />
          
          <PasswordInput
            label="Password"
            name="password"
            placeholder={isRegister ? "Password (min 6 characters, include A-Z, a-z, 0-9)" : "Password"}
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            disabled={loading}
            required
          />
          
          {isRegister && (
            <PasswordInput
              label="Confirm Password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              disabled={loading}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition mb-4 ${
              loading 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 transform hover:scale-105'
            }`}
          >
            {loading 
              ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isRegister ? 'Creating Account...' : 'Logging in...'}
                  </div>
                ) 
              : (isRegister ? 'Create Account' : 'Login')
            }
          </button>
        </form>

        <div className="flex items-center my-4">
          <hr className="flex-grow border-slate-200" />
          <span className="mx-2 text-slate-400 text-sm">or</span>
          <hr className="flex-grow border-slate-200" />
        </div>

        <SocialButton
          icon={<FaGoogle className="text-red-500" />}
          color="hover:border-red-300"
          onClick={() => handleSocialLogin('Google')}
        >
          Continue with Google
        </SocialButton>
        
        <SocialButton
          icon={<FaFacebook className="text-blue-600" />}
          color="hover:border-blue-300"
          onClick={() => handleSocialLogin('Facebook')}
        >
          Continue with Facebook
        </SocialButton>

        <div className="mt-6 text-center">
          <span className="text-slate-600 text-sm">
            {isRegister ? "Already have an account?" : "First time here?"}
          </span>
          <button
            className="ml-2 text-emerald-600 font-semibold hover:underline transition-colors"
            onClick={switchMode}
            disabled={loading}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center text-slate-500 text-xs gap-1">
          <FaLeaf className="text-lime-500" />
          <span>
            Join ReWear and help reduce fashion waste. Every login makes a difference!
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginSignupPage;
