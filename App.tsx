import React, { useState, useEffect, useMemo } from 'react';
import { Role, User, Product, CartItem, Order, OrderStatus } from './types';
import { INITIAL_PRODUCTS } from './constants';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import RiderDashboard from './components/RiderDashboard';
import AuthPage from './components/Auth/AuthPage';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { api, API_URL } from './services/api';

const AppContent: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'profile' | 'addresses' | 'admin-inventory' | 'admin-analytics' | 'admin-orders' | 'admin-users' | 'admin-addresses' | 'admin-settings' | 'admin-profile' | 'rider-dashboard'>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin State
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  // Effect to handle role-based redirection
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === Role.ADMIN) {
        setActiveTab('admin-analytics');
      } else if (currentUser.role === Role.RIDER) {
        setActiveTab('rider-dashboard');
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
      const backendUrl = API_URL;

      // Simple check to avoid blasting requests that will fail in production
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !import.meta.env.VITE_API_URL) {
        console.warn("Backend not deployed. Admin data fetching skipped.");
        return;
      }

      api.getUsers()
        .then((data: any) => {
          if (data && data.success) setAdminUsers(data.users);
        })
        .catch(err => console.error('Failed to fetch users:', err));
    }
  }, [currentUser, activeTab]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response: any = await api.getProducts();
        if (response && response.success) {
          // Convert backend product format to frontend format
          const formattedProducts = response.products.map((p: any) => ({
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
    api.getCategories()
      .then((data: any) => {
        if (data && data.success) {
          setCategoriesList(data.categories);
        }
      })
      .catch(err => {
        console.warn('Backend unavailable, using default categories:', err);
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

  // Fetch Orders based on Role
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return;

      try {
        let backendOrders: any[] = [];

        if (currentUser.role === Role.ADMIN) {
          const response: any = await api.getAllOrders();
          if (response && response.success) backendOrders = response.orders;
        } else if (currentUser.role === Role.RIDER) {
          // ... (rest unchanged)
          setOrders([]);
          return;
        } else {
          const response: any = await api.getUserOrders();
          if (response && response.success) backendOrders = response.orders;
        }

        const formattedOrders = backendOrders.map((o: any) => ({
          id: o.id.toString(), // Use DB ID for API calls
          orderNumber: o.order_number, // Use Order Number for display
          userId: o.user_id,
          items: o.items ? o.items.map((i: any) => ({
            id: i.id?.toString(),
            name: i.product_name || i.name || 'Product',
            price: parseFloat(i.unit_price || 0),
            quantity: i.quantity,
            image: i.image_url
          })) : [],
          total: parseFloat(o.total_amount),
          status: o.status,
          date: o.created_at,
          address: o.shipping_address,
          paymentMethod: o.payment_method,
          notes: o.notes,
          riderId: o.rider_id,
          deliveryType: o.delivery_type,
          deliveryDate: o.delivery_date,
          deliverySlot: o.delivery_slot
        }));
        setOrders(formattedOrders);

      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };

    fetchOrders();
    // Poll every 10s for updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [currentUser, currentUser?.role]);

  const placeOrder = async (
    address: string, 
    paymentMethod: string = 'UPI', 
    notes: string = '', 
    deliveryLocation?: {latitude: number, longitude: number},
    scheduling?: { deliveryType: string, deliveryDate?: string, deliverySlot?: string }
  ) => {
    if (!currentUser) return;

    try {
      const orderItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }));

      const response: any = await api.placeOrder({
        // ... (rest unchanged)
        items: orderItems,
        shipping_address: address,
        payment_method: paymentMethod,
        notes,
        delivery_location: deliveryLocation,
        delivery_type: scheduling?.deliveryType,
        delivery_date: scheduling?.deliveryDate,
        delivery_slot: scheduling?.deliverySlot
      });

      if (response && response.success) {
        alert('Order placed successfully!');
        setCart([]);
        setActiveTab('orders');
      } else {
        alert(`Failed to place order: ${response?.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error("Place order error:", error);
      alert(`Failed to place order: ${error.message}`);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Admin Methods
  const updateProduct = (updatedProduct: Product) => {
    // Stub: Would call PUT /api/products/:id
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const addProduct = (newProduct: Product) => {
    // Stub: Would call POST /api/products
    setProducts(prev => [...prev, newProduct]);
  };

  const deleteProduct = (id: string) => {
    // Stub: Would call DELETE /api/products/:id
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const response: any = await api.updateOrderStatus(id, status);

      if (response && response.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-green-600 font-bold">Loading...</div>;
  }

  if (!currentUser) {
    return <AuthPage />;
  }

  // Handle Rider specific view
  if (currentUser.role === Role.RIDER) {
    return <RiderDashboard currentUser={currentUser} onLogout={handleLogout} />;
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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          <h2 className="font-bold">Something went wrong.</h2>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
