import api from "../core/api";

const deliveryService = {
  check: (pincode, cod = false) =>
    api.get("/delivery/check", {
      params: { pincode, cod },
    }),
};

export default deliveryService;