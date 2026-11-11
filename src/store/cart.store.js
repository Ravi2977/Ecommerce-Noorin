
import { create } from "zustand";
import cartService from "../service/modules/cart.service";
import customerService from "../service/modules/customer.service";

const CART_TOKEN_KEY = "cartToken";
const CUSTOMER_TOKEN_KEY = "customerToken";

const getStoredCartToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CART_TOKEN_KEY);
};

const useCartStore = create((set, get) => ({
  cartToken: getStoredCartToken(),
  cart: null,
  isLoading: false,
  error: null,

  setCartToken: (token) => {
    if (token) {
      localStorage.setItem(CART_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(CART_TOKEN_KEY);
    }

    set({ cartToken: token });
  },

  setCart: (cart) => set({ cart }),

  setLoading: (isLoading) => set({ isLoading }),

  // Initialize guest or customer cart
  initializeCart: async () => {
    set({ isLoading: true, error: null });

    try {
      const customerToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
      const existingCartToken = getStoredCartToken();

      let cart;

      if (customerToken) {
        cart = await customerService.getCart();
      } else if (existingCartToken) {
        cart = await cartService.getByToken(existingCartToken);
      } else {
        cart = await cartService.create({});
      }

      if (!cart?.token) {
        throw new Error("Cart token was not returned by the server.");
      }

      get().setCartToken(cart.token);
      set({ cart, error: null });

      return cart;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh cart from backend
  refreshCart: async () => {
    const token = get().cartToken;

    if (!token) {
      return get().initializeCart();
    }

    set({ isLoading: true, error: null });

    try {
      const cart = await cartService.getByToken(token);
      set({ cart, error: null });
      return cart;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Add product to cart
  addItem: async (payload) => {
    const token = get().cartToken;

    if (!token) {
      throw new Error("Cart is not initialized.");
    }

    set({ isLoading: true, error: null });

    try {
      await cartService.addItem(token, payload);
      return await get().refreshCart();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Update item quantity
  updateItem: async (payload) => {
    const token = get().cartToken;

    if (!token) {
      throw new Error("Cart is not initialized.");
    }

    set({ isLoading: true, error: null });

    try {
      await cartService.updateItem(token, payload);
      return await get().refreshCart();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove individual item (quantity zero)
  removeItem: async (payload) => {
    const token = get().cartToken;

    if (!token) {
      throw new Error("Cart is not initialized.");
    }

    set({ isLoading: true, error: null });

    try {
      await cartService.removeItem(token, payload);
      return await get().refreshCart();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Apply coupon
  applyCoupon: async (payload) => {
    const token = get().cartToken;

    if (!token) {
      throw new Error("Cart is not initialized.");
    }

    set({ isLoading: true, error: null });

    try {
      await cartService.applyCoupon(token, payload);
      return await get().refreshCart();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove applied coupon
  removeCoupon: async () => {
    const token = get().cartToken;

    if (!token) {
      throw new Error("Cart is not initialized.");
    }

    set({ isLoading: true, error: null });

    try {
      await cartService.removeCoupon(token);
      return await get().refreshCart();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Empty entire cart
  clearItems: async () => {
    const token = get().cartToken;

    if (!token) {
      throw new Error("Cart is not initialized.");
    }

    set({ isLoading: true, error: null });

    try {
      await cartService.clearItems(token);
      return await get().refreshCart();
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Clear local cart state after successful order
  clearCart: () => {
    localStorage.removeItem(CART_TOKEN_KEY);

    set({
      cartToken: null,
      cart: null,
      error: null,
      isLoading: false,
    });
  },
}));

export default useCartStore;
