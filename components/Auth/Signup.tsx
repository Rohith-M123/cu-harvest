import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface SignupProps {
    onSwitchToLogin: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
    const { signup } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<Role>(Role.USER); // Default to USER
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await signup(email, password, name, role);
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                    onClick={onSwitchToLogin}
                    className="flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 hover:text-gray-700 transition-all"
                >
                    Login
                </button>
                <button
                    className="flex-1 py-2 text-sm font-bold rounded-lg bg-white shadow-sm text-green-600 transition-all"
                >
                    Signup
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 animate-shake mb-4">
                    {error}
                </div>
            )}

            {/* Role Selection */}
            <div className="space-y-1 mb-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Join As</label>
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
                        onClick={() => setRole(Role.RIDER)}
                        className={`py-2 px-4 rounded-xl text-sm font-bold border-2 transition-all ${role === Role.RIDER ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-400'}`}
                    >
                        Delivery Partner
                    </button>
                </div>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 outline-none text-sm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-bold text-sm border-r pr-2">+91</span>
                        </div>
                        <input
                            type="tel"
                            placeholder="Mobile Number"
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-14 pr-4 focus:border-green-500 outline-none text-sm font-medium"
                            value={phone}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 10) setPhone(val);
                            }}
                        />
                    </div>
                </div>
                <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 outline-none text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 outline-none text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirm"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 outline-none text-sm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all transform active:scale-95"
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>
        </React.Fragment>
    );
};

export default Signup;
