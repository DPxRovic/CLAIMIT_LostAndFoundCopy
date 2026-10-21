import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

export const getSupabaseConfigStatus = () => {
  const configured = isSupabaseConfigured();
  const missing = [];
  if (!supabaseUrl || supabaseUrl.includes('your-project')) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) missing.push('VITE_SUPABASE_ANON_KEY');
  return { configured, missing, url: supabaseUrl };
};

if (!isSupabaseConfigured()) {
  console.warn(
    '[ClaimIt / Supabase] Supabase credentials not fully configured. Using fallback client. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
}

/**
 * Look up registered user email by username to support username-based login.
 * Queries public.lookup_email_by_username RPC or public.profiles.
 */
export async function lookupEmailByUsername(username) {
  if (!username || !isSupabaseConfigured()) return null;
  const cleanUsername = username.trim();
  try {
    // 1. Try secure stored RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('lookup_email_by_username', {
      p_username: cleanUsername,
    });
    if (!rpcError && rpcData) {
      return rpcData;
    }

    // 2. Direct table lookup fallback
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (!error && data?.email) {
      return data.email;
    }
  } catch (err) {
    console.warn('[ClaimIt / Supabase] lookupEmailByUsername exception:', err);
  }
  return null;
}

// Export singleton Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Administrative RPC Wrappers
export async function adminApproveFaculty(targetUserId) {
  return await supabase.rpc('admin_approve_faculty', {
    target_user_id: targetUserId,
  });
}

export async function adminDeclineFaculty(targetUserId, reason, note = null) {
  return await supabase.rpc('admin_decline_faculty', {
    target_user_id: targetUserId,
    reason,
    note,
  });
}

export async function adminSuspendUser(targetUserId, reason = null) {
  return await supabase.rpc('admin_suspend_user', {
    target_user_id: targetUserId,
    reason,
  });
}

export async function adminReactivateUser(targetUserId) {
  return await supabase.rpc('admin_reactivate_user', {
    target_user_id: targetUserId,
  });
}

export async function adminDeactivateUser(targetUserId, reason = null) {
  return await supabase.rpc('admin_deactivate_user', {
    target_user_id: targetUserId,
    reason,
  });
}

export async function adminUpdateUserDetails(targetUserId, details) {
  return await supabase.rpc('admin_update_user_details', {
    target_user_id: targetUserId,
    new_full_name: details.name,
    new_username: details.username,
    new_role: details.role,
    new_program: details.program || null,
    new_section: details.section || null,
    new_department: details.department || null,
    new_position: details.position || null,
  });
}

export async function adminResetUserPassword(targetUserId, tempPassword) {
  return await supabase.rpc('admin_reset_user_password', {
    target_user_id: targetUserId,
    temp_password: tempPassword,
  });
}

/**
 * Administrative Account Creation:
 * Uses a transient Supabase client with persistSession: false so the active administrator's
 * session is preserved while safely creating the new user in auth.users and public.profiles.
 */
export async function adminCreateAccount(payload) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  const isStudent = payload.type === 'student';
  const requestedRole = isStudent ? 'Student' : 'Faculty';
  const cleanEmail = (payload.email || '').trim().toLowerCase();

  const transientClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  try {
    const { data, error } = await transientClient.auth.signUp({
      email: cleanEmail,
      password: payload.password,
      options: {
        data: {
          fullName: payload.name.trim(),
          role: requestedRole,
          studentId: payload.schoolId || '',
          program: payload.program || '',
          yearLevel: payload.yearLevel || '',
          section: payload.section || '',
          facultyId: payload.facultyId || '',
          department: payload.department || '',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user identity in authentication provider.' };
    }

    if (data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        error: 'An account with this email address already exists in the system.',
      };
    }

    // Record administrative creation in audit logs
    try {
      const { data: adminUser } = await supabase.auth.getUser();
      if (adminUser?.user?.id) {
        await supabase.from('account_audit_logs').insert({
          target_user_id: data.user.id,
          actor_id: adminUser.user.id,
          action: 'create_account',
          notes: `Administrator created ${requestedRole} account`,
          metadata: { role: requestedRole, email: cleanEmail },
        });
      }
    } catch (auditErr) {
      console.warn('[ClaimIt Admin] Audit log notice:', auditErr);
    }

    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err?.message || 'Unexpected error creating account.' };
  }
}

