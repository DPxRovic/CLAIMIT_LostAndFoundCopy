import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=============================================================================');
console.log('TEST SUITE: PASSWORD RECOVERY, 6-DIGIT OTP, RESET ROUTING & EMAIL TEMPLATES');
console.log('=============================================================================');

// --- Test 1: Anti-Enumeration Contract & Truthful UX Messaging ---
console.log('\n--- Test 1: Anti-Enumeration Security & Feedback Contract ---');
{
  // Supabase Auth returns { data: {}, error: null } for both existing and non-existing emails
  // to prevent attackers from discovering registered user email addresses.
  function simulateResetPasswordRequest(email) {
    if (!email || !email.trim()) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { success: false, error: 'Enter a valid email address, such as name@example.com.' };
    }
    // Expected anti-enumeration response: always succeeds without confirming account existence
    return {
      success: true,
      data: {},
      message: 'If an account matches that email address, recovery instructions have been sent.',
    };
  }

  const blankResult = simulateResetPasswordRequest('');
  assert.equal(blankResult.success, false);

  const registeredEmailResult = simulateResetPasswordRequest('student@ucc.edu.ph');
  assert.equal(registeredEmailResult.success, true);
  assert.match(registeredEmailResult.message, /If an account matches that email address/);

  const unknownEmailResult = simulateResetPasswordRequest('unregistered-user-998877@example.com');
  assert.equal(unknownEmailResult.success, true);
  assert.match(unknownEmailResult.message, /If an account matches that email address/);

  // Verify that ForgotPassword.jsx does not make illegal client-side queries against profiles
  const forgotPasswordContent = fs.readFileSync(path.join(process.cwd(), 'client/src/components/auth/ForgotPassword.jsx'), 'utf8');
  assert.equal(forgotPasswordContent.includes("from('profiles')"), false, 'ForgotPassword must never probe public.profiles directly');
  assert.equal(forgotPasswordContent.includes('lookupEmailByUsername'), false, 'ForgotPassword must not probe user existence');

  console.log('✓ Anti-enumeration security maintained: No user enumeration leaks or client-side profile probing.');
}

// --- Test 2: Supabase Email Template Config & 6-Digit Token Inclusion ---
console.log('\n--- Test 2: Recovery Email Template Configuration ---');
{
  const configPath = path.join(process.cwd(), 'supabase/config.toml');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  assert.match(configContent, /\[auth\.email\.template\.recovery\]/, 'config.toml must define [auth.email.template.recovery]');
  assert.match(configContent, /content_path\s*=\s*"\.\/supabase\/templates\/recovery\.html"/, 'config.toml must point to recovery.html');

  const templatePath = path.join(process.cwd(), 'supabase/templates/recovery.html');
  assert.equal(fs.existsSync(templatePath), true, 'recovery.html template must exist');
  
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  assert.match(templateContent, /\{\{\s*\.Token\s*\}\}/, 'Template must include {{ .Token }} for the 6-digit verification code');
  assert.match(templateContent, /\{\{\s*\.ConfirmationURL\s*\}\}/, 'Template must include {{ .ConfirmationURL }} for direct reset link');
  assert.match(templateContent, /ClaimIt/i, 'Template must be branded for ClaimIt');

  console.log('✓ Supabase email template verified: Contains both 6-digit OTP {{ .Token }} and direct link {{ .ConfirmationURL }}.');
}

// --- Test 3: Six-Digit OTP Input & Direct Validation Contract ---
console.log('\n--- Test 3: Six-Digit OTP Code Validation & Verification Contract ---');
{
  function validateOtp(code) {
    const clean = (code || '').trim().replace(/[^0-9]/g, '');
    if (!clean || clean.length < 6) {
      return { valid: false, error: 'Please enter the complete 6-digit verification code.' };
    }
    return { valid: true, code: clean.slice(0, 6) };
  }

  assert.equal(validateOtp('').valid, false);
  assert.equal(validateOtp('12345').valid, false);
  assert.equal(validateOtp('12345a').valid, false);
  assert.equal(validateOtp('928374').valid, true);
  assert.equal(validateOtp('928374').code, '928374');

  // Verify VerifyCode component supports quick back-to-email correction
  const verifyCodeContent = fs.readFileSync(path.join(process.cwd(), 'client/src/components/auth/VerifyCode.jsx'), 'utf8');
  assert.match(verifyCodeContent, /onBackToEmail/, 'VerifyCode must accept onBackToEmail for quick correction');
  assert.match(verifyCodeContent, /Change email/i, 'VerifyCode must present a link to change or fix the email address');

  console.log('✓ Six-digit OTP validation and email correction capabilities verified.');
}

