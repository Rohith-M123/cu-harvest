import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string, name: string, role?: Role) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    loginWithPhone: (phoneNumber: string, appVerifier: any) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

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

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setCurrentUser(null);
            setLoading(false);
            return;
        }

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const response = await fetch(`${API_URL}/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentUser(data.user);
            } else {
                console.warn("Backend profile fetch failed, token might be invalid.");
                localStorage.removeItem('authToken');
                setCurrentUser(null);
            }
        } catch (err) {
            console.error("Backend profile fetch error", err);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email: string, password: string, name: string, role: Role = Role.USER) => {
        try {
            const response = await api.auth.register({ email, password, name, role });
            if (response.success && response.token) {
                localStorage.setItem('authToken', response.token);
                await fetchUserProfile();
            } else {
                throw new Error("Registration failed.");
            }
        } catch (error: any) {
             throw new Error(error.message || "Registration failed.");
        }
    };

    const login = async (email: string, password: string) => {
        try {
             const response = await api.auth.login({ email, password });
             if (response.success && response.token) {
                 localStorage.setItem('authToken', response.token);
                 await fetchUserProfile();
             } else {
                 throw new Error("Login failed.");
             }
        } catch (error: any) {
             throw new Error(error.message || "Login failed.");
        }
    };

    const loginWithPhone = async (phoneNumber: string, appVerifier: any) => {
        // Disabled Phone Auth Firebase for pure backend
        throw new Error("Phone auth requires Firebase and is currently disabled.");
    };

    const logout = async () => {
        localStorage.removeItem('authToken');
        setCurrentUser(null);
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        loginWithPhone,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
