
import api from "../core/api";

const storeService = {
  // Client-side config request
  getConfig: () => api.get("/config"),
};

export default storeService;
