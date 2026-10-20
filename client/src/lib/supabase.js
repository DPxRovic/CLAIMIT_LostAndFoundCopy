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
 */
export async function adminFetchAllProfiles() {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured.', data: [] };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to fetch profiles.', data: [] };
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

    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err?.message || 'Failed to change password.' };
  }
}

