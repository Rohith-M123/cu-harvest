
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';

import { api } from '../../services/api';

interface TripHistoryProps {
    driverId: string;
}

const TripHistory: React.FC<TripHistoryProps> = ({ driverId }) => {
    const [trips, setTrips] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Default Today
    const [totalEarnings, setTotalEarnings] = useState(0);

    useEffect(() => {
        const fetchHistoryAndEarnings = async () => {
            setLoading(true);
            try {
                // Fetch completed orders for rider from backend
                const response = await api.getRiderTrips();

                if (response.success && response.trips) {
                    const fetchedTrips = response.trips;
                    
                    const filtered = fetchedTrips.filter((order: any) => {
                        const dateStr = order.created_at || order.date; 
                        if (!dateStr) return false;
                        const orderDate = new Date(dateStr).toISOString().split('T')[0];
                        return orderDate === dateFilter;
                    });

                    setTrips(filtered);
                }

                // Fetch total earnings
                const earningsRes = await api.getRiderEarnings();
                if (earningsRes.success && earningsRes.earnings) {
                     setTotalEarnings(earningsRes.earnings.total_earnings || 0);
                }
            } catch (error) {
                console.error("Error fetching trips or earnings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoryAndEarnings();
    }, [driverId, dateFilter]);

    return (
        <div className="space-y-4">
            {/* Date Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center sticky top-0 z-10">
                <span className="font-bold text-gray-700">Date</span>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                <p className="opacity-90 text-sm font-medium">Earnings on {dateFilter}</p>
                <h3 className="text-4xl font-black mt-1">₹{totalEarnings}</h3>
                <p className="mt-2 text-sm opacity-90">{trips.length} Trips Completed</p>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-8 text-gray-400">Loading history...</div>
            ) : trips.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">
                    No trips found for this date.
                </div>
            ) : (
                <div className="space-y-3">
                    {trips.map((trip: any) => (
                        <div key={trip.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${trip.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {trip.status}
                                    </span>
                                    <span className="text-xs text-gray-400">#{String(trip.id || '').slice(-6)}</span>
                                </div>
                                <p className="font-bold text-gray-800 mt-1">₹{trip.delivery_fee || 40} Earning</p>
                                <p className="text-xs text-gray-400 mt-1">{new Date(trip.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-lg font-bold text-gray-800">₹{trip.total_amount || 0}</span>
                                <p className="text-xs text-gray-400">Order Value</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TripHistory;
