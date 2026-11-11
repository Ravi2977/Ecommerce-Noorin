
import api from "../core/api";

const orderPath = (token) => {
    if (!token) {
        throw new Error("Order token is required.");
    }

    return `/orders/${encodeURIComponent(token)}`;
};

const orderService = {
    // Get order details and payment status
    getByToken: (token) =>
        api.get(orderPath(token)),

    // Request order cancellation
    requestCancellation: (token, payload = {}) =>
        api.post(
            `${orderPath(token)}/cancel-request`,
            payload
        ),

    // Request product return
    requestReturn: (token, payload) =>
        api.post(
            `${orderPath(token)}/returns`,
            payload
        ),
    // Get return requests of an order
    getReturns: (token) =>
        api.get(`${orderPath(token)}/returns`),

    // Download order invoice as PDF
    downloadInvoice: (token) =>
        api.get(`${orderPath(token)}/invoice`, {
            responseType: "blob",
        }),

    // Look up order
    lookup: (payload) =>
        api.post("/orders/lookup", payload),
};

export default orderService;
