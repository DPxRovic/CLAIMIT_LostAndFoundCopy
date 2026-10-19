import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseConfigStatus, lookupEmailByUsername } from '../lib/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfigured] = useState(isSupabaseConfigured());
  const [devPreviewMode, setDevPreviewMode] = useState(false);

  // Reference to prevent race conditions from overlapping async profile fetches
  const currentUserIdRef = useRef(null);

  // Fetch authoritative profile from public.profiles
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || !isConfigured) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Guard against race condition: check if current user is still the same
      if (currentUserIdRef.current !== userId) {
        return null;
      }

      if (profileErr) {
        console.error('[ClaimIt Auth] Error fetching user profile:', profileErr.message);
        setError(`Failed to load user profile: ${profileErr.message}`);
        setProfile(null);
        return null;
      }

      if (!data) {
        console.warn('[ClaimIt Auth] Profile record not found for user:', userId);
        setError('Your user account profile was not found. Please contact campus administration.');
        setProfile(null);
        return null;
      }

      setError(null);
      setProfile(data);
      return data;
    } catch (err) {
      if (currentUserIdRef.current === userId) {
        console.error('[ClaimIt Auth] Unexpected error fetching profile:', err);
        setError('An unexpected error occurred while loading your profile.');
        setProfile(null);
      }
      return null;
    }
  }, [isConfigured]);

  // Initial session restoration and auth listener
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (sessionError) {
          console.error('[ClaimIt Auth] Error getting session:', sessionError.message);
          setError(sessionError.message);
          setLoading(false);
          return;
        }

        if (initialSession?.user) {
          currentUserIdRef.current = initialSession.user.id;
          setSession(initialSession);
          setUser(initialSession.user);
          const loadedProfile = await fetchProfile(initialSession.user.id);
          
          // Verify status on initial restoration
          if (loadedProfile && loadedProfile.status !== 'Active') {
            await supabase.auth.signOut();
            currentUserIdRef.current = null;
            setSession(null);
            setUser(null);
            setProfile(null);
            if (loadedProfile.status === 'Suspended') {
              setError(`This account is suspended: ${loadedProfile.suspend_reason || 'Please contact administration.'}`);
            } else if (loadedProfile.status === 'Pending approval') {
              setError('Your faculty registration is pending administrative approval.');
            } else if (loadedProfile.status === 'Declined') {
              setError(`Your registration was declined: ${loadedProfile.declined_reason || 'Please contact administration.'}`);
            } else if (loadedProfile.status === 'Inactive') {
              setError(`This account is deactivated: ${loadedProfile.inactive_reason || 'Please contact administration.'}`);
            }
          }
        } else {
          currentUserIdRef.current = null;
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[ClaimIt Auth] Initialization error:', err);
          setError('Failed to initialize authentication.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT' || !newSession?.user) {
          currentUserIdRef.current = null;
          setSession(null);
          setUser(null);
          setProfile(null);
          setError(null);
          setLoading(false);
        } else if (newSession?.user) {
          const newUserId = newSession.user.id;
          const userChanged = currentUserIdRef.current !== newUserId;
          currentUserIdRef.current = newUserId;
          setSession(newSession);
          setUser(newSession.user);

          if (userChanged || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const loadedProfile = await fetchProfile(newUserId);
            if (loadedProfile && loadedProfile.status !== 'Active') {
              await supabase.auth.signOut();
              currentUserIdRef.current = null;
              setSession(null);
              setUser(null);
              setProfile(null);
              return;
            }
          }
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      currentUserIdRef.current = null;
      subscription.unsubscribe();
    };
  }, [isConfigured, fetchProfile]);

  // Login operation
  const login = useCallback(async (usernameOrEmail, password) => {
    if (!isConfigured) {
      const err = 'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.';
      setError(err);
      return { success: false, error: err };
    }

    setError(null);

    const identifier = (usernameOrEmail || '').trim();
    if (!identifier) {
      const err = 'Please enter your username or email.';
      setError(err);
      return { success: false, error: err };
    }

    if (!password) {
      const err = 'Please enter your password.';
      setError(err);
      return { success: false, error: err };
    }

    try {
      let emailToUse = identifier;

      // If user typed a username without @, try looking up their registered email
      if (!identifier.includes('@')) {
        const resolvedEmail = await lookupEmailByUsername(identifier);
        if (resolvedEmail) {
          emailToUse = resolvedEmail;
        } else {
          emailToUse = identifier;
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse.toLowerCase(),
        password,
      });

      if (signInError) {
        let userMessage = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email/username or password. Please verify your credentials.';
        } else if (signInError.message.includes('Email not confirmed')) {
          userMessage = 'Your email address has not been confirmed. Please check your inbox.';
        }
        setError(userMessage);
        return { success: false, error: userMessage };
      }

      if (data?.user) {
        currentUserIdRef.current = data.user.id;
        setSession(data.session);
        setUser(data.user);
        
        const userProfile = await fetchProfile(data.user.id);

        // Enforce account status restrictions authoritatively
        if (userProfile) {
          if (userProfile.status === 'Suspended') {
            await supabase.auth.signOut();
            currentUserIdRef.current = null;
            setSession(null);
            setUser(null);
            setProfile(null);
            const reason = userProfile.suspend_reason ? `: "${userProfile.suspend_reason}"` : '';
            const msg = `This account has been suspended${reason}. Please contact campus administration.`;
            setError(msg);
            return { success: false, error: msg, status: 'Suspended' };
          }

          if (userProfile.status === 'Pending approval') {
            await supabase.auth.signOut();
            currentUserIdRef.current = null;
            setSession(null);
            setUser(null);
            setProfile(null);
            const msg = 'Your faculty registration is currently pending administrator approval. You will receive access once an administrator reviews your account.';
            setError(msg);
            return { success: false, error: msg, status: 'Pending approval' };
          }

          if (userProfile.status === 'Declined') {
            await supabase.auth.signOut();
            currentUserIdRef.current = null;
            setSession(null);
            setUser(null);
            setProfile(null);
            const reason = userProfile.declined_reason ? `: "${userProfile.declined_reason}"` : '';
            const msg = `Your faculty registration was declined${reason}. Please contact campus administration for assistance.`;
            setError(msg);
            return { success: false, error: msg, status: 'Declined' };
          }

          if (userProfile.status === 'Inactive') {
            await supabase.auth.signOut();
            currentUserIdRef.current = null;
            setSession(null);
            setUser(null);
            setProfile(null);
            const reason = userProfile.inactive_reason ? `: "${userProfile.inactive_reason}"` : '';
            const msg = `This account has been deactivated${reason}. Please contact campus administration.`;
            setError(msg);
            return { success: false, error: msg, status: 'Inactive' };
          }
        }
        
        // Return loaded profile along with user
        return {
          success: true,
          user: data.user,
          profile: userProfile,
          role: userProfile?.role || 'Student',
          status: userProfile?.status || 'Active',
        };
      }

      return { success: false, error: 'Failed to retrieve user session.' };
    } catch (err) {
      const errMsg = err?.message || 'An unexpected error occurred during login.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, [isConfigured, fetchProfile]);

  // Logout operation
  const logout = useCallback(async () => {
    try {
      if (isConfigured) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.error('[ClaimIt Auth] Sign out error:', signOutError.message);
        }
      }
    } catch (err) {
      console.error('[ClaimIt Auth] Sign out exception:', err);
    } finally {
      currentUserIdRef.current = null;
      setSession(null);
      setUser(null);
      setProfile(null);
      setError(null);
      setDevPreviewMode(false);
    }
    return { success: true };
  }, [isConfigured]);

  // Manual profile refresh
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
    return null;
  }, [user, fetchProfile]);

  // Developer Preview switcher (Used ONLY in unconfigured development mode for visual inspection)
  const setDevPreviewRole = useCallback((roleName) => {
    if (isConfigured) return; // Disallowed in production / configured environments
    if (!roleName) {
      setDevPreviewMode(false);
      setUser(null);
      setProfile(null);
      return;
    }

    setDevPreviewMode(true);
    const mockUser = {
      id: 'dev-preview-id',
      email: roleName === 'Admin' ? 'admin@claimit.ucc.edu.ph' : 'student@claimit.ucc.edu.ph',
    };
    const mockProfile = {
      id: 'dev-preview-id',
      email: mockUser.email,
      full_name: roleName === 'Admin' ? 'Sabrina Carpenter' : 'Taylor Swift',
      username: roleName === 'Admin' ? 'sabrina' : 'taylor',
      role: roleName,
      status: 'Active',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      school_id: roleName === 'Student' ? '2023-01452' : null,
      program: roleName === 'Student' ? 'BS Information Technology' : null,
      year_level: roleName === 'Student' ? '3rd Year' : null,
      section: roleName === 'Student' ? 'BSIT 3-A' : null,
      department: roleName === 'Faculty' ? 'Computer Studies' : null,
    };
    setUser(mockUser);
    setProfile(mockProfile);
  }, [isConfigured]);

  // Role and status derived authoritatively from public.profiles
  const role = profile?.role || null;
  const status = profile?.status || null;

  const isAdmin = role === 'Admin' && status === 'Active';
  const isFaculty = role === 'Faculty' && status === 'Active';
  const isStudent = role === 'Student' && status === 'Active';
  const isActive = status === 'Active';
  const isPending = status === 'Pending approval';
  const isSuspended = status === 'Suspended';
  const isInactive = status === 'Inactive';
  const isDeclined = status === 'Declined';

  // Standard user object formatted for UI modals (UserProfileModal, LogoutConfirmation, headers)
  const formattedUser = profile ? {
    id: profile.id,
    name: profile.full_name || profile.username || 'ClaimIt User',
    fullName: profile.full_name,
    username: profile.username,
    email: profile.email || user?.email || '',
    role: profile.role || 'Student',
    status: profile.status || 'Active',
    avatarUrl: profile.avatar_url || '',
    schoolId: profile.school_id,
    program: profile.program,
    yearLevel: profile.year_level,
    section: profile.section,
    facultyId: profile.faculty_id,
    department: profile.department,
    position: profile.position,
    campus: profile.campus || 'Main Campus',
    contactNumber: profile.contact_number,
  } : null;

  const configStatus = getSupabaseConfigStatus();

  const value = {
    session,
    user,
    profile,
    formattedUser,
    loading,
    error,
    isConfigured,
    configStatus,
    role,
    status,
    isAdmin,
    isFaculty,
    isStudent,
    isActive,
    isPending,
    isSuspended,
    isInactive,
    isDeclined,
    devPreviewMode,
    setDevPreviewRole,
    login,
    logout,
    refreshProfile,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const DEFAULT_AUTH_STATE = {
  session: null,
  user: null,
  profile: null,
  formattedUser: null,
  loading: false,
  error: null,
  isConfigured: false,
  configStatus: { configured: false, missing: [] },
  role: null,
  status: null,
  isAdmin: false,
  isFaculty: false,
  isStudent: false,
  isActive: false,
  isPending: false,
  isSuspended: false,
  isInactive: false,
  isDeclined: false,
  devPreviewMode: false,
  setDevPreviewRole: () => {},
  login: async () => ({ success: false, error: 'Authentication not initialized' }),
  logout: async () => ({ success: true }),
  refreshProfile: async () => null,
  clearError: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_STATE;
}
