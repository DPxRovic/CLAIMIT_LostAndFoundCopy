import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import RegFormStudent from './RegFormStudent.jsx';
import RegFormFaculty from './RegFormFaculty.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import DatabaseSchemaNotice from '../shared/DatabaseSchemaNotice.jsx';

/**
 * Login component for ClaimIt
 * 
 * Supports both controlled navigation (via props) and self-contained standalone navigation.
 * Integrated with real Supabase Auth via useAuth().
 * 
 * @param {Object} props
 * @param {() => void} [props.onForgotPassword] Handler to navigate to Forgot Password view
 * @param {() => void} [props.onRegister] Handler to navigate to Register view
 * @param {(user: any) => void} [props.onLoginSuccess] Handler when login form succeeds
 */
export default function Login({ onForgotPassword, onRegister, onLoginSuccess }) {
  const { login, isConfigured, setDevPreviewRole, error: contextError, schemaMissing } = useAuth();

  // Internal view state for standalone usage when props are not provided
  const [internalView, setInternalView] = useState('login'); // 'login' | 'register-student' | 'register-faculty' | 'forgot-password'
  
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameOrEmailRef = useRef(null);
  const passwordRef = useRef(null);

  // Sync context error if present
  useEffect(() => {
    if (contextError) {
      setLoginError(contextError);
    }
  }, [contextError]);

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    const errors = {};

    // 1. Validate Identifier
    const trimmedIdentifier = usernameOrEmail.trim();
    if (!trimmedIdentifier) {
      errors.usernameOrEmail = 'Please enter your username or email.';
    } else if (trimmedIdentifier.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
      errors.usernameOrEmail = 'Enter a valid email address, such as name@example.com.';
    }

    // 2. Validate Password
    if (!password) {
      errors.password = 'Please enter your password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.usernameOrEmail && usernameOrEmailRef.current) {
        usernameOrEmailRef.current.focus();
      } else if (errors.password && passwordRef.current) {
        passwordRef.current.focus();
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await login(trimmedIdentifier, password);
      setIsSubmitting(false);

      if (!result.success) {
        setLoginError(result.error || 'Authentication failed. Please verify your credentials.');
        if (result.error && (result.error.toLowerCase().includes('password') || result.error.toLowerCase().includes('credentials'))) {
          if (passwordRef.current) passwordRef.current.focus();
        } else if (usernameOrEmailRef.current) {
          usernameOrEmailRef.current.focus();
        }
        return;
      }

      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setIsSubmitting(false);
      setLoginError(err?.message || "We couldn't connect to the server. Check your connection and try again.");
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      setInternalView('forgot-password');
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (onRegister) {
      onRegister();
    } else {
      setInternalView('register-student');
    }
  };

  // If running standalone and switched to register student view
  if (internalView === 'register-student') {
    return (
      <RegFormStudent
        onLogin={() => setInternalView('login')}
        onSwitchToFaculty={() => setInternalView('register-faculty')}
      />
    );
  }

  // If switched to register faculty view
  if (internalView === 'register-faculty') {
    return (
      <RegFormFaculty
        onLogin={() => setInternalView('login')}
        onSwitchToStudent={() => setInternalView('register-student')}
      />
    );
  }

  // If switched to forgot password view
  if (internalView === 'forgot-password') {
    return (
      <ForgotPassword
        onBackToLogin={() => setInternalView('login')}
        onProceedToCode={() => {
          setSubmittedMessage('Verification code dispatched. Please check your email.');
          setInternalView('login');
          setTimeout(() => setSubmittedMessage(null), 5000);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#23261F] flex flex-col justify-between select-none font-['Inter',ui-sans-serif,system-ui,sans-serif] w-full">
      {schemaMissing && <DatabaseSchemaNotice projectId="fqehjgpksojjwdjkzjdh" />}

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full">
        {/* Toast Notification */}
        {submittedMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#23261F] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-white/10 transition-all">
            <svg className="w-4 h-4 text-[#5170ff] shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{submittedMessage}</span>
            <button
              type="button"
              onClick={() => setSubmittedMessage(null)}
              className="ml-2 text-white/60 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Login Card Container */}
        <main className="w-full max-w-[480px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] p-8 sm:p-10">
        {/* Header Content with System Logo */}
        <div className="flex flex-col items-center text-center">
          {/* System Logo */}
          <div className="mb-5 flex items-center justify-center">
            {!imageError ? (
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCofUCFiKIJMG8R1lT7DHnPy95BWe5T72_xknGoZPASqWXk5OZAKkzJjhNR87Tg18UEpi3tZLXYfq3PvwBd3e0tO8yaPlENvLY2eUzdaYmTHiSJVYRfhTmHmZZ5n5-rjx8hOCDEm3xQRjGzHP2lO1KxPqRwblHdmX-AB7XWFry6apXTfUqntk-eG4P2Z3kH4seu_U1zRgswQYWWtFT27IrMkYdJyQ7jD4XfabK76w1K4CiPn_tohZvxZD-lonTMkBhv1MQ"
                alt="ClaimIt Logo"
                className="h-14 w-auto object-contain max-w-[240px]"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center text-[34px] font-extrabold tracking-tight select-none">
                <span className="relative flex items-center justify-center mr-0.5">
                  <svg className="w-8 h-8 text-[#23261F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3" />
                  </svg>
                </span>
                <span className="text-[#23261F] -ml-5 pl-5">laim</span>
                <span className="text-[#5170ff]">it</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#23261F]">
            Log in
          </h1>

          <p className="mt-2 text-base text-[#6E6858] leading-relaxed max-w-[340px]">
            Log in to report, browse, and manage your claims.
          </p>
        </div>

        {/* Informative Config Banner (If Supabase not yet configured) */}
        {!isConfigured && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs leading-relaxed">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Supabase Not Yet Configured</span>
            </div>
            <p>
              Set <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">VITE_SUPABASE_URL</code> and{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">VITE_SUPABASE_ANON_KEY</code> in your environment for live database authentication.
            </p>
            <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center gap-2">
              <span className="text-[11px] font-medium text-amber-900">UI Dev Preview:</span>
              <button
                type="button"
                onClick={() => setDevPreviewRole('Student')}
                className="text-xs text-[#5170ff] hover:underline font-semibold cursor-pointer"
              >
                Preview Student
              </button>
              <span className="text-amber-400">•</span>
              <button
                type="button"
                onClick={() => setDevPreviewRole('Admin')}
                className="text-xs text-[#5170ff] hover:underline font-semibold cursor-pointer"
              >
                Preview Admin
              </button>
            </div>
          </div>
        )}

        {/* Contextual Login Error Alert */}
        {loginError && !loginError.includes('schema cache') && !loginError.includes('Could not find the table') && (
          <div role="alert" className="mt-4 p-3 rounded-lg bg-[#fff5f5] border border-[#ba1a1a]/20 text-[#ba1a1a] text-xs sm:text-sm font-medium flex items-start gap-2 animate-in fade-in duration-150">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#ba1a1a]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-xs sm:text-sm">Authentication failed</p>
              <p className="text-xs text-[#ba1a1a]/90 mt-0.5">{loginError}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          {/* Username or Email Field */}
          <div>
            <label
              htmlFor="username_or_email"
              className="block text-[15px] font-semibold text-[#23261F] mb-1.5"
            >
              Username or Email
            </label>
            <div className="relative">
              <input
                ref={usernameOrEmailRef}
                type="text"
                id="username_or_email"
                name="username_or_email"
                value={usernameOrEmail}
                onChange={(e) => handleFieldChange('usernameOrEmail', e.target.value, setUsernameOrEmail)}
                placeholder="Enter your username or email"
                aria-invalid={Boolean(fieldErrors.usernameOrEmail)}
                aria-describedby={fieldErrors.usernameOrEmail ? 'username-error' : undefined}
                className={`w-full h-12 px-4 text-base bg-white border text-[#23261F] placeholder-[#6E6858]/70 focus:outline-none transition-colors rounded-lg ${
                  fieldErrors.usernameOrEmail
                    ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
            </div>
            {fieldErrors.usernameOrEmail && (
              <p id="username-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{fieldErrors.usernameOrEmail}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-[15px] font-semibold text-[#23261F] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
                placeholder="Enter your password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={`w-full h-12 pl-4 pr-12 text-base bg-white border text-[#23261F] placeholder-[#6E6858]/70 focus:outline-none transition-colors rounded-lg ${
                  fieldErrors.password
                    ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
              <button
                type="button"
                id="togglePassword"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6E6858] hover:text-[#23261F] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{fieldErrors.password}</span>
              </p>
            )}

            {/* Forgot Password Link */}
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm font-medium text-[#5170ff] hover:text-[#4767f6] hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                Forgot Password
              </button>
            </div>
          </div>

          {/* Log in Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 px-5 bg-[#5170ff] hover:bg-[#4767f6] text-white font-medium text-base shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center active:scale-[0.99] rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Logging in...</span>
                </div>
              ) : (
                <span>Log in</span>
              )}
            </button>
          </div>

          {/* Register Link */}
          <div className="pt-2 text-center">
            <span className="text-base text-[#6E6858]">Don't have an account? </span>
            <button
              type="button"
              onClick={handleRegisterClick}
              className="text-base font-semibold text-[#5170ff] hover:text-[#4767f6] hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0 inline"
            >
              Register
            </button>
          </div>
        </form>
      </main>
      </div>
    </div>
  );
}

export { Login };