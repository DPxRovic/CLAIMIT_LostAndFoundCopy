import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * UserProfileModal component for ClaimIt (Backend 1 - ROVIC)
 * 
 * Standalone popover card displaying user identity, profile settings link, and logout option.
 * 
 * @param {Object} props
 * @param {Object} [props.user] - User details ({ name, email, role, avatarUrl })
 * @param {() => void} [props.onProfileSettings] - Callback when clicking Profile & Settings
 * @param {() => void} [props.onLogout] - Callback when clicking Logout
 */
export default function UserProfileModal({
  user,
  onProfileSettings,
  onLogout,
}) {
  const authContext = useAuth();

  const [avatarError, setAvatarError] = useState(false);

  const activeUser = user || authContext?.formattedUser || {
    name: 'Sabrina Carpenter',
    email: 'sabrina@gmail.com',
    role: 'Admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  };

  const handleProfileSettingsClick = (e) => {
    e.preventDefault();
    if (onProfileSettings) {
      onProfileSettings();
    }
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    } else if (authContext) {
      authContext.logout();
    }
  };

  // Role badge: same as the Student / Faculty badge in the admin users table and the logout popup
  const getRoleBadgeStyle = () => 'bg-[#EFF4FF] text-[#5170ff]';

  return (
    <div className="w-full max-w-[288px] bg-white rounded-xl border border-[#E8E4D8] shadow-xl overflow-hidden transition-all duration-200 font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F] select-none text-left">
      {/* Top Header / Identity Area */}
      <div className="bg-[#F9FAFB] px-5 pt-6 pb-5 flex flex-col items-center text-center">
        {/* 1. Profile Picture */}
        <div className="relative mb-3.5">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-[#E8E4D8] bg-[#eff4ff] flex items-center justify-center">
            {!avatarError && activeUser?.avatarUrl ? (
              <img
                src={activeUser.avatarUrl}
                alt={activeUser?.name || 'User portrait'}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-xl font-bold text-[#5170ff]">
                {activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>
        </div>

        {/* 2. Name & Role */}
        <div className="flex items-center justify-center gap-1.5 mb-1 whitespace-nowrap">
          <h2 className="font-semibold text-[1.0625rem] leading-tight text-[#23261F] tracking-tight truncate max-w-[180px]">
            {activeUser?.name || 'Sabrina Carpenter'}
          </h2>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-medium leading-none shrink-0 ${getRoleBadgeStyle(
              activeUser?.role
            )}`}
          >
            {activeUser?.role || 'Admin'}
          </span>
        </div>

        {/* 3. Email Address */}
        <p className="font-normal text-[0.8125rem] leading-normal text-[#6E6858] break-all">
          {activeUser?.email || 'sabrina@gmail.com'}
        </p>
      </div>

      {/* Divider Line */}
      <div className="w-full h-[1px] bg-[#E8E4D8]" />

      {/* Navigation & Action List */}
      <div className="p-2 space-y-1 bg-white">
        {/* 4. Profile & Settings */}
        <button
          type="button"
          onClick={handleProfileSettingsClick}
          className="w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[#23261F] hover:bg-[#EFF4FF] hover:text-[#5170ff] transition-colors duration-150 cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            {/* Manage Accounts SVG Icon */}
            <svg
              className="w-5 h-5 text-[#23261F] group-hover:text-[#5170ff] transition-colors duration-150 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632zM18.75 9.75v3m1.5-1.5h-3"
              />
            </svg>
            <span className="font-medium text-[0.875rem] tracking-tight">
              Profile &amp; Settings
            </span>
          </div>
          {/* Chevron Right SVG Icon */}
          <svg
            className="w-4 h-4 text-[#6E6858]/60 group-hover:text-[#5170ff] group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Divider Line */}
        <div className="w-full h-[1px] bg-[#E8E4D8] my-1" />

        {/* 5. Logout */}
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition-colors duration-150 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {/* Logout SVG Icon */}
            <svg
              className="w-5 h-5 text-[#DC2626] transition-colors duration-150 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            <span className="font-medium text-[0.875rem] tracking-tight">
              Logout
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

export { UserProfileModal };