
import api from "../core/api";

const reviewService = {
  // Get reviews for a product
  getProductReviews: (productSlug, params = {}) => {
    if (!productSlug) {
      throw new Error("Product slug is required.");
    }

    return api.get(
      `/products/${encodeURIComponent(productSlug)}/reviews`,
      { params }
    );
  },

  // Submit a product review
  create: (productSlug, payload) => {
    if (!productSlug) {
      throw new Error("Product slug is required.");
    }

    return api.post(
      `/products/${encodeURIComponent(productSlug)}/reviews`,
      payload
    );
  },

  // Get logged-in customer's reviews
  getMyReviews: (params = {}) =>
    api.get("/customers/me/reviews", { params }),

  // Upload review images
  uploadImages: (formData) =>
    api.post("/customers/me/review-images", formData),
};

export default reviewService;
