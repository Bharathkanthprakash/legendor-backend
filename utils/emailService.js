import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Add the missing exports that auth.js is looking for
export const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const subject = 'Verify Your Email - Legendor';
  const html = `
    <h2>Welcome to Legendor!</h2>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>Or copy this link: ${verificationUrl}</p>
  `;
  
  return await sendEmail(to, subject, '', html);
};

export const sendWelcomeEmail = async (to, username) => {
  const subject = 'Welcome to Legendor!';
  const html = `
    <h2>Welcome to Legendor, ${username}!</h2>
    <p>Thank you for joining our community. We're excited to have you on board!</p>
    <p>Start exploring and connecting with other legends.</p>
  `;
  
  return await sendEmail(to, subject, '', html);
};

export default transporter;
