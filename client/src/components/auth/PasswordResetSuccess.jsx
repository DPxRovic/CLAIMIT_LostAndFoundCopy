import React, { useState } from 'react';

/**
 * PasswordResetSuccess component for ClaimIt
 *
 * @param {Object} props
 * @param {() => void} [props.onBackToLogin] - Callback to return to the Login screen
 */
export default function PasswordResetSuccess({ onBackToLogin }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#23261F] flex items-center justify-center p-4 sm:p-6 select-none font-['Inter',ui-sans-serif,system-ui,sans-serif] relative overflow-hidden">
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#5170ff]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#5170ff]/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <main className="w-full max-w-[450px] bg-white rounded-2xl border border-[#E8E4D8] shadow-[0_4px_24px_rgba(81,112,255,0.06)] px-8 py-10 flex flex-col items-center text-center relative z-10 transition-all duration-300">
        <div className="flex justify-center mb-6 h-9 items-center">
          {!imageError ? (
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs6hrNmoOIOn7UzqRwxgwRPKx7mvDkcrEBTFfkttlfv7tgyFVb_Yl5Npr3s8hxTRRMyNCawWDyBvixVyqvY1phXAIzgay94F0SF3pDBH22A47ktoPrziVy0Cy_IkCldfERBUImJhedCoZhXfL-S-B17rrFlYH8C_smsIuHSEHkHBkcNV69odi-Yts_e8bhFwgX9oH0QGJOhQ0j1vb_x0Nj9NIOLuaSEziF8m-HEWgzpmL20lvAOKB-0K6a98WSCzkaKpc"
              alt="ClaimIt"
              className="h-9 w-auto object-contain select-none"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center text-[30px] font-extrabold tracking-tight select-none">
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

        <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#5170ff] flex items-center justify-center mx-auto mb-5 shadow-xs">
          <svg className="w-7 h-7 stroke-[2.4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#23261F] tracking-tight mb-2">
          Password reset
        </h1>

        <p className="text-base text-[#6E6858] max-w-[320px] mx-auto leading-relaxed mb-8">
          Your password has been updated. You can now log in with your new password.
        </p>

        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center justify-center w-full h-12 py-3 px-6 bg-[#5170ff] hover:bg-[#4767f6] active:scale-[0.99] text-white font-medium text-base rounded-lg shadow-sm hover:shadow-md transition-all duration-200 select-none cursor-pointer group"
        >
          <span>Back to Log In</span>
          <svg
            className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </main>
    </div>
  );
}

export { PasswordResetSuccess };