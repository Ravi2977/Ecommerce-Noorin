
import "server-only";
import serverApi from "../core/server-api";

const productServerService = {
  getAll: (params = {}, options = {}) =>
    serverApi.get("/products", { ...options, params }),

  getBySlug: (slug, options = {}) =>
    serverApi.get(
      `/products/${encodeURIComponent(slug)}`,
      options
    ),

  getReviews: (slug, params = {}, options = {}) =>
    serverApi.get(
      `/products/${encodeURIComponent(slug)}/reviews`,
      { ...options, params }
    ),
};

export default productServerService;
