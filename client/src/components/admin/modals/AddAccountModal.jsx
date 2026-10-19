import React, { useState, useEffect, useRef } from 'react';

/**
 * AddAccountModal (admin side)
 *
 * Same look as the user-side registration form (RegFormStudent / RegFormFaculty),
 * shown as a popup with admin wording. The user-side files are NOT imported or
 * changed, so there are no merge conflicts with them.
 *
 * PROPS:
 * - isOpen (boolean)
 * - onClose ()
 * - onSubmit (payload)
 *     payload = { type: 'student' | 'faculty', name, email, password,
 *                 schoolId, program, yearLevel, section        // student
 *                 facultyId, department }                      // faculty
 * - defaultType = 'student'
 */

const LOGO_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA0EZqgzhpJ5wYcWOX-OaFu2K5Z4jyyXW5aBWirli2EGKPQ5RH0NIPS81h3tn9WGW-IK-mvtvVidWSotmcILVjQPQymp-sz_LaAyANPUjRSOzBFNDdUfop6G-wRSfZS0uLBjMyUfzb9hjqi0vZrY4l_ONosDa0-gbOSP4GOILrjrgsYGVgNKojqSOW3OkAAxx5Ul09PHm0r96uWtIJLK-8_mHmKJu-OT6GY6uzV5fx_HWhP8QdNEplzZg';

// Same options as the registration form (full names are saved, so the tables show them as-is)
const PROGRAMS = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Business Administration',
  'BS Secondary Education',
  'BS Criminology',
];

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const DEPARTMENTS = [
  'College of Computer Studies',
  'College of Business & Accountancy',
  'College of Education',
  'College of Arts and Sciences',
  'College of Engineering',
];

// Same input style as the registration form
const inputClass =
  'w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-[#E8E4D8] bg-white text-[#1e2330] placeholder-[#94a3b8] transition-colors focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 outline-none';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'block text-xs font-semibold text-[#1e2330] mb-1';

function EyeIcon({ open }) {
  return open ? (
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
  );
}

export function AddAccountModal({ isOpen, onClose, onSubmit, defaultType = 'student' }) {
  const [role, setRole] = useState(defaultType);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Student fields
  const [studentId, setStudentId] = useState('');
  const [program, setProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [section, setSection] = useState('');

  // Faculty fields
  const [facultyId, setFacultyId] = useState('');
  const [department, setDepartment] = useState('');

  // Passwords
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [imageError, setImageError] = useState(false);

  const firstInputRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Reset the form every time it opens
  useEffect(() => {
    if (!isOpen) return undefined;
    setRole(defaultType);
    setFullName('');
    setEmail('');
    setStudentId('');
    setProgram('');
    setYearLevel('');
    setSection('');
    setFacultyId('');
    setDepartment('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage('');
    const timer = setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen, defaultType]);

  // Esc closes, and the page behind doesn't scroll while open
  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fullName.trim()) return setErrorMessage('Please enter the full name.');
    if (!email.trim() || !email.includes('@')) return setErrorMessage('Please enter a valid email address.');
    if (role === 'student' && !studentId.trim()) return setErrorMessage('Please enter the School ID Number.');
    if (role === 'faculty' && !facultyId.trim()) return setErrorMessage('Please enter the Faculty/Employee ID.');
    if (password.length < 8) return setErrorMessage('Password must be at least 8 characters long.');
    if (password !== confirmPassword) return setErrorMessage('Passwords do not match. Please verify.');

    setErrorMessage('');
    onSubmit?.({
      type: role,
      name: fullName.trim(),
      email: email.trim(),
      password,
      ...(role === 'student'
        ? { schoolId: studentId.trim(), program, yearLevel, section: section.trim() }
        : { facultyId: facultyId.trim(), department }),
    });
    onCloseRef.current?.();
  };

  if (!isOpen) return null;

  const roleButtonClass = (active) =>
    `flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
      active ? 'bg-white text-[#5170ff] shadow-xs' : 'text-[#64748b] hover:text-[#1e2330]'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] overflow-y-auto"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-account-title"
        className="relative w-full max-w-[570px] my-auto max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-[#E8E4D8] shadow-2xl px-7 py-6 sm:px-8 sm:py-7 text-[#1e2330] antialiased"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1 rounded-lg text-[#64748b] hover:text-[#1e2330] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header (same as registration) */}
        <header className="flex flex-col items-center text-center">
          <div className="h-9 flex items-center justify-center mb-1">
            {!imageError ? (
              <img
                alt="ClaimIt Logo"
                className="h-9 w-auto object-contain select-none"
                src={LOGO_SRC}
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
          <h2 id="add-account-title" className="text-2xl font-bold text-[#1e2330] tracking-tight mt-2 mb-1">
            Add Account
          </h2>
          <p className="text-xs text-[#64748b] max-w-sm">Create a student or faculty account on ClaimIt.</p>
        </header>

        <form autoComplete="off" className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="add-fullname">Full Name</label>
              <input
                ref={firstInputRef}
                id="add-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Maria Santos"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="add-email">UCC Email</label>
              <input
                id="add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@ucc.edu.ph"
                className={inputClass}
              />
            </div>
          </div>

          {/* Student / Faculty switch */}
          <div>
            <span className={labelClass}>Account type</span>
            <div aria-label="Account type" className="grid grid-cols-2 p-1 bg-[#eff4ff] rounded-lg border border-[#e0e8fd]" role="tablist">
              <button type="button" role="tab" aria-selected={role === 'student'} onClick={() => setRole('student')} className={roleButtonClass(role === 'student')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
                  />
                </svg>
                <span>Student</span>
              </button>
              <button type="button" role="tab" aria-selected={role === 'faculty'} onClick={() => setRole('faculty')} className={roleButtonClass(role === 'faculty')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
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

          {/* Role fields */}
          {role === 'student' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="add-student-id">School ID Number</label>
                  <input id="add-student-id" type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. 2022-01452-MN-0" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="add-program">Program</label>
                  <select id="add-program" value={program} onChange={(e) => setProgram(e.target.value)} className={selectClass}>
                    <option value="" disabled>Select Program</option>
                    {PROGRAMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="add-year">Year Level</label>
                  <select id="add-year" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className={selectClass}>
                    <option value="" disabled>Select Year Level</option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="add-section">Section</label>
                  <input id="add-section" type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. BSCS 3-A" className={inputClass} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="add-faculty-id">Faculty/Employee ID</label>
                <input id="add-faculty-id" type="text" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="e.g. FAC-2019-0412" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="add-department">Department</label>
                <select id="add-department" value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass}>
                  <option value="" disabled>Select Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div>
              <label className={labelClass} htmlFor="add-password">Password</label>
              <div className="relative">
                <input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`${inputClass} pr-9`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#64748b] hover:text-[#1e2330] focus:outline-none cursor-pointer"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="add-confirm-password">Confirm Password</label>
              <div className="relative">
                <input
                  id="add-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`${inputClass} pr-9`}
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#64748b] hover:text-[#1e2330] focus:outline-none cursor-pointer"
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              </div>
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-[#ba1a1a] text-xs font-semibold pt-1" role="alert">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit (same as registration) */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#5170ff] hover:bg-[#3d5cf5] active:bg-[#2b47dc] text-white font-semibold text-sm rounded-lg shadow-sm shadow-[#5170ff]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAccountModal;