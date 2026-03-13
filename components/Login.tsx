
import React, { useState } from 'react';
import { Role, User } from '../types';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState<Role>(Role.USER);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // Try backend authentication first
    const loginData = {
      email: email,
      password: password
    };

    try {
      const result = await api.auth.login(loginData);

      if (result.success || result.token) { // Adjust based on actual response structure
        // If response is exactly { success: true, token: ..., user: ... } or just { token: ..., user: ... }
        // apiRequest returns response.json().
        // Let's assume response matches what backend sends.
        onLogin(result.user, result.token);
      } else {
        setError(`Login failed: ${result.message || 'Invalid credentials'}. Please try: admin@cu-harvest.com / admin123`);
      }
    } catch (error: any) {
      console.error('Network error:', error);
      setError(`Login failed: ${error.message}`);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !phone || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (phone.length < 10) {
      setError('Enter a valid phone number');
      return;
    }

    // Register with backend
    const registerData = {
      name: name,
      email: email,
      password: password,
      phone: phone,
      role: role // Pass the selected role (USER or RIDER)
    };

    try {
      const result = await api.auth.register(registerData);

      if (result.success || result.token) {
        onLogin(result.user, result.token);
      } else {
        setError(`Registration failed: ${result.message || 'Validation error'}. Please ensure: Name (2+ chars), Valid email, Password (6+ chars), Phone (10-15 digits)`);
      }
    } catch (error: any) {
      console.error('Network error:', error);
      setError(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-4xl font-black text-yellow-500">CU</span>
            <span className="text-4xl font-black text-green-600 ml-2">HARVEST</span>
          </div>
          <p className="text-gray-500 font-medium">India's Last Minute App</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => { setIsSignup(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignup ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsSignup(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignup ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Signup
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 animate-shake">
            {error}
          </div>
        )}

        {!isSignup ? (
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
                  placeholder={role === Role.ADMIN ? "Admin Username" : "Email Address"}
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
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${role === Role.ADMIN ? 'bg-yellow-500 shadow-yellow-100 hover:bg-yellow-600' : 'bg-green-600 shadow-green-100 hover:bg-green-700'}`}
            >
              Sign In to Harvest
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 outline-none text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 px-4 focus:border-green-500 outline-none text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
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
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-green-100 hover:bg-green-700 transition-all transform active:scale-95"
            >
              Create Account
            </button>
          </form>
        )}

        {isSignup && (
          <div className="flex justify-center mt-4">
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                type="button"
                onClick={() => setRole(Role.USER)}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${role === Role.USER ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole(Role.RIDER)}
                className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${role === Role.RIDER ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Delivery Partner
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest pt-4">
          Secured by Harvest-Shield™
        </div>
      </div>
    </div>
  );
};

export default Login;
