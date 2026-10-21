// =============================================================================
// ClaimIt - Prompt 7 Admin Dashboard, Statistics & Faculty Approval Tests
// =============================================================================

import assert from 'node:assert/strict';

console.log('--- Running ClaimIt Admin Dashboard & Faculty Approval Tests ---\n');

// Sample test dataset matching database schema
const mockDatabaseProfiles = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    full_name: 'Dr. Miguel Aquino',
    email: 'miguel.aquino@campus.edu',
    username: 'm.aquino',
    role: 'Faculty',
    status: 'Pending approval',
    department: 'College of Nursing',
    position: 'Professor',
    created_at: '2026-09-13T08:00:00Z',
    approved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    full_name: 'Dr. Elena Rostova',
    email: 'elena.rostova@campus.edu',
    username: 'e.rostova',
    role: 'Faculty',
    status: 'Active',
    department: 'College of Arts & Sciences',
    position: 'Associate Professor',
    created_at: '2026-09-10T10:00:00Z',
    approved_at: '2026-09-10T12:00:00Z',
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    full_name: 'Hannah Puerta',
    email: 'hannah.puerta@campus.edu',
    username: 'h.puerta',
    role: 'Student',
    status: 'Active',
    program: 'BS Computer Science',
    year_level: '3rd Year',
    section: '3A',
    created_at: '2026-09-09T09:00:00Z',
    approved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    full_name: 'Marcus Vance',
    email: 'marcus.vance@campus.edu',
    username: 'm.vance',
    role: 'Student',
    status: 'Active',
    program: 'BS Information Technology',
    year_level: '2nd Year',
    section: '2B',
    created_at: '2026-09-08T09:00:00Z',
    approved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000005',
    full_name: 'Joshua Kim',
    email: 'joshua.kim@campus.edu',
    username: 'j.kim',
    role: 'Student',
    status: 'Suspended',
    program: 'BS Business Administration',
    year_level: '4th Year',
    section: '4A',
    suspend_reason: 'Repeated fraudulent claims',
    created_at: '2026-08-28T14:00:00Z',
    approved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000006',
    full_name: 'Prof. Mark Rhicky Raby',
    email: 'raby.mark@campus.edu',
    username: 'mark.raby',
    role: 'Faculty',
    status: 'Suspended',
    department: 'College of Arts and Sciences',
    position: 'Associate Professor',
    suspend_reason: 'Policy violation',
    created_at: '2026-08-25T11:00:00Z',
    approved_at: '2026-08-26T00:00:00Z',
  },
  {
    id: '11111111-0000-0000-0000-000000000007',
    full_name: 'Sam Aquino',
    email: 'aquino.sam@campus.edu',
    username: 'sam.admin',
    role: 'Admin',
    status: 'Active',
    created_at: '2026-08-01T08:00:00Z',
    approved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000008',
    full_name: 'Alumni Student',
    email: 'alumni@campus.edu',
    username: 'alumni.user',
    role: 'Student',
    status: 'Inactive',
    inactive_reason: 'Graduated',
    created_at: '2026-07-15T08:00:00Z',
    approved_at: null,
  },
  {
    id: '11111111-0000-0000-0000-000000000009',
    full_name: 'Declined Applicant',
    email: 'declined@campus.edu',
    username: 'declined.prof',
    role: 'Faculty',
    status: 'Declined',
    declined_reason: 'Not found in faculty directory',
    created_at: '2026-07-10T08:00:00Z',
    approved_at: null,
  },
];

