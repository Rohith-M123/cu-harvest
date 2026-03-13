// Frontend Examples using Firebase Auth Token

import { getAuth } from "firebase/auth";

// Helper to get current user token
const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");
    return await user.getIdToken();
};

// 1. Place an Order
export const placeOrder = async (items, address) => {
    try {
        const token = await getAuthToken();
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: items, // [{ product_id: 1, quantity: 2 }]
                shipping_address: address,
                payment_method: 'COD'
            })
        });
        const data = await response.json();
        console.log('Order Placed:', data);
        return data;
    } catch (error) {
        console.error('Error placing order:', error);
    }
};

// 2. Rider: Get Assigned Orders
export const getMyAssignedOrders = async () => {
    try {
        const token = await getAuthToken();
        const response = await fetch('http://localhost:5000/api/orders/rider/assigned', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        console.log('Assigned Orders:', data);
        return data;
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
};

// 3. Rider: Accept Order
export const acceptOrder = async (orderId) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'ACCEPTED' })
        });
        const data = await response.json();
        console.log('Order Accepted:', data);
        return data;
    } catch (error) {
        console.error('Error accepting order:', error);
    }
};

// 4. Admin: Assign Order
export const assignOrderToRider = async (orderId, riderId) => {
    try {
        const token = await getAuthToken();
        const response = await fetch(`http://localhost:5000/api/orders/admin/${orderId}/assign`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rider_id: riderId })
        });
        const data = await response.json();
        console.log('Order Assigned:', data);
        return data;
    } catch (error) {
        console.error('Error assigning order:', error);
    }
};
