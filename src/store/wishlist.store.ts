
import { create } from "zustand";
import customerService from "@/service/modules/customer.service";

export type WishlistProduct = {
  id: number | string;
  slug: string;
  name: string;
  [key: string]: unknown;
};

type WishlistState = {
  products: WishlistProduct[];
  isLoading: boolean;
  initialized: boolean;
  error: string | null;

  initializeWishlist: (force?: boolean) => Promise<void>;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: number | string) => Promise<void>;
  removeItem: (productId: number | string) => Promise<void>;
  isWishlisted: (productId: number | string) => boolean;
  clearWishlist: () => void;
};

function hasCustomerToken(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(localStorage.getItem("customerToken"))
  );
}

function extractWishlist(response: unknown): WishlistProduct[] {
  if (Array.isArray(response)) {
    return response as WishlistProduct[];
  }

  if (response && typeof response === "object") {
    const result = response as Record<string, unknown>;

    if (Array.isArray(result.data)) {
      return result.data as WishlistProduct[];
    }

    if (Array.isArray(result.wishlist)) {
      return result.wishlist as WishlistProduct[];
    }

    if (Array.isArray(result.products)) {
      return result.products as WishlistProduct[];
    }

    if (Array.isArray(result.items)) {
      return result.items as WishlistProduct[];
    }

    if (Array.isArray(result.content)) {
      return result.content as WishlistProduct[];
    }
  }

  return [];
}

const useWishlistStore = create<WishlistState>((set, get) => ({
  products: [],
  isLoading: false,
  initialized: false,
  error: null,

  // Initialize wishlist on application load or after login
  initializeWishlist: async (force = false) => {
    if (get().isLoading) return;

    if (get().initialized && !force) return;

    if (!hasCustomerToken()) {
      set({
        products: [],
        initialized: true,
        error: null,
      });
      return;
    }

    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await customerService.getWishlist();

      set({
        products: extractWishlist(response),
        initialized: true,
        error: null,
      });
    } catch (error) {
      set({
        initialized: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load wishlist.",
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh wishlist from backend
  fetchWishlist: async () => {
    await get().initializeWishlist(true);
  },

  // Add product to wishlist
  addItem: async (productId) => {
    if (!hasCustomerToken()) {
      throw new Error(
        "Please login to add products to your wishlist."
      );
    }

    const alreadyExists = get().products.some(
      (product) => String(product.id) === String(productId)
    );

    if (alreadyExists) return;

    set({
      isLoading: true,
      error: null,
    });

    try {
      await customerService.addToWishlist({ productId });

      // Fetch the latest wishlist from backend
      const response = await customerService.getWishlist();

      set({
        products: extractWishlist(response),
        initialized: true,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to add product to wishlist.",
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Remove product from wishlist
  removeItem: async (productId) => {
    if (!hasCustomerToken()) {
      throw new Error(
        "Please login to manage your wishlist."
      );
    }

    set({
      isLoading: true,
      error: null,
    });

    try {
      await customerService.removeFromWishlist(productId);

      // Fetch the latest wishlist from backend
      const response = await customerService.getWishlist();

      set({
        products: extractWishlist(response),
        initialized: true,
        error: null,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Unable to remove product from wishlist.",
      });

      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Check whether product exists in wishlist
  isWishlisted: (productId) => {
    return get().products.some(
      (product) => String(product.id) === String(productId)
    );
  },

  // Clear wishlist on logout
  clearWishlist: () => {
    set({
      products: [],
      initialized: false,
      isLoading: false,
      error: null,
    });
  },
}));

export default useWishlistStore;
