
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
// Firestore imports removed
import { api } from '../../services/api';

interface RiderHomeProps {
    driverId: string;
}

const RiderHome: React.FC<RiderHomeProps> = ({ driverId }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);

    const fetchOrders = async () => {
        try {
            // Check status first
            const profile = await api.auth.getProfile();
            if (profile.success) {
                setIsOnline(profile.user.is_online);
                if (!profile.user.is_online) {
                    setOrders([]);
                    setLoading(false);
                    return;
                }
            }

            const res = await api.getRiderOrders();
            if (res.success) {
                const formattedOrders = res.orders.map((o: any) => ({
                    id: o.id.toString(),
                    orderNumber: o.order_number,
                    userId: o.user_id,
                    items: o.items || [], // API might not join items yet? Check controller.
                    // Controller getRiderOrders sends o.*. It does NOT join items.
                    // We might need to fetch items or just show summary.
                    // For now, let's map what we have.
                    total: parseFloat(o.total_amount),
                    status: o.status,
                    date: o.created_at,
                    address: o.shipping_address,
                    paymentMethod: o.payment_method,
                    customerName: o.user_name,
                    customerPhone: o.user_phone,
                    deliveryType: o.delivery_type,
                    deliveryDate: o.delivery_date,
                    deliverySlot: o.delivery_slot
                }));
                // Sort by date desc
                formattedOrders.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setOrders(formattedOrders);
            }
        } catch (err) {
            console.error("Failed to fetch rider orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [driverId]);

    useEffect(() => {
        // Location watcher for rider
        let watchId: number;
        if ("geolocation" in navigator) {
            watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await api.updateRiderLocation(latitude, longitude);
                    } catch (err) {
                        console.error("Failed to update location", err);
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
            );
        }
        return () => {
            if (watchId !== undefined && "geolocation" in navigator) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [driverId]);

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            // Call backend API
            const res = await api.updateOrderStatus(orderId, newStatus);
            if (res.success) {
                alert("Status updated!");
                fetchOrders(); // Refresh
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update status");
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PLACED: return 'bg-yellow-100 text-yellow-800';
            // case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800'; // Removed
            case OrderStatus.PACKED: return 'bg-indigo-100 text-indigo-800';
            case OrderStatus.OUT_FOR_DELIVERY: return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div className="text-center py-12 text-gray-400">Loading orders...</div>;

    if (!isOnline) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="text-6xl mb-4 grayscale">🛵</div>
                <h3 className="text-xl font-bold text-gray-800">You are Offline</h3>
                <p className="text-sm mt-2 text-center">Toggle your status to online to start receiving and delivering orders.</p>
                <button 
                    onClick={async () => {
                         const res = await api.updateRiderStatus(true);
                         if (res.success) fetchOrders();
                    }}
                    className="mt-6 bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-100"
                >
                    Go Online Now
                </button>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
                <div className="text-6xl mb-4 animate-bounce">🛵</div>
                <h3 className="text-xl font-bold text-gray-800">No Active Deliveries</h3>
                <p className="text-sm mt-2">You're all caught up! Stay online for new alerts.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            <h2 className="font-bold text-gray-700 px-2">Active Deliveries ({orders.length})</h2>
            {orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                    {/* Status Strip */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(order.status).split(' ')[0].replace('bg-', 'bg-')}`}></div>

                    <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.status)}`}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                            <div className="mt-2 font-bold text-gray-800">Order #{order.orderNumber || order.id}</div>
                        </div>
                        <div className="text-right">
                            {/* Timer or Time */}
                            <div className="text-xs font-bold text-gray-400">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            {order.deliveryType === 'SCHEDULED' && (
                                <div className="mt-1 text-[10px] font-black text-blue-600 uppercase">
                                    📅 {new Date(order.deliveryDate!).toLocaleDateString()}
                                    <br />
                                    {order.deliverySlot}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer & Location */}
                    <div className="space-y-3 pl-2 border-t border-dashed border-gray-100 pt-3">
                        <div className="flex items-start space-x-3">
                            <div className="mt-1 bg-gray-100 p-1.5 rounded-full">👤</div>
                            <div>
                                <p className="font-bold text-sm text-gray-800">{order.customerName || 'Customer'}</p>
                                <a href={`tel:${order.customerPhone}`} className="text-blue-600 text-xs font-bold hover:underline">
                                    {order.customerPhone || 'No Phone'}
                                </a>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="mt-1 bg-gray-100 p-1.5 rounded-full">📍</div>
                            <div>
                                <p className="text-sm text-gray-600 leading-snug">{order.address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pl-2">
                        {order.status !== OrderStatus.OUT_FOR_DELIVERY ? (
                            <button
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.OUT_FOR_DELIVERY)}
                                className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-gray-200 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                            >
                                <span>🚀</span> <span>Start Delivery</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusUpdate(order.id, OrderStatus.DELIVERED)}
                                className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-green-200 active:scale-95 transition-transform flex items-center justify-center space-x-2"
                            >
                                <span>✅</span> <span>Complete Delivery</span>
                            </button>
                        )}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-center mt-3 text-xs font-bold text-gray-400 hover:text-gray-600"
                        >
                            Open in Google Maps
                        </a>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RiderHome;
