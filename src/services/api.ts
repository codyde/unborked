import { Product, User, Purchase, CartItem } from '../types';

// Fix typo in API URL - 'loclahost' should be 'localhost'
const API_URL = 'http://localhost:3000';

// Authentication Services
export const authService = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  register: async (username: string, password: string): Promise<{ message: string; userId: number }> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  },
};

// Product Services
export const productService = {
  getProducts: async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/products`);

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    return response.json();
  },

  getProductById: async (id: number): Promise<Product> => {
    const response = await fetch(`${API_URL}/products/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }

    return response.json();
  },
};

// Purchase Services
export const purchaseService = {
  createPurchase: async (items: any[], total: string, token: string): Promise<{ message: string; purchase: Purchase }> => {
    const response = await fetch(`${API_URL}/purchases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ items, total }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Purchase failed');
    }

    return response.json();
  },

  getPurchaseHistory: async (token: string): Promise<Purchase[]> => {
    const response = await fetch(`${API_URL}/purchases`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch purchase history');
    }

    return response.json();
  },
};