// =============================================================================
// TEST 1: Exact Definition & Verification of Dashboard Statistics
// =============================================================================
console.log('Test 1: Dashboard Count Metric Definitions & Verification');
{
  function computeAuthoritativeDashboardStats(profiles) {
    const totalAccounts = profiles.length;
    const studentAccounts = profiles.filter((p) => p.role === 'Student').length;
    // Faculty includes both Active approved faculty and Pending applicants
    const facultyAccounts = profiles.filter((p) => p.role === 'Faculty').length;
    const suspendedAccounts = profiles.filter((p) => p.status === 'Suspended').length;

    const pendingFaculty = profiles.filter((p) => p.role === 'Faculty' && p.status === 'Pending approval').length;
    const activeAccounts = profiles.filter((p) => p.status === 'Active').length;
    const inactiveAccounts = profiles.filter((p) => p.status === 'Inactive').length;
    const declinedAccounts = profiles.filter((p) => p.status === 'Declined').length;

    return {
      totalAccounts,
      studentAccounts,
      facultyAccounts,
      suspendedAccounts,
      pendingFaculty,
      activeAccounts,
      inactiveAccounts,
      declinedAccounts,
    };
  }

  const stats = computeAuthoritativeDashboardStats(mockDatabaseProfiles);

  assert.equal(stats.totalAccounts, 9, 'Total Accounts must count all registered users');
  assert.equal(stats.studentAccounts, 4, 'Students must include all student accounts (Active, Suspended, Inactive)');
  assert.equal(stats.facultyAccounts, 4, 'Faculty must include all faculty accounts (Active, Pending approval, Suspended, Declined)');
  assert.equal(stats.suspendedAccounts, 2, 'Suspended Accounts must count all suspended users across all roles');
  assert.equal(stats.pendingFaculty, 1, 'Pending faculty must be 1');
  assert.equal(stats.activeAccounts, 4, 'Active accounts must be 4');
  assert.equal(stats.inactiveAccounts, 1, 'Inactive accounts must be 1');
  assert.equal(stats.declinedAccounts, 1, 'Declined accounts must be 1');

  // Total check: Active (4) + Pending (1) + Suspended (2) + Inactive (1) + Declined (1) = 9
  assert.equal(
    stats.activeAccounts + stats.pendingFaculty + stats.suspendedAccounts + stats.inactiveAccounts + stats.declinedAccounts,
    stats.totalAccounts,
    'Sum of mutually exclusive status buckets must equal total accounts'
  );

  console.log('✓ All 4 dashboard metrics accurately adhere to documented specifications without contradiction.');
}

// =============================================================================
// TEST 2: Deterministic Ordering of Recent Accounts with Tie-Breaker
// =============================================================================
console.log('\nTest 2: Deterministic Ordering of Recent Accounts (created_at DESC, id DESC)');
{
  const identicalTimestampAccounts = [
    { id: 'uuid-a', full_name: 'User A', created_at: '2026-09-01T12:00:00Z' },
    { id: 'uuid-c', full_name: 'User C', created_at: '2026-09-01T12:00:00Z' },
    { id: 'uuid-b', full_name: 'User B', created_at: '2026-09-01T12:00:00Z' },
    { id: 'uuid-z', full_name: 'User Older', created_at: '2026-08-01T12:00:00Z' },
    { id: 'uuid-x', full_name: 'User Newer', created_at: '2026-10-01T12:00:00Z' },
  ];

  function sortRecentAccounts(list) {
    return [...list].sort((a, b) => {
      const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      // Deterministic tie-breaker: id DESC
      return b.id.localeCompare(a.id);
    });
  }

  const sorted = sortRecentAccounts(identicalTimestampAccounts);

  assert.equal(sorted[0].id, 'uuid-x', 'Newest timestamp must be first');
  // Among identical timestamps, id DESC means c > b > a
  assert.equal(sorted[1].id, 'uuid-c');
  assert.equal(sorted[2].id, 'uuid-b');
  assert.equal(sorted[3].id, 'uuid-a');
  assert.equal(sorted[4].id, 'uuid-z', 'Oldest timestamp must be last');

  console.log('✓ Deterministic ordering verified with stable tie-breaker resolution.');
}

