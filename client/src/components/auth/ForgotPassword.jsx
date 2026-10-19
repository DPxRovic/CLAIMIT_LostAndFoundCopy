import React, { useState } from 'react';

/**
 * ForgotPassword component for ClaimIt
 * 
 * @param {Object} props
 * @param {() => void} [props.onBackToLogin] - Handler to navigate back to login screen
 * @param {(email: string) => void} [props.onProceedToCode] - Handler when proceeding to enter verification code
 */
export default function ForgotPassword({ onBackToLogin, onProceedToCode }) {
  const [email, setEmail] = useState('');
  const [imageError, setImageError] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onProceedToCode) {
      onProceedToCode(email.trim().toLowerCase() || 'user@ucc.edu.ph');
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
                type="email"
                id="ucc-email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                className="w-full h-12 pl-4 pr-4 text-base bg-white border border-[#E8E4D8] text-[#23261F] placeholder-[#6E6858]/70 focus:outline-none focus:ring-2 focus:ring-[#5170ff]/20 focus:border-[#5170ff] rounded-lg transition-colors shadow-xs"
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="w-full h-12 px-5 bg-[#5170ff] hover:bg-[#4767f6] text-white font-medium text-base shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] rounded-lg cursor-pointer"
            >
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
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export { ForgotPassword };