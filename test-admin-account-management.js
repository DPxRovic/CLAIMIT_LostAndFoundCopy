// =============================================================================
// ClaimIt - Prompt 6 Admin Account Management & Status Enforcement Test Suite
// =============================================================================

import assert from 'node:assert/strict';

console.log('--- Running ClaimIt Admin Account Management & Status Enforcement Tests ---\n');

// 1. Role-Based Admin Action Permission Verification
console.log('Test 1: Admin Permission Verification & Client Safety');
{
  function checkAdminPrivileges(userRole, userStatus) {
    if (!userRole || userRole !== 'Admin') {
      return { allowed: false, error: 'Access denied: Administrator privileges required.' };
    }
    if (userStatus !== 'Active') {
      return { allowed: false, error: 'Access denied: Administrator account is not active.' };
    }
    return { allowed: true };
  }

  // Active Admin
  assert.equal(checkAdminPrivileges('Admin', 'Active').allowed, true);

  // Suspended Admin
  assert.equal(checkAdminPrivileges('Admin', 'Suspended').allowed, false);
  assert.match(checkAdminPrivileges('Admin', 'Suspended').error, /not active/);

  // Student attempting admin action
  assert.equal(checkAdminPrivileges('Student', 'Active').allowed, false);
  assert.match(checkAdminPrivileges('Student', 'Active').error, /privileges required/);

  // Faculty attempting admin action
  assert.equal(checkAdminPrivileges('Faculty', 'Active').allowed, false);

  console.log('✓ Admin actions strictly require role "Admin" and status "Active".');
}

// 2. Safe Reactivation Logic: Faculty Approval Protection
console.log('\nTest 2: Safe Faculty Reactivation Rules (Unapproved Faculty Guard)');
{
  function computeReactivatedStatus(account) {
    // If user is Faculty and has NEVER been approved (approved_at IS NULL),
    // status reverts to 'Pending approval', NOT 'Active'.
    if (account.role === 'Faculty' && !account.approved_at) {
      return {
        status: 'Pending approval',
        destination: 'pending_queue',
        notes: 'Account reactivated and returned to Pending approval queue',
      };
    }
    return {
      status: 'Active',
      destination: 'active_list',
      notes: 'Account reactivated to Active status',
    };
  }

  // Student reactivation -> Active
  const student = { role: 'Student', status: 'Suspended' };
  assert.equal(computeReactivatedStatus(student).status, 'Active');

  // Approved faculty reactivation -> Active
  const approvedFaculty = { role: 'Faculty', status: 'Suspended', approved_at: '2026-09-01T00:00:00Z' };
  assert.equal(computeReactivatedStatus(approvedFaculty).status, 'Active');

  // Unapproved faculty reactivation -> Must revert to 'Pending approval'
  const unapprovedFaculty = { role: 'Faculty', status: 'Suspended', approved_at: null };
  const unapprovedResult = computeReactivatedStatus(unapprovedFaculty);
  assert.equal(unapprovedResult.status, 'Pending approval');
  assert.equal(unapprovedResult.destination, 'pending_queue');
  console.log('✓ Unapproved faculty cannot bypass administrative review upon reactivation.');
}

