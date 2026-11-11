
import api from "../core/api";
import serverApi from "../core/server-api";

const homeService = {
  getHome: (params = {}) => api.get("/home", { params }),

  getHomeServer: (options = {}) =>
    serverApi.get("/home", options),
};

export default homeService;
