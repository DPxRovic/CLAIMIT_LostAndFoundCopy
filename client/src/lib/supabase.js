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

if (!isSupabaseConfigured()) {
  console.warn(
    '[ClaimIt / Supabase] Supabase credentials not fully configured. Using fallback client. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
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
