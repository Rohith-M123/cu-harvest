
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User as FirebaseUser,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Role } from '../types';

export const authService = {
    signup: async (email: string, password: string, name: string): Promise<void> => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userData: User & { createdAt: Timestamp } = {
            id: user.uid,
            name,
            email: user.email!,
            role: Role.USER,
            addresses: [],
            createdAt: Timestamp.now()
        };

        // We cast to any or omit createdAt from User type depending on strictness, 
        // but for Firestore we want to save it.
        await setDoc(doc(db, 'users', user.uid), userData);
        await sendEmailVerification(user);
    },

    login: async (email: string, password: string): Promise<FirebaseUser> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    logout: async (): Promise<void> => {
        await signOut(auth);
    },

    getUserRole: async (uid: string): Promise<Role | null> => {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return (docSnap.data() as User).role;
        }
        return null;
    }
};
