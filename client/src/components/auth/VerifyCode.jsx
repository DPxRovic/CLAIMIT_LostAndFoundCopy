import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * VerifyCode component for ClaimIt
 * 
 * Verifies Supabase Auth 6-digit recovery OTP code with direct validation and truthful feedback.
 * 
 * @param {Object} props
 * @param {string} [props.email='student@ucc.edu.ph'] - The recipient email displayed in the prompt
 * @param {string} [props.initialMessage] - Optional feedback message from previous step
 * @param {() => void} [props.onBackToLogin] - Callback when clicking the Back button
 * @param {() => void} [props.onBackToEmail] - Optional callback to edit the email address
 * @param {(code: string) => void} [props.onCodeVerified] - Callback when verification is successful (triggers reset password step)
 * @param {() => void} [props.onResend] - Callback when resending code
 */
export default function VerifyCode({
  email = 'student@ucc.edu.ph',
  initialMessage,
  onBackToLogin,
  onBackToEmail,
  onCodeVerified,
  onResend,
}) {
  const { verifyRecoveryOtp, requestPasswordReset } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [toastMessage, setToastMessage] = useState(initialMessage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [imageError, setImageError] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Dismiss initial toast message after 6 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const clearError = () => {
    if (errorMessage) setErrorMessage('');
  };

  const handleChange = (index, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    clearError();

    const newDigits = [...digits];

    if (!cleanValue) {
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    // Take the last entered character if multiple typed
    newDigits[index] = cleanValue.slice(-1);
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pastedData) return;

    clearError();
    const pastedChars = pastedData.slice(0, 6).split('');
    const newDigits = [...digits];

    pastedChars.forEach((char, i) => {
      if (i < 6) newDigits[i] = char;
    });

    setDigits(newDigits);

    const targetIndex = Math.min(pastedChars.length, 5);
    inputRefs.current[targetIndex]?.focus();
  };

  const handleResendClick = async () => {
    if (timeLeft > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');

    try {
      const result = await requestPasswordReset(email);
      setIsResending(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to resend code. Please wait before trying again.');
        return;
      }

      setTimeLeft(30);
      setDigits(['', '', '', '', '', '']);
      setToastMessage(`A fresh 6-digit code has been sent to ${email}`);

      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }

      if (onResend) {
        onResend();
      }
    } catch (err) {
      setIsResending(false);
      setErrorMessage(err?.message || "We couldn't connect to the server. Check your connection and try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const fullCode = digits.join('').trim();

    // 1. Direct validation: 6 digits required
    if (fullCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      const firstEmptyIndex = digits.findIndex((d) => !d);
      if (firstEmptyIndex !== -1 && inputRefs.current[firstEmptyIndex]) {
        inputRefs.current[firstEmptyIndex].focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verifyRecoveryOtp(email, fullCode);
      setIsSubmitting(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid or expired verification code. Please check the code and try again.');
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
        return;
      }

      // Verification successful -> Proceed to Reset Password step
      if (onCodeVerified) {
        onCodeVerified(fullCode);
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || "We couldn't connect to the server. Check your connection and try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#23261F] flex items-center justify-center p-4 sm:p-6 select-none font-['Inter',ui-sans-serif,system-ui,sans-serif] relative overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#23261F] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-white/10 transition-all">
          <svg className="w-4 h-4 text-[#5170ff] shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="ml-2 text-white/60 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Subtle Ambient Backdrop Glow */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#5170ff]/8 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-[#5170ff]/8 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Verification Card */}
      <main className="w-full max-w-[480px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] p-8 sm:p-12 relative transition-all duration-300">
        {/* Top Bar: Navigation */}
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
            <span>Back</span>
          </button>
        </div>

        {/* Brand Identity */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-5 flex items-center justify-center h-14">
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
            Enter code
          </h1>
          <p className="mt-2 text-base text-[#6E6858] leading-relaxed max-w-[360px]">
            If an account is associated with{' '}
            <span className="font-semibold text-[#23261F]">{email}</span>, a 6-digit recovery code was sent to your inbox.
          </p>
          {onBackToEmail && (
            <button
              type="button"
              onClick={onBackToEmail}
              className="mt-2 text-xs font-semibold text-[#5170ff] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Need to fix a typo? Change email address</span>
            </button>
          )}
        </div>

        {/* 6-digit Code Input Form */}
        <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
          {/* 6-digit Input Cluster */}
          <div className="flex justify-between items-center gap-2 sm:gap-2.5 my-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Digit ${index + 1} of verification code`}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-lg transition-all outline-none ${
                  errorMessage
                    ? 'border-2 border-[#ba1a1a] bg-[#fff5f5] text-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
                    : 'bg-white border border-[#E8E4D8] text-[#23261F] focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div role="alert" className="flex items-center justify-center gap-1.5 text-[#ba1a1a] text-xs font-semibold mt-2.5 animate-in fade-in duration-150">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Resend Countdown Trigger */}
          <div className="flex items-center justify-center gap-1.5 mt-5 mb-7 text-center text-sm text-[#6E6858]">
            <span>Didn't get a code?</span>
            {timeLeft > 0 ? (
              <button
                type="button"
                disabled
                className="font-semibold text-sm inline-flex items-center gap-1 text-[#6E6858]/70 cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>
                  Resend code (0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft})
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isResending}
                onClick={handleResendClick}
                className="font-semibold text-sm inline-flex items-center gap-1 text-[#5170ff] hover:underline cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>{isResending ? 'Sending...' : 'Resend code'}</span>
              </button>
            )}
          </div>

          {/* Submission Trigger */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 px-5 text-white font-medium text-base rounded-lg shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer bg-[#5170ff] hover:bg-[#4767f6] active:bg-[#2b47dc] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Verifying code...</span>
              </div>
            ) : (
              <>
                <span>Submit</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

export { VerifyCode };
