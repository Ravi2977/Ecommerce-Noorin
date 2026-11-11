
import api from "../core/api";

const BASE_PATH = "/customers/me/wishlist";

const wishlistService = {
  // Get customer wishlist
  getAll: (params = {}) =>
    api.get(BASE_PATH, { params }),

  // Add product to wishlist
  add: (payload) =>
    api.post(BASE_PATH, payload),

  // Remove product from wishlist
  remove: (productId) => {
    if (productId === undefined || productId === null || productId === "") {
      throw new Error("Product ID is required.");
    }

    return api.delete(
      `${BASE_PATH}/${encodeURIComponent(productId)}`
    );
  },
};

export default wishlistService;
