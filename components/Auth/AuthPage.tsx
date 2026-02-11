
import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthPage: React.FC = () => {
    const [isSignup, setIsSignup] = useState(false);

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

                {!isSignup ? (
                    <Login onSwitchToSignup={() => setIsSignup(true)} />
                ) : (
                    <Signup onSwitchToLogin={() => setIsSignup(false)} />
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

export default AuthPage;
