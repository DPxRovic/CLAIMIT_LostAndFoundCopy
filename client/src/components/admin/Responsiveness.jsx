import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import UserProfileModal from '../shared/UserProfileModal.jsx';
import LogoutConfirmation from '../shared/LogoutConfirmation.jsx';

// Load admin pages from the pages folder.
const pageModules = import.meta.glob('./pages/*.jsx');

const createLazyPage = (fileName) => {
  const importPage = pageModules[`./pages/${fileName}.jsx`];
  return importPage ? lazy(importPage) : null;
};

const ADMIN_PAGES = {
  dashboard: createLazyPage('Dashboard'),
  'user-management': createLazyPage('UserManagement'),
  reports: createLazyPage('ReportsAdmin'),
  'manage-lists': createLazyPage('ManageLists'),
  'activity-logs': createLazyPage('ActivityLogs'),
  'profile-settings': createLazyPage('AdminProfileSettings'),
};

const NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: 'user-management', label: 'User Management', icon: 'group' },
  { path: 'reports', label: 'Reports', icon: 'description' },
  { path: 'manage-lists', label: 'Manage Lists', icon: 'format_list_bulleted' },
  { path: 'activity-logs', label: 'Activity Logs', icon: 'history' },
];

const DESKTOP_QUERY = '(min-width: 1024px)';

