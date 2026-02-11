
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { authService } from '../services/authService';
import {
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, Role } from '../types';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string, name: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email: string, password: string, name: string) => {
        await authService.signup(email, password, name);
    };

    const login = async (email: string, password: string) => {
        const user = await authService.login(email, password);
        if (!user.emailVerified) {
            // Optional warning logic
        }
    };

    const logout = async () => {
        await authService.logout();
        setCurrentUser(null);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        let userData = docSnap.data() as User;

                        // Force Admin Role for specific email
                        if (user.email === 'admin@cu-harvest.com' && userData.role !== Role.ADMIN) {
                            userData = { ...userData, role: Role.ADMIN };
                            await setDoc(docRef, { role: Role.ADMIN }, { merge: true });
                        }

                        setCurrentUser(userData);
                    } else {
                        // User exists in Auth but not Firestore
                        // Create a default user object locally to allow login
                        const userData: User = {
                            id: user.uid,
                            name: user.displayName || 'User',
                            email: user.email!,
                            role: Role.USER,
                            addresses: []
                        };
                        // Try to write to Firestore, but if it fails, just use local state
                        try {
                            await setDoc(doc(db, 'users', user.uid), userData);
                        } catch (e) {
                            console.warn("Could not create user spec in Firestore (likely permission issue):", e);
                        }
                        setCurrentUser(userData);
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                    // Fallback: Allow login even if Firestore fails
                    const fallbackUser: User = {
                        id: user.uid,
                        name: user.displayName || 'User',
                        email: user.email!,
                        role: Role.USER,
                        addresses: []
                    };
                    setCurrentUser(fallbackUser);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
