import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseConfigStatus,
  lookupEmailByUsername,
  updateUserProfile as apiUpdateProfile,
  uploadUserAvatar as apiUploadAvatar,
  updateUserEmail as apiUpdateEmail,
  verifyAndChangePassword as apiChangePassword,
  recordActivityLog,
} from '../lib/supabase.js';

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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      return (
        hash.includes('type=recovery') ||
        hash.includes('reset-password') ||
        search.includes('type=recovery')
      );
    }
    return false;
  });

  // Reference to prevent race conditions from overlapping async profile fetches
  const currentUserIdRef = useRef(null);
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
        const activeUser = fallbackUser || userRef.current;
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
        const activeUser = fallbackUser || userRef.current;
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
  }, [isConfigured]);

  const fetchProfileRef = useRef(fetchProfile);
  useEffect(() => {
    fetchProfileRef.current = fetchProfile;
  }, [fetchProfile]);

  // Initial session restoration and auth listener
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initAuth() {
      try {
        const hash = typeof window !== 'undefined' ? (window.location.hash || '') : '';
        const search = typeof window !== 'undefined' ? (window.location.search || '') : '';
        const isRecoveryFlow = hash.includes('type=recovery') || hash.includes('reset-password') || search.includes('type=recovery');
        if (isRecoveryFlow) {
          setIsPasswordRecovery(true);
        }

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
          const loadedProfile = await fetchProfileRef.current(initialSession.user.id, initialSession.user);
          
          if (!isMounted) return;

          // Verify status on initial restoration only if NOT in password recovery flow
          if (!isRecoveryFlow && loadedProfile && loadedProfile.status !== 'Active') {
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

    // Listen for hash changes to detect recovery URL
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        const h = window.location.hash || '';
        const s = window.location.search || '';
        if (h.includes('type=recovery') || h.includes('reset-password') || s.includes('type=recovery')) {
          setIsPasswordRecovery(true);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        // Specifically detect password recovery events emitted by Supabase GoTrue
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          if (newSession?.user) {
            currentUserIdRef.current = newSession.user.id;
            setSession(newSession);
            setUser(newSession.user);
          }
          setLoading(false);
          return;
        }

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
            const loadedProfile = await fetchProfileRef.current(newUserId, newSession.user);
            if (!isMounted) return;

            // Only enforce status lock when NOT actively in password recovery flow
            const hash = typeof window !== 'undefined' ? (window.location.hash || '') : '';
            const search = typeof window !== 'undefined' ? (window.location.search || '') : '';
            const isRecovery = hash.includes('type=recovery') || hash.includes('reset-password') || search.includes('type=recovery');

            if (!isRecovery && loadedProfile && loadedProfile.status !== 'Active') {
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
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isConfigured]);

  // Login operation
  // Login operation
  const login = useCallback(async (usernameOrEmail, password) => {
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

    if (!isConfigured) {
      // In-memory mock login for preview environment
      const lower = identifier.toLowerCase();
      let roleToUse = 'Student';
      let mockName = 'Taylor Swift';
      let mockEmail = identifier.includes('@') ? identifier : `${identifier}@campus.edu`;
      let mockDepartment = 'College of Computer Studies';
      let mockProgram = 'BS Information Technology';

      if (lower.includes('admin') || lower === 'sabrina') {
        roleToUse = 'Admin';
        mockName = 'Sabrina Carpenter';
        mockDepartment = 'System Administration';
      } else if (lower.includes('faculty') || lower.includes('prof') || lower === 'aquino') {
        roleToUse = 'Faculty';
        mockName = 'Dr. Miguel Aquino';
        mockDepartment = 'College of Nursing';
      } else {
        const cleanName = identifier.includes('@') ? identifier.split('@')[0] : identifier;
        mockName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        if (mockName.length < 3) mockName = 'Taylor Swift';
      }

      const mockUser = {
        id: `mock-${roleToUse.toLowerCase()}-${Date.now()}`,
        email: mockEmail,
      };

      const mockProfile = {
        id: mockUser.id,
        email: mockEmail,
        full_name: mockName,
        username: identifier.replace(/@.*/, ''),
        role: roleToUse,
        status: 'Active',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        school_id: roleToUse === 'Student' ? '2023-01452' : null,
        faculty_id: roleToUse === 'Faculty' ? 'FAC-2026-8812' : null,
        program: roleToUse === 'Student' ? mockProgram : null,
        year_level: roleToUse === 'Student' ? '3rd Year' : null,
        section: roleToUse === 'Student' ? 'BSIT 3-A' : null,
        department: mockDepartment,
        campus: 'Main Campus',
      };

      currentUserIdRef.current = mockUser.id;
      setSession({ user: mockUser });
      setUser(mockUser);
      setProfile(mockProfile);
      setDevPreviewMode(true);

      recordActivityLog({
        action: 'login',
        notes: `${mockProfile.full_name} (${roleToUse}) signed in`,
        targetUserId: mockUser.id,
        targetName: mockProfile.full_name,
        targetRole: roleToUse,
        actorId: mockUser.id,
        actorName: mockProfile.full_name,
        actorRole: roleToUse,
        metadata: { email: mockEmail, role: roleToUse, preview: true },
      }).catch(() => {});

      return {
        success: true,
        user: mockUser,
        profile: mockProfile,
        role: roleToUse,
        status: 'Active',
      };
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

        const actorName = userProfile?.full_name || userProfile?.username || data.user.email?.split('@')[0] || 'User';
        const actorRole = userProfile?.role || 'Student';

        // Record successful login audit log
        recordActivityLog({
          action: 'login',
          notes: `${actorName} (${actorRole}) signed in`,
          targetUserId: data.user.id,
          targetName: actorName,
          targetRole: actorRole,
          actorId: data.user.id,
          actorName: actorName,
          actorRole: actorRole,
          metadata: { email: data.user.email, role: actorRole },
        }).catch(() => {});
        
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
    setError(null);

    const isFacultyRole = String(registrationData.role).toLowerCase() === 'faculty';
    const cleanFullName = (registrationData.fullName || '').trim() || 'ClaimIt User';
    const cleanEmail = (registrationData.email || '').trim().toLowerCase() || 'user@campus.edu';
    const cleanStudentId = (registrationData.studentId || '').trim();
    const cleanFacultyId = (registrationData.facultyId || '').trim();
    const cleanProgram = (registrationData.program || '').trim();
    const cleanYearLevel = (registrationData.yearLevel || '').trim();
    const cleanSection = (registrationData.section || '').trim();
    const cleanDepartment = (registrationData.department || '').trim();
    const rawUsername = cleanEmail.split('@')[0] || cleanFullName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!isConfigured) {
      const mockUser = {
        id: `mock-${Date.now()}`,
        email: cleanEmail,
      };

      const mockProfile = {
        id: mockUser.id,
        email: cleanEmail,
        full_name: cleanFullName,
        username: rawUsername,
        role: isFacultyRole ? 'Faculty' : 'Student',
        status: isFacultyRole ? 'Pending approval' : 'Active',
        school_id: cleanStudentId || '2026-0001',
        program: cleanProgram || 'BS Information Technology',
        year_level: cleanYearLevel || '1st Year',
        section: cleanSection || '1-A',
        faculty_id: cleanFacultyId || 'FAC-2026-001',
        department: cleanDepartment || 'College of Computer Studies',
        campus: 'Main Campus',
      };

      if (!isFacultyRole) {
        currentUserIdRef.current = mockUser.id;
        setSession({ user: mockUser });
        setUser(mockUser);
        setProfile(mockProfile);
      }

      recordActivityLog({
        action: 'register',
        notes: `New ${isFacultyRole ? 'Faculty' : 'Student'} registration: ${cleanFullName}`,
        targetUserId: mockUser.id,
        targetName: cleanFullName,
        targetRole: isFacultyRole ? 'Faculty' : 'Student',
        actorId: mockUser.id,
        actorName: cleanFullName,
        actorRole: isFacultyRole ? 'Faculty' : 'Student',
        metadata: { email: cleanEmail, role: isFacultyRole ? 'Faculty' : 'Student' },
      }).catch(() => {});

      return {
        success: true,
        user: mockUser,
        session: isFacultyRole ? null : { user: mockUser },
        requiresEmailVerification: false,
        requiresFacultyApproval: isFacultyRole,
        role: isFacultyRole ? 'Faculty' : 'Student',
      };
    }

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

      recordActivityLog({
        action: 'register',
        notes: `New ${isFacultyRole ? 'Faculty' : 'Student'} registration: ${cleanFullName}`,
        targetUserId: data?.user?.id,
        targetName: cleanFullName,
        targetRole: isFacultyRole ? 'Faculty' : 'Student',
        actorId: data?.user?.id,
        actorName: cleanFullName,
        actorRole: isFacultyRole ? 'Faculty' : 'Student',
        metadata: { email: cleanEmail, role: isFacultyRole ? 'Faculty' : 'Student' },
      }).catch(() => {});

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

  // Password Recovery - Step 1: Request recovery email/code
  const requestPasswordReset = useCallback(async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }

    if (!isConfigured) {
      return {
        success: true,
        data: {},
        message: 'Recovery code sent (in preview mode: enter code 123456 to continue).',
      };
    }

    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/#reset-password` : undefined;
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (resetError) {
        let msg = resetError.message;
        if (msg.includes('rate limit') || resetError.status === 429) {
          msg = 'Email rate limit exceeded. Please wait a few minutes before requesting another code.';
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          msg = "We couldn't connect to the server. Check your connection and try again.";
        }
        return { success: false, error: msg };
      }

      return {
        success: true,
        data,
        message: 'If an account matches that email address, recovery instructions have been sent.',
      };
    } catch (err) {
      let msg = err?.message || 'An unexpected error occurred while requesting password reset.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = "We couldn't connect to the server. Check your connection and try again.";
      }
      return { success: false, error: msg };
    }
  }, [isConfigured]);

  // Password Recovery - Step 2: Verify 6-digit OTP code
  const verifyRecoveryOtp = useCallback(async (email, token) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanToken = (token || '').trim();

    if (!cleanEmail) {
      return { success: false, error: 'Email address is missing.' };
    }
    if (!cleanToken || cleanToken.length < 6) {
      return { success: false, error: 'Please enter the complete 6-digit verification code.' };
    }

    if (!isConfigured) {
      const mockUser = { id: 'mock-recovery-user', email: cleanEmail };
      setSession({ user: mockUser });
      setUser(mockUser);
      return {
        success: true,
        session: { user: mockUser },
        user: mockUser,
      };
    }

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'recovery',
      });

      if (verifyError) {
        let msg = verifyError.message;
        if (msg.includes('Token has expired') || msg.includes('expired')) {
          msg = 'This verification code has expired. Please request a new code.';
        } else if (msg.includes('invalid') || msg.includes('Invalid') || verifyError.status === 400) {
          msg = 'Invalid verification code. Please check the 6-digit code and try again.';
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          msg = "We couldn't connect to the server. Check your connection and try again.";
        }
        return { success: false, error: msg };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.user);
      }
      setIsPasswordRecovery(true);

      return {
        success: true,
        session: data.session,
        user: data.user,
      };
    } catch (err) {
      let msg = err?.message || 'An unexpected error occurred while verifying the code.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = "We couldn't connect to the server. Check your connection and try again.";
      }
      return { success: false, error: msg };
    }
  }, [isConfigured]);

  // Password Recovery - Step 3: Update password using authenticated recovery session
  const updatePassword = useCallback(async (newPassword) => {
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    if (!isConfigured) {
      setIsPasswordRecovery(false);
      return {
        success: true,
        user: user || { id: 'mock-user' },
      };
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        let msg = updateError.message;
        if (msg.includes('Password should be at least')) {
          msg = 'Password must be at least 8 characters long.';
        } else if (msg.includes('Auth session missing') || msg.includes('session')) {
          msg = 'Your recovery session has expired. Please restart the password reset process.';
        } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          msg = "We couldn't connect to the server. Check your connection and try again.";
        }
        return { success: false, error: msg };
      }

      setIsPasswordRecovery(false);
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      recordActivityLog({
        action: 'reset_password_completed',
        notes: `Password reset completed successfully for ${data?.user?.email || user?.email || 'user'}`,
        targetUserId: data?.user?.id || user?.id,
        actorId: data?.user?.id || user?.id,
        metadata: { updated_at: new Date().toISOString() },
      }).catch(() => {});

      return {
        success: true,
        user: data.user,
      };
    } catch (err) {
      let msg = err?.message || 'An unexpected error occurred while updating your password.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        msg = "We couldn't connect to the server. Check your connection and try again.";
      }
      return { success: false, error: msg };
    }
  }, [isConfigured, user]);

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Logout operation
  const logout = useCallback(async () => {
    try {
      const activeUser = user || userRef.current;
      const activeProfile = profile;
      if (activeUser || activeProfile) {
        const actorName = activeProfile?.full_name || activeProfile?.username || activeUser?.email?.split('@')[0] || 'User';
        const actorRole = activeProfile?.role || 'Student';
        await recordActivityLog({
          action: 'logout',
          notes: `${actorName} (${actorRole}) signed out`,
          targetUserId: activeUser?.id || null,
          targetName: actorName,
          targetRole: actorRole,
          actorId: activeUser?.id || null,
          actorName: actorName,
          actorRole: actorRole,
          metadata: { email: activeUser?.email, role: actorRole },
        }).catch((err) => {
          console.warn('[ClaimIt] Logout audit notice:', err);
        });
      }

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
      setIsPasswordRecovery(false);
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    return { success: true };
  }, [isConfigured, user, profile]);

  // Manual profile refresh
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
    return null;
  }, [user, fetchProfile]);

  // Self-Service Profile Update (Prompt 5)
  const updateUserProfile = useCallback(async (updates) => {
    if (!user?.id) {
      return { success: false, error: 'No active session found. Please log in.' };
    }

    // In-memory fallback if Supabase credentials are not configured
    if (!isConfigured) {
      setProfile((prev) => {
        const next = { ...(prev || {}), ...updates };
        return next;
      });
      return { success: true, profile: { ...profile, ...updates } };
    }

    const res = await apiUpdateProfile(user.id, updates);
    if (res.success && res.profile) {
      setProfile(res.profile);
    }
    return res;
  }, [user?.id, isConfigured, profile]);

  // Self-Service Avatar Upload (Prompt 5)
  const uploadAvatar = useCallback(async (file) => {
    if (!user?.id) {
      return { success: false, error: 'No active session found. Please log in.' };
    }

    if (!file) {
      return { success: false, error: 'Please choose an image file to upload.' };
    }

    // MIME type check
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return {
        success: false,
        error: 'Unsupported image format. Allowed formats are JPG, PNG, WEBP, and GIF.',
      };
    }

    // Size limit check (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: 'File size exceeds 2MB limit. Please choose a smaller image.',
      };
    }

    if (!isConfigured) {
      const localUrl = URL.createObjectURL(file);
      setProfile((prev) => ({ ...(prev || {}), avatar_url: localUrl }));
      return { success: true, publicUrl: localUrl };
    }

    const res = await apiUploadAvatar(user.id, file);
    if (res.success && res.profile) {
      setProfile(res.profile);
    }
    return res;
  }, [user?.id, isConfigured]);

  // Self-Service Email Update (Prompt 5)
  const updateEmail = useCallback(async (newEmail) => {
    if (!user?.id) {
      return { success: false, error: 'No active session found. Please log in.' };
    }

    const cleanEmail = (newEmail || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Email address cannot be empty.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (cleanEmail === (user.email || profile?.email || '').toLowerCase()) {
      return { success: false, error: 'New email is identical to current email.' };
    }

    if (!isConfigured) {
      setUser((prev) => (prev ? { ...prev, email: cleanEmail } : null));
      setProfile((prev) => (prev ? { ...prev, email: cleanEmail } : null));
      return {
        success: true,
        message: 'Email updated in preview mode.',
        pendingVerification: false,
      };
    }

    const res = await apiUpdateEmail(cleanEmail);
    if (res.success) {
      // In Supabase, email update requires clicking the confirmation link.
      // Refresh profile to reflect any server updates.
      await fetchProfile(user.id);
    }
    return res;
  }, [user?.id, user?.email, profile?.email, isConfigured, fetchProfile]);

  // Self-Service Secure Password Change (Prompt 5)
  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    if (!user?.id) {
      return { success: false, error: 'No active session found. Please log in.' };
    }

    if (!currentPassword) {
      return { success: false, error: 'Current password is required.' };
    }

    if (!newPassword) {
      return { success: false, error: 'New password is required.' };
    }

    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    if (newPassword === currentPassword) {
      return { success: false, error: 'New password cannot be the same as your current password.' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'New password and confirmation password do not match.' };
    }

    if (!isConfigured) {
      return { success: true, message: 'Password updated in preview mode.' };
    }

    const currentEmail = user.email || profile?.email;
    if (!currentEmail) {
      return { success: false, error: 'Unable to verify email for current session. Please log in again.' };
    }

    return await apiChangePassword(currentEmail, currentPassword, newPassword);
  }, [user?.id, user?.email, profile?.email, isConfigured]);

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
    isPasswordRecovery,
    setIsPasswordRecovery,
    clearPasswordRecovery,
    login,
    register,
    logout,
    refreshProfile,
    updateUserProfile,
    uploadAvatar,
    updateEmail,
    changePassword,
    requestPasswordReset,
    verifyRecoveryOtp,
    updatePassword,
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
  isPasswordRecovery: false,
  setIsPasswordRecovery: () => {},
  clearPasswordRecovery: () => {},
  login: async () => ({ success: false, error: 'Authentication not initialized' }),
  register: async () => ({ success: false, error: 'Authentication not initialized' }),
  logout: async () => ({ success: true }),
  refreshProfile: async () => null,
  updateUserProfile: async () => ({ success: false, error: 'Authentication not initialized' }),
  uploadAvatar: async () => ({ success: false, error: 'Authentication not initialized' }),
  updateEmail: async () => ({ success: false, error: 'Authentication not initialized' }),
  changePassword: async () => ({ success: false, error: 'Authentication not initialized' }),
  requestPasswordReset: async () => ({ success: false, error: 'Authentication not initialized' }),
  verifyRecoveryOtp: async () => ({ success: false, error: 'Authentication not initialized' }),
  updatePassword: async () => ({ success: false, error: 'Authentication not initialized' }),
  clearError: () => {},
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_STATE;
}
