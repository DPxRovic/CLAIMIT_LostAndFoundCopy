import React, {
  useState,
  useRef,
  useEffect,
  lazy,
  Suspense,
} from 'react';

import AddReportItem from './myreports/AddReportItem.jsx';
import ReportSubmittedConfirmation from './myreports/ReportSubmittedConfirmation.jsx';
import { UserProfileModal } from '../shared/UserProfileModal.jsx';
import LogoutConfirmation from '../shared/LogoutConfirmation.jsx';
import Notifications from '../shared/Notifications.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

import HomePage from './Home.jsx';

// Load other pages only when needed.
const BrowseItems = lazy(() => import('./browseitems/BrowseItems.jsx'));
const MyReports = lazy(() => import('./myreports/MyReports.jsx'));
const ClaimsAndMatches = lazy(() => import('./claimsandmatches/ClaimsAndMatches.jsx'));
const ProfileSettings = lazy(() => import('./ProfileSettings.jsx'));

// Loading fallback for lazy-loaded pages.
// (Moved outside the component so it isn't recreated on every render.)
const PageLoading = ({ label }) => (
  <div className="flex w-full items-center justify-center py-20">
    <p className="text-sm text-[#6E6858]">Loading {label}...</p>
  </div>
);

// Placeholder notifications for UI work. Replace with real data later.
const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Your claim was approved', unread: true },
  { id: 2, title: 'New item matches your report', unread: true },
  { id: 3, title: 'Report submitted successfully', unread: false },
];

/**
 * MainForm_User layout component for ClaimIt.
 *
 * Handles:
 * - Navbar and page navigation
 * - Report Item modal
 * - Report Submitted confirmation
 * - Notifications dropdown
 * - Profile dropdown
 * - Profile Settings navigation
 * - Logout confirmation
 *
 * The outer wrapper sets Inter, so every user page and popup rendered inside
 * this layout uses Inter.
 */

