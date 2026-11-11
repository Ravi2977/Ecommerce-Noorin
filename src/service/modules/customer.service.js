import api from "../core/api";

const customerService = {
  // CUSTOMER PROFILE
  getProfile: () => api.get("/customers/me"),
  updateProfile: (payload) => api.patch("/customers/me", payload),
  changePassword: (payload) => api.post("/customers/me/password", payload),

  // CUSTOMER ADDRESSES
  getAddresses: () => api.get("/customers/me/addresses"),
  addAddress: (payload) => api.post("/customers/me/addresses", payload),
  updateAddress: (addressId, payload) =>
    api.put(
      `/customers/me/addresses/${encodeURIComponent(addressId)}`,
      payload
    ),
  deleteAddress: (addressId) =>
    api.delete(`/customers/me/addresses/${encodeURIComponent(addressId)}`),

  // CUSTOMER CART
  getCart: () => api.get("/customers/me/cart"),
  mergeCart: (cartToken) =>
    api.post("/customers/me/cart/merge", { cartToken }),

  // CUSTOMER WISHLIST
  getWishlist: (params = {}) =>
    api.get("/customers/me/wishlist", { params }),
  addToWishlist: (payload) =>
    api.post("/customers/me/wishlist", payload),
  removeFromWishlist: (productId) =>
    api.delete(
      `/customers/me/wishlist/${encodeURIComponent(productId)}`
    ),

  // CUSTOMER REVIEWS
  getReviews: (params = {}) =>
    api.get("/customers/me/reviews", { params }),

  submitProductReview: (idOrSlug, payload) =>
    api.post(
      `/products/${encodeURIComponent(String(idOrSlug))}/reviews`,
      payload
    ),

  // CUSTOMER SUPPORT
  getTickets: (params = {}) =>
    api.get("/customers/me/tickets", { params }),
  createTicket: (payload) =>
    api.post("/customers/me/tickets", payload),
  getTicket: (ticketNumber) =>
    api.get(
      `/customers/me/tickets/${encodeURIComponent(ticketNumber)}`
    ),
  sendTicketMessage: (ticketNumber, payload) =>
    api.post(
      `/customers/me/tickets/${encodeURIComponent(ticketNumber)}/messages`,
      payload
    ),

  // CUSTOMER ORDERS
  getOrders: (params = {}) =>
    api.get("/customers/me/orders", { params }),

  // ORDER CANCELLATION
  requestCancellation: (cartToken, reason) =>
    api.post(
      `/orders/${encodeURIComponent(cartToken)}/cancel-request`,
      { reason }
    ),

  // ORDER RETURNS
  requestReturn: (cartToken, payload) =>
    api.post(
      `/orders/${encodeURIComponent(cartToken)}/returns`,
      payload
    ),

  getReturns: (cartToken) =>
    api.get(
      `/orders/${encodeURIComponent(cartToken)}/returns`
    ),

  // ORDER INVOICE - PDF BLOB
  getInvoice: (cartToken) =>
    api.get(
      `/orders/${encodeURIComponent(cartToken)}/invoice`,
      { responseType: "blob" }
    ),
};

export default customerService;