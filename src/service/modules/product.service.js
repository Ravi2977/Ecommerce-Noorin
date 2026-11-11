
import api from "../core/api";

const productService = {
  // Product listing with filters, sorting and pagination
  getAll: (params = {}) =>
    api.get("/products", { params }),

  // Single product by ID or slug
  getBySlug: (slug) =>
    api.get(`/products/${encodeURIComponent(slug)}`),

  // Product reviews
  getReviews: (slug, params = {}) =>
    api.get(`/products/${encodeURIComponent(slug)}/reviews`, {
      params,
    }),

  // Submit a product review
  createReview: (slug, payload, options = {}) =>
    api.post(
      `/products/${encodeURIComponent(slug)}/reviews`,
      payload,
      options
    ),

  // Notify me when product is available
  notifyMe: (slug, payload) =>
    api.post(
      `/products/${encodeURIComponent(slug)}/notify-me`,
      payload
    ),
};

export default productService;
