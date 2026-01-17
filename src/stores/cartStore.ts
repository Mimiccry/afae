import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  count: number;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  count: 0,

  addToCart: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
          count: state.count + 1,
        };
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }],
        count: state.count + 1,
      };
    });
  },

  removeFromCart: (id) => {
    set((state) => {
      const itemToRemove = state.items.find((i) => i.id === id);
      const quantityToRemove = itemToRemove?.quantity || 0;
      return {
        items: state.items.filter((item) => item.id !== id),
        count: Math.max(0, state.count - quantityToRemove),
      };
    });
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(id);
      return;
    }
    set((state) => {
      const existingItem = state.items.find((i) => i.id === id);
      const oldQuantity = existingItem?.quantity || 0;
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        ),
        count: state.count - oldQuantity + quantity,
      };
    });
  },

  clearCart: () => {
    set({ items: [], count: 0 });
  },

  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },
}));