export default function MainForm_User({
  onNavigate,
  onReportItem,
  onProfileSettings,
  onLogout,
  user: initialUser,
}) {
  const authContext = useAuth();

  const defaultUser = {
    name: 'Taylor Swift',
    email: 'taylorswift@gmail.com',
    role: 'Student',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  };

  const user = initialUser || authContext?.formattedUser || defaultUser;

  // Default page.
  const [currentTab, setCurrentTab] = useState('home');

  // Navbar and profile states.
  const [imageError, setImageError] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] =
    useState(false);

  // Notification states.
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Report modal states.
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReportConfirmationOpen, setIsReportConfirmationOpen] =
    useState(false);

  // Stores the details of the most recently submitted report.
  const [submittedReport, setSubmittedReport] = useState(null);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'browse-items', label: 'Browse Items' },
    { id: 'my-reports', label: 'My Reports' },
    { id: 'my-claims', label: 'Claims & Matches' },
  ];

  // Close profile / notification dropdowns when clicking outside.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileModalOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isProfileModalOpen || isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileModalOpen, isNotificationOpen]);

  // Notifications action handlers.
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleMarkNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Handle navbar navigation.
  const handleTabClick = (event, path) => {
    event.preventDefault();

    setCurrentTab(path);

    if (onNavigate) {
      onNavigate(path);
    }
  };

  // Open Report Item modal.
  const handleReportItemClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsReportModalOpen(true);

    if (onReportItem) {
      onReportItem();
    }
  };

  // Close Report Item modal.
  const handleCloseModal = () => {
    setIsReportModalOpen(false);
  };

  // Submit report and show the confirmation modal.
  const handleModalSubmit = (reportData) => {
    // Generate a demonstration report ID.
    // Replace this with the ID returned by your backend when connected.
    const reportId = `R-${String(Date.now()).slice(-6)}`;

    const newReport = {
      ...reportData,
      reportId,
    };

    setSubmittedReport(newReport);

    // Close the form first, then show the confirmation.
    setIsReportModalOpen(false);
    setIsReportConfirmationOpen(true);

    console.log('Report submitted:', newReport);
  };

  // Close Report Submitted confirmation.
  const handleCloseReportConfirmation = () => {
    setIsReportConfirmationOpen(false);
  };

  // Navigate to My Reports from the confirmation modal.
  const handleViewReports = () => {
    setIsReportConfirmationOpen(false);
    setCurrentTab('my-reports');

    if (onNavigate) {
      onNavigate('my-reports');
    }
  };

  // Navigate to Claims & Matches (from the Browse Items success popup).
  const handleViewClaims = () => {
    setCurrentTab('my-claims');

    if (onNavigate) {
      onNavigate('my-claims');
    }
  };

  // Open Profile & Settings page.
  const handleProfileSettings = () => {
    setIsProfileModalOpen(false);
    setCurrentTab('profile-settings');

    if (onProfileSettings) {
      onProfileSettings();
    }
  };

  // Open Logout Confirmation instead of immediately logging out.
  const handleLogout = () => {
    setIsProfileModalOpen(false);
    setIsLogoutConfirmationOpen(true);
  };

  // Cancel logout.
  const handleCancelLogout = () => {
    setIsLogoutConfirmationOpen(false);
  };

  // Confirm logout.
  const handleConfirmLogout = async () => {
    setIsLogoutConfirmationOpen(false);

    if (onLogout) {
      onLogout();
    }
    if (authContext) {
      await authContext.logout();
    }
  };

  // Navigate from Home to Browse Items.
  const handleBrowseAllClick = () => {
    setCurrentTab('browse-items');

    if (onNavigate) {
      onNavigate('browse-items');
    }
  };

  // Render the selected page.
  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <HomePage onBrowseAllClick={handleBrowseAllClick} onNavigateToClaims={handleViewClaims} />;

      case 'browse-items':
        return (
          <Suspense fallback={<PageLoading label="Browse Items" />}>
            <BrowseItems onNavigateToClaims={handleViewClaims} />
          </Suspense>
        );

      case 'my-reports':
        return (
          <Suspense fallback={<PageLoading label="My Reports" />}>
            <MyReports />
          </Suspense>
        );

      case 'my-claims':
        return (
          <Suspense fallback={<PageLoading label="Claims & Matches" />}>
            <ClaimsAndMatches />
          </Suspense>
        );

      case 'profile-settings':
        return (
          <Suspense fallback={<PageLoading label="Profile & Settings" />}>
            {/* Log Out in the sidebar opens the same logout confirmation as the profile menu */}
            <ProfileSettings onLogout={handleLogout} />
          </Suspense>
        );

      default:
        return <HomePage onBrowseAllClick={handleBrowseAllClick} onNavigateToClaims={handleViewClaims} />;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-[#f8f9ff] font-['Inter',ui-sans-serif,system-ui,sans-serif] text-[#23261F] antialiased">

      {/* =========================
          HEADER / NAVBAR
      ========================== */}
      <header className="relative z-50 w-full shrink-0 border-b border-[#E8E4D8] bg-white">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-[22px]">

          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">

            {/* Logo */}
            <a
              className="flex shrink-0 items-center focus:outline-none"
              data-path="home"
              href="#home"
              onClick={(event) => handleTabClick(event, 'home')}
            >
              {!imageError ? (
                <img
                  alt="ClaimIt Logo"
                  className="h-8 w-auto select-none object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNd2kKAy611ZAiDZzEnrENDlpP2SNj5UKDlhXChAJBo8X9ZmQUkGURH1GTMgj5294lZZOORyDc9ff9Bp7adnyJDAKUOTBtM8z3PM34Ggk_wJZeVsLlOQnoGSCt5HaT8MBN3KBMaaPnm-erb8lE84t6g8i03uARXSyrAwTKflKbzM2uEoW_Yb29LqoV2fDSlcpM-F2AbPqn5Nau2bv0XJx95TY1D0NWceGcTK07E3mDLgiHWM7baKGrv44T2Sjm0F896js"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex select-none items-center text-[26px] font-extrabold tracking-tight">

                  <span className="relative mr-0.5 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-[#23261F]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line
                        x1="21"
                        y1="21"
                        x2="16.65"
                        y2="16.65"
                        strokeWidth="3"
                      />
                    </svg>
                  </span>

                  <span className="-ml-3 pl-3 text-[#23261F]">
                    laim
                  </span>

                  <span className="text-[#5170ff]">
                    it
                  </span>
                </div>
              )}
            </a>

            {/* Navigation */}
            <nav className="hidden h-full items-center gap-4 md:flex">
              {navItems.map((item) => {
                const isActive = currentTab === item.id;

                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    data-path={item.id}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(event) => handleTabClick(event, item.id)}
                    className={`inline-flex items-center border-b-2 px-1 py-1 text-sm transition-colors ${
                      isActive
                        ? 'border-[#5170ff] font-semibold text-[#5170ff]'
                        : 'border-transparent font-medium text-[#6E6858] hover:text-[#23261F]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons & Buttons */}
          <div className="flex shrink-0 items-center gap-4">

            {/* Report Item Button (same as the admin primary button) */}
            <button
              type="button"
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-[#5170ff] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#4767f6]"
              onClick={handleReportItemClick}
            >
              <svg
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>

              <span>Report Item</span>
            </button>

            {/* Notifications */}
            <div className="relative inline-block" ref={notificationRef}>
              <button
                aria-label="Notifications"
                onClick={() => {
                  setIsNotificationOpen((previous) => !previous);
                  setIsProfileModalOpen(false);
                }}
                className="relative flex cursor-pointer items-center justify-center rounded-lg p-2 text-[#6E6858] transition-colors hover:bg-[#F3F4F6] hover:text-[#23261F]"
                type="button"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>

                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
                )}
              </button>

              {/* Notifications Popover */}
              {isNotificationOpen && (
                <Notifications
                  notifications={notifications}
                  onClose={() => setIsNotificationOpen(false)}
                  onMarkAllAsRead={handleMarkAllNotificationsRead}
                  onMarkAsRead={handleMarkNotificationAsRead}
                  // This page already closes the panel on outside clicks (and the bell toggles it)
                  closeOnOutsideClick={false}
                />
              )}
            </div>

            {/* User Profile */}
            <div className="relative inline-block" ref={profileRef}>
              <button
                aria-label="User Profile"
                onClick={() => {
                  setIsProfileModalOpen((previous) => !previous);
                  setIsNotificationOpen(false);
                }}
                className="flex cursor-pointer items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:ring-[#5170ff]/30 focus:outline-none"
                type="button"
              >
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#5170ff]">

                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'User profile'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-[18px] w-[18px] text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                      />
                    </svg>
                  )}
                </div>
              </button>

              {/* User Profile Popover */}
              {isProfileModalOpen && (
                <div className="absolute right-0 top-full z-50 mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <UserProfileModal
                    user={user}
                    onProfileSettings={handleProfileSettings}
                    onLogout={handleLogout}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <main className="flex min-h-[calc(100vh-4rem)] w-full flex-1 flex-col items-center bg-[#f8f9ff]">

        <div className="flex w-full flex-1 flex-col">

          {/* Shared page container */}
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-[22px] py-10">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="mt-auto w-full shrink-0 border-t border-[#E8E4D8] bg-white py-6">

        <div className="mx-auto flex max-w-7xl justify-end px-[22px]">
          <p className="text-right text-sm font-normal text-[#6E6858]">
            © 2026 ClaimIt. All rights reserved.
          </p>
        </div>
      </footer>

      {/* =========================
          REPORT ITEM MODAL
      ========================== */}
      <AddReportItem
        isOpen={isReportModalOpen}
        onClose={handleCloseModal}
        onCancel={handleCloseModal}
        onSubmit={handleModalSubmit}
      />

      {/* =========================
          REPORT SUBMITTED CONFIRMATION
      ========================== */}
      <ReportSubmittedConfirmation
        isOpen={isReportConfirmationOpen}
        onClose={handleCloseReportConfirmation}
        onViewReports={handleViewReports}
        reportId={submittedReport?.reportId ?? 'R-0000'}
        reportType={submittedReport?.reportType ?? 'lost'}
      />

      {/* =========================
          LOGOUT CONFIRMATION
      ========================== */}
      <LogoutConfirmation
        isOpen={isLogoutConfirmationOpen}
        user={user}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />

    </div>
  );
}

export { MainForm_User };