/**
 * Fetches all user profiles from public.profiles with role-based security.
 * Applies deterministic sorting (created_at DESC with id DESC tie-breaker).
 */
export async function adminFetchAllProfiles() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.', data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to fetch profiles.', data: [] };
  }
}

/**
 * Fetches authoritative dashboard metrics directly from PostgreSQL via RPC.
 */
export async function adminFetchDashboardStats() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase.rpc('admin_get_dashboard_stats');
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to fetch dashboard metrics.' };
  }
}

// -----------------------------------------------------------------------------
// Self-Service Profile & Storage Helpers (Prompt 5)
// -----------------------------------------------------------------------------

/**
 * Updates permitted profile attributes for the authenticated user.
 * Sanitizes input against client-side role or status escalation.
 */
export async function updateUserProfile(userId, updates) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }

  // Whitelist allowable columns to prevent accidental or malicious payload tampering
  const allowedFields = [
    'full_name',
    'username',
    'school_id',
    'program',
    'year_level',
    'section',
    'faculty_id',
    'department',
    'position',
    'campus',
    'contact_number',
    'avatar_url',
  ];

  const payload = {};
  for (const field of allowedFields) {
    if (field in updates) {
      payload[field] = updates[field] === '' ? null : updates[field];
    }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    recordActivityLog({
      action: 'update_profile',
      notes: `Updated profile details: ${data?.full_name || 'User'}`,
      targetUserId: userId,
      targetName: data?.full_name,
      actorId: userId,
      actorName: data?.full_name,
      actorRole: data?.role || 'User',
      metadata: { fieldsUpdated: Object.keys(payload) },
    }).catch(() => {});

    return { success: true, profile: data };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to update profile.' };
  }
}

/**
 * Uploads a profile picture to the Supabase Storage 'avatars' bucket.
 * Enforces ownership folder convention: `${userId}/${filename}`
 * Validates file format and 2MB file size ceiling.
 */
export async function uploadUserAvatar(userId, file) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }
  if (!userId) {
    return { success: false, error: 'User ID is required for photo upload.' };
  }
  if (!file) {
    return { success: false, error: 'No file selected.' };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Unsupported image format. Allowed formats are JPG, PNG, WEBP, and GIF.',
    };
  }

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: 'File size exceeds the 2MB limit. Please choose a smaller image.',
    };
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message || 'Storage upload failed.' };
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData?.publicUrl;
    if (!publicUrl) {
      return { success: false, error: 'Could not obtain public URL for uploaded photo.' };
    }

    // Persist to public.profiles table
    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      return { success: false, error: profileError.message || 'Failed to update profile with avatar URL.' };
    }

    recordActivityLog({
      action: 'upload_avatar',
      notes: `Updated profile photo: ${updatedProfile?.full_name || 'User'}`,
      targetUserId: userId,
      targetName: updatedProfile?.full_name,
      actorId: userId,
      actorName: updatedProfile?.full_name,
      actorRole: updatedProfile?.role || 'User',
      metadata: { avatar_url: publicUrl },
    }).catch(() => {});

    return { success: true, publicUrl, profile: updatedProfile };
  } catch (err) {
    return { success: false, error: err?.message || 'Unexpected error during avatar upload.' };
  }
}

/**
 * Updates the user's email address via Supabase Auth.
 * Supabase dispatches a confirmation email to the new address before taking effect.
 */
export async function updateUserEmail(newEmail) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }
  const cleanEmail = (newEmail || '').trim().toLowerCase();
  if (!cleanEmail) {
    return { success: false, error: 'Email address cannot be empty.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      email: cleanEmail,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return {
      success: true,
      message: 'Confirmation email sent. Please check your new inbox to verify the change.',
      user: data.user,
    };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to update email.' };
  }
}

