import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'https://legendor.in'}/verify-email/${token}`;
  
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
