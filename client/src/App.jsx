import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/auth/Login.jsx';
import AdminMainForm from './components/admin/Responsiveness.jsx';
import MainForm_User from './components/user/MainForm_User.jsx';
import DatabaseSchemaNotice from './components/shared/DatabaseSchemaNotice.jsx';

/**
 * ClaimIt Loading Screen
 * Displayed while verifying Supabase Auth session and loading profile.
 */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col items-center justify-center p-4 select-none font-['Inter',ui-sans-serif,system-ui,sans-serif]">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="flex items-center text-3xl font-extrabold tracking-tight">
          <span className="relative flex items-center justify-center mr-0.5">
            <svg className="w-8 h-8 text-[#23261F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3" />
            </svg>
          </span>
          <span className="text-[#23261F] -ml-5 pl-5">laim</span>
          <span className="text-[#5170ff]">it</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm font-medium text-[#6E6858]">
          <svg className="animate-spin h-4 w-4 text-[#5170ff]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading session...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Main application container containing role-based routing and session guards.
 */
function AppContent() {
  const { user, role, status, loading, logout, devPreviewMode, setDevPreviewRole, schemaMissing } = useAuth();
  const [adminViewMode, setAdminViewMode] = useState('admin'); // 'admin' | 'user-preview'

  if (loading) {
    return <AuthLoadingScreen />;
  }

  // Not authenticated or account is not Active -> Show Login
  if (!user || status !== 'Active') {
    return <Login />;
  }

  // Authenticated as Admin
  if (role === 'Admin') {
    return (
      <div className="relative w-full h-screen">
        {schemaMissing && <DatabaseSchemaNotice projectId="fqehjgpksojjwdjkzjdh" />}
        {/* Admin Dev Mode floating switcher bar */}
        {devPreviewMode && (
          <aside
            aria-label="Developer Preview Controls"
            className="fixed top-2 right-4 z-[9999] bg-[#23261F] text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-emerald-300">Dev Preview: Admin</span>
            <button
              type="button"
              onClick={() => setDevPreviewRole('Student')}
              className="underline text-slate-300 hover:text-white cursor-pointer ml-1"
            >
              Switch to Student
            </button>
            <span className="text-white/30">•</span>
            <button
              type="button"
              onClick={logout}
              className="text-red-300 hover:text-red-200 cursor-pointer"
            >
              Exit Preview
            </button>
          </aside>
        )}

        {/* Admin view or Admin previewing user interface */}
        {adminViewMode === 'user-preview' ? (
          <div>
            <div className="bg-[#5170ff] text-white text-xs py-2 px-4 flex items-center justify-between sticky top-0 z-50">
              <span className="font-medium">
                Admin Mode: You are previewing the student/faculty user interface.
              </span>
              <button
                type="button"
                onClick={() => setAdminViewMode('admin')}
                className="bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded text-white font-semibold cursor-pointer transition-colors"
              >
                Return to Admin Dashboard
              </button>
            </div>
            <MainForm_User onLogout={logout} />
          </div>
        ) : (
          <AdminMainForm onLogout={logout} />
        )}
      </div>
    );
  }

  // Authenticated as Student, Faculty, or Staff
  return (
    <div className="relative w-full min-h-screen">
      {schemaMissing && <DatabaseSchemaNotice projectId="fqehjgpksojjwdjkzjdh" />}
      {devPreviewMode && (
        <aside
          aria-label="Developer Preview Controls"
          className="fixed top-2 right-4 z-[9999] bg-[#23261F] text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/10"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-emerald-300">Dev Preview: {role || 'Student'}</span>
          <button
            type="button"
            onClick={() => setDevPreviewRole('Admin')}
            className="underline text-slate-300 hover:text-white cursor-pointer ml-1"
          >
            Switch to Admin
          </button>
          <span className="text-white/30">•</span>
          <button
            type="button"
            onClick={logout}
            className="text-red-300 hover:text-red-200 cursor-pointer"
          >
            Exit Preview
          </button>
        </aside>
      )}
      <MainForm_User onLogout={logout} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