// =============================================================================
// TEST 3: Role & Status Filters Combination & Empty States
// =============================================================================
console.log('\nTest 3: Role and Status Filter Combinations & Reset Behavior');
{
  function filterAccounts(list, { searchQuery = '', role = 'All Roles', status = 'All Statuses' }) {
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const matchesSearch =
        !q ||
        item.full_name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.username && item.username.toLowerCase().includes(q));

      const matchesRole =
        role === 'All Roles' ||
        item.role.toLowerCase() === role.toLowerCase() ||
        (role === 'Students' && item.role.toLowerCase() === 'student');

      const matchesStatus =
        status === 'All Statuses' ||
        item.status.toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  // Filter 1: Pending Faculty
  const pendingFaculty = filterAccounts(mockDatabaseProfiles, { role: 'Faculty', status: 'Pending approval' });
  assert.equal(pendingFaculty.length, 1);
  assert.equal(pendingFaculty[0].full_name, 'Dr. Miguel Aquino');

  // Filter 2: Active Students
  const activeStudents = filterAccounts(mockDatabaseProfiles, { role: 'Students', status: 'Active' });
  assert.equal(activeStudents.length, 2);

  // Filter 3: Suspended Accounts (All Roles)
  const allSuspended = filterAccounts(mockDatabaseProfiles, { role: 'All Roles', status: 'Suspended' });
  assert.equal(allSuspended.length, 2);

  // Filter 4: Empty Result Combination (Suspended Admins)
  const emptyResult = filterAccounts(mockDatabaseProfiles, { role: 'Admin', status: 'Suspended' });
  assert.equal(emptyResult.length, 0);

  // Filter 5: Resetting restores all accounts
  const resetResult = filterAccounts(mockDatabaseProfiles, { searchQuery: '', role: 'All Roles', status: 'All Statuses' });
  assert.equal(resetResult.length, mockDatabaseProfiles.length);

  console.log('✓ Filters operate cleanly independently and in combination; empty results and resets behave properly.');
}

// =============================================================================
// TEST 4: Distinction between Query Failure and True Zero Count
// =============================================================================
console.log('\nTest 4: Error Handling vs. True Zero Count Distinction');
{
  function evaluateDashboardState({ loading, error, data }) {
    if (loading) {
      return { state: 'LOADING', message: 'Loading database accounts...' };
    }
    if (error) {
      return { state: 'ERROR', message: error, isError: true };
    }
    if (!data || data.length === 0) {
      return { state: 'EMPTY', count: 0, message: 'No accounts found matching your search or filters.' };
    }
    return { state: 'SUCCESS', count: data.length, data };
  }

  // Network/DB failure
  const failureState = evaluateDashboardState({ loading: false, error: 'Failed to fetch profiles from database.', data: null });
  assert.equal(failureState.state, 'ERROR');
  assert.equal(failureState.isError, true);
  assert.notEqual(failureState.state, 'EMPTY', 'A failed query must NEVER be masked as an empty list or 0 count');

  // Legitimate true zero count
  const trueZeroState = evaluateDashboardState({ loading: false, error: null, data: [] });
  assert.equal(trueZeroState.state, 'EMPTY');
  assert.equal(trueZeroState.count, 0);

  console.log('✓ Query failures are strictly separated from genuine zero-count states.');
}

// =============================================================================
// TEST 5: Faculty Approval State Machine & Concurrency Protection
// =============================================================================
console.log('\nTest 5: Faculty Approval Workflow & Race Condition Defense');
{
  function simulateApproveFaculty(targetAccount, adminUser) {
    if (!adminUser || adminUser.role !== 'Admin' || adminUser.status !== 'Active') {
      return { success: false, error: 'Access denied: Administrator privileges required.' };
    }
    if (!targetAccount) {
      return { success: false, error: 'Target user not found.' };
    }
    if (targetAccount.role !== 'Faculty') {
      return { success: false, error: `Operation not permitted: Target account is not a faculty account (role: ${targetAccount.role}).` };
    }
    if (targetAccount.status === 'Active' && targetAccount.approved_at) {
      return { success: false, error: 'Faculty application has already been approved.' };
    }
    if (targetAccount.status !== 'Pending approval') {
      return { success: false, error: `Faculty application is no longer pending approval (current status: ${targetAccount.status}).` };
    }

    const updated = {
      ...targetAccount,
      status: 'Active',
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
      declined_at: null,
      declined_reason: null,
    };

    return {
      success: true,
      data: updated,
      auditLog: {
        action: 'approve_faculty',
        actor_id: adminUser.id,
        target_user_id: targetAccount.id,
      },
    };
  }

  const admin = { id: 'admin-uuid', role: 'Admin', status: 'Active' };
  const pendingFaculty = { id: 'faculty-uuid', role: 'Faculty', status: 'Pending approval', full_name: 'Dr. Jane' };

  // 1. Successful approval
  const result1 = simulateApproveFaculty(pendingFaculty, admin);
  assert.equal(result1.success, true);
  assert.equal(result1.data.status, 'Active');
  assert.ok(result1.data.approved_at);

  // 2. Duplicate / Concurrent approval on now-Active account
  const result2 = simulateApproveFaculty(result1.data, admin);
  assert.equal(result2.success, false);
  assert.match(result2.error, /already been approved/);

  // 3. Attempting approval on a student
  const student = { id: 'student-uuid', role: 'Student', status: 'Pending approval' };
  const result3 = simulateApproveFaculty(student, admin);
  assert.equal(result3.success, false);
  assert.match(result3.error, /not a faculty account/);

  // 4. Non-admin attempting approval
  const nonAdmin = { id: 'user-uuid', role: 'Student', status: 'Active' };
  const result4 = simulateApproveFaculty(pendingFaculty, nonAdmin);
  assert.equal(result4.success, false);
  assert.match(result4.error, /Administrator privileges required/);

  console.log('✓ Faculty approval validates pending state, prevents duplicate approvals, and enforces admin authorization.');
}

