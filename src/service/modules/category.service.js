
import api from "../core/api";
import serverApi from "../core/server-api";

const categoryService = {
  getAll: (params = {}) =>
    api.get("/categories", { params }),

  getTree: (params = {}) =>
    api.get("/categories/tree", { params }),

  getAllServer: (options = {}) =>
    serverApi.get("/categories", options),

  getTreeServer: (options = {}) =>
    serverApi.get("/categories/tree", options),
};

export default categoryService;
