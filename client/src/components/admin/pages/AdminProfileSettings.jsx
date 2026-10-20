import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';

const DEFAULT_ADMIN = {
  name: 'Sabrina Carpenter',
  email: 'sabrina@gmail.com',
  fullname: 'crystal2',
  contactNumber: '09878475879',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
};

/* Shared styles (same tokens as the other admin pages) */
const cardClass = 'bg-white rounded-xl border border-[#E8E4D8] shadow-sm';
const labelClass = 'text-[11px] font-semibold uppercase tracking-wider text-[#6E6858]';
const inputClass =
  'w-full px-3.5 py-2 text-sm bg-white border border-[#E8E4D8] rounded-lg text-[#23261F] placeholder:text-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-2 focus:ring-[#5170ff]/20 disabled:bg-slate-50 disabled:text-slate-400';
const btnPrimary =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
const btnOutline =
  'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-[#E8E4D8] bg-white hover:bg-[#F3F4F6] text-[#23261F] text-sm font-medium transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
const navItemBase =
  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors text-left cursor-pointer';

/** Settings row: title on the left, fields on the right (stacks on small screens) */
function SettingsRow({ title, description, children, first = false }) {
  return (
    <div
      className={`grid gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8 ${first ? 'pt-6' : 'pt-7'}`}
    >
      <div>
        <h3 className="text-sm font-semibold text-[#23261F]">{title}</h3>
        {description && <p className="text-xs text-[#6E6858] mt-0.5">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * AdminProfileSettings component
 *
 * Dedicated admin settings page matching ClaimIt administrator designs.
 * Integrates real Supabase Auth, profiles persistence, and storage for photo uploads.
 *
 * @param {Object} [props]
 * @param {Object} [props.initialUser]
 * @param {((data: any) => void)} [props.onSaveProfile]
 * @param {((data: any) => void)} [props.onSaveAccount]
 * @param {(() => void)} [props.onLogout]
 * @param {string} [props.className]
 */
export const AdminProfileSettings = ({
  initialUser = DEFAULT_ADMIN,
  onSaveProfile,
  onSaveAccount,
  onLogout,
  className = '',
}) => {
  const {
    user,
    profile,
    loading: authLoading,
    role,
    status,
    updateUserProfile,
    uploadAvatar,
    updateEmail,
    changePassword,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'account'
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('Changes applied successfully!');
  const fileInputRef = useRef(null);

  // Admin Profile State
  const [profileData, setProfileData] = useState({
    name: profile?.full_name || initialUser.name || 'Sabrina Carpenter',
    fullname: profile?.full_name || initialUser.fullname || initialUser.name || 'Sabrina Carpenter',
    contactNumber: profile?.contact_number || initialUser.contactNumber || '',
    avatarUrl: profile?.avatar_url || initialUser.avatarUrl || DEFAULT_ADMIN.avatarUrl,
  });

  // Admin Account Settings State
  const [accountData, setAccountData] = useState({
    email: profile?.email || user?.email || initialUser.email || 'sabrina@gmail.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Status & Validation States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [profileErrors, setProfileErrors] = useState({});
  const [profileServerNotice, setProfileServerNotice] = useState(null);

  const [accountErrors, setAccountErrors] = useState({});
  const [accountServerNotice, setAccountServerNotice] = useState(null);

  const [photoError, setPhotoError] = useState(null);

  // Synchronize when authenticated profile arrives or updates
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.full_name || initialUser?.name || 'Administrator',
        fullname: profile.full_name || initialUser?.fullname || 'Administrator',
        contactNumber: profile.contact_number || initialUser?.contactNumber || '',
        avatarUrl: profile.avatar_url || initialUser?.avatarUrl || DEFAULT_ADMIN.avatarUrl,
      });

      setAccountData((prev) => ({
        ...prev,
        email: profile.email || user?.email || initialUser?.email || '',
      }));
    }
  }, [profile, user?.email, initialUser]);

  const triggerToast = (msg = 'Changes applied successfully!') => {
    setSuccessToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3500);
  };

  // ---------------------------------------------------------------------------
  // Profile Photo Upload Handler
  // ---------------------------------------------------------------------------
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    // 1. Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError('Unsupported format. Please upload a JPG, PNG, WEBP, or GIF image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validate file size (2MB ceiling)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setPhotoError('Image size exceeds the 2MB limit. Please choose a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const res = await uploadAvatar(file);
      if (res.success && res.publicUrl) {
        setProfileData((prev) => ({ ...prev, avatarUrl: res.publicUrl }));
        if (onSaveProfile) {
          onSaveProfile({ avatarUrl: res.publicUrl });
        }
        triggerToast('Profile photo updated successfully!');
      } else {
        setPhotoError(res.error || 'Failed to upload photo. Please try again.');
      }
    } catch (err) {
      setPhotoError(err?.message || 'An unexpected error occurred while uploading.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // Admin Profile Submit Handler
  // ---------------------------------------------------------------------------
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileServerNotice(null);

    const trimmedFullName = (profileData.fullname || '').trim();
    const trimmedContact = (profileData.contactNumber || '').trim();

    if (!trimmedFullName) {
      setProfileErrors({ fullname: 'Full Name is required.' });
      return;
    }

    setIsSavingProfile(true);

    try {
      const updates = {
        full_name: trimmedFullName,
        contact_number: trimmedContact,
      };

      const res = await updateUserProfile(updates);

      if (res.success) {
        setProfileServerNotice({
          type: 'success',
          message: 'Administrator details saved successfully.',
        });
        triggerToast('Profile details updated successfully!');
        if (onSaveProfile) {
          onSaveProfile({
            name: trimmedFullName,
            fullname: trimmedFullName,
            contactNumber: trimmedContact,
          });
        }
      } else {
        setProfileServerNotice({
          type: 'error',
          message: res.error || 'Failed to update administrator details.',
        });
      }
    } catch (err) {
      setProfileServerNotice({
        type: 'error',
        message: err?.message || 'An unexpected error occurred while saving profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Admin Account Settings Submit Handler (Email & Password)
  // ---------------------------------------------------------------------------
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAccountErrors({});
    setAccountServerNotice(null);

    const trimmedEmail = (accountData.email || '').trim().toLowerCase();
    const currentEmail = (profile?.email || user?.email || initialUser?.email || '').toLowerCase();
    const errors = {};

    // 1. Email format validation
    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 2. Password validation
    const hasCurrentPw = Boolean(accountData.currentPassword);
    const hasNewPw = Boolean(accountData.newPassword);
    const hasConfirmPw = Boolean(accountData.confirmPassword);
    const isChangingPassword = hasCurrentPw || hasNewPw || hasConfirmPw;

    if (isChangingPassword) {
      if (!hasCurrentPw) {
        errors.currentPassword = 'Enter your current password to authorize this change.';
      }
      if (!hasNewPw) {
        errors.newPassword = 'Enter a new password.';
      } else if (accountData.newPassword.length < 8) {
        errors.newPassword = 'Password must be at least 8 characters long.';
      } else if (accountData.newPassword === accountData.currentPassword) {
        errors.newPassword = 'New password cannot be the same as your current password.';
      }

      if (!hasConfirmPw) {
        errors.confirmPassword = 'Confirm your new password.';
      } else if (accountData.newPassword !== accountData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setAccountErrors(errors);
      return;
    }

    const emailChanged = trimmedEmail !== currentEmail;
    if (!emailChanged && !isChangingPassword) {
      setAccountServerNotice({
        type: 'info',
        message: 'No changes were detected in your account settings.',
      });
      return;
    }

    setIsSavingAccount(true);

    try {
      let emailSuccess = true;
      let passwordSuccess = true;
      const notices = [];

      // A. Update email
      if (emailChanged) {
        const emailRes = await updateEmail(trimmedEmail);
        if (emailRes.success) {
          notices.push(
            emailRes.message ||
              'A verification email was sent to your new address. Please confirm it to finalize the email change.'
          );
          if (onSaveAccount) {
            onSaveAccount({ email: trimmedEmail });
          }
        } else {
          emailSuccess = false;
          setAccountErrors((prev) => ({ ...prev, email: emailRes.error }));
        }
      }

      // B. Change password
      if (isChangingPassword) {
        const pwRes = await changePassword(
          accountData.currentPassword,
          accountData.newPassword,
          accountData.confirmPassword
        );

        if (pwRes.success) {
          notices.push('Password updated successfully.');
          setAccountData((prev) => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }));
        } else {
          passwordSuccess = false;
          if (pwRes.error?.toLowerCase().includes('current password')) {
            setAccountErrors((prev) => ({ ...prev, currentPassword: pwRes.error }));
          } else {
            setAccountErrors((prev) => ({ ...prev, newPassword: pwRes.error }));
          }
        }
      }

      if (emailSuccess && passwordSuccess) {
        setAccountServerNotice({
          type: 'success',
          message: notices.join(' '),
        });
        triggerToast('Account settings updated successfully!');
      } else if (!emailSuccess || !passwordSuccess) {
        setAccountServerNotice({
          type: 'error',
          message: 'One or more updates could not be completed. Please review the errors below.',
        });
      }
    } catch (err) {
      setAccountServerNotice({
        type: 'error',
        message: err?.message || 'An unexpected error occurred while saving account settings.',
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'account', label: 'Account Settings', icon: 'lock' },
  ];

  const handleLogoutAction = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  return (
    <div className={`max-w-[1340px] mx-auto flex flex-col gap-6 w-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#23261F] tracking-tight">Profile &amp; Settings</h1>
          {role && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF4FF] text-[#5170ff] border border-[#5170ff]/20">
              {role}
            </span>
          )}
          {status && status !== 'Active' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              {status}
            </span>
          )}
        </div>
        <p className="text-sm text-[#6E6858]">
          Manage your administrator account details and security settings.
        </p>
      </div>

      {/* Main Container: 2 Columns */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Column: Sidebar Card */}
        <aside className={`${cardClass} w-full md:w-64 lg:w-72 p-4 flex flex-col shrink-0`}>
          {/* User Preview */}
          <div className="flex items-center gap-3 px-1 pb-4 border-b border-[#E8E4D8]">
            <div className="relative">
              <img
                src={profileData.avatarUrl}
                alt={profileData.name}
                className="w-11 h-11 rounded-full object-cover shrink-0 border border-[#E8E4D8] bg-[#eff4ff]"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_ADMIN.avatarUrl;
                }}
              />
              {isUploadingPhoto && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-white animate-spin">
                    progress_activity
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-sm text-[#23261F] leading-snug truncate">
                {profileData.fullname || profileData.name || 'Administrator'}
              </span>
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
                  <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Divider & Log Out */}
          <div className="mt-6 pt-3 border-t border-[#E8E4D8]">
            <button
              type="button"
              onClick={handleLogoutAction}
              className={`${navItemBase} font-medium text-[#6E6858] hover:text-[#DC2626] hover:bg-[#FEF2F2]`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
                logout
              </span>
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Right Column: Content Card */}
        <main className={`${cardClass} flex-1 w-full p-6 sm:p-8`}>
          {authLoading && (
            <div className="flex items-center gap-2.5 text-sm text-[#6E6858] py-4">
              <span className="material-symbols-outlined text-[18px] text-[#5170ff] animate-spin">
                progress_activity
              </span>
              <span>Loading administrator profile...</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            /* ================= ADMIN PROFILE VIEW ================= */
            <form onSubmit={handleProfileSubmit} className="flex flex-col" noValidate>
              <div className="pb-5 border-b border-[#E8E4D8]">
                <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">Profile</h2>
                <p className="text-sm text-[#6E6858] mt-1">
                  This is how campus users and logs identify your administrative actions.
                </p>
              </div>

              {/* Status Notice */}
              {profileServerNotice && (
                <div
                  role="alert"
                  className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2.5 border ${
                    profileServerNotice.type === 'error'
                      ? 'bg-[#fff5f5] text-[#ba1a1a] border-[#ba1a1a]/20'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                    {profileServerNotice.type === 'error' ? 'error' : 'check_circle'}
                  </span>
                  <span>{profileServerNotice.message}</span>
                </div>
              )}

              {/* Profile Picture */}
              <SettingsRow title="Profile Picture" first>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={profileData.avatarUrl}
                        alt={profileData.name}
                        className="w-14 h-14 rounded-full object-cover border border-[#E8E4D8] shrink-0 bg-[#eff4ff]"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_ADMIN.avatarUrl;
                        }}
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px] text-white animate-spin">
                            progress_activity
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      className={btnOutline}
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#6E6858]" aria-hidden="true">
                        photo_camera
                      </span>
                      <span>{isUploadingPhoto ? 'Uploading...' : 'Change photo'}</span>
                    </button>
                  </div>
                  {photoError && (
                    <p role="alert" className="text-xs text-[#ba1a1a] font-medium flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{photoError}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-[#6E6858]">JPG, PNG, WEBP, or GIF up to 2MB.</p>
                </div>
              </SettingsRow>

              {/* Details */}
              <SettingsRow title="Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fullname" className={labelClass}>
                      Full Name <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      value={profileData.fullname}
                      onChange={(e) => {
                        setProfileData((prev) => ({ ...prev, fullname: e.target.value }));
                        if (profileErrors.fullname) setProfileErrors((p) => ({ ...p, fullname: null }));
                      }}
                      className={`${inputClass} ${profileErrors.fullname ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/10' : ''}`}
                      disabled={isSavingProfile}
                    />
                    {profileErrors.fullname && (
                      <p role="alert" className="text-xs text-[#ba1a1a] font-medium">
                        {profileErrors.fullname}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contactNumber" className={labelClass}>Contact Number</label>
                    <input
                      id="contactNumber"
                      type="text"
                      placeholder="e.g. 09123456789"
                      value={profileData.contactNumber}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, contactNumber: e.target.value }))}
                      className={inputClass}
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>
              </SettingsRow>

              <div className="pt-8 flex justify-end">
                <button type="submit" disabled={isSavingProfile} className={btnPrimary}>
                  {isSavingProfile ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Apply</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ================= ACCOUNT SETTINGS VIEW ================= */
            <form onSubmit={handleAccountSubmit} className="flex flex-col" noValidate>
              <div className="pb-5 border-b border-[#E8E4D8]">
                <h2 className="text-[18px] font-bold text-[#23261F] tracking-tight">Account Settings</h2>
                <p className="text-sm text-[#6E6858] mt-1">Update your sign-in email and administrator password.</p>
              </div>

              {/* Status Notice */}
              {accountServerNotice && (
                <div
                  role="alert"
                  className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2.5 border ${
                    accountServerNotice.type === 'error'
                      ? 'bg-[#fff5f5] text-[#ba1a1a] border-[#ba1a1a]/20'
                      : accountServerNotice.type === 'info'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                    {accountServerNotice.type === 'error' ? 'error' : accountServerNotice.type === 'info' ? 'info' : 'check_circle'}
                  </span>
                  <span>{accountServerNotice.message}</span>
                </div>
              )}

              {/* Email Row */}
              <SettingsRow title="Email" description="Used for administrator login." first>
                <div className="flex flex-col gap-1.5 max-w-sm">
                  <input
                    id="email"
                    aria-label="Email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => {
                      setAccountData((prev) => ({ ...prev, email: e.target.value }));
                      if (accountErrors.email) setAccountErrors((p) => ({ ...p, email: null }));
                    }}
                    className={`${inputClass} ${accountErrors.email ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/10' : ''}`}
                    disabled={isSavingAccount}
                  />
                  {accountErrors.email && (
                    <p role="alert" className="text-xs text-[#ba1a1a] font-medium">
                      {accountErrors.email}
                    </p>
                  )}
                  <p className="text-[11px] text-[#6E6858]">
                    Updating your email will dispatch a verification link before changing.
                  </p>
                </div>
              </SettingsRow>

              {/* Change Password Row */}
              <SettingsRow title="Change Password" description="Must be at least 8 characters.">
                <div className="flex flex-col gap-3 max-w-xl">
                  {/* Current Password */}
                  <div className="flex flex-col gap-1.5 sm:max-w-[calc(50%-0.375rem)]">
                    <label htmlFor="currentPassword" className={labelClass}>
                      Current Password
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={accountData.currentPassword}
                      onChange={(e) => {
                        setAccountData((prev) => ({ ...prev, currentPassword: e.target.value }));
                        if (accountErrors.currentPassword) setAccountErrors((p) => ({ ...p, currentPassword: null }));
                      }}
                      className={`${inputClass} ${accountErrors.currentPassword ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/10' : ''}`}
                      disabled={isSavingAccount}
                      autoComplete="current-password"
                    />
                    {accountErrors.currentPassword && (
                      <p role="alert" className="text-xs text-[#ba1a1a] font-medium">
                        {accountErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  {/* New and Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="newPassword" className={labelClass}>New Password</label>
                      <input
                        id="newPassword"
                        type="password"
                        placeholder="At least 8 characters"
                        value={accountData.newPassword}
                        onChange={(e) => {
                          setAccountData((prev) => ({ ...prev, newPassword: e.target.value }));
                          if (accountErrors.newPassword) setAccountErrors((p) => ({ ...p, newPassword: null }));
                        }}
                        className={`${inputClass} ${accountErrors.newPassword ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/10' : ''}`}
                        disabled={isSavingAccount}
                        autoComplete="new-password"
                      />
                      {accountErrors.newPassword && (
                        <p role="alert" className="text-xs text-[#ba1a1a] font-medium">
                          {accountErrors.newPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        placeholder="Re-enter new password"
                        value={accountData.confirmPassword}
                        onChange={(e) => {
                          setAccountData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                          if (accountErrors.confirmPassword) setAccountErrors((p) => ({ ...p, confirmPassword: null }));
                        }}
                        className={`${inputClass} ${accountErrors.confirmPassword ? 'border-[#ba1a1a] ring-2 ring-[#ba1a1a]/10' : ''}`}
                        disabled={isSavingAccount}
                        autoComplete="new-password"
                      />
                      {accountErrors.confirmPassword && (
                        <p role="alert" className="text-xs text-[#ba1a1a] font-medium">
                          {accountErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </SettingsRow>

              <div className="pt-8 flex justify-end">
                <button type="submit" disabled={isSavingAccount} className={btnPrimary}>
                  {isSavingAccount ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Apply</span>
                  )}
                </button>
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
          <span className="material-symbols-outlined text-[18px] text-[#10B981]" aria-hidden="true">
            check_circle
          </span>
          <span>{successToastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminProfileSettings;