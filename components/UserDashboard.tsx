
import React, { useState, useMemo } from 'react';
// Corrected import: Removed CATEGORIES which is a constant, not a type.
import { Product, CartItem, Order, User } from '../types';
import { CATEGORIES as CONST_CATEGORIES } from '../constants';
import ProductCard from './ProductCard';
import CartModal from './CartModal';
import OrderTracking from './OrderTracking';

interface UserDashboardProps {
  activeTab: string;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  searchQuery: string;
  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  placeOrder: (addr: string) => void;
  currentUser: User;
  addAddress: (addr: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({
  activeTab,
  products,
  cart,
  orders,
  searchQuery,
  addToCart,
  removeFromCart,
  placeOrder,
  currentUser,
  addAddress
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (activeTab === 'orders') {
    return <OrderTracking orders={orders} />;
  }

  if (activeTab === 'profile') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-6 min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          My Profile
        </h2>
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Name</label>
            <p className="text-xl font-medium text-gray-900">{currentUser.name}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <p className="text-xl font-medium text-gray-900">{currentUser.email}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Role</label>
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold uppercase">
              {currentUser.role}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'addresses') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-6 min-h-[50vh]">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Saved Addresses
        </h2>

        <div className="space-y-3 mb-8">
          {currentUser.addresses && currentUser.addresses.length > 0 ? (
            currentUser.addresses.map((addr, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg flex items-start gap-3 hover:border-green-500 transition-colors bg-gray-50">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div>
                  <p className="font-bold text-gray-800">Home / Work</p>
                  <p className="text-gray-600 text-sm mt-1">{addr}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <p className="text-gray-500">No saved addresses yet</p>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="font-bold mb-4 text-gray-800">Add New Address</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const input = form.elements.namedItem('newAddress') as HTMLInputElement;
            if (input.value) {
              addAddress(input.value);
              input.value = '';
            }
          }} className="flex gap-3">
            <input
              name="newAddress"
              type="text"
              placeholder="Enter apartment, street, city, zip..."
              className="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              required
            />
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-bold transition-colors shadow-lg shadow-green-200">
              Save
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Category Slider */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Shop by Category</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <div
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 cursor-pointer text-center group ${!selectedCategory ? 'ring-2 ring-green-500 rounded-xl p-1' : ''}`}
          >
            <div className="w-20 h-20 bg-gray-200 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
              <span className="font-bold text-gray-500">All</span>
            </div>
            <p className="text-xs font-medium">View All</p>
          </div>
          {CONST_CATEGORIES.map(cat => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex-shrink-0 cursor-pointer text-center group ${selectedCategory === cat.name ? 'ring-2 ring-green-500 rounded-xl p-1' : ''}`}
            >
              <img src={cat.image} alt={cat.name} className="w-20 h-20 rounded-xl mb-2 object-cover group-hover:scale-105 transition-transform" />
              <p className="text-xs font-medium">{cat.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section className="mb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{selectedCategory || 'Trending Near You'}</h2>
          <span className="text-sm text-green-600 font-semibold">{filteredProducts.length} items found</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={() => addToCart(product)}
              cartQuantity={cart.find(item => item.id === product.id)?.quantity || 0}
              onRemove={() => removeFromCart(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Quick Cart Bar (Mobile-first) */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-4 left-4 right-4 bg-green-600 text-white rounded-xl shadow-2xl p-4 flex items-center justify-between cursor-pointer animate-bounce-short z-40"
          onClick={() => setIsCartOpen(true)}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white text-green-600 font-bold px-2 py-1 rounded text-sm">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
            </div>
            <div>
              <p className="text-sm font-bold">₹{cartTotal}</p>
              <p className="text-[10px] opacity-80">View Cart</p>
            </div>
          </div>
          <div className="flex items-center gap-1 font-bold">
            Checkout
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}

      {/* Cart Modal Overlay */}
      {isCartOpen && (
        <CartModal
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
          placeOrder={placeOrder}
          addresses={currentUser.addresses || []}
        />
      )}
    </div>
  );
};

export default UserDashboard;
