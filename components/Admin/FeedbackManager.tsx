import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const FeedbackManager: React.FC = () => {
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAllFeedback = async () => {
        setLoading(true);
        try {
            const res = await api.getAllFeedback();
            if (res.success) {
                setFeedbacks(res.feedbacks);
            }
        } catch (err) {
            console.error("Failed to fetch all feedback:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllFeedback();
    }, []);

    return (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-black text-gray-800">Customer Feedback</h2>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Monitor Rider Performance</p>
                </div>
                <button 
                  onClick={fetchAllFeedback}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Refresh Feedback"
                >
                  <svg className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-400">Loading feedback...</div>
            ) : feedbacks.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-20">⭐</div>
                    <p className="text-gray-400 font-bold uppercase text-xs">No feedback received yet</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Rider</th>
                                <th className="p-4">Rating</th>
                                <th className="p-4">Comment</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {feedbacks.map((f) => (
                                <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-800 text-sm">{f.user_name}</p>
                                        <p className="text-[10px] text-gray-400">{f.user_email}</p>
                                    </td>
                                    <td className="p-4 font-bold text-gray-700 text-xs uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                            {f.rider_name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <span key={s} className={`text-xs ${s <= f.rating ? '' : 'grayscale opacity-20'}`}>⭐</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-xs">
                                        <p className="text-sm text-gray-600 line-clamp-2 italic">
                                            {f.comment || <span className="text-gray-300 not-italic uppercase text-[10px] font-bold">No comment left</span>}
                                        </p>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-gray-400">
                                        {new Date(f.date).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FeedbackManager;