export default function Responsiveness({
  currentPath = 'manage-lists',
  onNavigate = () => {},
  onLogout,
  initialUser = {
    name: 'Sabrina Carpenter',
    email: 'sabrina@gmail.com',
    role: 'Admin',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
}) {
  const [activePath, setActivePath] = useState(currentPath);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] =
    useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(initialUser);

  const profileButtonRef = useRef(null);
  const modalContainerRef = useRef(null);

  // Load Material Symbols icons.
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

  // Keep the selected page synchronized with the parent.
  useEffect(() => {
    setActivePath(currentPath);
  }, [currentPath]);

  // Close the profile popup when clicking or tapping outside it.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isProfileModalOpen &&
        modalContainerRef.current &&
        !modalContainerRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileModalOpen]);

  // Close the drawer and profile popup with Escape.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsProfileModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Automatically close the drawer when switching to desktop width.
  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);

    const handleMediaChange = (event) => {
      if (event.matches) {
        setIsSidebarOpen(false);
      }
    };

    // Support modern browsers and older browser versions.
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);

  // Prevent the page behind the mobile drawer from scrolling.
  useEffect(() => {
    if (!isSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  const handleNavClick = (path, event) => {
    if (event) event.preventDefault();

    setIsProfileModalOpen(false);
    setIsSidebarOpen(false);
    setActivePath(path);
    onNavigate(path);
  };

  const handleOpenProfileSettings = () => {
    setIsProfileModalOpen(false);
    setIsSidebarOpen(false);
    setActivePath('profile-settings');
    onNavigate('profile-settings');
  };

  // Open the logout confirmation (same popup as the user side)
  const handleLogout = () => {
    setIsProfileModalOpen(false);
    setIsSidebarOpen(false);
    setIsLogoutConfirmationOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutConfirmationOpen(false);

    if (onLogout) {
      onLogout();
    } else {
      alert('Logged out successfully.');
    }
  };

  const renderContent = () => {
    const PageComponent = ADMIN_PAGES[activePath];

    if (!PageComponent) {
      return (
        <div className="w-full bg-white rounded-xl border border-[#E8E4D8] shadow-sm p-6 sm:p-10 lg:p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#5170ff] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[24px]">
              construction
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-[#23261F] capitalize">
            {activePath.replaceAll('-', ' ')}
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
          <div className="w-full py-16 flex items-center justify-center text-sm text-[#6E6858]">
            Loading page...
          </div>
        }
      >
        <PageComponent
          initialUser={user}
          onSaveProfile={(updated) =>
            setUser((previous) => ({ ...previous, ...updated }))
          }
          onSaveAccount={(updated) =>
            setUser((previous) => ({
              ...previous,
              email: updated.email,
            }))
          }
          onLogout={handleLogout}
        />
      </Suspense>
    );
  };

  return (
    <div className="flex w-full h-screen h-dvh min-h-0 overflow-hidden bg-[#f8f9ff] text-[#23261F] font-['Inter',ui-sans-serif,system-ui,sans-serif]">
      {/* Mobile and tablet backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        tabIndex={isSidebarOpen ? 0 : -1}
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-[#0b1c30]/40 backdrop-blur-[1px] transition-opacity duration-200 lg:hidden ${
          isSidebarOpen
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Responsive sidebar */}
      <aside
        id="admin-sidebar"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[260px] max-w-[85vw] flex-col border-r border-[#E8E4D8] bg-white shadow-xl transition-transform duration-200 ease-out
          lg:static lg:z-30 lg:w-[260px] lg:min-w-[260px] lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-[1px_0_8px_rgba(0,0,0,0.02)]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand header */}
        <div className="flex h-16 w-full shrink-0 items-center justify-between border-b border-[#E8E4D8] px-6">
          <a
            href="#dashboard"
            aria-label="ClaimIt Dashboard"
            onClick={(event) => handleNavClick('dashboard', event)}
            className="flex min-w-0 items-center focus:outline-none"
          >
            <img
              alt="ClaimIt Logo"
              className="h-8 w-auto max-w-full object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVDgS-g_QQ1iiwo6rh3nt6Q78aVoc3sGZI7kiZRt5mUI8eXsxr6fenZ-8hqsvaN0_BfyJqnKpBjT7kfJ2ftSToXWq9ayg2Is6bnPsQg7rRSlO-RBlZbxBZUpCoP7lPeeYy4Ne4f_AR25vjWlfW_HhLlcPVNr2uaU3zl2uZDvIy_xiFPkCm_bi2JnjYOODBF20XB4W85R9MC5PPnvkITwShhor84eckbUKgPP4WrsJa1zn_FHhQzuczhwHFtSpg-FuOzs4"
            />
          </a>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center justify-center rounded-lg p-2 text-[#444655] transition-colors hover:bg-[#e5eeff] hover:text-[#0b1c30] cursor-pointer lg:hidden"
          >
            <span className="material-symbols-outlined text-[22px]">
              close
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = activePath === item.path;

            return (
              <a
                key={item.path}
                href={`#${item.path}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={(event) => handleNavClick(item.path, event)}
                className={`flex min-w-0 items-center gap-3 px-3.5 py-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'rounded-lg bg-[#5170ff] text-sm font-semibold text-white shadow-sm'
                    : 'rounded-lg bg-transparent text-sm font-medium text-[#444655] hover:bg-[#e5eeff] hover:text-[#0b1c30]'
                }`}
              >
                <span
                  className={`material-symbols-outlined shrink-0 text-[20px] ${
                    isActive ? 'text-white' : 'text-[#444655]'
                  }`}
                >
                  {item.icon}
                </span>

                <span className="truncate">{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="z-20 flex h-16 w-full shrink-0 items-center justify-between gap-2 border-b border-[#E8E4D8] bg-white px-3 shadow-[0_1px_4px_rgba(0,0,0,0.02)] sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            {/* Hamburger menu on mobile and tablet */}
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-controls="admin-sidebar"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(true)}
              className="flex shrink-0 items-center justify-center rounded-lg p-2 text-[#444655] transition-colors hover:bg-[#e5eeff] hover:text-[#0b1c30] cursor-pointer lg:hidden"
            >
              <span className="material-symbols-outlined text-[24px]">
                menu
              </span>
            </button>

            {/* Date and time */}
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#E8E4D8] bg-white px-2.5 py-1.5 text-xs sm:gap-2.5 sm:px-4 sm:text-sm">
              <span className="material-symbols-outlined shrink-0 text-[18px] text-[#5170ff] sm:text-[20px]">
                calendar_today
              </span>

              <span className="truncate font-bold text-[#23261F]">
                <span className="hidden sm:inline">
                  Wed, Sep 16, 2026
                </span>
                <span className="sm:hidden">Sep 16, 2026</span>
              </span>

              <span className="hidden text-[#6E6858]/60 md:inline">
                •
              </span>

              <span className="hidden whitespace-nowrap font-medium text-[#444655] md:inline">
                10:45 AM PST
              </span>
            </div>
          </div>

          {/* Notifications and profile */}
          <div className="relative flex shrink-0 items-center gap-1 sm:gap-3">
            <button
              aria-label="Notifications"
              className="relative flex items-center justify-center rounded-lg p-2 text-[#444655] transition-colors hover:bg-[#e5eeff] hover:text-[#0b1c30] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">
                notifications
              </span>

              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
            </button>

            {/* Profile button */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                aria-label="User Profile"
                aria-expanded={isProfileModalOpen}
                aria-haspopup="true"
                onClick={() =>
                  setIsProfileModalOpen((previous) => !previous)
                }
                className="flex items-center justify-center rounded-full cursor-pointer transition-all hover:ring-2 hover:ring-[#5170ff]/30 focus:outline-none"
                type="button"
              >
                {user.avatarUrl ? (
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-[#E8E4D8]">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5170ff]">
                    <span className="material-symbols-outlined text-[18px] text-white">
                      person
                    </span>
                  </div>
                )}
              </button>

              {/* Keep the profile popup inside the viewport */}
              {isProfileModalOpen && (
                <div
                  ref={modalContainerRef}
                  className="absolute right-0 top-11 z-50 max-h-[calc(100dvh-5rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
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

        {/* Scrollable page content */}
        <main className="w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#f8f9ff] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto flex min-h-full w-full max-w-[1340px] flex-1 flex-col">
            <div className="w-full min-w-0 flex-1">
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

export { Responsiveness as AdminMainForm };