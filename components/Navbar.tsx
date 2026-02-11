
import React from 'react';
import { User, Role } from '../types';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
}

const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  cartCount
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setActiveTab(currentUser.role === Role.ADMIN ? 'admin-analytics' : 'home')}
        >
          <span className="text-2xl font-black text-yellow-500">CU</span>
          <span className="text-2xl font-black text-green-600 ml-1">HARVEST</span>
        </div>

        {/* Search - Desktop/Mobile */}
        {currentUser.role === Role.USER && (
          <div className="flex-grow max-w-2xl relative hidden md:block">
            <input
              type="text"
              placeholder='Search "milk", "vegetables", "fruits"'
              className="w-full bg-gray-100 border-none rounded-lg py-3 px-10 focus:ring-2 focus:ring-green-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs text-gray-500">Welcome,</span>
            <span className="text-sm font-semibold">{currentUser.name}</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-fade-in-down">
                  {currentUser.role === Role.ADMIN ? (
                    <>
                      <button onClick={() => { setActiveTab('admin-profile'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                        Profile
                      </button>
                      <button onClick={() => { setActiveTab('admin-analytics'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                        Dashboard
                      </button>
                      <button onClick={() => { setActiveTab('admin-inventory'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                        Manage Products
                      </button>
                      <button onClick={() => { setActiveTab('admin-orders'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                        Manage Orders
                      </button>
                      <button onClick={() => { setActiveTab('admin-users'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                        Manage Users
                      </button>
                      <button onClick={() => { setActiveTab('admin-addresses'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                        Manage Addresses
                      </button>
                      <button onClick={() => { setActiveTab('admin-settings'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                        Settings
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </button>
                      <button
                        onClick={() => { setActiveTab('orders'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        My Orders
                      </button>
                      <button
                        onClick={() => { setActiveTab('addresses'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Saved Addresses
                      </button>
                    </>
                  )}
                  <div className="h-px bg-gray-100 my-2"></div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      {currentUser.role === Role.USER && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder='Search products...'
              className="w-full bg-gray-100 border-none rounded-lg py-2.5 px-10 focus:ring-2 focus:ring-green-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
