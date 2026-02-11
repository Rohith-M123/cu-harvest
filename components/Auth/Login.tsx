
import React, { useState } from 'react';
import { Role } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
    onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
    const { login } = useAuth();
    const [role, setRole] = useState<Role>(Role.USER);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Login failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                    className="flex-1 py-2 text-sm font-bold rounded-lg bg-white shadow-sm text-green-600 transition-all"
                >
                    Login
                </button>
                <button
                    onClick={onSwitchToSignup}
                    className="flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 hover:text-gray-700 transition-all"
                >
                    Signup
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 animate-shake mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Login Role</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setRole(Role.USER)}
                            className={`py-2 px-4 rounded-xl text-sm font-bold border-2 transition-all ${role === Role.USER ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'}`}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole(Role.ADMIN)}
                            className={`py-2 px-4 rounded-xl text-sm font-bold border-2 transition-all ${role === Role.ADMIN ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-100 text-gray-400'}`}
                        >
                            Admin
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={role === Role.ADMIN ? "Admin Email" : "Email Address"}
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 focus:ring-0 outline-none transition-all text-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 focus:ring-0 outline-none transition-all text-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${role === Role.ADMIN ? 'bg-yellow-500 shadow-yellow-100 hover:bg-yellow-600' : 'bg-green-600 shadow-green-100 hover:bg-green-700'}`}
                >
                    {loading ? 'Signing In...' : 'Sign In to Harvest'}
                </button>
            </form>
        </React.Fragment>
    );
};

export default Login;
