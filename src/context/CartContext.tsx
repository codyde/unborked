import React, { createContext, useContext, useReducer } from 'react';
import { CartItem } from '../types';
import * as Sentry from '@sentry/react';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

// Only destructure used logger functions
const { info, warn, fmt } = Sentry.logger;

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      info(fmt`Cart Action: ADD_ITEM - Product ID: ${action.payload.id}, Quantity: ${action.payload.quantity}, Existed: ${!!existingItem}`);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM': {
      const idToRemove = parseInt(action.payload, 10); // Parse string ID to number
      info(fmt`Cart Action: REMOVE_ITEM - Product ID: ${idToRemove}`);
      if (isNaN(idToRemove)) { // Handle potential parsing errors
          warn(fmt`REMOVE_ITEM: Invalid ID provided, cannot parse to integer: ${action.payload}`);
          return state;
      }
      return {
        ...state,
        items: state.items.filter(item => item.id !== idToRemove), // Compare numbers
      };
    }
    case 'UPDATE_QUANTITY': {
      const idToUpdate = parseInt(action.payload.id, 10); // Parse string ID to number
      info(fmt`Cart Action: UPDATE_QUANTITY - Product ID: ${idToUpdate}, New Quantity: ${action.payload.quantity}`);
       if (isNaN(idToUpdate)) { // Handle potential parsing errors
          warn(fmt`UPDATE_QUANTITY: Invalid ID provided, cannot parse to integer: ${action.payload.id}`);
          return state;
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === idToUpdate // Compare numbers
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case 'CLEAR_CART':
      info('Cart Action: CLEAR_CART');
      return { ...state, items: [] };
    default:
      // Optionally log unexpected action types if needed
      // warn(fmt`Cart Action: Unknown action type received: ${action.type}`);
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};