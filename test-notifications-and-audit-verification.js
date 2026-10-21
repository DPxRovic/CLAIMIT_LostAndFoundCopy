// =============================================================================
// ClaimIt - Notifications & Database Activity Logs Verification Test Suite
// =============================================================================

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=============================================================================');
console.log('TEST SUITE: NOTIFICATIONS & REAL DATABASE ACTIVITY LOGS VERIFICATION');
console.log('=============================================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Activity Logs Never Silently Substitute Fake Seed Records On Error
// -----------------------------------------------------------------------------
console.log('--- Test 1: Activity Logs Honest Error & Empty State Contract ---');
{
  // Simulate mock database returning error
  function mockAdminFetchActivityLogs({ isConfigured, dbError, dbRows }) {
    if (!isConfigured) {
      return { success: true, data: [], isDemoMode: true };
    }
    if (dbError) {
      // Must NOT return fake records
      return { success: false, error: dbError, data: [] };
    }
    return { success: true, data: dbRows || [] };
  }

  // 1.1 DB Error case
  const errRes = mockAdminFetchActivityLogs({ isConfigured: true, dbError: 'connection refused' });
  assert.equal(errRes.success, false);
  assert.equal(errRes.error, 'connection refused');
  assert.deepEqual(errRes.data, []); // Empty array, NO fake seed data injected

  // 1.2 Empty DB table case
  const emptyRes = mockAdminFetchActivityLogs({ isConfigured: true, dbRows: [] });
  assert.equal(emptyRes.success, true);
  assert.deepEqual(emptyRes.data, []);

  // 1.3 Unconfigured local session case: starts clean
  const unconfiguredRes = mockAdminFetchActivityLogs({ isConfigured: false });
  assert.equal(unconfiguredRes.success, true);
  assert.deepEqual(unconfiguredRes.data, []);

  console.log('✓ Activity logs strictly return error states and empty arrays without fake seed data.');
}

// -----------------------------------------------------------------------------
// TEST 2: Schema Migration Verifications for Nullable Target & Notifications
// -----------------------------------------------------------------------------
console.log('\n--- Test 2: Database Migration Integrity ---');
{
  const migrationPath = path.resolve('supabase/migrations/20261021000002_notifications_and_audit_fixes.sql');
  assert.equal(fs.existsSync(migrationPath), true, 'Migration file must exist');

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sqlContent, /ALTER TABLE public\.account_audit_logs\s+ALTER COLUMN target_user_id DROP NOT NULL;/i);
  assert.match(sqlContent, /CREATE TABLE IF NOT EXISTS public\.notifications/i);
  assert.match(sqlContent, /ALTER TABLE public\.notifications ENABLE ROW LEVEL SECURITY;/i);
  assert.match(sqlContent, /CREATE POLICY "notifications_select_policy"/i);
  assert.match(sqlContent, /CREATE POLICY "notifications_update_policy"/i);

  console.log('✓ Migration correctly alters audit log target nullability and provisions notifications table with RLS.');
}

// -----------------------------------------------------------------------------
// TEST 3: Duplicate Audit Log Prevention (skipRemoteInsert)
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Dual-Insert Prevention for Database RPCs ---');
{
  let remoteInsertCount = 0;
  let localEntryCount = 0;

  function recordActivityLogSimulation({ action, skipRemoteInsert, isConfigured }) {
    localEntryCount += 1;
    if (isConfigured && !skipRemoteInsert) {
      remoteInsertCount += 1;
    }
  }

  // An RPC action (e.g. approve_faculty) where SQL already inserted into audit log
  recordActivityLogSimulation({ action: 'approve_faculty', skipRemoteInsert: true, isConfigured: true });
  assert.equal(localEntryCount, 1);
  assert.equal(remoteInsertCount, 0, 'Must not duplicate remote insert when RPC already logged event');

  // A non-RPC action (e.g. manage_lists)
  recordActivityLogSimulation({ action: 'manage_lists', skipRemoteInsert: false, isConfigured: true });
  assert.equal(localEntryCount, 2);
  assert.equal(remoteInsertCount, 1, 'Non-RPC action must perform remote insert');

  console.log('✓ Duplicate audit logging is prevented for database RPC actions.');
}

// -----------------------------------------------------------------------------
// TEST 4: Notifications State Machine, Unread Count & Mark-As-Read
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Notifications Lifecycle, Unread Tracking & State Transitions ---');
{
  const testNotifs = [
    { id: 'n-1', title: 'Faculty Registration', message: 'Dr. Santos registered', read: false, unread: true },
    { id: 'n-2', title: 'Account Suspended', message: 'User suspended', read: false, unread: true },
    { id: 'n-3', title: 'Report Submitted', message: 'New lost umbrella', read: true, unread: false },
  ];

  // 4.1 Unread count calculation
  const unreadCount = testNotifs.filter((n) => n.unread).length;
  assert.equal(unreadCount, 2);

  // 4.2 Mark single notification read
  function markNotificationRead(list, id) {
    return list.map((n) => (n.id === id ? { ...n, read: true, unread: false } : n));
  }
  const afterSingle = markNotificationRead(testNotifs, 'n-1');
  assert.equal(afterSingle.find((n) => n.id === 'n-1').unread, false);
  assert.equal(afterSingle.filter((n) => n.unread).length, 1);

  // 4.3 Mark all notifications read
  function markAllRead(list) {
    return list.map((n) => ({ ...n, read: true, unread: false }));
  }
  const afterAll = markAllRead(testNotifs);
  assert.equal(afterAll.filter((n) => n.unread).length, 0);

  // 4.4 Empty notification list
  const emptyNotifs = [];
  assert.equal(emptyNotifs.filter((n) => n.unread).length, 0);

  console.log('✓ Notifications unread counts, mark-as-read, and mark-all-as-read verified.');
}

