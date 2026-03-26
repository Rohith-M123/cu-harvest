import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('--- Testing SMTP configuration ---');
console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? 'Set' : 'NOT SET'}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'Set' : 'NOT SET'}`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Please set EMAIL_USER and EMAIL_PASS in your .env file before running this script.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function testEmail() {
  try {
    console.log('Attempting to send a test email to:', process.env.EMAIL_USER);
    const info = await transporter.sendMail({
      from: `"Test Service" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // sending it to yourself
      subject: 'SMTP Test Successful',
      text: 'If you are seeing this, your SMTP configuration is correct!',
      html: '<b>If you are seeing this, your SMTP configuration is correct!</b>'
    });
    console.log('Test email sent successfully! Message ID:', info.messageId);
    console.log('\nSuccess! Your email and password are correct. Use these exact credentials in Render environment variables.');
  } catch (error) {
    console.error('\nFAILED to send test email. Reason:', error.message);
    console.log('Please verify:');
    console.log('1. You are using a 16-character App Password (NOT your regular Google password)');
    console.log('2. Your email address is correct');
    console.log('3. There are no trailing spaces in your .env or Render variables');
  }
}

testEmail();
