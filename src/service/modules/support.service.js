
import api from "../core/api";

const supportService = {
  // Submit contact form
  submitContact: (payload) =>
    api.post("/contact", payload),

  // Newsletter subscription
  subscribeNewsletter: (payload) =>
    api.post("/newsletter", payload),

  // Get logged-in customer's support tickets
  getMyTickets: (params = {}) =>
    api.get("/customers/me/tickets", { params }),

  // Create a support ticket
  createTicket: (payload) =>
    api.post("/customers/me/tickets", payload),

  // Get ticket details by ticket number
  getTicketByNumber: (ticketNumber) => {
    if (!ticketNumber) {
      throw new Error("Ticket number is required.");
    }

    return api.get(
      `/customers/me/tickets/${encodeURIComponent(ticketNumber)}`
    );
  },

  // Reply to an existing ticket
  replyToTicket: (ticketNumber, payload) => {
    if (!ticketNumber) {
      throw new Error("Ticket number is required.");
    }

    return api.post(
      `/customers/me/tickets/${encodeURIComponent(ticketNumber)}/messages`,
      payload
    );
  },
};

export default supportService;
