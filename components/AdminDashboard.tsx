
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Order, OrderStatus, Category } from '../types';
import InventoryManager from './Admin/InventoryManager';
import Analytics from './Admin/Analytics';
import AdminOrderManager from './Admin/OrderManager';

import { User } from '../types';

interface AdminDashboardProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  products: Product[];
  orders: Order[];
  updateOrderStatus: (id: string, s: OrderStatus) => void;
  updateProduct: (p: Product) => void;
  addProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  categories: any[];
  adminUsers?: User[];
  currentUser?: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  setActiveTab,
  products,
  orders,
  updateOrderStatus,
  updateProduct,
  addProduct,
  deleteProduct,
  categories = [],
  adminUsers = [],
  currentUser
}) => {

  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 space-y-2 bg-white p-4 rounded-xl border h-fit sticky top-24">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Admin Panel</h2>

        {[
          { id: 'admin-profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { id: 'admin-analytics', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
          { id: 'admin-inventory', label: 'Products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { id: 'admin-orders', label: 'Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
          { id: 'admin-users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { id: 'admin-addresses', label: 'Addresses', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
          { id: 'admin-settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </aside>

      {/* Main Admin View */}
      <div className="flex-grow">
        {activeTab === 'admin-analytics' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Revenue</p>
                    <h3 className="text-3xl font-black mt-2">₹{totalSales.toLocaleString()}</h3>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Total Orders</p>
                    <h3 className="text-3xl font-black mt-2">{orders.length}</h3>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-wider">Active Users</p>
                    <h3 className="text-3xl font-black mt-2">{adminUsers.length}</h3>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <Analytics orders={orders} products={products} />
          </div>
        )}

        {activeTab === 'admin-inventory' && (
          <InventoryManager
            products={products}
            updateProduct={updateProduct}
            addProduct={addProduct}
            deleteProduct={deleteProduct}
            categories={categories}
          />
        )}

        {activeTab === 'admin-orders' && (
          <AdminOrderManager
            orders={orders}
            updateOrderStatus={updateOrderStatus}
          />
        )}

        {/* New Views */}
        {activeTab === 'admin-profile' && currentUser && (
          <div className="bg-white p-8 rounded-2xl border shadow-sm">
            <h2 className="text-2xl font-black mb-6">Admin Profile</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-3xl font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Name</p>
                <p className="text-xl font-bold mb-4">{currentUser.name}</p>
                <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Email</p>
                <p className="text-xl font-bold mb-4">{currentUser.email}</p>
                <p className="text-gray-500 uppercase tracking-widest text-xs font-bold">Role</p>
                <span className="bg-purple-100 text-purple-700 font-bold px-3 py-1 rounded-lg text-sm">{currentUser.role}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin-users' && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-black">Registered Users ({adminUsers.length})</h2>
            </div>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {adminUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">Now</td>
                    <td className="p-4">
                      <button className="text-red-500 hover:text-red-700 font-bold text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'admin-addresses' && (
          <div className="bg-white p-8 rounded-2xl border shadow-sm text-center">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            </div>
            <h2 className="text-xl font-black text-gray-800">Address Management</h2>
            <p className="text-gray-500 mt-2">View and manage customer delivery locations.</p>
            <p className="text-xs text-gray-400 mt-4">(Feature coming soon)</p>
          </div>
        )}

        {activeTab === 'admin-settings' && (
          <div className="bg-white p-8 rounded-2xl border shadow-sm">
            <h2 className="text-2xl font-black mb-6">Settings</h2>
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <span className="font-bold">Dark Mode</span>
                <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer"><div className="w-6 h-6 bg-white shadow-sm rounded-full absolute left-0"></div></div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <span className="font-bold">Email Notifications</span>
                <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer"><div className="w-6 h-6 bg-white shadow-sm rounded-full absolute right-0"></div></div>
              </div>
              <button className="text-red-600 font-bold text-sm">Reset Application Data</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
