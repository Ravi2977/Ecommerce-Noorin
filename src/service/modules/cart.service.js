
import api from "../core/api";

const cartPath = (token) => {
    if (!token) {
        throw new Error("Cart token is required.");
    }

    return `/carts/${encodeURIComponent(token)}`;
};

const cartService = {
    // Create a new cart
    create: (payload = {}) =>
        api.post("/carts", payload),

    // Get cart details
    getByToken: (token) =>
        api.get(cartPath(token)),

    // Add product or variant to cart
    addItem: (token, payload) =>
        api.post(`${cartPath(token)}/items`, payload),

    // Update cart item quantity
    updateItem: (token, payload) =>
        api.patch(`${cartPath(token)}/items`, payload),

    // Clear all items from cart
    clearItems: (token) =>
        api.delete(cartPath(token)),

    // Remove individual item by setting quantity to zero
    removeItem: (token, payload) =>
        api.patch(`${cartPath(token)}/items`, {
            ...payload,
            quantity: 0,
        }),

    // Apply coupon
    applyCoupon: (token, payload) =>
        api.post(`${cartPath(token)}/coupon`, payload),

    // Remove coupon
    removeCoupon: (token) =>
        api.delete(`${cartPath(token)}/coupon`),

    refreshCart: async () => {
        const token = get().cartToken;
        const customerToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);

        if (!token && !customerToken) {
            return get().initializeCart();
        }

        set({ isLoading: true, error: null });

        try {
            const cart = customerToken
                ? await customerService.getCart()
                : await cartService.getByToken(token);

            if (cart?.token) {
                get().setCartToken(cart.token);
            }

            set({ cart, error: null });

            return cart;
        } catch (error) {
            set({ error: error.message });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },
};

export default cartService;
