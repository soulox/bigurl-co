import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || '';
const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'BigURL <noreply@bigurl.co>';

const mg = MAILGUN_API_KEY ? mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
}) : null;

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!mg || !MAILGUN_DOMAIN) {
    console.warn('Mailgun not configured, email not sent:', { to, subject });
    return;
  }

  try {
    await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const subject = 'Welcome to BigURL!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to BigURL!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333;">Hi ${name},</h2>
        
        <p>Thanks for signing up! You're now ready to start creating short, trackable links.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0;">Your Free Plan Includes:</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>5 short links</li>
            <li>QR code generation</li>
            <li>Basic analytics</li>
            <li>Custom slugs</li>
          </ul>
        </div>
        
        <p>Ready to upgrade? Check out our <strong>Basic (20 links)</strong> and <strong>Pro (100 links)</strong> plans for more capacity!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bigurl.co'}/dashboard" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Go to Dashboard
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          Questions? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bigurl.co'}/contact">contact page</a>.
        </p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

export async function sendContactFormEmail(name: string, email: string, message: string) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@bigurl.co';
  const subject = `Contact Form: ${name}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Message:</strong></p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
        ${message.replace(/\n/g, '<br>')}
      </div>
      <hr>
      <p style="color: #666; font-size: 12px;">Reply directly to ${email} to respond.</p>
    </body>
    </html>
  `;

  await sendEmail(adminEmail, subject, html);
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://bigurl.co'}/auth/reset-password?token=${resetToken}`;
  const subject = 'Reset Your BigURL Password';
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        If you didn't request this, you can safely ignore this email.
      </p>
      
      <p style="color: #999; font-size: 12px;">
        Or copy this link: ${resetUrl}
      </p>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
}