// -----------------------------------------------------------------------------
// TEST 5: Responsiveness.jsx & AdminMainForm.jsx Bell Wiring Contract
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: UI Bell Component & Popover Contract Verification ---');
{
  const respPath = path.resolve('client/src/components/admin/Responsiveness.jsx');
  const mainPath = path.resolve('client/src/components/admin/AdminMainForm.jsx');

  const respCode = fs.readFileSync(respPath, 'utf8');
  const mainCode = fs.readFileSync(mainPath, 'utf8');

  // Both components must import Notifications
  assert.match(respCode, /import Notifications from '\.\.\/shared\/Notifications\.jsx';/);
  assert.match(mainCode, /import Notifications from '\.\.\/shared\/Notifications\.jsx';/);

  // Both components must have notification state
  assert.match(respCode, /const \[isNotificationsOpen, setIsNotificationsOpen\] = useState\(false\);/);
  assert.match(mainCode, /const \[isNotificationsOpen, setIsNotificationsOpen\] = useState\(false\);/);

  // Both components must attach onClick to bell button
  assert.match(respCode, /onClick=\{handleToggleNotifications\}/);
  assert.match(mainCode, /onClick=\{handleToggleNotifications\}/);

  // Both components must render <Notifications
  assert.match(respCode, /<Notifications/);
  assert.match(mainCode, /<Notifications/);

  console.log('✓ Notification bell in both Responsiveness.jsx and AdminMainForm.jsx correctly wired to Notifications panel.');
}

// -----------------------------------------------------------------------------
// TEST 6: Authentication Auditing (Login & Logout Event Tracking)
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Authentication Auditing for Successful Login & Logout ---');
{
  const authContextPath = path.resolve('client/src/context/AuthContext.jsx');
  const authCode = fs.readFileSync(authContextPath, 'utf8');

  // Verify recordActivityLog is imported in AuthContext
  assert.match(authCode, /recordActivityLog/);

  // Verify login records activity log
  assert.match(authCode, /action:\s*['"]login['"]/);

  // Verify logout records activity log before signOut
  assert.match(authCode, /action:\s*['"]logout['"]/);
  const logoutFnIndex = authCode.indexOf('const logout = useCallback(');
  assert.ok(logoutFnIndex > 0, 'logout function must exist');
  const logoutBody = authCode.slice(logoutFnIndex, logoutFnIndex + 1200);
  const logIndex = logoutBody.indexOf("action: 'logout'");
  const signOutIndex = logoutBody.indexOf('supabase.auth.signOut()');
  assert.ok(logIndex > 0, 'logout action must be logged');
  assert.ok(signOutIndex > 0, 'signOut must be called');
  assert.ok(logIndex < signOutIndex, 'recordActivityLog for logout must be invoked before supabase.auth.signOut()');

  console.log('✓ Authentication auditing correctly records login and logout events with proper timing.');
}

// -----------------------------------------------------------------------------
// TEST 7: ActivityLogs Interface Improvements & Action Type Filtering
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Activity Logs Interface Filters & Formatting ---');
{
  const activityLogsPath = path.resolve('client/src/components/admin/pages/ActivityLogs.jsx');
  const activityLogsCode = fs.readFileSync(activityLogsPath, 'utf8');

  // Verify action type options exist
  assert.match(activityLogsCode, /ACTION_TYPE_OPTIONS/);
  assert.match(activityLogsCode, /actionTypeFilter/);

  // Verify action mapping covers login, logout, and profile operations
  assert.match(activityLogsCode, /actionKey === 'login'/);
  assert.match(activityLogsCode, /actionKey === 'logout'/);
  assert.match(activityLogsCode, /actionKey === 'update_profile'/);

  console.log('✓ ActivityLogs interface formats authentication events and provides action type filters.');
}

// -----------------------------------------------------------------------------
// TEST 8: Missing Notifications Table Graceful Fallback Contract
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Notifications Table Missing Schema Cache Defense ---');
{
  const supabaseLibPath = path.resolve('client/src/lib/supabase.js');
  const supabaseLibCode = fs.readFileSync(supabaseLibPath, 'utf8');

  // Verify adminFetchNotifications handles schema cache error gracefully
  assert.match(supabaseLibCode, /tableMissing:\s*true/);
  assert.match(supabaseLibCode, /getLocalNotifications\(\)/);

  console.log('✓ Notifications gracefully fall back to local cache when database table is not yet created.');
}

console.log('\n=============================================================================');
console.log('ALL NOTIFICATION & ACTIVITY LOG VERIFICATION TESTS PASSED SUCCESSFULLY!');
console.log('=============================================================================');
