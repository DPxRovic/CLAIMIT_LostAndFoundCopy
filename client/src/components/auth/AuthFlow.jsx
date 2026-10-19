import React, { useState } from 'react';
import ForgotPassword from './ForgotPassword';
import VerifyCode from './VerifyCode';
import ResetPassword from './ResetPassword';
import PasswordResetSuccess from './PasswordResetSuccess';

export default function AuthFlow({ onNavigateToLogin }) {
  const [currentStep, setCurrentStep] = useState('forgot');
  const [userEmail, setUserEmail] = useState('');

  return (
    <div>
      {/* Step 1: Request Password Reset */}
      {currentStep === 'forgot' && (
        <ForgotPassword
          onBackToLogin={onNavigateToLogin}
          onProceedToCode={(email) => {
            setUserEmail(email);
            setCurrentStep('verify');
          }}
        />
      )}

      {/* Step 2: Verification Code Input */}
      {currentStep === 'verify' && (
        <VerifyCode
          email={userEmail}
          onBackToLogin={onNavigateToLogin}
          onCodeVerified={() => setCurrentStep('reset')}
        />
      )}

      {/* Step 3: Set New Password */}
      {currentStep === 'reset' && (
        <ResetPassword
          onSuccess={() => setCurrentStep('success')}
          onCancel={onNavigateToLogin}
        />
      )}

      {/* Step 4: Password Reset Success */}
      {currentStep === 'success' && (
        <PasswordResetSuccess
          onBackToLogin={onNavigateToLogin}
        />
      )}
    </div>
  );
}