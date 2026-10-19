import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * RegFormStudent component for ClaimIt
 * 
 * Implements real Supabase Auth registration with direct, obvious field-level validation,
 * accessibility compliance, and truthful outcome states.
 * 
 * @param {Object} props
 * @param {() => void} [props.onLogin] - Callback to return to the Login screen
 * @param {() => void} [props.onSwitchToFaculty] - Callback to switch to Faculty registration form
 * @param {(result: any) => void} [props.onSubmit] - Callback when form is successfully submitted
 */
export default function RegFormStudent({ onLogin, onSwitchToFaculty, onSubmit }) {
  const { register } = useAuth();

  const [role, setRole] = useState('student'); // 'student' | 'faculty'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  // Student role fields
  const [studentId, setStudentId] = useState('');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [section, setSection] = useState('');

  // Passwords
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field validation and state tracking
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [registrationOutcome, setRegistrationOutcome] = useState(null);

  // Input refs for automatic focusing on first invalid field
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const studentIdRef = useRef(null);
  const programRef = useRef(null);
  const yearLevelRef = useRef(null);
  const sectionRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const fieldRefMap = {
    fullName: fullNameRef,
    email: emailRef,
    studentId: studentIdRef,
    program: programRef,
    yearLevel: yearLevelRef,
    section: sectionRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  };

  const handleFieldChange = (field, value, setter) => {
    setter(value);
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errors = {};

    // 1. Validate Full Name
    if (!fullName.trim()) {
      errors.fullName = 'Please enter your full name.';
    }

    // 2. Validate Email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address, such as name@example.com.';
    }

    // 3. Validate Student Specific Fields
    if (!studentId.trim()) {
      errors.studentId = 'Please enter your School ID Number.';
    }

    if (!program) {
      errors.program = 'Please select your program.';
    }

    if (!yearLevel) {
      errors.yearLevel = 'Please select your year level.';
    }

    if (!section.trim()) {
      errors.section = 'Please enter your section.';
    }

    // 4. Validate Passwords
    if (!password) {
      errors.password = 'Please enter a password.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // If validation fails, set errors and focus first invalid field
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstInvalidField = Object.keys(errors)[0];
      const targetRef = fieldRefMap[firstInvalidField];
      if (targetRef && targetRef.current) {
        targetRef.current.focus();
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const result = await register({
        fullName,
        email,
        password,
        role: 'student',
        studentId,
        program,
        yearLevel,
        section,
      });

      if (!result.success) {
        setServerError(result.error || 'Registration failed. Please check your information and try again.');
        if (result.error && result.error.toLowerCase().includes('email')) {
          setFieldErrors((prev) => ({ ...prev, email: result.error }));
          if (emailRef.current) emailRef.current.focus();
        } else if (result.error && result.error.toLowerCase().includes('password')) {
          setFieldErrors((prev) => ({ ...prev, password: result.error }));
          if (passwordRef.current) passwordRef.current.focus();
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSubmitting(false);
      setRegistrationOutcome(result);
      if (onSubmit) {
        onSubmit(result);
      }
    } catch (err) {
      setIsSubmitting(false);
      setServerError(err?.message || "We couldn't connect to the server. Check your connection and try again.");
    }
  };

  // If registration succeeded, show truthful outcome state
  if (registrationOutcome) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 text-[#23261F] antialiased bg-[#f8f9ff] font-['Inter',ui-sans-serif,system-ui,sans-serif] select-none">
        <main className="w-full max-w-[520px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] p-8 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-[#5170ff]/10 text-[#5170ff] flex items-center justify-center mx-auto">
            {registrationOutcome.requiresEmailVerification ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">
              {registrationOutcome.requiresEmailVerification ? 'Verify Your Email Address' : 'Account Created Successfully!'}
            </h1>
            <p className="mt-2 text-sm text-[#6E6858] leading-relaxed max-w-sm mx-auto">
              {registrationOutcome.requiresEmailVerification
                ? 'Your account was created. Check your email to verify your address before signing in.'
                : 'Your student account has been created and activated. You can now log in to access ClaimIt.'}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onLogin}
              className="w-full py-2.5 px-4 bg-[#5170ff] hover:bg-[#4767f6] active:bg-[#2b47dc] text-white font-semibold text-sm rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Proceed to Log in
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 text-[#23261F] antialiased bg-[#f8f9ff] font-['Inter',ui-sans-serif,system-ui,sans-serif] select-none">
      {/* Main Register Card Container */}
      <main className="w-full max-w-[570px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] px-7 py-6 sm:px-8 sm:py-7 relative transition-all">
        {/* Brand Header */}
        <header className="flex flex-col items-center text-center">
          <div className="h-9 flex items-center justify-center mb-1">
            {!imageError ? (
              <img
                alt="ClaimIt Logo"
                className="h-9 w-auto object-contain select-none"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0EZqgzhpJ5wYcWOX-OaFu2K5Z4jyyXW5aBWirli2EGKPQ5RH0NIPS81h3tn9WGW-IK-mvtvVidWSotmcILVjQPQymp-sz_LaAyANPUjRSOzBFNDdUfop6G-wRSfZS0uLBjMyUfzb9hjqi0vZrY4l_ONosDa0-gbOSP4GOILrjrgsYGVgNKojqSOW3OkAAxx5Ul09PHm0r96uWtIJLK-8_mHmKJu-OT6GY6uzV5fx_HWhP8QdNEplzZg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex items-center text-[28px] font-extrabold tracking-tight select-none">
                <span className="relative flex items-center justify-center mr-0.5">
                  <svg className="w-7 h-7 text-[#23261F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3" />
                  </svg>
                </span>
                <span className="text-[#23261F] -ml-4 pl-4">laim</span>
                <span className="text-[#5170ff]">it</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight mt-2 mb-1">
            Create an Account
          </h1>
          <p className="text-xs text-[#6E6858] max-w-sm">
            Join ClaimIt to report, track, and recover items across campus.
          </p>
        </header>

        {/* Global / Server Error Notice */}
        {serverError && (
          <div role="alert" className="mt-4 p-3 rounded-lg bg-[#fff5f5] border border-[#ba1a1a]/20 text-[#ba1a1a] text-xs font-semibold flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#ba1a1a]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {/* Register Form */}
        <form autoComplete="off" className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
          {/* Row 1: Full Name & UCC Email (2-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="fullname">
                Full Name
              </label>
              <input
                ref={fullNameRef}
                id="fullname"
                name="fullname"
                type="text"
                value={fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value, setFullName)}
                placeholder="e.g. Maria Santos"
                required
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? 'fullname-error' : undefined}
                className={`w-full text-xs sm:text-sm px-3 py-2 rounded-lg border bg-white text-[#23261F] placeholder-[#6E6858]/70 transition-colors outline-none ${
                  fieldErrors.fullName
                    ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
              {fieldErrors.fullName && (
                <p id="fullname-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.fullName}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="email">
                UCC Email
              </label>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => handleFieldChange('email', e.target.value, setEmail)}
                placeholder="username@ucc.edu.ph"
                required
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={`w-full text-xs sm:text-sm px-3 py-2 rounded-lg border bg-white text-[#23261F] placeholder-[#6E6858]/70 transition-colors outline-none ${
                  fieldErrors.email
                    ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
              {fieldErrors.email && (
                <p id="email-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Role Switcher (Student / Faculty) */}
          <div>
            <span className="block text-xs font-semibold text-[#23261F] mb-1">I am a</span>
            <div aria-label="Account Role Selection" className="grid grid-cols-2 p-1 bg-[#eff4ff] rounded-lg border border-[#E8E4D8]" role="tablist">
              {/* Student Role Button */}
              <button
                type="button"
                role="tab"
                aria-selected={role === 'student'}
                onClick={() => setRole('student')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  role === 'student'
                    ? 'bg-white text-[#5170ff] shadow-xs'
                    : 'text-[#6E6858] hover:text-[#23261F]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
                  />
                </svg>
                <span>Student</span>
              </button>

              {/* Faculty Role Button */}
              <button
                type="button"
                role="tab"
                aria-selected={role === 'faculty'}
                onClick={() => {
                  if (onSwitchToFaculty) {
                    onSwitchToFaculty();
                  } else {
                    setRole('faculty');
                  }
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  role === 'faculty'
                    ? 'bg-white text-[#5170ff] shadow-xs'
                    : 'text-[#6E6858] hover:text-[#23261F]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
                  />
                </svg>
                <span>Faculty</span>
              </button>
            </div>
          </div>

          {/* Student Specific Fields */}
          <div className="space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="student-id">
                  School ID Number
                </label>
                <input
                  ref={studentIdRef}
                  id="student-id"
                  name="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => handleFieldChange('studentId', e.target.value, setStudentId)}
                  placeholder="e.g. 2022-01452-MN-0"
                  aria-invalid={Boolean(fieldErrors.studentId)}
                  aria-describedby={fieldErrors.studentId ? 'student-id-error' : undefined}
                  className={`w-full text-xs sm:text-sm px-3 py-2 rounded-lg border bg-white text-[#23261F] placeholder-[#6E6858]/70 transition-colors outline-none ${
                    fieldErrors.studentId
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                />
                {fieldErrors.studentId && (
                  <p id="student-id-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{fieldErrors.studentId}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="student-program">
                  Program
                </label>
                <select
                  ref={programRef}
                  id="student-program"
                  name="program"
                  value={program}
                  onChange={(e) => handleFieldChange('program', e.target.value, setProgram)}
                  aria-invalid={Boolean(fieldErrors.program)}
                  aria-describedby={fieldErrors.program ? 'student-program-error' : undefined}
                  className={`w-full text-xs sm:text-sm px-3 py-2 rounded-lg border bg-white text-[#23261F] transition-colors outline-none cursor-pointer ${
                    fieldErrors.program
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                >
                  <option value="" disabled>Select Program</option>
                  <option value="BSCS">BS Computer Science</option>
                  <option value="BSIT">BS Information Technology</option>
                  <option value="BSBA">BS Business Administration</option>
                  <option value="BSED">BS Secondary Education</option>
                  <option value="BSCrim">BS Criminology</option>
                </select>
                {fieldErrors.program && (
                  <p id="student-program-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{fieldErrors.program}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="student-year">
                  Year Level
                </label>
                <select
                  ref={yearLevelRef}
                  id="student-year"
                  name="yearLevel"
                  value={yearLevel}
                  onChange={(e) => handleFieldChange('yearLevel', e.target.value, setYearLevel)}
                  aria-invalid={Boolean(fieldErrors.yearLevel)}
                  aria-describedby={fieldErrors.yearLevel ? 'student-year-error' : undefined}
                  className={`w-full text-xs sm:text-sm px-3 py-2 rounded-lg border bg-white text-[#23261F] transition-colors outline-none cursor-pointer ${
                    fieldErrors.yearLevel
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                >
                  <option value="" disabled>Select Year Level</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                {fieldErrors.yearLevel && (
                  <p id="student-year-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{fieldErrors.yearLevel}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="student-section">
                  Section
                </label>
                <input
                  ref={sectionRef}
                  id="student-section"
                  name="section"
                  type="text"
                  value={section}
                  onChange={(e) => handleFieldChange('section', e.target.value, setSection)}
                  placeholder="e.g. BSCS 3-A"
                  aria-invalid={Boolean(fieldErrors.section)}
                  aria-describedby={fieldErrors.section ? 'student-section-error' : undefined}
                  className={`w-full text-xs sm:text-sm px-3 py-2 rounded-lg border bg-white text-[#23261F] placeholder-[#6E6858]/70 transition-colors outline-none ${
                    fieldErrors.section
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                />
                {fieldErrors.section && (
                  <p id="student-section-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{fieldErrors.section}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Passwords (2-Column Grid with Toggle Visibility) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div>
              <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value, setPassword)}
                  placeholder="Enter password (min 8 characters)"
                  required
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  className={`w-full text-xs sm:text-sm pl-3 pr-9 py-2 rounded-lg border bg-white text-[#23261F] placeholder-[#6E6858]/70 transition-colors outline-none ${
                    fieldErrors.password
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#6E6858] hover:text-[#23261F] focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#23261F] mb-1" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  ref={confirmPasswordRef}
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value, setConfirmPassword)}
                  placeholder="Re-enter password"
                  required
                  aria-invalid={Boolean(fieldErrors.confirmPassword)}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                  className={`w-full text-xs sm:text-sm pl-3 pr-9 py-2 rounded-lg border bg-white text-[#23261F] placeholder-[#6E6858]/70 transition-colors outline-none ${
                    fieldErrors.confirmPassword
                      ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                      : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                  }`}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#6E6858] hover:text-[#23261F] focus:outline-none cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>
          </div>

          {/* Action Button: Register */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#5170ff] hover:bg-[#4767f6] active:bg-[#2b47dc] text-white font-semibold text-sm rounded-lg shadow-sm shadow-[#5170ff]/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>

          {/* Footer Alternate Action Link */}
          <div className="pt-2 text-center text-xs text-[#6E6858]">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onLogin}
              className="text-[#5170ff] font-semibold hover:underline hover:text-[#4767f6] transition-colors ml-1 cursor-pointer"
            >
              Log in
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export { RegFormStudent };