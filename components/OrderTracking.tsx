
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../types';

interface OrderTrackingProps {
  orders: Order[];
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock real-time updates (just for visual effect)
  const [eta, setEta] = useState(15);
  useEffect(() => {
    if (selectedOrder && selectedOrder.status !== OrderStatus.DELIVERED) {
      const timer = setInterval(() => {
        setEta(prev => prev > 1 ? prev - 1 : 1);
      }, 60000); // Decrease ETA every minute
      return () => clearInterval(timer);
    }
  }, [selectedOrder]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PLACED: return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-700';
      case OrderStatus.PACKED: return 'bg-indigo-100 text-indigo-700';
      case OrderStatus.OUT_FOR_DELIVERY: return 'bg-purple-100 text-purple-700';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-700';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const steps = [
    { status: OrderStatus.PLACED, label: "Order Placed", icon: "📝" },
    { status: OrderStatus.CONFIRMED, label: "Order Confirmed", icon: "👍" },
    { status: OrderStatus.PACKED, label: "Packed", icon: "📦" },
    { status: OrderStatus.OUT_FOR_DELIVERY, label: "Out for Delivery", icon: "🛵" },
    { status: OrderStatus.DELIVERED, label: "Delivered", icon: "🏠" },
  ];

  const getCurrentStepIndex = (status: OrderStatus) => {
    // Handle CANCELLED separately or map to 0
    if (status === OrderStatus.CANCELLED) return -1;
    return steps.findIndex(s => s.status === status);
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
    const currentStep = getCurrentStepIndex(selectedOrder.status);

    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setSelectedOrder(null)} className="mb-4 flex items-center text-gray-500 hover:text-green-600 font-bold text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Back to Orders
        </button>

        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
          {/* Header / Map Placeholder */}
          <div className="bg-green-50 p-6 border-b border-green-100 text-center relative overflow-hidden">
            {selectedOrder.status === OrderStatus.DELIVERED ? (
              <div className="z-10 relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl">🎉</div>
                <h2 className="text-2xl font-black text-green-800">Order Delivered!</h2>
                <p className="text-green-600 font-medium">Enjoy your items</p>
              </div>
            ) : (
              <div className="z-10 relative">
                <h2 className="text-3xl font-black text-green-800 mb-1">{eta} mins</h2>
                <p className="text-green-600 font-bold uppercase tracking-wider text-xs">Estimated Delivery Time</p>

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
                      {isCurrent && <p className="text-xs text-green-600 animate-pulse font-medium">In Progress...</p>}
                    </div>
                  </div>
                );
              })}
            </div>

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

  // List View
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
