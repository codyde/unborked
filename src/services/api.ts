import { Product, User, Purchase, CartItem } from '../types';

// Fix typo in API URL - 'loclahost' should be 'localhost'
const API_URL = 'http://localhost:3000';

// Function to get the value of a specific feature flag
// Defaults to 'true' if flag is not found or fetch fails
const getFeatureFlag = async (flagName: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/flags`);
    if (!response.ok) {
      console.error(`Failed to fetch flags, defaulting ${flagName} to true.`);
      return true; // Default to true on fetch error
    }
    const flags: Record<string, boolean> = await response.json();
    // Return flag value if found, otherwise default to true
    return flags[flagName] !== undefined ? flags[flagName] : true;
  } catch (error) {
    console.error(`Error fetching flag ${flagName}, defaulting to true:`, error);
    return true; // Default to true on any other error
  }
};

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
    // Check the feature flag
    const useV2Query = await getFeatureFlag('STOREQUERY_V2');
    const productsEndpoint = useV2Query ? `${API_URL}/products/v2` : `${API_URL}/products`;

    console.log(`Fetching products using endpoint: ${productsEndpoint} (STOREQUERY_V2=${useV2Query})`);

    const response = await fetch(productsEndpoint);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to get error details
      throw new Error(`Failed to fetch products from ${productsEndpoint}: ${errorData.error || response.statusText}`);
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