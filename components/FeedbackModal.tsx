import React, { useState } from 'react';
import { api } from '../services/api';

interface FeedbackModalProps {
    orderId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ orderId, onClose, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.submitFeedback({
                order_id: orderId,
                rating,
                comment
            });
            if (res.success) {
                onSuccess();
            } else {
                setError(res.message || "Failed to submit feedback");
            }
        } catch (err: any) {
            setError(err.message || "Failed to submit feedback. You might have already rated this order.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center">
                    <div className="text-5xl mb-4">⭐</div>
                    <h2 className="text-2xl font-black text-gray-800">Rate Your Experience</h2>
                    <p className="text-gray-500 mt-2">How was your delivery for order #{orderId.slice(-6)}?</p>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-2 my-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`text-4xl transition-all duration-200 ${star <= rating ? 'scale-110' : 'grayscale opacity-30 scale-100 hover:opacity-50'}`}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>

                    {/* Comment Field */}
                    <div className="text-left mb-6">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Tell us more (Optional)</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Was the food fresh? Was the rider polite?"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-yellow-400 outline-none transition-all h-24 resize-none"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="py-3.5 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-colors"
                        >
                            Skip
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`py-3.5 rounded-2xl font-bold text-white shadow-xl transition-all ${loading ? 'bg-gray-300' : 'bg-black active:scale-95'}`}
                        >
                            {loading ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;
