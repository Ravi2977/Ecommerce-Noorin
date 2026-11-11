
"use client";

import { useCallback, useEffect, useState } from "react";
import customerService from "@/service/modules/customer.service";

type TicketMessage = {
  from: "CUSTOMER" | "STORE";
  body: string;
  createdAt: string;
};

type Ticket = {
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  orderNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
};

function formatDate(date?: string) {
  if (!date) return "—";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusStyle(status: string) {
  const value = status?.toUpperCase();

  if (value === "CLOSED" || value === "RESOLVED") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (value === "OPEN" || value === "IN_PROGRESS") {
    return "bg-blue-50 text-blue-700 border-blue-100";
  }

  return "bg-amber-50 text-amber-700 border-amber-100";
}

function extractList(response: any): Ticket[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.tickets)) return response.tickets;
  return [];
}

function extractTicket(response: any): Ticket {
  return response?.data ?? response?.ticket ?? response;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [reply, setReply] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerService.getTickets();
      setTickets(extractList(response));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load support tickets."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = async (ticketNumber: string) => {
    try {
      setDetailLoading(true);
      setMessageError("");
      setSelectedTicket(null);

      const response = await customerService.getTicket(ticketNumber);
      setSelectedTicket(extractTicket(response));
    } catch (err) {
      setMessageError(
        err instanceof Error ? err.message : "Unable to load ticket details."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) return;

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      const payload: {
        subject: string;
        message: string;
        orderNumber?: string;
      } = {
        subject: subject.trim(),
        message: message.trim(),
      };

      if (orderNumber.trim()) {
        payload.orderNumber = orderNumber.trim();
      }

      const response = await customerService.createTicket(payload);
      const newTicket = extractTicket(response);

      setSubject("");
      setMessage("");
      setOrderNumber("");
      setShowCreateForm(false);
      setSuccess("Your support ticket has been created successfully.");

      await loadTickets();

      if (newTicket?.ticketNumber) {
        await openTicket(newTicket.ticketNumber);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create support ticket."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedTicket || !reply.trim()) return;

    try {
      setSending(true);
      setMessageError("");

      await customerService.sendTicketMessage(
        selectedTicket.ticketNumber,
        { message: reply.trim() }
      );

      setReply("");
      await openTicket(selectedTicket.ticketNumber);
      await loadTickets();
    } catch (err) {
      setMessageError(
        err instanceof Error ? err.message : "Unable to send your reply."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-[55vh] bg-[#FAF6EF]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">

        {/* Heading */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8C6D1F]">
              We're Here To Help
            </p>

            <h1 className="mt-2 font-[family-name:var(--font-cormorant)] text-4xl font-medium leading-tight text-[#2B2B2B] sm:text-5xl lg:text-6xl">
              Support & Help Desk
            </h1>

            <p className="mt-2 text-sm text-[#777] sm:text-base">
              Need assistance? Create a ticket and our team will help you.
            </p>
          </div>

          <button
            onClick={() => {
              setShowCreateForm((value) => !value);
              setSuccess("");
              setError("");
            }}
            className="inline-flex min-h-12 items-center justify-center bg-[#2B2B2B] px-6 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:bg-[#8C6D1F]"
          >
            {showCreateForm ? "Cancel" : "+ Create Ticket"}
          </button>
        </div>

        {/* Notifications */}
        {success && (
          <div className="mb-5 rounded-lg border border-green-100 bg-green-50 px-5 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-100 bg-white px-5 py-3 text-sm text-red-700">
            {error}
            <button
              onClick={loadTickets}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Create Ticket Form */}
        {showCreateForm && (
          <section className="mb-8 rounded-xl border border-[#E5DED4] bg-white p-5 sm:p-8">
            <h2 className="font-[family-name:var(--font-cormorant)] text-3xl text-[#2B2B2B]">
              Create a Support Ticket
            </h2>

            <p className="mt-1 text-sm text-[#888]">
              Describe your issue and our support team will get back to you.
            </p>

            <form onSubmit={handleCreateTicket} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#555]">
                  Subject *
                </label>

                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  maxLength={150}
                  placeholder="Briefly describe your issue"
                  className="w-full rounded-lg border border-[#E5DED4] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#555]">
                  Order Number (Optional)
                </label>

                <input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Enter your order number"
                  className="w-full rounded-lg border border-[#E5DED4] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#C9A24B]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#555]">
                  Message *
                </label>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  maxLength={3000}
                  placeholder="Tell us how we can help you..."
                  className="w-full resize-y rounded-lg border border-[#E5DED4] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#C9A24B]"
                />
              </div>

              <button
                type="submit"
                disabled={creating || !subject.trim() || !message.trim()}
                className="min-h-12 bg-[#2B2B2B] px-8 text-xs font-medium uppercase tracking-[0.15em] text-white transition hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Submit Ticket"}
              </button>
            </form>
          </section>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.4fr]">

          {/* Ticket List */}
          <section className="overflow-hidden rounded-xl border border-[#E5DED4] bg-white">
            <div className="flex items-center justify-between border-b border-[#EEE8DF] px-5 py-5 sm:px-6">
              <div>
                <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#2B2B2B]">
                  My Tickets
                </h2>
                <p className="mt-1 text-xs text-[#999]">
                  Your recent support requests
                </p>
              </div>

              <span className="rounded-full bg-[#FAF6EF] px-3 py-1.5 text-xs text-[#8C6D1F]">
                {tickets.length}
              </span>
            </div>

            {loading ? (
              <div className="space-y-4 p-5">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="animate-pulse space-y-3">
                    <div className="h-4 w-2/3 rounded bg-[#EEE8DF]" />
                    <div className="h-3 w-1/3 rounded bg-[#EEE8DF]" />
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF6EF] text-xl text-[#8C6D1F]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path
                      d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.3A2.5 2.5 0 0 1 4 14.5v-9Z"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-2xl text-[#2B2B2B]">
                  No tickets yet
                </h3>

                <p className="mt-1 text-xs leading-6 text-[#888]">
                  Your support requests will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F0EBE3]">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.ticketNumber}
                    onClick={() => openTicket(ticket.ticketNumber)}
                    className={`block w-full px-5 py-5 text-left transition hover:bg-[#FAF6EF] sm:px-6 ${
                      selectedTicket?.ticketNumber === ticket.ticketNumber
                        ? "bg-[#FAF6EF]"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#2B2B2B]">
                          {ticket.subject}
                        </p>
                        <p className="mt-1 text-[11px] text-[#999]">
                          #{ticket.ticketNumber}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${getStatusStyle(
                          ticket.status
                        )}`}
                      >
                        {ticket.status?.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-3 text-[11px] text-[#999]">
                      Updated {formatDate(ticket.updatedAt)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Ticket Conversation */}
          <section className="flex min-h-[440px] flex-col overflow-hidden rounded-xl border border-[#E5DED4] bg-white">
            {detailLoading ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#888]">
                Loading conversation...
              </div>
            ) : selectedTicket ? (
              <>
                <div className="border-b border-[#EEE8DF] px-5 py-5 sm:px-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C6D1F]">
                        Ticket Conversation
                      </p>

                      <h2 className="mt-1 font-[family-name:var(--font-cormorant)] text-2xl text-[#2B2B2B]">
                        {selectedTicket.subject}
                      </h2>

                      <p className="mt-1 text-[11px] text-[#999]">
                        #{selectedTicket.ticketNumber}
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase ${getStatusStyle(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status?.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 p-5 sm:p-7">
                  {(selectedTicket.messages ?? []).length === 0 ? (
                    <p className="py-10 text-center text-sm text-[#999]">
                      No messages in this ticket yet.
                    </p>
                  ) : (
                    selectedTicket.messages?.map((item, index) => {
                      const isCustomer = item.from === "CUSTOMER";

                      return (
                        <div
                          key={`${selectedTicket.ticketNumber}-${index}`}
                          className={`flex ${
                            isCustomer ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[90%] rounded-xl px-4 py-3 sm:max-w-[80%] ${
                              isCustomer
                                ? "bg-[#2B2B2B] text-white"
                                : "border border-[#EEE5D8] bg-[#FAF6EF] text-[#444]"
                            }`}
                          >
                            <p
                              className={`mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] ${
                                isCustomer ? "text-[#E5C77E]" : "text-[#8C6D1F]"
                              }`}
                            >
                              {isCustomer ? "You" : "NOORINE Support"}
                            </p>

                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {item.body}
                            </p>

                            <p
                              className={`mt-2 text-[10px] ${
                                isCustomer ? "text-white/60" : "text-[#999]"
                              }`}
                            >
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {messageError && (
                  <p className="px-5 text-sm text-red-600 sm:px-7">
                    {messageError}
                  </p>
                )}

                {selectedTicket.status?.toUpperCase() === "CLOSED" ? (
                  <div className="border-t border-[#EEE8DF] bg-[#FAF6EF] px-5 py-5 text-center text-sm text-[#777]">
                    This ticket is closed. You cannot send further replies.
                  </div>
                ) : (
                  <form
                    onSubmit={handleSendReply}
                    className="border-t border-[#EEE8DF] p-4 sm:p-6"
                  >
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#666]">
                      Your Reply
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={2}
                        required
                        maxLength={3000}
                        placeholder="Write your message..."
                        className="min-h-14 flex-1 resize-y rounded-lg border border-[#E5DED4] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none transition focus:border-[#C9A24B]"
                      />

                      <button
                        type="submit"
                        disabled={sending || !reply.trim()}
                        className="min-h-12 bg-[#2B2B2B] px-6 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF6EF] text-[#8C6D1F]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-7 w-7"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  >
                    <path
                      d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.3A2.5 2.5 0 0 1 4 14.5v-9Z"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <h3 className="mt-5 font-[family-name:var(--font-cormorant)] text-3xl text-[#2B2B2B]">
                  Your Support Inbox
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-6 text-[#888]">
                  Select a ticket from the left to view its conversation and
                  reply to our support team.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Contact Information */}
        <div className="mt-7 rounded-xl border border-[#E5DED4] bg-white p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-[family-name:var(--font-cormorant)] text-2xl text-[#2B2B2B]">
              Need more assistance?
            </p>
            <p className="mt-1 text-sm text-[#888]">
              You can also reach our team directly via email.
            </p>
          </div>

          <a
            href="mailto:support@noorine.in"
            className="mt-4 inline-flex min-h-11 items-center justify-center border border-[#C9A24B] px-5 text-xs font-medium uppercase tracking-wider text-[#8C6D1F] transition hover:bg-[#FAF6EF] sm:mt-0"
          >
            Contact Support
          </a>
        </div>
      </div>
    </main>
  );
}
