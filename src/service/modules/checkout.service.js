
import api from "../core/api";

const checkoutService = {
  // Create checkout from cart
  create: (cartToken, payload = {}) => {
    if (!cartToken) {
      throw new Error("Cart token is required.");
    }

    return api.post(
      `/carts/${encodeURIComponent(cartToken)}/checkout`,
      payload
    );
  },
};

export default checkoutService;