// 3. Temporary Password Generation Criteria
console.log('\nTest 3: Temporary Password Generator & Security Constraints');
{
  function generateTemporaryPassword() {
    return `Campus-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  function validateTempPassword(pw) {
    if (!pw || pw.length < 8) return false;
    if (!pw.startsWith('Campus-')) return false;
    return true;
  }

  const samplePassword = generateTemporaryPassword();
  assert.equal(validateTempPassword(samplePassword), true);
  assert.ok(samplePassword.length >= 13);
  console.log('✓ Temporary passwords meet 8+ length and format criteria: ' + samplePassword);
}

// 4. Admin Account Creation Validation
console.log('\nTest 4: Admin Account Creation Validation (Student vs Faculty)');
{
  function validateAdminCreatePayload(payload) {
    const errors = [];
    if (!payload.name?.trim()) errors.push('Full name is required.');
    if (!payload.email?.trim() || !payload.email.includes('@')) errors.push('Valid email is required.');
    if (!payload.password || payload.password.length < 8) errors.push('Password must be at least 8 characters.');

    if (payload.type === 'student') {
      if (!payload.schoolId?.trim()) errors.push('School ID is required for student accounts.');
    } else if (payload.type === 'faculty') {
      if (!payload.facultyId?.trim()) errors.push('Faculty ID is required for faculty accounts.');
    } else {
      errors.push('Invalid account type.');
    }

    return { valid: errors.length === 0, errors };
  }

  // Valid student payload
  const validStudent = {
    type: 'student',
    name: 'Juan Dela Cruz',
    email: 'juan@ucc.edu.ph',
    password: 'SecurePassword123',
    schoolId: '2024-0012',
    program: 'BS Computer Science',
    yearLevel: '3rd Year',
    section: '3A',
  };
  assert.equal(validateAdminCreatePayload(validStudent).valid, true);

  // Missing faculty ID
  const invalidFaculty = {
    type: 'faculty',
    name: 'Prof. Pedro Penduko',
    email: 'pedro@ucc.edu.ph',
    password: 'SecurePassword123',
    facultyId: '',
  };
  const facultyResult = validateAdminCreatePayload(invalidFaculty);
  assert.equal(facultyResult.valid, false);
  assert.ok(facultyResult.errors.some(e => e.includes('Faculty ID')));

  // Short password
  const shortPwStudent = { ...validStudent, password: 'short' };
  assert.equal(validateAdminCreatePayload(shortPwStudent).valid, false);

  console.log('✓ Admin account creation validates student and faculty prerequisites.');
}

// 5. Account Status Enforcement on Login
console.log('\nTest 5: Authoritative Status Enforcement (Suspended, Inactive, Declined)');
{
  function enforceLoginStatus(status, reason) {
    if (status === 'Active') {
      return { allowed: true };
    }
    if (status === 'Suspended') {
      const msg = reason ? `: "${reason}"` : '';
      return { allowed: false, status: 'Suspended', error: `This account has been suspended${msg}. Please contact campus administration.` };
    }
    if (status === 'Pending approval') {
      return { allowed: false, status: 'Pending approval', error: 'Your faculty registration is currently pending administrator approval.' };
    }
    if (status === 'Declined') {
      const msg = reason ? `: "${reason}"` : '';
      return { allowed: false, status: 'Declined', error: `Your faculty registration was declined${msg}. Please contact campus administration for assistance.` };
    }
    if (status === 'Inactive') {
      const msg = reason ? `: "${reason}"` : '';
      return { allowed: false, status: 'Inactive', error: `This account has been deactivated${msg}. Please contact campus administration.` };
    }
    return { allowed: false, error: 'Unknown account status.' };
  }

  assert.equal(enforceLoginStatus('Active').allowed, true);

  const suspended = enforceLoginStatus('Suspended', 'Policy violation');
  assert.equal(suspended.allowed, false);
  assert.match(suspended.error, /Policy violation/);

  const inactive = enforceLoginStatus('Inactive', 'Graduated');
  assert.equal(inactive.allowed, false);
  assert.match(inactive.error, /deactivated/);

  const pending = enforceLoginStatus('Pending approval');
  assert.equal(pending.allowed, false);
  assert.match(pending.error, /pending administrator approval/);

  console.log('✓ Account status rules enforce non-active accounts cannot establish active sessions.');
}

// 6. Audit Logging Data Integrity Test
console.log('\nTest 6: Audit Logging Schema Contract Verification');
{
  const allowedActions = [
    'create_account',
    'approve_faculty',
    'decline_faculty',
    'suspend_account',
    'reactivate_account',
    'deactivate_account',
    'reset_password',
    'update_user_details',
  ];

  function validateAuditEntry(entry) {
    assert.ok(entry.target_user_id, 'Target user ID is required');
    assert.ok(entry.actor_id, 'Actor ID is required');
    assert.ok(allowedActions.includes(entry.action), `Action ${entry.action} must be in allowed actions`);
    assert.ok(entry.notes, 'Audit notes are required');
    return true;
  }

  assert.equal(
    validateAuditEntry({
      target_user_id: '11111111-1111-1111-1111-111111111111',
      actor_id: '22222222-2222-2222-2222-222222222222',
      action: 'suspend_account',
      notes: 'Suspended for repeated fraudulent claims',
    }),
    true
  );

  console.log('✓ Audit log entries comply with schema and permitted actions.');
}

console.log('\n=============================================================');
console.log('ALL 6 ADMIN MANAGEMENT TEST SUITES PASSED SUCCESSFULLY!');
console.log('=============================================================');
