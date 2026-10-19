import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import UserProfileModal from '../shared/UserProfileModal.jsx';
import LogoutConfirmation from '../shared/LogoutConfirmation.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Automatically discover JSX files in the same components folder.
const pageModules = import.meta.glob('./pages/*.jsx');

// Load a page only if its corresponding file exists.
const createLazyPage = (fileName) => {
  const importPage = pageModules[`./pages/${fileName}.jsx`];

  return importPage ? lazy(importPage) : null;
};

// Connect each navigation tab to its JSX component.
const ADMIN_PAGES = {
  dashboard: createLazyPage('Dashboard'),
  'user-management': createLazyPage('UserManagement'),
  reports: createLazyPage('ReportsAdmin'),
  'manage-lists': createLazyPage('ManageLists'),
  'activity-logs': createLazyPage('ActivityLogs'),
  'profile-settings': createLazyPage('AdminProfileSettings'),
};

const NAV_ITEMS = [
  {
    path: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
  },
  {
    path: 'user-management',
    label: 'User Management',
    icon: 'group',
  },
  {
    path: 'reports',
    label: 'Reports',
    icon: 'description',
  },
  {
    path: 'manage-lists',
    label: 'Manage Lists',
    icon: 'format_list_bulleted',
  },
  {
    path: 'activity-logs',
    label: 'Activity Logs',
    icon: 'history',
  },
];

