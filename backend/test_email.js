import { sendOrderNotification } from './src/services/emailService.js';
import mongoose from 'mongoose';

const testEmail = async () => {
    console.log('Testing Email Service...');
    
    const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        order_number: 'TEST-12345',
        total_amount: 25.50
    };

    // Replace with the user's email if they want to receive it, 
    // but the email in .env is mollirohit1020@gmail.com, so we'll send it to themselves for testing
    const testRecipient = process.env.EMAIL_USER || 'mollirohit1020@gmail.com'; 

    console.log(`Sending test email to ${testRecipient}...`);
    
    try {
        const success = await sendOrderNotification(testRecipient, mockOrder, 'PLACED');
        if (success) {
            console.log('✅ Email sent successfully!');
        } else {
            console.log('❌ Failed to send email. Check credentials or logs.');
        }
    } catch (err) {
        console.error('Error during test:', err);
    }
    
    process.exit(0);
};

testEmail();
