
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import FeedbackModal from './FeedbackModal';

interface OrderTrackingProps {
  orders: Order[];
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Fetch real-time updates when an order is selected
  useEffect(() => {
    let interval: any;
    
    const fetchTracking = async () => {
      if (!selectedOrder) return;
      
      try {
        const response = await api.trackOrder(selectedOrder.id);
        if (response.success && response.tracking) {
           setTrackingData(response.tracking);
        }
      } catch (error) {
        console.error("Failed to fetch tracking data", error);
      }
    };

    if (selectedOrder && selectedOrder.status !== OrderStatus.DELIVERED && selectedOrder.status !== OrderStatus.CANCELLED) {
      fetchTracking();
      interval = setInterval(fetchTracking, 15000); // Update every 15s
    } else if (selectedOrder) {
      // Just fetch once if delivered/cancelled to get final rider details
      fetchTracking();
    }

    return () => clearInterval(interval);
  }, [selectedOrder]);

  const getEtaMinutes = () => {
      if (!trackingData || !trackingData.estimated_delivery_time) return 15; // default fallback
      const diffMs = new Date(trackingData.estimated_delivery_time).getTime() - new Date().getTime();
      const diffMins = Math.max(1, Math.round(diffMs / 60000));
      return diffMins;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PLACED: return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.VERIFIED: return 'bg-blue-100 text-blue-700';
      case OrderStatus.ASSIGNED: return 'bg-indigo-100 text-indigo-700';
      case OrderStatus.ACCEPTED: return 'bg-cyan-100 text-cyan-700';
      case OrderStatus.OUT_FOR_DELIVERY: return 'bg-purple-100 text-purple-700';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-700';
      case OrderStatus.REJECTED:
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const steps = [
    { status: OrderStatus.PLACED, label: "Order Placed", icon: "📝" },
    { status: OrderStatus.VERIFIED, label: "Order Confirmed", icon: "👍" },
    { status: OrderStatus.ASSIGNED, label: "Assigned to Rider", icon: "👤" },
    { status: OrderStatus.OUT_FOR_DELIVERY, label: "Out for Delivery", icon: "🛵" },
    { status: OrderStatus.DELIVERED, label: "Delivered", icon: "🏠" },
  ];

  const getCurrentStepIndex = (status: string) => {
    // Map non-standard statuses
    let effectiveStatus = status;
    if (status === OrderStatus.ACCEPTED || status === 'PACKED') effectiveStatus = OrderStatus.ASSIGNED;
    if (status === OrderStatus.CANCELLED || status === OrderStatus.REJECTED) return -1;
    return steps.findIndex(s => s.status === effectiveStatus);
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <p className="text-xl font-bold">No orders yet</p>
        <p>Order something delicious now!</p>
      </div>
    );
  }

