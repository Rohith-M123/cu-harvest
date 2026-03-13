
import React, { useState, useEffect } from 'react';
import { Product, Order, OrderStatus, Category, User, Role } from '../types';
import InventoryManager from './Admin/InventoryManager';
import Analytics from './Admin/Analytics';
import AdminOrderManager from './Admin/OrderManager';
import FeedbackManager from './Admin/FeedbackManager';
import { api } from '../services/api';

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
  currentUser?: User;
  adminUsers?: User[];
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
  currentUser,
  adminUsers
}) => {

  const [users, setUsers] = useState<User[]>(adminUsers || []);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Sync users with props when they change
  useEffect(() => {
    if (adminUsers) {
      setUsers(adminUsers);
    }
  }, [adminUsers]);

  // Fetch Users from API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.getUsers();
      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin-users') {
      fetchUsers();
    }
  }, [activeTab]);

  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);

  const toggleUserRole = async (userId: string, currentRole: Role, firebaseUid?: string) => {
    // Current Cycle: USER -> RIDER -> ADMIN -> USER
    let newRole: Role = Role.USER;
    if (currentRole === Role.USER) newRole = Role.RIDER;
    else if (currentRole === Role.RIDER) newRole = Role.ADMIN;
    else if (currentRole === Role.ADMIN) newRole = Role.USER;

    if (!confirm(`Are you sure you want to change role from ${currentRole} to ${newRole}?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        if (confirm("Session expired or invalid. Please log in again to perform admin actions.")) {
          // We can't easily access logout() here as it's not passed as prop. 
          // But we can reload the page which might trigger auth check or just let user manually logout.
          window.location.reload();
        }
        return;
      }

      // 1. Update MySQL Backend
      const res = await api.updateUserRole(userId, newRole);

      if (res.success) {
        alert(`Role successfully updated to ${newRole}`);
        fetchUsers(); // Refresh list to show new role
      } else {
        const errData = await res.json();
        alert(`Failed to update role in Backend: ${errData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Role update error:", error);
      alert("An unexpected error occurred while updating the role.");
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const token = localStorage.getItem('authToken');

  const toggleUserStatus = async (userId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    try {
      const res = await api.updateUserStatus(userId, newStatus);
      if (res.success) {
        alert(`User ${newStatus === 'ACTIVE' ? 'activated' : 'suspended'}`);
        // Trigger refresh? 
        // AdminDashboard receives users as props 'adminUsers' from App.tsx. Or does it fetch itself?
        // In the code I read earlier, AdminDashboard had a useEffect fetching from Firestore!
        // BUT Step 263 App.tsx passed 'adminUsers' prop from SQL fetch.
        // Let's check AdminDashboard again.
        // AdminDashboard:36 `const [users, setUsers] = useState<User[]>([]);`
        // AdminDashboard:40 `useEffect ... onSnapshot(usersCollection ...)` -> fetches from Firestore.
        // This is a conflict!
        // I need to use the `adminUsers` prop passed from App.tsx OR update AdminDashboard to fetch from API.
        // Since App.tsx is already fetching SQL users, I should use that OR refactor AdminDashboard.
        // Given the `users` state in AdminDashboard is what renders the table (line 215 `users.map`), 
        // and it uses Firestore, I MUST refactor AdminDashboard to use the `adminUsers` prop OR fetch from API inside AdminDashboard.
        // Using API inside AdminDashboard is cleaner for actions like Delete/Update which require re-fetch.
        fetchUsers();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.")) return;
    try {
      const res = await api.deleteUser(userId);
      if (res.success) {
        alert("User deleted successfully");
        fetchUsers();
      } else {
        alert(`Failed to delete: ${res.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format Date Helper
  const formatDate = (timestamp?: any) => {
    if (!timestamp) return 'N/A';
    // Check if it's a Firestore Timestamp (has seconds property)
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }
    return 'N/A';
  };

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
          { id: 'admin-feedback', label: 'Feedback', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
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
                    <h3 className="text-3xl font-black mt-2">{users.length}</h3>
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
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black">Registered Users ({users.length})</h2>
              {loadingUsers && <span className="text-sm text-gray-500 animate-pulse">Updating...</span>}
            </div>

            {users.length === 0 && !loadingUsers ? (
              <div className="p-12 text-center text-gray-400">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-400">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold">
                          {user.name}
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{user.id}</div>
                        </td>
                        <td className="p-4 text-gray-600">{user.email}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${user.status === 'SUSPENDED' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {user.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-sm">{formatDate(user.createdAt)}</td>
                        <td className="p-4 flex gap-2">
                          <button
                            onClick={() => toggleUserRole(user.id, user.role)}
                            className="text-blue-500 hover:text-blue-700 font-bold text-xs bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 transition-colors"
                          >
                            {user.role === Role.ADMIN ? 'Demote' : 'Promote'}
                          </button>

                          <button
                            onClick={() => toggleUserStatus(user.id, user.status)}
                            className={`font-bold text-xs px-3 py-1 rounded-lg border transition-colors ${user.status === 'SUSPENDED' ? 'text-green-600 bg-green-50 border-green-100' : 'text-orange-600 bg-orange-50 border-orange-100'}`}
                          >
                            {user.status === 'SUSPENDED' ? 'Resume' : 'Hold'}
                          </button>

                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs bg-red-50 px-3 py-1 rounded-lg border border-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin-feedback' && (
          <FeedbackManager />
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
