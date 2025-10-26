import nodemailer from "nodemailer";

// Create transporter with your Gmail
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Email transporter failed:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: `Legendor <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Legendor Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🏆 Legendor</h1>
          <p style="color: #6b7280; margin: 5px 0;">Sports Social Network</p>
        </div>
        
        <h2 style="color: #1f2937;">Verify Your Email Address</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Welcome to Legendor! To complete your registration and start connecting with sports enthusiasts, 
          please verify your email address by clicking the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;
                    font-weight: bold; font-size: 16px;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">
            This link will expire in 24 hours. If you didn't create an account with Legendor, 
            please ignore this email.
          </p>
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw new Error("Failed to send verification email");
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const mailOptions = {
    from: `Legendor <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Legendor! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🏆 Legendor</h1>
          <p style="color: #6b7280; margin: 5px 0;">Sports Social Network</p>
        </div>
        
        <h2 style="color: #1f2937;">Welcome to the Community, ${name}! 🎉</h2>
        
        <p style="color: #4b5563; line-height: 1.6;">
          We're excited to have you join Legendor - the ultimate sports social network! 
          Get ready to:
        </p>
        
        <ul style="color: #4b5563; line-height: 1.6;">
          <li>Connect with sports enthusiasts worldwide</li>
          <li>Share your sports moments and achievements</li>
          <li>Discover amazing sports content</li>
          <li>Join conversations about your favorite sports</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/feed" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;
                    font-weight: bold; font-size: 16px;">
            Start Exploring
          </a>
        </div>
        
        <p style="color: #6b7280;">
          If you have any questions, feel free to reply to this email. We're here to help!
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px;">
            Happy sporting!<br>
            The Legendor Team
          </p>
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${name} <${email}>`);
    return true;
  } catch (error) {
    console.error("❌ Welcome email error:", error);
    throw new Error("Failed to send welcome email");
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: `Legendor <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Legendor Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🏆 Legendor</h1>
        </div>
        
        <h2 style="color: #1f2937;">Reset Your Password</h2>
        
        <p style="color: #4b5563; line-height: 1.6;">
          You requested to reset your password. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc2626; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;
                    font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Or copy this link: ${resetUrl}
        </p>
        
        <p style="color: #6b7280;">
          If you didn't request this, please ignore this email. Your password will remain unchanged.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px;">
            This link will expire in 1 hour.
          </p>
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Password reset email error:", error);
    throw new Error("Failed to send password reset email");
  }
};
