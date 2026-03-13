const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper to get current ID token from localStorage
const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

// Generic Fetch Wrapper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API Request Failed');
    }

    return await response.json();
};

export const api = {
    // Orders
    placeOrder: (data: any) => apiRequest('/orders', { method: 'POST', body: JSON.stringify(data) }),
    getUserOrders: (status?: string) => apiRequest(`/orders/my-orders${status ? `?status=${status}` : ''}`),
    getOrderDetails: (id: string) => apiRequest(`/orders/my-orders/${id}`),
    trackOrder: (id: string) => apiRequest(`/orders/${id}/track`),

    // Rider
    getRiderOrders: (history: boolean = false) => apiRequest(`/orders/rider/assigned${history ? '?history=true' : ''}`),
    updateOrderStatus: (id: string, status: string) => apiRequest(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    }),
    updateRiderLocation: (lat: number, lng: number) => apiRequest(`/rider/location`, {
        method: 'PUT',
        body: JSON.stringify({ latitude: lat, longitude: lng })
    }),
    updateRiderStatus: (is_online: boolean) => apiRequest(`/rider/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_online })
    }),
    getRiderEarnings: () => apiRequest(`/rider/earnings`),
    getRiderTrips: () => apiRequest(`/rider/trips`),

    // Feedback
    submitFeedback: (data: { order_id: string, rating: number, comment?: string }) => apiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getRiderFeedback: (riderId: string) => apiRequest(`/feedback/rider/${riderId}`),
    getAllFeedback: () => apiRequest('/feedback/admin/all'),

    // Admin
    getAllOrders: (status?: string) => apiRequest(`/orders/admin/all${status ? `?status=${status}` : ''}`),
    assignOrder: (id: string, riderId: string) => apiRequest(`/orders/admin/${id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ rider_id: riderId })
    }),
    getAdminAnalytics: () => apiRequest(`/admin/analytics`),
    getOrderLocations: () => apiRequest(`/admin/order-locations`),

    // Admin - Users
    getUsers: () => apiRequest('/users'),
    getRiders: () => apiRequest('/users/riders'), // Add this
    updateUserRole: (id: string, role: string) => apiRequest(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    }),
    updateUserStatus: (id: string, status: string) => apiRequest(`/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    }),
    deleteUser: (id: string) => apiRequest(`/users/${id}`, { method: 'DELETE' }),

    // Auth
    auth: {
        login: (data: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
        register: (data: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
        getProfile: () => apiRequest('/auth/profile')
    }
};
