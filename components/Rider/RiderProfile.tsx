import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { api } from '../../services/api';

interface RiderProfileProps {
    currentUser: User;
}

const RiderProfile: React.FC<RiderProfileProps> = ({ currentUser: userProp }) => {
    const isOnline = userProp.is_online || false;
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({ averageRating: 0, totalCount: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await api.getRiderFeedback(userProp.id);
                if (res.success) {
                    setFeedbacks(res.feedbacks);
                    setStats(res.stats);
                }
            } catch (err) {
                console.error("Failed to fetch feedback:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, [userProp.id]);

    const toggleOnlineStatus = async () => {
        try {
            const newStatus = !isOnline;
            const response = await api.updateRiderStatus(newStatus);
            if (response.success) {
                // The parent RiderDashboard will refresh via polling or we could trigger a callback.
                // For simplicity, we just rely on parent refresh.
                alert(`You are now ${newStatus ? 'Online' : 'Offline'}`);
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error toggling status:", error);
            alert("Failed to update status");
        }
    };

    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                    👤
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">{userProp.name}</h2>
                    <p className="text-gray-500 text-sm">{userProp.email}</p>
                    <p className="text-gray-500 text-sm font-mono mt-1">{userProp.id}</p>
                </div>
            </div>

            {/* Status Toggle */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">Availability Status</h3>
                    <p className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                        Currently {isOnline ? 'Online & Receiving Orders' : 'Offline'}
                    </p>
                </div>
                <button
                    onClick={toggleOnlineStatus}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${isOnline ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                    <span
                        className={`${isOnline ? 'translate-x-7' : 'translate-x-1'} inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
                    />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Deliveries</p>
                    <h3 className="text-3xl font-black text-gray-800 mt-2">{userProp.total_deliveries || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Earnings</p>
                    <h3 className="text-3xl font-black text-gray-800 mt-2">₹{userProp.total_earnings || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-100 col-span-2">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Average Rating</p>
                            <h3 className="text-3xl font-black text-gray-800 mt-2">⭐ {stats.averageRating}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Based on</p>
                            <p className="text-xl font-bold text-gray-800">{stats.totalCount} reviews</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg mb-4">Customer Reviews</h3>
                {loading ? (
                    <p className="text-gray-400 text-sm">Loading reviews...</p>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 text-sm">No reviews yet. Keep delivering!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {feedbacks.map((f, idx) => (
                            <div key={idx} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-gray-800 text-sm">₹{f.user_name}</p>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={`text-xs ${star <= f.rating ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</span>
                                        ))}
                                    </div>
                                </div>
                                {f.comment && <p className="text-gray-600 text-sm italic">"{f.comment}"</p>}
                                <p className="text-[10px] text-gray-400 mt-1">{new Date(f.date).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RiderProfile;
