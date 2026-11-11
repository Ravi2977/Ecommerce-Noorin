
import "server-only";
import serverApi from "../core/server-api";

const storeServerService = {
  // Server-side config request (SEO/layout/server components)
  getConfigServer: (options = {}) =>
    serverApi.get("/config", options),
};

export default storeServerService;
