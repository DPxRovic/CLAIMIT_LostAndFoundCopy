import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const DEFAULT_FALLBACK_USER = {
  name: 'Campus User',
  email: 'user@claimit.ucc.edu.ph',
  role: 'Student',
  avatarUrl: '',
};

/**
 * LogoutConfirmation Modal Component (Backend 1 - ROVIC)
 * 
 * Styled according to ClaimIt system specifications:
 * icon badge + close (X), heading and copy, user identity strip, divider, action row.
 * Connected with useAuth() for live Supabase sign out.
 *
 * @param {Object} [props]
 * @param {boolean} [props.isOpen=true] - Controls visibility of the modal
 * @param {Function} [props.onCancel] - Callback when user cancels or clicks close/backdrop
 * @param {Function} [props.onConfirm] - Callback when user confirms logout
 * @param {Function} [props.onClose] - Alternative callback alias for onCancel
 * @param {Function} [props.onLogout] - Alternative callback alias for onConfirm
 * @param {Object} [props.user] - User details to display (defaults to authenticated profile)
 * @param {string} [props.className] - Additional classes for the modal container
 */
export const LogoutConfirmation = ({
  isOpen = true,
  onCancel,
  onConfirm,
  onClose,
  onLogout,
  user,
  className = '',
}) => {
  const authContext = useAuth();

  const handleCancel = onCancel || onClose;
  const handleConfirm = onConfirm || onLogout || (authContext ? authContext.logout : null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && handleCancel) {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCancel]);

  if (!isOpen) {
    return null;
  }

  const activeUser = user || authContext?.formattedUser || DEFAULT_FALLBACK_USER;

  const userData = {
    name: activeUser.name || activeUser.fullName || 'Campus User',
    email: activeUser.email || 'user@claimit.ucc.edu.ph',
    role: activeUser.role || 'Student',
    avatarUrl: activeUser.avatarUrl || '',
  };

  const initialLetter = userData.name ? userData.name.charAt(0).toUpperCase() : 'U';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[480px] bg-white rounded-xl border border-[#E8E4D8] shadow-xl p-6 flex flex-col animate-in zoom-in-95 duration-200 font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F] ${className}`}
      >
        {/* Top Bar: Logout Icon & Close Button */}
        <div className="flex items-start justify-between w-full mb-4">
          <div className="w-11 h-11 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a] shrink-0">
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#444655] hover:bg-[#e5eeff] hover:text-[#0b1c30] transition-colors focus:outline-none cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Header & Subtitle */}
        <div className="flex flex-col gap-1.5 mb-4">
          <h2 id="logout-modal-title" className="text-[20px] font-bold text-[#23261F] tracking-tight">
            Log out of ClaimIt?
          </h2>
          <p className="text-sm text-[#6E6858] leading-relaxed">
            You&apos;ll need to sign back in to report items, browse, or check your claims.
          </p>
        </div>

        {/* Account strip */}
        <div className="mb-5 p-3 rounded-lg bg-[#F9FAFB] border border-[#E8E4D8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {userData.avatarUrl ? (
              <img
                src={userData.avatarUrl}
                alt={userData.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#E8E4D8]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#5170ff] font-bold text-sm flex items-center justify-center shrink-0 border border-[#E8E4D8]">
                {initialLetter}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm text-[#23261F] leading-snug truncate">{userData.name}</span>
              <span className="text-xs text-[#6E6858] truncate">{userData.email}</span>
            </div>
          </div>

          {/* Role badge */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EFF4FF] text-[#5170ff] shrink-0">
            {userData.role}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full mb-5 border-t border-[#E8E4D8]" />

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] font-semibold text-sm hover:bg-[#e5eeff] transition-colors focus:outline-none cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ba1a1a] text-white font-semibold text-sm shadow-sm hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;