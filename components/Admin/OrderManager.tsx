
import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';

interface OrderManagerProps {
  orders: Order[];
  updateOrderStatus: (id: string, s: OrderStatus) => void;
}

import { api } from '../../services/api';

const OrderManager: React.FC<OrderManagerProps> = ({ orders, updateOrderStatus }) => {
  const [riders, setRiders] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchRiders = async () => {
      try {
        const res = await api.getRiders();
        if (res.success) {
          setRiders(res.riders);
        }
      } catch (err) {
        console.error("Failed to fetch riders", err);
      }
    };
    fetchRiders();
  }, []);

  const handleAssignRider = async (orderId: string, riderId: string) => {
    if (!riderId) return;
    try {
      const res = await api.assignOrder(orderId, riderId);
      if (res.success) {
        alert("Rider assigned successfully!");
        // Ideally trigger a refresh of orders here, but we rely on parent polling or refresh?
        // The parent AdminDashboard fetches orders via props. 
        // We might need to trigger parent update. 
        // For now, alert is fine.
      } else {
        alert("Failed to assign rider");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning rider");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">Manage User Orders</h2>

      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border flex flex-col items-center">
            <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-400 font-bold">No orders placed yet.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border p-6 flex flex-col md:flex-row gap-6 hover:shadow-lg transition-shadow">
              <div className="flex-grow space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono font-bold text-lg">{order.orderNumber || order.id}</h3>
                  <div className="text-right">
                    <span className="block text-xs text-gray-400 font-bold uppercase">{new Date(order.date).toLocaleString()}</span>
                    {order.deliveryType === 'SCHEDULED' && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase mt-1">
                            📅 {new Date(order.deliveryDate!).toLocaleDateString()} - {order.deliverySlot}
                        </span>
                    )}
                    {order.deliveryType === 'INSTANT' && (
                        <span className="inline-block bg-green-100 text-green-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase mt-1">
                            ⚡ Instant
                        </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Delivery Address</p>
                  <p className="text-sm font-medium text-gray-700">{order.address}</p>
                </div>
              </div>

              <div className="md:w-64 border-l md:pl-6 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Change Status</p>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="w-full border p-2 rounded-xl text-sm font-bold bg-white mb-2"
                  >
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Assign Rider</p>
                  <select
                    value={order.riderId || ''}
                    onChange={(e) => handleAssignRider(order.id, e.target.value)}
                    className="w-full border p-2 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="">Select Rider</option>
                    {riders.map(rider => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name} {rider.is_online ? '(🟢)' : '(🔴)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Payment</p>
                    <p className="text-xs font-bold text-green-600">PAID ({order.paymentMethod || 'UPI'})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Grand Total</p>
                    <p className="text-2xl font-black">₹{order.total}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div >
  );
};

export default OrderManager;
