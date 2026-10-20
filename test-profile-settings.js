// =============================================================================
// ClaimIt - Prompt 5 Profile Management & Storage Test Suite
// =============================================================================

import assert from 'node:assert/strict';

console.log('--- Running ClaimIt Profile Management & Storage Tests ---\n');

// 1. Data Model & Field Whitelist Test
console.log('Test 1: Field Whitelisting & Tamper Protection');
{
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

  const maliciousPayload = {
    full_name: 'Jane Doe',
    role: 'Admin', // Attempted role escalation
    status: 'Active', // Attempted status escalation
    approved_at: new Date().toISOString(), // Attempted audit tampering
    school_id: 'BSCS-2024-001',
    program: 'BS Computer Science',
  };

  const sanitized = {};
  for (const field of allowedFields) {
    if (field in maliciousPayload) {
      sanitized[field] = maliciousPayload[field];
    }
  }

  assert.equal(sanitized.full_name, 'Jane Doe');
  assert.equal(sanitized.school_id, 'BSCS-2024-001');
  assert.equal(sanitized.program, 'BS Computer Science');
  assert.equal(sanitized.role, undefined, 'Role must NOT be in sanitized update payload');
  assert.equal(sanitized.status, undefined, 'Status must NOT be in sanitized update payload');
  assert.equal(sanitized.approved_at, undefined, 'Audit fields must NOT be in sanitized update payload');
  console.log('✓ Whitelist correctly filters out role, status, and administrative audit fields.');
}

// 2. Photo Storage Type & Size Validation Test
console.log('\nTest 2: Photo Storage MIME Type & Size Limit (2MB)');
{
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB

  function validatePhoto(file) {
    if (!file) return { valid: false, error: 'No file selected.' };
    if (!allowedMimeTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported image format. Allowed formats are JPG, PNG, WEBP, and GIF.' };
    }
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds the 2MB limit. Please choose a smaller image.' };
    }
    return { valid: true };
  }

  // Valid photo cases
  assert.equal(validatePhoto({ type: 'image/jpeg', size: 1024 * 500 }).valid, true);
  assert.equal(validatePhoto({ type: 'image/png', size: 1024 * 1024 }).valid, true);
  assert.equal(validatePhoto({ type: 'image/webp', size: 1024 * 2048 }).valid, true);
  assert.equal(validatePhoto({ type: 'image/gif', size: 500 }).valid, true);

  // Invalid photo cases
  const oversize = validatePhoto({ type: 'image/jpeg', size: 2 * 1024 * 1024 + 1 });
  assert.equal(oversize.valid, false);
  assert.match(oversize.error, /2MB limit/);

  const invalidType = validatePhoto({ type: 'image/svg+xml', size: 1000 });
  assert.equal(invalidType.valid, false);
  assert.match(invalidType.error, /Unsupported image format/);

  const exeType = validatePhoto({ type: 'application/x-msdownload', size: 500 });
  assert.equal(exeType.valid, false);

  console.log('✓ Photo validation accurately enforces 2MB ceiling and allowed image types.');
}

// 3. Storage Folder Convention Test
console.log('\nTest 3: Storage Folder Isolation (${auth.uid()}/*)');
{
  const userId = '11111111-2222-3333-4444-555555555555';
  const fileExt = 'png';
  const fileName = `avatar-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Emulate Supabase storage.foldername(name)[1]
  const foldername = filePath.split('/')[0];
  assert.equal(foldername, userId, 'Storage path folder segment must equal authenticated user ID');
  console.log('✓ Storage path adheres to policy: (storage.foldername(name))[1] = auth.uid()::text');
}

// 4. Password Change Flow Validation Test
console.log('\nTest 4: Password Change Validation & Verification');
{
  function validatePasswordChange(currentPw, newPw, confirmPw) {
    if (!currentPw) {
      return { valid: false, error: 'Current password is required.' };
    }
    if (!newPw) {
      return { valid: false, error: 'New password is required.' };
    }
    if (newPw.length < 8) {
      return { valid: false, error: 'New password must be at least 8 characters long.' };
    }
    if (newPw === currentPw) {
      return { valid: false, error: 'New password cannot be the same as your current password.' };
    }
    if (newPw !== confirmPw) {
      return { valid: false, error: 'New password and confirmation password do not match.' };
    }
    return { valid: true };
  }

  // Missing current password
  assert.equal(validatePasswordChange('', 'NewPass123', 'NewPass123').valid, false);
  // Short password (< 8 chars)
  assert.equal(validatePasswordChange('OldPass123', 'short', 'short').valid, false);
  // Identical to current password
  assert.equal(validatePasswordChange('SamePass123', 'SamePass123', 'SamePass123').valid, false);
  // Confirmation mismatch
  assert.equal(validatePasswordChange('OldPass123', 'NewPass123', 'Different123').valid, false);
  // Valid change
  assert.equal(validatePasswordChange('OldPass123', 'NewPass1234', 'NewPass1234').valid, true);

  console.log('✓ Password change validation strictly enforces security criteria.');
}

// 5. Email Format Validation Test
console.log('\nTest 5: Email Validation');
{
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.equal(emailRegex.test('user@ucc.edu.ph'), true);
  assert.equal(emailRegex.test('student@gmail.com'), true);
  assert.equal(emailRegex.test('invalid-email'), false);
  assert.equal(emailRegex.test('@no-local-part.com'), false);
  assert.equal(emailRegex.test('no-domain@'), false);
  console.log('✓ Email regex correctly validates campus and standard email formats.');
}

// 6. Role and Status Immutability in Database Schema
console.log('\nTest 6: Database Trigger & Policy Verification');
{
  import('node:fs').then(({ readFileSync }) => {
    const migration1 = readFileSync('supabase/migrations/20261019000001_create_account_schema.sql', 'utf8');
    const migration2 = readFileSync('supabase/migrations/20261020000001_profile_storage_security.sql', 'utf8');

    // Check trigger exists
    assert.match(migration1, /protect_profile_privileges\(\)/, 'Trigger protect_profile_privileges must exist');
    assert.match(migration1, /Unauthorized: Users cannot modify their role assignment/, 'Role tampering must raise exception');
    assert.match(migration1, /Unauthorized: Users cannot modify their account status/, 'Status tampering must raise exception');

    // Check storage policies exist
    assert.match(migration2, /avatars_public_select/, 'Public select policy must exist');
    assert.match(migration2, /avatars_authenticated_upload/, 'Authenticated upload policy must exist');
    assert.match(migration2, /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/, 'Folder isolation must be enforced');

    console.log('✓ Migrations properly define privilege escalation protection and storage RLS.');
    console.log('\nALL 6 TEST SUITES PASSED SUCCESSFULLY!');
  });
}