export default function AdminMainForm({
  currentPath = 'manage-lists',
  onNavigate = () => {},
  onLogout,
  initialUser,
}) {
  const authContext = useAuth();

  const defaultUser = {
    name: 'Sabrina Carpenter',
    email: 'sabrina@gmail.com',
    role: 'Admin',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  };

  const [activePath, setActivePath] = useState(currentPath);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);
  const [user, setUser] = useState(initialUser || authContext?.formattedUser || defaultUser);

  useEffect(() => {
    if (!initialUser && authContext?.formattedUser) {
      setUser(authContext.formattedUser);
    }
  }, [authContext?.formattedUser, initialUser]);

  const profileButtonRef = useRef(null);
  const modalContainerRef = useRef(null);

  // Load Material Symbols for the sidebar and header icons.
  useEffect(() => {
    const linkId = 'material-symbols-outlined-font';

    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');

      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';

      document.head.appendChild(link);
    }
  }, []);

  // Synchronize the active tab with the currentPath prop.
  useEffect(() => {
    setActivePath(currentPath);
  }, [currentPath]);

  // Close profile modal on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isProfileModalOpen &&
        modalContainerRef.current &&
        !modalContainerRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileModalOpen]);

  const handleNavClick = (path, e) => {
    if (e) e.preventDefault();

    setIsProfileModalOpen(false);
    setActivePath(path);
    onNavigate(path);
  };

  const handleOpenProfileSettings = () => {
    setIsProfileModalOpen(false);
    setActivePath('profile-settings');
    onNavigate('profile-settings');
  };

  // Open the logout confirmation (same popup as the user side)
  const handleLogout = () => {
    setIsProfileModalOpen(false);
    setIsLogoutConfirmationOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsLogoutConfirmationOpen(false);
    if (onLogout) onLogout();
    if (authContext) {
      await authContext.logout();
    }
  };

  // Display the selected page, or a clean fallback if not yet implemented
  const renderContent = () => {
    const PageComponent = ADMIN_PAGES[activePath];

    if (!PageComponent) {
      return (
        <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#5170ff] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">construction</span>
          </div>
          <h2 className="text-xl font-bold text-[#23261F] capitalize">
            {activePath.replace('-', ' ')}
          </h2>
          <p className="text-sm text-[#6E6858] max-w-md">
            This module is being created. Click below to return to Manage Lists.
          </p>
          <button
            type="button"
            onClick={() => handleNavClick('manage-lists')}
            className="mt-2 px-4 py-2 bg-[#5170ff] text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer hover:bg-[#4767f6] transition-colors"
          >
            Go to Manage Lists
          </button>
        </div>
      );
    }

    return (
      <Suspense
        fallback={
          <div className="w-full py-20 flex items-center justify-center text-sm text-[#6E6858]">
            Loading page...
          </div>
        }
      >
        <PageComponent
          initialUser={user}
          onSaveProfile={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
          onSaveAccount={(updated) => setUser((prev) => ({ ...prev, email: updated.email }))}
          onLogout={handleLogout}
        />
      </Suspense>
    );
  };

  return (
    <div className="flex flex-row w-full h-screen min-h-screen overflow-hidden bg-[#f8f9ff] text-[#23261F] font-['Inter',ui-sans-serif,system-ui,sans-serif]">
      {/* Sidebar */}
      <aside className="w-[260px] min-w-[260px] h-full bg-white border-r border-[#E8E4D8] flex flex-col shrink-0 z-30 shadow-[1px_0_8px_rgba(0,0,0,0.02)]">
        {/* Brand Header */}
        <div className="h-16 w-full px-6 flex items-center shrink-0 border-b border-[#E8E4D8]">
          <a
            className="flex items-center focus:outline-none w-[212px] shrink-0"
            data-path="dashboard"
            href="#dashboard"
            onClick={(e) => handleNavClick('dashboard', e)}
          >
            <img
              alt="ClaimIt Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVDgS-g_QQ1iiwo6rh3nt6Q78aVoc3sGZI7kiZRt5mUI8eXsxr6fenZ-8hqsvaN0_BfyJqnKpBjT7kfJ2ftSToXWq9ayg2Is6bnPsQg7rRSlO-RBlZbxBZUpCoP7lPeeYy4Ne4f_AR25vjWlfW_HhLlcPVNr2uaU3zl2uZDvIy_xiFPkCm_bi2JnjYOODBF20XB4W85R9MC5PPnvkITwShhor84eckbUKgPP4WrsJa1zn_FHhQzuczhwHFtSpg-FuOzs4"
            />
          </a>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 flex flex-col gap-1.5 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path;

            return (
              <a
                key={item.path}
                href={`#${item.path}`}
                data-path={item.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => handleNavClick(item.path, e)}
                className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'rounded-lg text-sm font-semibold text-white bg-[#5170ff] shadow-sm'
                    : 'rounded-lg text-sm font-medium text-[#444655] bg-transparent hover:bg-[#e5eeff] hover:text-[#0b1c30]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-white' : 'text-[#444655]'
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main Column */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 w-full bg-white border-b border-[#E8E4D8] px-8 flex items-center justify-between shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)] z-20">
          {/* Date and Time */}
          <div className="flex items-center">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-lg border border-[#E8E4D8] bg-white text-sm">
              <span className="material-symbols-outlined text-[20px] text-[#5170ff]">
                calendar_today
              </span>

              <span className="font-bold text-[#23261F]">
                Wed, Sep 16, 2026
              </span>

              <span className="text-[#6E6858]/60">•</span>

              <span className="font-medium text-[#444655]">
                10:45 AM PST
              </span>
            </div>
          </div>

          {/* Notifications and User Profile */}
          <div className="flex items-center gap-3 relative">
            <button
              aria-label="Notifications"
              className="relative flex items-center justify-center p-2 rounded-lg text-[#444655] hover:bg-[#e5eeff] hover:text-[#0b1c30] transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">
                notifications
              </span>

              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
            </button>

            {/* User Profile Button with Modal Trigger */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                aria-label="User Profile"
                onClick={() => setIsProfileModalOpen((prev) => !prev)}
                className="flex items-center justify-center focus:outline-none rounded-full cursor-pointer hover:ring-2 hover:ring-[#5170ff]/30 transition-all"
                type="button"
              >
                {user.avatarUrl ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E8E4D8]">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#5170ff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[18px]">
                      person
                    </span>
                  </div>
                )}
              </button>

              {/* UserProfileModal Popover Card */}
              {isProfileModalOpen && (
                <div
                  ref={modalContainerRef}
                  className="absolute right-0 top-11 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <UserProfileModal
                    user={user}
                    onProfileSettings={handleOpenProfileSettings}
                    onLogout={handleLogout}
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8 w-full overflow-y-auto bg-[#f8f9ff]">
          <div className="max-w-[1340px] mx-auto w-full min-h-full flex flex-col flex-1">
            {/* Dynamic Content Container for Admin pages */}
            <div className="w-full flex-1">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Logout confirmation (same popup as the user side) */}
      <LogoutConfirmation
        isOpen={isLogoutConfirmationOpen}
        user={user}
        onCancel={() => setIsLogoutConfirmationOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}

export { AdminMainForm };