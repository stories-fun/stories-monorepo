import * as React from "react";

interface EmailTemplateProps {
  otp: number;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({ otp }) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>Account Verification</h1>
      <p>To complete your account verification, please enter the One-Time Password (OTP) below:</p>
      <div style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        padding: '10px', 
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        margin: '20px 0'
      }}>
        {otp}
      </div>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
    </div>
  );
};

export default EmailTemplate;