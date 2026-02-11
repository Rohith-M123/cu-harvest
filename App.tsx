
import React, { useState, useEffect, useMemo } from 'react';
import { Role, User, Product, CartItem, Order, OrderStatus } from './types';
import { INITIAL_PRODUCTS } from './constants';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/Auth/AuthPage';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'profile' | 'addresses' | 'admin-inventory' | 'admin-analytics' | 'admin-orders' | 'admin-users' | 'admin-addresses' | 'admin-settings' | 'admin-profile'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin State
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Effect to handle role-based redirection
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === Role.ADMIN) {
        setActiveTab('admin-analytics');
      } else {
        setActiveTab('home');
      }
    }
  }, [currentUser]);

  // Fetch Admin Data
  useEffect(() => {
    if (currentUser && currentUser.role === Role.ADMIN) {
      // Only attempt fetch if we are in a dev environment or have a real backend URL
      // For now, suppress error if on localhost to avoid confusion, or handle gracefully
      const token = localStorage.getItem('authToken');
      // TODO: Replace with deployed backend URL
      const backendUrl = 'http://localhost:5001';

      // Simple check to avoid blasting requests that will fail in production
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.warn("Backend not deployed. Admin data fetching skipped.");
        return;
      }

      fetch(`${backendUrl}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setAdminUsers(data.users);
        })
        .catch(err => console.error('Failed to fetch users:', err));
    }
  }, [currentUser, activeTab]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // TODO: Replace with deployed backend URL
        const response = await fetch('http://localhost:5001/api/products');
        if (response.ok) {
          const data = await response.json();
          // Convert backend product format to frontend format
          const formattedProducts = data.products.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            category: p.category_name,
            price: p.price,
            originalPrice: p.original_price,
            discount: p.discount_percent,
            stock: p.stock_quantity,
            unit: p.unit,
            image: p.image_url,
            description: p.description
          }));
          setProducts(formattedProducts);
        } else {
          throw new Error("Backend not reachable");
        }
      } catch (error) {
        console.warn('Backend unavailable, using static product data:', error);
        // Fall back to initial products if API fails
        setProducts(INITIAL_PRODUCTS);
      }
    };

    fetchProducts();
  }, []);

  // Fetch Categories
  useEffect(() => {
    fetch('http://localhost:5001/api/products/categories')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setCategoriesList(data.categories);
        }
      })
      .catch(err => {
        console.warn('Backend unavailable, using default categories:', err);
        // Fallback categories if needed, or just leave empty
      });
  }, []);

  const handleLogout = async () => {
    await logout();
    setCart([]);
    setOrders([]);
    setActiveTab('home');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId).map(item => {
      if (item.id === productId) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const placeOrder = async (address: string, paymentMethod: string = 'UPI', notes: string = '') => {
    if (!currentUser) return;

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9), // Temporary ID
      userId: currentUser.id,
      items: cart,
      total: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: OrderStatus.PLACED,
      date: new Date().toISOString(),
      address,
      paymentMethod,
      notes
    };

    // TODO: Save order to Firestore or Backend
    // Currently just state
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setActiveTab('orders');
    alert('Order placed successfully!');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Admin Methods (Stubbed for now, need Firestore implementation)
  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const addProduct = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-green-600 font-bold">Loading...</div>;
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 md:pb-0">
      <Navbar
        currentUser={currentUser}
        cartItemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="pt-24 px-4 max-w-7xl mx-auto">
        {currentUser.role === Role.ADMIN ? (
          <AdminDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            products={products}
            orders={orders}
            updateOrderStatus={updateOrderStatus}
            updateProduct={updateProduct}
            addProduct={addProduct}
            deleteProduct={deleteProduct}
            categories={categoriesList}
            adminUsers={adminUsers}
            currentUser={currentUser}
          />
        ) : (
          <UserDashboard
            activeTab={activeTab}
            products={filteredProducts}
            cart={cart}
            orders={orders}
            searchQuery={searchQuery}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            placeOrder={placeOrder}
            currentUser={currentUser}
            addAddress={(addr) => { /* TODO: Update Firestore */ }}
          />
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
