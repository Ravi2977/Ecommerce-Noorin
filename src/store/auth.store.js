
import { create } from "zustand";
import authService from "../service/modules/auth.service";
import customerService from "../service/modules/customer.service";
import useCartStore from "./cart.store";

const TOKEN_KEY = "customerToken";
const CART_KEY = "cartToken";

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

const useAuthStore = create((set, get) => ({
  customerToken: getStoredToken(),
  customer: null,
  isAuthenticated: Boolean(getStoredToken()),
  isLoading: false,

  // Initialize authentication from stored token
  initializeAuth: () => {
    const token = getStoredToken();

    set({
      customerToken: token,
      isAuthenticated: Boolean(token),
    });
  },

  // Set or update customer session
  setSession: (token, customer = null) => {
    if (!token) {
      throw new Error("Customer token is required.");
    }

    localStorage.setItem(TOKEN_KEY, token);

    set({
      customerToken: token,
      customer,
      isAuthenticated: true,
    });
  },

  // Start session and merge guest cart
  startSession: async (token, customer = null) => {
    if (!token) {
      throw new Error("Customer token is required.");
    }

    get().setSession(token, customer);

    set({ isLoading: true });

    try {
      const guestCartToken = localStorage.getItem(CART_KEY);

      const cart = guestCartToken
        ? await customerService.mergeCart(guestCartToken)
        : await customerService.getCart();

      if (cart?.token) {
        useCartStore.getState().setCartToken(cart.token);
      }

      useCartStore.getState().setCart(cart);

      return cart;
    } finally {
      set({ isLoading: false });
    }
  },

  // Signup
  signup: async (payload) => {
    set({ isLoading: true });

    try {
      const result = await authService.signup(payload);

      if (!result.verificationRequired && result.token) {
        await get().startSession(
          result.token,
          result.customer || null
        );
      }

      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  // Email verification
  verifyEmail: async (payload) => {
    set({ isLoading: true });

    try {
      const result = await authService.verifyEmail(payload);

      if (result.token) {
        await get().startSession(
          result.token,
          result.customer || null
        );
      }

      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  // Resend email verification
  resendVerification: (payload) =>
    authService.resendVerification(payload),

  // Login
  login: async (payload) => {
    set({ isLoading: true });

    try {
      const result = await authService.login(payload);

      await get().startSession(
        result.token,
        result.customer || null
      );

      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  // Forgot password
  forgotPassword: (payload) =>
    authService.forgotPassword(payload),

  // Reset password
  // Existing forgot-password page handles startSession.
  resetPassword: (payload) =>
    authService.resetPassword(payload),

  // Change password
  // Backend returns a new token and customer.
  changePassword: async (payload) => {
    set({ isLoading: true });

    try {
      const result = await customerService.changePassword(payload);

      if (result?.token) {
        get().setSession(
          result.token,
          result.customer || get().customer
        );
      }

      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });

    try {
      await authService.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CART_KEY);

      useCartStore.getState().clearCart();

      set({
        customerToken: null,
        customer: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  // Update customer in store
  setCustomer: (customer) => set({ customer }),

  // Clear customer session
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);

    set({
      customerToken: null,
      customer: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
