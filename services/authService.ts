
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
    sendEmailVerification,
    signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Role } from '../types';

import { API_URL } from './api';

export const authService = {
    signup: async (email: string, password: string, name: string, role: Role = Role.USER): Promise<void> => {
        // 1. Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData: User & { createdAt: Timestamp } = {
            id: user.uid,
            name,
            email: user.email!,
            role: role,
            addresses: [],
            createdAt: Timestamp.now()
        };

        // 2. Firestore (Keep for compatibility/backup)
        await setDoc(doc(db, 'users', user.uid), userData);
        await sendEmailVerification(user);

        // 3. Backend SQL Auth
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role,
                    firebase_uid: (userCredential.user as any).uid
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }

                // SYNC: If backend returned a different role (e.g. linked account), update Firestore
                if (data.user && data.user.role && data.user.role !== role) {
                    console.log(`Syncing Firestore role from ${role} to ${data.user.role}`);
                    await setDoc(doc(db, 'users', user.uid), { role: data.user.role }, { merge: true });
                }
            } else {
                console.warn('Backend registration failed, but Firebase succeeded.');
            }
        } catch (error) {
            console.error('Backend registration error:', error);
        }
    },

    login: async (email: string, password: string): Promise<FirebaseUser> => {
        // 1. Firebase Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // 2. Backend SQL Login
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    password,
                    firebase_uid: userCredential.user.uid
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }
            } else {
                console.warn('Backend login failed.');
            }
        } catch (error) {
            console.error('Backend login error:', error);
        }

        return userCredential.user;
    },

    logout: async (): Promise<void> => {
        await signOut(auth);
        localStorage.removeItem('authToken');
    },

    getUserRole: async (uid: string): Promise<Role | null> => {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return (docSnap.data() as User).role;
        }
        return null;
    },

    loginWithPhone: async (phoneNumber: string, appVerifier: any): Promise<any> => {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return confirmationResult;
    },

    syncBackend: async (firebaseUser: FirebaseUser, role?: Role): Promise<string | null> => {
        try {
            // We use the existing login endpoint which supports firebase_uid
            // Phone users might not have email, so generate a dummy one for backend
            const email = firebaseUser.email || `phone_${firebaseUser.uid}@cu-harvest.com`;

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: 'dummy_password_for_uid_login',
                    firebase_uid: firebaseUser.uid,
                    name: firebaseUser.displayName || 'App User',
                    role: role // Pass role for auto-sync creation
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    return data.token;
                }
            }
        } catch (err) {
            console.warn("Backend sync failed:", err);
        }
        return null;
    }
};
