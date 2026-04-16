/**
 * Supabase Client Service
 * Centralized initialization and reusable API queries
 */

// Supabase credentials (from TheGoodGreen project)
const SUPABASE_URL = 'https://dehcgxbupadfabotpwvg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaGNneGJ1cGFkZmFib3Rwd3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDEyNjUsImV4cCI6MjA4ODk3NzI2NX0.rXFsN9k0XYCPFf4BejbwkHvmuhvIid921jYeZmsUU6g';

// Initialize Supabase client (requires supabase-js library to be loaded first)
const sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Get current user from localStorage
 */
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('current_user'));
}

/**
 * Get user profile by email
 */
async function getProfile(email) {
    try {
        const { data, error } = await sbClient
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

/**
 * Get user profile for 24-day plan progress
 */
async function get24DayProfile(email) {
    try {
        const { data, error } = await sbClient
            .from('profiles')
            .select('plan24days, "24planweek", active_package_name')
            .eq('email', email)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching 24-day profile:', error);
        return null;
    }
}

/**
 * Update user profile
 */
async function updateProfile(email, updates) {
    try {
        const { data, error } = await sbClient
            .from('profiles')
            .update(updates)
            .eq('email', email)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('Error updating profile:', error);
        return null;
    }
}

/**
 * Get all orders for a customer phone number
 */
async function getOrdersByPhone(phone) {
    try {
        const { data, error } = await sbClient
            .from('orders')
            .select('*, order_items(*)')
            .eq('customer_phone', phone);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

/**
 * Get all orders (admin view)
 */
async function getAllOrders() {
    try {
        const { data, error } = await sbClient
            .from('orders')
            .select('*');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching all orders:', error);
        return [];
    }
}

/**
 * Get all order items (admin view)
 */
async function getAllOrderItems() {
    try {
        const { data, error } = await sbClient
            .from('order_items')
            .select('*');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching order items:', error);
        return [];
    }
}

/**
 * Create a new order
 */
async function createOrder(orderData) {
    try {
        const { data, error } = await sbClient
            .from('orders')
            .insert([orderData])
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('Error creating order:', error);
        return null;
    }
}

/**
 * Create order items
 */
async function createOrderItems(items) {
    try {
        const { data, error } = await sbClient
            .from('order_items')
            .insert(items)
            .select();

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error creating order items:', error);
        return [];
    }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, status) {
    try {
        const { data, error } = await sbClient
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('Error updating order status:', error);
        return null;
    }
}

/**
 * Update order item status
 */
async function updateOrderItemStatus(itemId, status) {
    try {
        const { data, error } = await sbClient
            .from('order_items')
            .update({ status })
            .eq('id', itemId)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('Error updating order item status:', error);
        return null;
    }
}

/**
 * Update plan24days progress
 */
async function update24DayProgress(email, week) {
    try {
        const { data, error } = await sbClient
            .from('profiles')
            .update({ "24planweek": week })
            .eq('email', email)
            .select();

        if (error) throw error;
        return data?.[0] || null;
    } catch (error) {
        console.error('Error updating 24-day progress:', error);
        return null;
    }
}

/**
 * Check if email has previous orders (for promo code validation)
 */
async function getOrderCount(email) {
    try {
        const { data, error } = await sbClient
            .from('orders')
            .select('id', { count: 'exact' })
            .eq('customer_email', email);

        if (error) throw error;
        return data?.length || 0;
    } catch (error) {
        console.error('Error counting orders:', error);
        return 0;
    }
}