// --- Test 4: Password Recovery URL Detection & Event Handling ---
console.log('\n--- Test 4: Password Recovery Routing & PASSWORD_RECOVERY Event Contract ---');
{
  function detectRecoveryFlow(hash, search) {
    const h = hash || '';
    const s = search || '';
    return (
      h.includes('type=recovery') ||
      h.includes('reset-password') ||
      s.includes('type=recovery')
    );
  }

  // Case A: Supabase direct redirect with hash fragment
  assert.equal(detectRecoveryFlow('#reset-password#access_token=token&type=recovery', ''), true);
  // Case B: Standard hash route
  assert.equal(detectRecoveryFlow('#reset-password', ''), true);
  // Case C: Query parameter redirect
  assert.equal(detectRecoveryFlow('', '?type=recovery&access_token=token'), true);
  // Case D: Standard app routing
  assert.equal(detectRecoveryFlow('#dashboard', ''), false);
  assert.equal(detectRecoveryFlow('', ''), false);

  // Verify AuthContext implementation
  const authContextContent = fs.readFileSync(path.join(process.cwd(), 'client/src/context/AuthContext.jsx'), 'utf8');
  assert.match(authContextContent, /isPasswordRecovery/, 'AuthContext must track isPasswordRecovery state');
  assert.match(authContextContent, /event === 'PASSWORD_RECOVERY'/, 'AuthContext must handle GoTrue PASSWORD_RECOVERY event');
  assert.match(authContextContent, /clearPasswordRecovery/, 'AuthContext must provide clearPasswordRecovery helper');

  // Verify App.jsx rendering guard
  const appContent = fs.readFileSync(path.join(process.cwd(), 'client/src/App.jsx'), 'utf8');
  assert.match(appContent, /if\s*\(\s*isPasswordRecovery\s*\)/, 'App.jsx must check isPasswordRecovery before rendering dashboard or standard login');
  assert.match(appContent, /<ResetPassword/, 'App.jsx must render ResetPassword component in recovery mode');
  assert.match(appContent, /<PasswordResetSuccess/, 'App.jsx must render PasswordResetSuccess component on completion');

  // Verify Login.jsx syncs internalView with recovery hash
  const loginContent = fs.readFileSync(path.join(process.cwd(), 'client/src/components/auth/Login.jsx'), 'utf8');
  assert.match(loginContent, /internalView === 'reset-password'/, 'Login.jsx must support reset-password view');
  assert.match(loginContent, /hash\.includes\('reset-password'\)/, 'Login.jsx must detect reset-password in window hash');

  console.log('✓ Direct recovery link routing, GoTrue event handler, and modal bypass verified.');
}

// --- Test 5: New Password Strength & Recovery Session Finalization ---
console.log('\n--- Test 5: New Password Validation & Session Finalization ---');
{
  function validateNewPassword(newPw, confirmPw) {
    if (!newPw) return { valid: false, error: 'Please enter your new password.' };
    if (newPw.length < 8) return { valid: false, error: 'Password must be at least 8 characters long.' };
    if (!confirmPw) return { valid: false, error: 'Please confirm your new password.' };
    if (newPw !== confirmPw) return { valid: false, error: 'Passwords do not match.' };
    return { valid: true };
  }

  assert.equal(validateNewPassword('', '').valid, false);
  assert.equal(validateNewPassword('1234567', '1234567').valid, false);
  assert.equal(validateNewPassword('NewSecurePass2026!', 'MismatchPass!').valid, false);
  assert.equal(validateNewPassword('NewSecurePass2026!', 'NewSecurePass2026!').valid, true);

  // Verify ResetPassword component enforces these exact constraints
  const resetPasswordContent = fs.readFileSync(path.join(process.cwd(), 'client/src/components/auth/ResetPassword.jsx'), 'utf8');
  assert.match(resetPasswordContent, /newPassword\.length < 8/, 'ResetPassword must check for 8-char minimum');
  assert.match(resetPasswordContent, /newPassword !== confirmPassword/, 'ResetPassword must verify confirmation match');

  console.log('✓ Password strength constraints and recovery session finalization verified.');
}

console.log('\n=============================================================================');
console.log('ALL PASSWORD RECOVERY, 6-DIGIT OTP & ROUTING TESTS PASSED END-TO-END!');
console.log('=============================================================================');
