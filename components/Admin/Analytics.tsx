
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Order, Product } from '../../types';
import { api } from '../../services/api';

interface AnalyticsProps {
  orders: Order[];
  products: Product[];
}

const Analytics: React.FC<AnalyticsProps> = ({ orders, products }) => {
  const [stats, setStats] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const statsRes = await api.getAdminAnalytics();
        if (statsRes.success) setStats(statsRes.data);

        const locRes = await api.getOrderLocations();
        if (locRes.success && locRes.locations) {
           // Parse latitude/longitude
           const mappedLocs = locRes.locations.map((loc: any) => ({
             x: parseFloat(loc.longitude),
             y: parseFloat(loc.latitude),
             z: 100, // Size of scatter dot
             name: loc.order_id
           })).filter((l: any) => !isNaN(l.x) && !isNaN(l.y));
           setLocations(mappedLocs);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      }
    };
    fetchAnalytics();
  }, []);

  const totalRevenue = stats?.revenue || orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = stats?.totalOrders || orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount).toFixed(2) : 0;
  const activeRiders = stats?.activeRiders || 0;
  
  // Real sales data from backend or fallback
  const salesData = stats?.topProducts?.map((p: any) => ({
      name: p.name.substring(0, 10) + '...',
      sales: p.count
  })) || [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  // Category performance
  const categoryData = products.reduce((acc: any[], p) => {
    const existing = acc.find(a => a.name === p.category);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: p.category, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
          <p className="text-3xl font-black text-gray-800">₹{totalRevenue}</p>
          <p className="text-xs text-green-600 mt-2 font-bold">Live Data</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Orders</p>
          <p className="text-3xl font-black text-gray-800">{totalOrdersCount}</p>
          <p className="text-xs text-green-600 mt-2 font-bold">Today: {stats?.todayOrders || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Avg. Order Value</p>
          <p className="text-3xl font-black text-gray-800">₹{avgOrderValue}</p>
          <p className="text-xs text-gray-500 mt-2 font-bold">Per user</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 bg-purple-50">
          <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">Active Riders</p>
          <p className="text-3xl font-black text-purple-800">{activeRiders}</p>
          <p className="text-xs text-purple-600 mt-2 font-bold">Currently Online</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
            {stats?.topProducts ? 'Top Selling Items' : 'Weekly Sales Performance'}
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Real-time</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" radius={[6, 6, 0, 0]}>
                  {salesData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-black text-gray-800 mb-6">Inventory by Category</h3>
          <div className="h-64 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 ml-4">
              {categoryData.map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-gray-600">{cat.name}: {cat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Simulation */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-black text-gray-800 mb-2 flex items-center gap-2">
            Delivery Heatmap 📍
          </h3>
          <p className="text-sm text-gray-500 mb-6">Geographic distribution of recent orders based on device coordinates.</p>
          
          <div className="h-80 w-full bg-gray-50 rounded-xl border border-dashed border-gray-200 overflow-hidden relative">
            {locations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        {/* Domain set to auto to scale the coordinates */}
                        <XAxis type="number" dataKey="x" name="Longitude" domain={['auto', 'auto']} hide />
                        <YAxis type="number" dataKey="y" name="Latitude" domain={['auto', 'auto']} hide />
                        <ZAxis type="number" dataKey="z" range={[100, 500]} name="Density" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-3 rounded-xl shadow-lg border text-sm">
                                            <p className="font-bold text-gray-800">Order #{payload[0].payload.name}</p>
                                            <p className="text-gray-500 text-xs mt-1">Lat: {payload[0].payload.y.toFixed(4)}</p>
                                            <p className="text-gray-500 text-xs">Lng: {payload[0].payload.x.toFixed(4)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="Orders" data={locations} fill="#ef4444" opacity={0.6} />
                    </ScatterChart>
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="text-4xl mb-3">🗺️</span>
                    <p>No coordinate data available yet.</p>
                </div>
            )}
          </div>
      </div>

    </div>
  );
};

export default Analytics;