/**
 * Changes user password after verifying their current password.
 */
export async function verifyAndChangePassword(email, currentPassword, newPassword) {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.' };
  }
  if (!currentPassword) {
    return { success: false, error: 'Current password is required.' };
  }
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }
  if (currentPassword === newPassword) {
    return { success: false, error: 'New password cannot be the same as your current password.' };
  }

  try {
    // Reauthenticate to verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      return { success: false, error: 'Current password is incorrect. Please check and try again.' };
    }

    // Update password
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      let msg = updateError.message;
      if (msg.includes('Password should be at least')) {
        msg = 'Password must be at least 8 characters long.';
      }
      return { success: false, error: msg };
    }

    recordActivityLog({
      action: 'change_password',
      notes: `Changed account password`,
      targetUserId: data?.user?.id,
      actorId: data?.user?.id,
      metadata: { email },
    }).catch(() => {});

    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to change password.' };
  }
}

// -----------------------------------------------------------------------------
// Activity / Audit Logs Management
// -----------------------------------------------------------------------------

const STORAGE_KEY_LOGS = 'claimit_activity_logs_v1';
const STORAGE_KEY_NOTIFS = 'claimit_notifications_v1';

export function getLocalActivityLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalActivityLog(entry) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalActivityLogs();
    const updated = [entry, ...current.filter((l) => l.id !== entry.id)].slice(0, 150);
    window.localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
  } catch (err) {
    console.warn('[ClaimIt] Notice saving activity log locally:', err);
  }
}

export function formatPhilippineTimestamp(isoString) {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
    return `${datePart} · ${timePart} PHT`;
  } catch {
    return isoString;
  }
}

/**
 * Fetches authoritative activity logs from public.account_audit_logs.
 * Never silently substitutes fake seed data on query failure.
 */
