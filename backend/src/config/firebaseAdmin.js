import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);

try {
    // Try to load service account from local file
    // You should put your serviceAccountKey.json in backend/ or config/
    const serviceAccount = require('../../serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized with serviceAccountKey.json');

} catch (error) {
    // Fallback to environment variables or default app (if on GCP)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin initialized with FIREBASE_SERVICE_ACCOUNT_KEY');
        } catch (e) {
            console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
        }
    } else {
        // Attempt default init (works on GCP/Firebase Hosting functions sometimes)
        // admin.initializeApp();
        console.warn('⚠️ Firebase Admin could not load serviceAccountKey.json. Authentication verification might fail if not on GCP.');
        // Initialize with no-op or mock for development if needed, but better to fail explicitly or mock in tests
        // For now we just initialize a default app which might fail later if no creds
        try {
            admin.initializeApp();
            console.log('⚠️ Firebase Admin initialized with default credentials');
        } catch (e) {
            console.error('❌ Failed to initialize Firebase Admin');
        }
    }
}

export default admin;
