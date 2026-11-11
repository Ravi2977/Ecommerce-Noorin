
import api from "../core/api";
import serverApi from "../core/server-api";

const collectionService = {
  // Get all collections
  getAll: (params = {}) =>
    api.get("/collections", { params }),

  // Get collection details by slug
  getBySlug: (slug, params = {}) =>
    api.get(
      `/collections/${encodeURIComponent(slug)}`,
      { params }
    ),

  // Server-side methods
  getAllServer: (params = {}, options = {}) =>
    serverApi.get("/collections", { ...options, params }),

  getBySlugServer: (slug, params = {}, options = {}) =>
    serverApi.get(
      `/collections/${encodeURIComponent(slug)}`,
      { ...options, params }
    ),
};

export default collectionService;
