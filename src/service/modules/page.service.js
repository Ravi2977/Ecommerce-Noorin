
import api from "../core/api";
import serverApi from "../core/server-api";

const pageService = {
  // Get all CMS pages
  getAll: (params = {}) =>
    api.get("/pages", { params }),

  // Get page details by slug
  getBySlug: (slug) =>
    api.get(`/pages/${encodeURIComponent(slug)}`),

  // Server-side methods
  getAllServer: (params = {}, options = {}) =>
    serverApi.get("/pages", { ...options, params }),

  getBySlugServer: (slug, options = {}) =>
    serverApi.get(
      `/pages/${encodeURIComponent(slug)}`,
      options
    ),
};

export default pageService;
