import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * ForgotPassword component for ClaimIt
 * 
 * Initiates Supabase Auth password recovery flow with direct validation and clear feedback.
 * 
 * @param {Object} props
 * @param {string} [props.initialEmail] - Optional initial email to pre-fill
 * @param {() => void} [props.onBackToLogin] - Handler to navigate back to login screen
 * @param {(email: string, message?: string) => void} [props.onProceedToCode] - Handler when proceeding to enter verification code
 */
export default function ForgotPassword({ initialEmail = '', onBackToLogin, onProceedToCode }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(initialEmail || '');
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const emailInputRef = useRef(null);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError('');
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError('');
    setServerError('');

    const cleanEmail = email.trim();

    // 1. Direct validation: empty check
    if (!cleanEmail) {
      setFieldError('Please enter your email address.');
      if (emailInputRef.current) emailInputRef.current.focus();
      return;
    }

    // 2. Direct validation: format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFieldError('Enter a valid email address, such as name@example.com.');
      if (emailInputRef.current) emailInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(cleanEmail);
      setIsSubmitting(false);

      if (!result.success) {
        setServerError(result.error || 'Failed to dispatch recovery email. Please check your connection and try again.');
        return;
      }

      if (onProceedToCode) {
        onProceedToCode(cleanEmail, result.message);
      }
    } catch (err) {
      setIsSubmitting(false);
      setServerError(err?.message || "We couldn't connect to the server. Check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#23261F] flex items-center justify-center p-4 sm:p-6 select-none font-['Inter',ui-sans-serif,system-ui,sans-serif]">
      <main className="w-full max-w-[480px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] p-8 sm:p-12 relative transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-[#6E6858] hover:text-[#5170ff] transition-colors text-sm font-semibold group cursor-pointer"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Login</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-5 flex items-center justify-center h-14">
            {!imageError ? (
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs6hrNmoOIOn7UzqRwxgwRPKx7mvDkcrEBTFfkttlfv7tgyFVb_Yl5Npr3s8hxTRRMyNCawWDyBvixVyqvY1phXAIzgay94F0SF3pDBH22A47ktoPrziVy0Cy_IkCldfERBUImJhedCoZhXfL-S-B17rrFlYH8C_smsIuHSEHkHBkcNV69odi-Yts_e8bhFwgX9oH0QGJOhQ0j1vb_x0Nj9NIOLuaSEziF8m-HEWgzpmL20lvAOKB-0K6a98WSCzkaKpc"
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
            Reset your password
          </h1>
          <p className="mt-2 text-base text-[#6E6858] leading-relaxed max-w-[340px]">
            Enter the email linked to your account — we'll send a code to reset your password.
          </p>
        </div>

        {/* Server / Network Error Alert */}
        {serverError && (
          <div role="alert" className="mb-5 p-3 rounded-lg bg-[#fff5f5] border border-[#ba1a1a]/20 text-[#ba1a1a] text-xs sm:text-sm font-medium flex items-start gap-2 animate-in fade-in duration-150">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-[#ba1a1a]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-[#ba1a1a]/95 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="ucc-email"
              className="block text-[15px] font-semibold text-[#23261F] mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                ref={emailInputRef}
                type="email"
                id="ucc-email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? 'email-error' : undefined}
                className={`w-full h-12 pl-4 pr-4 text-base bg-white border text-[#23261F] placeholder-[#6E6858]/70 focus:outline-none rounded-lg transition-colors shadow-xs ${
                  fieldError
                    ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                    : 'border-[#E8E4D8] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
            </div>
            {fieldError && (
              <p id="email-error" role="alert" className="text-[#ba1a1a] text-xs font-medium mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{fieldError}</span>
              </p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 px-5 bg-[#5170ff] hover:bg-[#4767f6] active:bg-[#2b47dc] text-white font-medium text-base shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] rounded-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending code...</span>
                </div>
              ) : (
                <>
                  <span>Confirm Email</span>
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export { ForgotPassword };