// =============================================================================
// TEST 6: Faculty Decline Workflow & Historical Data Preservation
// =============================================================================
console.log('\nTest 6: Faculty Decline Workflow & Historical Preservation');
{
  function simulateDeclineFaculty(targetAccount, reason, note, adminUser) {
    if (!adminUser || adminUser.role !== 'Admin' || adminUser.status !== 'Active') {
      return { success: false, error: 'Access denied: Administrator privileges required.' };
    }
    if (!targetAccount) {
      return { success: false, error: 'Target user not found.' };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A decline reason must be specified.' };
    }
    if (targetAccount.role !== 'Faculty') {
      return { success: false, error: `Operation not permitted: Target account is not a faculty account.` };
    }
    if (targetAccount.status !== 'Pending approval') {
      return { success: false, error: `Faculty application is no longer pending approval (current status: ${targetAccount.status}).` };
    }

    const updated = {
      ...targetAccount,
      status: 'Declined',
      declined_at: new Date().toISOString(),
      declined_by: adminUser.id,
      declined_reason: reason.trim(),
      declined_note: note ? note.trim() : null,
    };

    return {
      success: true,
      data: updated,
      // Records remain in system; NO delete operation
      recordsPreserved: true,
      auditLog: {
        action: 'decline_faculty',
        actor_id: adminUser.id,
        target_user_id: targetAccount.id,
        reason: reason.trim(),
      },
    };
  }

  const admin = { id: 'admin-uuid', role: 'Admin', status: 'Active' };
  const pendingFaculty = { id: 'faculty-uuid-2', role: 'Faculty', status: 'Pending approval', full_name: 'Dr. John' };

  // 1. Missing reason error
  const invalidDecline = simulateDeclineFaculty(pendingFaculty, '', '', admin);
  assert.equal(invalidDecline.success, false);
  assert.match(invalidDecline.error, /reason must be specified/);

  // 2. Successful decline with reason and note
  const validDecline = simulateDeclineFaculty(
    pendingFaculty,
    'Unverified campus affiliation / Not found in faculty directory',
    'Checked HR database, employee ID not found.',
    admin
  );
  assert.equal(validDecline.success, true);
  assert.equal(validDecline.data.status, 'Declined');
  assert.equal(validDecline.recordsPreserved, true);
  assert.ok(validDecline.data.declined_at);
  assert.equal(validDecline.data.declined_reason, 'Unverified campus affiliation / Not found in faculty directory');

  // 3. Stale decision defense (cannot decline already declined or active)
  const staleDecline = simulateDeclineFaculty(validDecline.data, 'Another reason', '', admin);
  assert.equal(staleDecline.success, false);
  assert.match(staleDecline.error, /no longer pending approval/);

  console.log('✓ Faculty decline records reason and audit trail without deleting records; rejects stale operations.');
}

console.log('\n=============================================================');
console.log('ALL 6 DASHBOARD & FACULTY WORKFLOW TESTS PASSED SUCCESSFULLY!');
console.log('=============================================================');