  // Detailed View
  if (selectedOrder) {
    const activeStatus = trackingData ? trackingData.status : selectedOrder.status;
    const currentStep = getCurrentStepIndex(activeStatus);

    return (
      <div className="max-w-2xl mx-auto">
        {/* Feedback Modal Overlay */}
        {showFeedbackModal && selectedOrder && (
            <FeedbackModal 
              orderId={selectedOrder.id}
              onClose={() => setShowFeedbackModal(false)}
              onSuccess={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSuccess(selectedOrder.id);
              }}
            />
        )}
        <button onClick={() => { setSelectedOrder(null); setTrackingData(null); }} className="mb-4 flex items-center text-gray-500 hover:text-green-600 font-bold text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Back to Orders
        </button>

        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          {/* Header */}
          <div className="bg-green-50 p-6 border-b border-green-100 text-center relative overflow-hidden">
            {activeStatus === OrderStatus.DELIVERED ? (
              <div className="z-10 relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">🎉</div>
                <h2 className="text-2xl font-black text-green-800">Order Delivered!</h2>
                <p className="text-green-600 font-medium">Enjoy your items</p>
              </div>
            ) : activeStatus === OrderStatus.CANCELLED || activeStatus === OrderStatus.REJECTED ? (
               <div className="z-10 relative">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">❌</div>
                <h2 className="text-2xl font-black text-red-800">Order Cancelled</h2>
              </div>
            ) : (
              <div className="z-10 relative">
                {selectedOrder.deliveryType === 'SCHEDULED' ? (
                  <>
                    <h2 className="text-2xl font-black text-green-800 mb-1">Scheduled</h2>
                    <p className="text-green-600 font-bold uppercase tracking-wider text-xs">
                      {new Date(selectedOrder.deliveryDate!).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} – {selectedOrder.deliverySlot}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl font-black text-green-800 mb-1">{getEtaMinutes()} mins</h2>
                    <p className="text-green-600 font-bold uppercase tracking-wider text-xs">Estimated Delivery Time</p>
                  </>
                )}

                {/* Live Pulse */}
                <div className="mt-6 inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-bold text-gray-700">Live Tracking</span>
                </div>
              </div>
            )}

            {activeStatus === OrderStatus.DELIVERED && !feedbackSuccess && (
                <button 
                  onClick={() => setShowFeedbackModal(true)}
                  className="mt-4 bg-white text-green-700 px-6 py-2 rounded-xl font-bold text-sm shadow-sm border border-green-100 hover:bg-green-50 transition-colors"
                >
                  ⭐ Rate Delivery
                </button>
            )}

            {feedbackSuccess && (
                <div className="mt-4 bg-green-100 text-green-800 py-2 px-4 rounded-xl text-xs font-bold inline-block animate-bounce-short">
                    ✅ Thanks for your feedback!
                </div>
            )}

            {/* Decorative Map Pattern Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#16a34a 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
          </div>

          <div className="p-6">
            {/* Stepper */}
            <div className="space-y-8 relative pl-4 border-l-2 border-gray-100 ml-4 py-2">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={step.status} className="relative flex items-center gap-4">
                    <div className={`absolute -left-[21px] w-10 h-10 rounded-full border-4 border-white flex items-center justify-center transition-colors ${isCompleted ? 'bg-green-500 text-white shadow-green-200 shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                      <span className="text-lg">{step.icon}</span>
                    </div>
                    <div className={`transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                      <p className={`font-bold ${isCurrent ? 'text-lg text-green-700' : 'text-sm text-gray-800'}`}>{step.label}</p>
                      {isCurrent && <p className="text-xs text-green-600 animate-pulse font-medium">----In Progress...</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rider Details (If tracking data exists) */}
            {trackingData && trackingData.rider && (
               <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-xl border">👤</div>
                     <div>
                        <p className="font-bold text-gray-900">{trackingData.rider.name}</p>
                        <p className="text-xs text-gray-500">Delivery Partner</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <a href={`tel:${trackingData.rider.phone}`} className="p-3 bg-white text-green-600 rounded-xl shadow-sm border hover:bg-green-50">📱</a>
                     {trackingData.rider.location && (
                        <a 
                          href={`https://www.google.com/maps?q=${trackingData.rider.location.latitude},${trackingData.rider.location.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="p-3 bg-white text-blue-600 rounded-xl shadow-sm border hover:bg-blue-50"
                        >🗺️</a>
                     )}
                  </div>
               </div>
            )}

            {/* Order Details */}
            <div className="mt-8 pt-6 border-t space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Delivery Address</p>
                  <p className="text-sm font-medium text-gray-800 mt-1 max-w-[200px]">{selectedOrder.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Order ID</p>
                  <p className="text-sm font-mono font-bold text-gray-800 mt-1">{selectedOrder.id}</p>
                </div>
              </div>

              {/* Items Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-bold uppercase mb-3">Items ({selectedOrder.items.length})</p>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">{item.quantity}x</span>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      {/* Mock price if 0 because older orders might not have unit price saved in specific format */}
                      <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-lg">
                  <span>Total Bill</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">My Orders</h2>
      {orders.map(order => (
        <div key={order.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center text-xl shadow-sm">
                🛍️
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Order #{order.id.slice(-6)}</p>
                <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status).replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')}`}>
              {order.status}
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex -space-x-2 overflow-hidden">
                {order.items.slice(0, 4).map((item, idx) => (
                  <img key={idx} className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover bg-gray-100" src={item.image} alt={item.name} />
                ))}
                {order.items.length > 4 && (
                  <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">+{order.items.length - 4}</div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                <p className="text-lg font-black">₹{order.total}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(order)}
              className="w-full py-3 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2 border border-green-100"
            >
              Track Order
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderTracking;
