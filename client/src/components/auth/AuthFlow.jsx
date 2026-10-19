import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import VerifyCode from './VerifyCode.jsx';
import ResetPassword from './ResetPassword.jsx';
import PasswordResetSuccess from './PasswordResetSuccess.jsx';

/**
 * AuthFlow component coordinating the 4-step password recovery lifecycle:
 * Step 1: ForgotPassword (submit email)
 * Step 2: VerifyCode (submit 6-digit OTP)
 * Step 3: ResetPassword (submit new password)
 * Step 4: PasswordResetSuccess (confirmation & return to login)
 */
export default function AuthFlow({ onNavigateToLogin }) {
  const { logout } = useAuth();
  const [currentStep, setCurrentStep] = useState('forgot');
  const [userEmail, setUserEmail] = useState('');
  const [initialMessage, setInitialMessage] = useState('');

  const handleReturnToLogin = async () => {
    try {
      await logout();
    } catch {
      // Ignored
    }
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
  };

  return (
    <div>
      {/* Step 1: Request Password Reset */}
      {currentStep === 'forgot' && (
        <ForgotPassword
          onBackToLogin={handleReturnToLogin}
          onProceedToCode={(email, message) => {
            setUserEmail(email);
            setInitialMessage(message || '');
            setCurrentStep('verify');
          }}
        />
      )}

      {/* Step 2: Verification Code Input */}
      {currentStep === 'verify' && (
        <VerifyCode
          email={userEmail}
          initialMessage={initialMessage}
          onBackToLogin={handleReturnToLogin}
          onCodeVerified={() => setCurrentStep('reset')}
        />
      )}

      {/* Step 3: Set New Password */}
      {currentStep === 'reset' && (
        <ResetPassword
          onSuccess={() => setCurrentStep('success')}
          onCancel={handleReturnToLogin}
        />
      )}

      {/* Step 4: Password Reset Success */}
      {currentStep === 'success' && (
        <PasswordResetSuccess
          onBackToLogin={handleReturnToLogin}
        />
      )}
    </div>
  );
}

export { AuthFlow };
