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

  const [schemaMissing, setSchemaMissing] = useState(false);

  // Reference to prevent race conditions from overlapping async profile fetches
  const currentUserIdRef = useRef(null);

  // Fetch authoritative profile from public.profiles
  const fetchProfile = useCallback(async (userId, fallbackUser = null) => {
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
        const errMsg = profileErr.message || '';
        const isTableOrSchemaIssue =
          profileErr.code === 'PGRST205' ||
          profileErr.code === '42P01' ||
          errMsg.toLowerCase().includes('schema cache') ||
          errMsg.toLowerCase().includes('profiles') ||
          errMsg.toLowerCase().includes('could not find the table') ||
          errMsg.toLowerCase().includes('relation "public.profiles" does not exist') ||
          errMsg.toLowerCase().includes('does not exist');

        if (isTableOrSchemaIssue) {
          console.warn(
            '[ClaimIt / Supabase] The "public.profiles" table is not yet created or cached in your Supabase project. ' +
            'Please run the migration in supabase/migrations/20261019000001_create_account_schema.sql in your Supabase SQL editor.'
          );
          setSchemaMissing(true);
        } else {
          console.warn('[ClaimIt Auth] Notice fetching profile:', errMsg);
        }

        // Synthesize fallback profile from user auth metadata so the app remains accessible
        const activeUser = fallbackUser || user;
        const meta = activeUser?.user_metadata || {};
        const fallbackProfile = {
          id: userId,
          email: activeUser?.email || '',
          full_name: meta.fullName || meta.full_name || meta.name || activeUser?.email?.split('@')[0] || 'ClaimIt User',
          username: meta.username || activeUser?.email?.split('@')[0] || 'user',
          role: meta.role || 'Student',
          status: meta.role === 'Faculty' ? 'Pending approval' : 'Active',
          school_id: meta.studentId || meta.school_id || '',
          program: meta.program || '',
          year_level: meta.yearLevel || '',
          section: meta.section || '',
          faculty_id: meta.facultyId || '',
          department: meta.department || '',
          campus: 'Main Campus',
          _isFallback: true,
        };
        setError(null);
        setProfile(fallbackProfile);
        return fallbackProfile;
      }

      if (!data) {
        // Table exists, but row was not inserted yet. Try user_metadata as fallback
        const activeUser = fallbackUser || user;
        const meta = activeUser?.user_metadata || {};
        if (meta.fullName || meta.role) {
          const fallbackProfile = {
            id: userId,
            email: activeUser?.email || '',
            full_name: meta.fullName || meta.full_name || meta.name || 'ClaimIt User',
            username: meta.username || activeUser?.email?.split('@')[0] || 'user',
            role: meta.role || 'Student',
            status: meta.role === 'Faculty' ? 'Pending approval' : 'Active',
            school_id: meta.studentId || '',
            program: meta.program || '',
            year_level: meta.yearLevel || '',
            section: meta.section || '',
            faculty_id: meta.facultyId || '',
            department: meta.department || '',
            campus: 'Main Campus',
            _isFallback: true,
          };
          setError(null);
          setProfile(fallbackProfile);
          return fallbackProfile;
        }

        console.warn('[ClaimIt Auth] Profile record not found for user:', userId);
        setError('Your user account profile was not found. Please contact campus administration.');
        setProfile(null);
        return null;
      }

      setError(null);
      setSchemaMissing(false);
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
  }, [isConfigured, user]);

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
          const loadedProfile = await fetchProfile(initialSession.user.id, initialSession.user);
          
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
            const loadedProfile = await fetchProfile(newUserId, newSession.user);
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
          userMessage = 'Invalid username or password. Please verify your credentials.';
        } else if (signInError.message.includes('Email not confirmed')) {
          userMessage = 'Your email address has not been confirmed. Please check your inbox to verify your address before signing in.';
        } else if (signInError.message.includes('Failed to fetch') || signInError.message.includes('NetworkError') || signInError.message.includes('network')) {
          userMessage = "We couldn't connect to the server. Check your connection and try again.";
        }
        setError(userMessage);
        return { success: false, error: userMessage };
      }

      if (data?.user) {
        currentUserIdRef.current = data.user.id;
        setSession(data.session);
        setUser(data.user);
        
        const userProfile = await fetchProfile(data.user.id, data.user);

        if (!userProfile) {
          await supabase.auth.signOut();
          currentUserIdRef.current = null;
          setSession(null);
          setUser(null);
          setProfile(null);
          const profileErrMsg = 'Account profile could not be loaded. Please contact campus administration.';
          setError(profileErrMsg);
          return { success: false, error: profileErrMsg };
        }

        // Enforce account status restrictions authoritatively
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
      let errMsg = err?.message || 'An unexpected error occurred during login.';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        errMsg = "We couldn't connect to the server. Check your connection and try again.";
      }
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, [isConfigured, fetchProfile]);

  // Real Supabase Auth Registration
  const register = useCallback(async (registrationData) => {
    if (!isConfigured) {
      const err = 'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.';
      setError(err);
      return { success: false, error: err };
    }

    setError(null);

    const isFacultyRole = String(registrationData.role).toLowerCase() === 'faculty';
    const cleanFullName = (registrationData.fullName || '').trim();
    const cleanEmail = (registrationData.email || '').trim().toLowerCase();
    const cleanStudentId = (registrationData.studentId || '').trim();
    const cleanFacultyId = (registrationData.facultyId || '').trim();
    const cleanProgram = (registrationData.program || '').trim();
    const cleanYearLevel = (registrationData.yearLevel || '').trim();
    const cleanSection = (registrationData.section || '').trim();
    const cleanDepartment = (registrationData.department || '').trim();
    const rawUsername = cleanEmail.split('@')[0] || cleanFullName.toLowerCase().replace(/[^a-z0-9]/g, '');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: registrationData.password,
        options: {
          data: {
            fullName: cleanFullName,
            full_name: cleanFullName,
            username: rawUsername,
            role: isFacultyRole ? 'Faculty' : 'Student',
            studentId: cleanStudentId,
            program: cleanProgram,
            yearLevel: cleanYearLevel,
            section: cleanSection,
            facultyId: cleanFacultyId,
            department: cleanDepartment,
          },
        },
      });

      if (signUpError) {
        let userMessage = signUpError.message;
        if (signUpError.message.includes('User already registered') || signUpError.message.includes('already registered')) {
          userMessage = 'An account with this email address already exists. Please log in instead.';
        } else if (signUpError.message.includes('Password should be at least')) {
          userMessage = 'Password must be at least 8 characters long.';
        } else if (signUpError.message.includes('rate limit')) {
          userMessage = 'Too many requests. Please wait a few minutes before trying again.';
        } else if (signUpError.message.includes('Failed to fetch') || signUpError.message.includes('NetworkError')) {
          userMessage = "We couldn't connect to the server. Check your connection and try again.";
        }
        setError(userMessage);
        return { success: false, error: userMessage };
      }

      // Supabase user enumeration protection check:
      // If user already exists and email confirmations are enabled, Supabase returns
      // data.user with empty identities array instead of an explicit error.
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const dupMsg = 'An account with this email address already exists. Please log in instead.';
        setError(dupMsg);
        return { success: false, error: dupMsg };
      }

      if (!data?.user) {
        const noUserMsg = 'Registration failed: No user identity was returned by the authentication service.';
        setError(noUserMsg);
        return { success: false, error: noUserMsg };
      }

      const requiresEmailVerification = !data?.session;
      const requiresFacultyApproval = isFacultyRole;

      // Security protection: If faculty registered, enforce pending approval gate
      if (requiresFacultyApproval && data?.session) {
        await supabase.auth.signOut();
        currentUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      // If active session exists (Student with immediate confirmation), ensure profile is loaded
      if (data?.session && !requiresFacultyApproval) {
        currentUserIdRef.current = data.user.id;
        setSession(data.session);
        setUser(data.user);
        const loadedProf = await fetchProfile(data.user.id, data.user);
        
        // If PostgreSQL trigger had any delay or failure and table exists, perform client fallback insert
        if (!loadedProf && !schemaMissing) {
          try {
            await supabase.from('profiles').insert({
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanFullName,
              username: rawUsername,
              role: 'Student',
              status: 'Active',
              school_id: cleanStudentId || null,
              program: cleanProgram || null,
              year_level: cleanYearLevel || null,
              section: cleanSection || null,
            });
            await fetchProfile(data.user.id, data.user);
          } catch (profileInsertErr) {
            console.warn('[ClaimIt Auth] Fallback profile insert note:', profileInsertErr);
          }
        }
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        requiresEmailVerification,
        requiresFacultyApproval,
        role: isFacultyRole ? 'Faculty' : 'Student',
      };
    } catch (err) {
      let errMsg = err?.message || 'An unexpected error occurred during registration.';
      if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
        errMsg = "We couldn't connect to the server. Check your connection and try again.";
      }
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  }, [isConfigured, fetchProfile, schemaMissing]);

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
    schemaMissing,
    login,
    register,
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
  schemaMissing: false,
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
  register: async () => ({ success: false, error: 'Authentication not initialized' }),
  logout: async () => ({ success: true }),
  refreshProfile: async () => null,
  clearError: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_STATE;
}
