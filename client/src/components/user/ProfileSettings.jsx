import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, LogOut, Camera, ChevronDown, Check, CheckCircle2 } from 'lucide-react';

const DEFAULT_USER = {
  name: 'Taylor Swift',
  email: 'taylor@gmail.com',
  schoolId: 'BSCS-1002',
  program: 'BS Computer Science',
  schoolYear: '2026',
  section: '3A',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
};

const PROGRAM_OPTIONS = [
  'BS Computer Science',
  'BS Information Technology',
  'BS Computer Engineering',
  'BS Business Administration',
  'BS Psychology',
  'BA Communication',
];

/* Shared styles (same tokens as the admin Profile & Settings page) */
const cardClass = 'bg-white rounded-xl border border-[#E8E4D8] shadow-sm';
const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]';
const inputClass =
  'w-full px-3.5 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer';
const btnOutline =
  'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#F3F4F6] text-[#23261F] text-sm font-medium transition-colors cursor-pointer';
const navItemBase =
  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors text-left cursor-pointer';

/** Settings row: title on the left, fields on the right (stacks on small screens) */
function SettingsRow({ title, description, children, first = false }) {
  return (
    <div className={`grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8 ${first ? 'pt-6' : 'pt-7'}`}>
      <div>
        <h3 className="text-sm font-semibold text-[#23261F]">{title}</h3>
        {description && <p className="text-xs text-[#6E6858] mt-0.5">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popover-style dropdown (same look as the filters in ClaimsAndMatches),
// with a trigger that matches the other inputs in this form.
// ---------------------------------------------------------------------------
const ProgramDropdown = ({ id, title, value, options, onChange, resetValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const isDefault = value === resetValue;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <div className="relative block w-full" ref={wrapperRef}>
      {/* Trigger (same style as the text inputs) */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2 text-sm bg-white border rounded-lg text-[#23261F] text-left cursor-pointer transition-colors focus:outline-none ${
          isOpen ? 'border-[#5170ff] ring-2 ring-[#5170ff]/20' : 'border-[#E8E4D8] hover:border-[#CBD5E1]'
        }`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#6E6858] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Menu */}
      {isOpen && (
        <div className="absolute left-0 z-30 mt-1.5 w-full min-w-[220px] bg-white border border-[#E8E4D8] rounded-xl shadow-lg">
          <div className={`px-3.5 pt-3 pb-1 ${labelClass}`}>{title}</div>

          <div role="listbox" aria-label={title} className="px-1.5 py-1 flex flex-col gap-0.5">
            {options.map((opt) => {
              const isActive = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => onChange(opt)}
                  className={`w-full flex items-center justify-between gap-4 px-2.5 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer focus:outline-none ${
                    isActive
                      ? 'bg-[#EFF4FF] text-[#5170ff] font-semibold'
                      : 'text-[#23261F] font-medium hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span>{opt}</span>
                  {isActive && (
                    <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-[#E8E4D8]">
            <button
              type="button"
              onClick={() => onChange(resetValue)}
              disabled={isDefault}
              className={`text-xs font-medium transition-colors ${
                isDefault ? 'text-[#6E6858]/40 cursor-not-allowed' : 'text-[#6E6858] hover:text-[#23261F] cursor-pointer'
              }`}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-lg text-xs font-medium text-white bg-[#5170ff] hover:bg-[#4767f6] transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @param {Object} [props]
 * @param {Object} [props.initialUser]
 * @param {((data: any) => void)} [props.onSaveProfile]
 * @param {((data: any) => void)} [props.onSaveAccount]
 * @param {(() => void)} [props.onLogout]
 * @param {string} [props.className]
 */
export const ProfileSettings = ({
  initialUser = DEFAULT_USER,
  onSaveProfile,
  onSaveAccount,
  onLogout,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'account'
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const fileInputRef = useRef(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: initialUser.name,
    schoolId: initialUser.schoolId,
    program: initialUser.program,
    schoolYear: initialUser.schoolYear,
    section: initialUser.section,
    avatarUrl: initialUser.avatarUrl,
  });

  // Account Settings Form State
  const [accountData, setAccountData] = useState({
    email: initialUser.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const triggerToast = () => {
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    if (onSaveProfile) {
      onSaveProfile(profileData);
    }
    triggerToast();
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (onSaveAccount) {
      onSaveAccount(accountData);
    }
    triggerToast();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setProfileData((prev) => ({ ...prev, avatarUrl: previewUrl }));
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', Icon: User },
    { id: 'account', label: 'Account Settings', Icon: Lock },
  ];

  return (
    <div className={`max-w-[1340px] mx-auto flex flex-col gap-6 w-full font-['Inter',ui-sans-serif,system-ui,sans-serif] ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">Profile &amp; Settings</h1>
        <p className="text-sm text-[#6E6858]">Manage how you appear on ClaimIt and how you sign in.</p>
      </div>

      {/* Main Container: 2 Columns */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Column: Sidebar Card */}
        <aside className={`${cardClass} w-full md:w-64 lg:w-72 p-4 flex flex-col shrink-0`}>
          {/* User Preview */}
          <div className="flex items-center gap-3 px-1 pb-4 border-b border-[#E8E4D8]">
            <img
              src={profileData.avatarUrl}
              alt={profileData.name}
              className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#E8E4D8]"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm text-[#23261F] leading-snug truncate">{profileData.name}</span>
              <span className="text-xs text-[#6E6858] truncate">{accountData.email}</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 pt-3">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`${navItemBase} ${
                    isActive
                      ? 'bg-[#EFF4FF] text-[#5170ff] font-semibold'
                      : 'font-medium text-[#6E6858] hover:text-[#23261F] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <item.Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Divider & Log Out */}
          <div className="mt-6 pt-3 border-t border-[#E8E4D8]">
            <button
              type="button"
              onClick={() => onLogout?.()}
              className={`${navItemBase} font-medium text-[#6E6858] hover:text-[#DC2626] hover:bg-[#FEF2F2]`}
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Right Column: Content Card */}
        <main className={`${cardClass} flex-1 w-full p-6 sm:p-8`}>
          {activeTab === 'profile' ? (
            /* ================= PROFILE VIEW ================= */
            <form onSubmit={handleProfileSubmit} className="flex flex-col">
              <div className="pb-5 border-b border-[#E8E4D8]">
                <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">Profile</h2>
                <p className="text-sm text-[#6E6858] mt-1">
                  This is how other students see you on your reports and claims.
                </p>
              </div>

              <SettingsRow title="Profile Picture" first>
                <div className="flex items-center gap-4">
                  <img
                    src={profileData.avatarUrl}
                    alt={profileData.name}
                    className="w-14 h-14 rounded-full object-cover border border-[#E8E4D8] shrink-0"
                  />
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={btnOutline}>
                    <Camera className="w-4 h-4 text-[#6E6858]" aria-hidden="true" />
                    <span>Change photo</span>
                  </button>
                </div>
              </SettingsRow>

              <SettingsRow title="Details">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 max-w-2xl">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="fullname" className={labelClass}>Full Name</label>
                    <input
                      id="fullname"
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="schoolId" className={labelClass}>School ID Number</label>
                    <input
                      id="schoolId"
                      type="text"
                      value={profileData.schoolId}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, schoolId: e.target.value }))}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="program" className={labelClass}>Program</label>
                    <ProgramDropdown
                      id="program"
                      title="Select program"
                      value={profileData.program}
                      options={PROGRAM_OPTIONS}
                      resetValue={initialUser.program}
                      onChange={(v) => setProfileData((prev) => ({ ...prev, program: v }))}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="schoolYear" className={labelClass}>School Year</label>
                    <input
                      id="schoolYear"
                      type="text"
                      value={profileData.schoolYear}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, schoolYear: e.target.value }))}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="section" className={labelClass}>Section</label>
                    <input
                      id="section"
                      type="text"
                      value={profileData.section}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, section: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </SettingsRow>

              <div className="pt-8 flex justify-end">
                <button type="submit" className={btnPrimary}>Apply</button>
              </div>
            </form>
          ) : (
            /* ================= ACCOUNT SETTINGS VIEW ================= */
            <form onSubmit={handleAccountSubmit} className="flex flex-col">
              <div className="pb-5 border-b border-[#E8E4D8]">
                <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">Account Settings</h2>
                <p className="text-sm text-[#6E6858] mt-1">Update your sign-in email and password.</p>
              </div>

              <SettingsRow title="Email" first>
                <div className="max-w-sm">
                  <input
                    id="email"
                    aria-label="Email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </SettingsRow>

              <SettingsRow title="Change Password" description="At least 8 characters.">
                <div className="flex flex-col gap-3 max-w-xl">
                  <div className="flex flex-col gap-1.5 sm:max-w-[calc(50%-0.375rem)]">
                    <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      value={accountData.currentPassword}
                      onChange={(e) => setAccountData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="newPassword" className={labelClass}>New Password</label>
                      <input
                        id="newPassword"
                        type="password"
                        value={accountData.newPassword}
                        onChange={(e) => setAccountData((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={accountData.confirmPassword}
                        onChange={(e) => setAccountData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </SettingsRow>

              <div className="pt-8 flex justify-end">
                <button type="submit" className={btnPrimary}>Apply</button>
              </div>
            </form>
          )}
        </main>
      </div>

      {/* Floating Success Feedback Toast */}
      {showSuccessToast && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-[#23261F] text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="status"
        >
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" aria-hidden="true" />
          <span>Changes applied successfully!</span>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;