
import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';
import RiderHome from './Rider/RiderHome';
import TripHistory from './Rider/TripHistory';
import RiderProfile from './Rider/RiderProfile';
import { api } from '../services/api';

interface RiderDashboardProps {
    currentUser: User;
    onLogout: () => void;
}

const RiderDashboard: React.FC<RiderDashboardProps> = ({ currentUser: initialUser, onLogout }) => {
    const [currentUser, setCurrentUser] = useState(initialUser);
    const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile'>('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Refresh Profile for real-time status and stats
    const refreshProfile = async () => {
        try {
            const res = await api.auth.getProfile();
            if (res.success) {
                setCurrentUser(res.user);
            }
        } catch (err) {
            console.error("Failed to refresh rider profile:", err);
        }
    };

    // Polling for updates
    useEffect(() => {
        const interval = setInterval(refreshProfile, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const toggleOnlineStatus = async () => {
        try {
            const newStatus = !currentUser.is_online;
            const response = await api.updateRiderStatus(newStatus);
            if (response.success) {
                setCurrentUser(prev => ({ ...prev, is_online: newStatus }));
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            alert("Failed to update status");
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <RiderHome driverId={currentUser.id} />;
            case 'history': return <TripHistory driverId={currentUser.id} />;
            case 'profile': return <RiderProfile currentUser={currentUser} />;
            default: return <RiderHome driverId={currentUser.id} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* App Bar */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-4 py-3 flex justify-between items-center relative">
                    <div className="flex items-center space-x-2" onClick={() => setActiveTab('home')}>
                        <span className="text-2xl">🛵</span>
                        <div>
                            <h1 className="text-lg font-black leading-none">
                                <span className="text-yellow-500">CU</span> <span className="text-green-600">HARVEST</span> <span className="text-gray-800">RIDER</span>
                            </h1>
                            <div className="flex items-center space-x-1 mt-0.5">
                                <div className={`w-2 h-2 rounded-full ${currentUser.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">{currentUser.is_online ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Toggle in Header */}
                    <div className="flex items-center mr-2">
                         <button
                            onClick={toggleOnlineStatus}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${currentUser.is_online ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                            <span
                                className={`${currentUser.is_online ? 'translate-x-5' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>

                    {/* 3-Dot Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-14 right-4 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
                            <button
                                onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 text-sm font-bold text-gray-700"
                            >
                                <span>👤</span> <span>My Profile</span>
                            </button>
                            <button
                                onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 text-sm font-bold text-gray-700"
                            >
                                <span>📅</span> <span>Trip History</span>
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center space-x-3 text-sm font-bold text-red-600"
                            >
                                <span>🚪</span> <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-lg mx-auto w-full p-4 relative z-0">
                {renderContent()}
            </main>

            {/* Bottom Nav (Optional, Blinkit style uses bottom nav usually) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-around items-center z-40 md:max-w-lg md:mx-auto md:rounded-t-2xl md:shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-green-600' : 'text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="text-[10px] font-bold">Orders</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex flex-col items-center space-y-1 ${activeTab === 'history' ? 'text-green-600' : 'text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-bold">History</span>
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center space-y-1 ${activeTab === 'profile' ? 'text-green-600' : 'text-gray-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-[10px] font-bold">Profile</span>
                </button>
            </nav>
        </div>
    );
};

export default RiderDashboard;