export async function adminFetchActivityLogs() {
  if (!isSupabaseConfigured()) {
    return { success: true, data: getLocalActivityLogs(), isDemoMode: true };
  }

  try {
    const { data, error } = await supabase
      .from('account_audit_logs')
      .select(`
        id,
        action,
        reason,
        notes,
        metadata,
        created_at,
        actor:actor_id (
          id,
          full_name,
          role,
          username
        ),
        target:target_user_id (
          id,
          full_name,
          role,
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ClaimIt] Database query failed for account_audit_logs:', error.message);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to load activity logs.', data: [] };
  }
}

/**
 * Records an activity event in Supabase and local storage.
 * Avoids duplicate insertion if a backend RPC already recorded the event.
 */
export async function recordActivityLog({
  action,
  notes = null,
  reason = null,
  targetUserId = null,
  targetName = null,
  targetRole = null,
  actorId = null,
  actorName = null,
  actorRole = 'Admin',
  metadata = {},
  skipRemoteInsert = false,
}) {
  const timestamp = new Date().toISOString();
  const entryId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const resolvedActorName = actorName || 'Admin';
  const resolvedActorRole = actorRole || 'Admin';

  const localEntry = {
    id: entryId,
    action,
    reason,
    notes,
    metadata,
    created_at: timestamp,
    actor: {
      id: actorId || 'current-user',
      full_name: resolvedActorName,
      role: resolvedActorRole,
      username: resolvedActorName.toLowerCase().replace(/\s+/g, ''),
    },
    target: targetUserId || targetName ? {
      id: targetUserId || entryId,
      full_name: targetName || 'User',
      role: targetRole || 'Student',
      username: (targetName || 'user').toLowerCase().replace(/\s+/g, ''),
    } : null,
  };

  saveLocalActivityLog(localEntry);

  if (isSupabaseConfigured() && !skipRemoteInsert) {
    try {
      const { data: activeUser } = await supabase.auth.getUser();
      const currentActorId = actorId || activeUser?.user?.id;
      if (currentActorId) {
        await supabase.from('account_audit_logs').insert({
          target_user_id: targetUserId || null,
          actor_id: currentActorId,
          action,
          reason,
          notes,
          metadata,
        });
      }
    } catch (err) {
      console.warn('[ClaimIt] Audit log Supabase insert notice:', err?.message || err);
    }
  }

  return { success: true, entry: localEntry };
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS SYSTEM (Authoritative Database + Local Cache)
// -----------------------------------------------------------------------------

let notificationTableWarningLogged = false;

export function getLocalNotifications() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalNotification(notification) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalNotifications();
    const updated = [notification, ...current.filter((n) => n.id !== notification.id)].slice(0, 100);
    window.localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
  } catch (err) {
    console.warn('[ClaimIt] Notice saving notification locally:', err);
  }
}

/**
 * Fetches authoritative notifications for the current user/admin.
 * Falls back gracefully to local notifications if database table is not yet provisioned.
 */
export async function adminFetchNotifications() {
  if (!isSupabaseConfigured()) {
    return { success: true, data: getLocalNotifications(), isDemoMode: true };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        (error.message && (
          error.message.toLowerCase().includes('schema cache') ||
          error.message.toLowerCase().includes('notifications') ||
          error.message.toLowerCase().includes('could not find the table') ||
          error.message.toLowerCase().includes('relation') ||
          error.message.toLowerCase().includes('does not exist')
        ));

      if (isMissingTable) {
        if (!notificationTableWarningLogged) {
          console.warn(
            '[ClaimIt / Supabase] The "public.notifications" table was not found in schema cache. ' +
            'Please run the migration in supabase/migrations/20261021000002_notifications_and_audit_fixes.sql in your Supabase SQL editor. ' +
            'Falling back to local notifications.'
          );
          notificationTableWarningLogged = true;
        }
        return { success: true, data: getLocalNotifications(), isDemoMode: false, tableMissing: true };
      }

      console.warn('[ClaimIt] Could not query notifications from database:', error.message);
      return { success: false, error: error.message, data: [] };
    }

    notificationTableWarningLogged = false;
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to load notifications.', data: [] };
  }
}

/**
 * Marks a notification as read in the database and local cache.
 */
export async function adminMarkNotificationAsRead(id) {
  // Update local cache
  if (typeof window !== 'undefined') {
    try {
      const current = getLocalNotifications();
      const updated = current.map((n) => (n.id === id ? { ...n, read: true, unread: false } : n));
      window.localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch (err) {
      console.warn('[ClaimIt] Error marking notification as read in database:', err);
    }
  }

  return { success: true };
}

/**
 * Marks all notifications as read in the database and local cache.
 */
export async function adminMarkAllNotificationsAsRead() {
  // Update local cache
  if (typeof window !== 'undefined') {
    try {
      const current = getLocalNotifications();
      const updated = current.map((n) => ({ ...n, read: true, unread: false }));
      window.localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data: activeUser } = await supabase.auth.getUser();
      const uid = activeUser?.user?.id;
      if (uid) {
        await supabase.from('notifications').update({ read: true }).eq('user_id', uid).eq('read', false);
      } else {
        await supabase.from('notifications').update({ read: true }).eq('read', false);
      }
    } catch (err) {
      console.warn('[ClaimIt] Error marking all notifications read in database:', err);
    }
  }

  return { success: true };
}

/**
 * Creates and persists a new notification.
 */
export async function createNotification({
  userId = null,
  title,
  message,
  type = 'system',
  status = null,
  claimId = null,
  metadata = {},
}) {
  const timestamp = new Date().toISOString();
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const localNotif = {
    id: notifId,
    title,
    message,
    type,
    status,
    claimId,
    unread: true,
    read: false,
    created_at: timestamp,
    metadata,
  };

  saveLocalNotification(localNotif);

  if (isSupabaseConfigured()) {
    try {
      const targetUserId = userId || (await supabase.auth.getUser())?.data?.user?.id;
      if (targetUserId) {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          title,
          message,
          type,
          status,
          claim_id: claimId,
          read: false,
          metadata,
        });
      }
    } catch (err) {
      console.warn('[ClaimIt] Notice creating notification in database:', err?.message || err);
    }
  }

  return { success: true, notification: localNotif };
}



