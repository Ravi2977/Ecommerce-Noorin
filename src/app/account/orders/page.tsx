
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  Truck,
  CalendarDays,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  FileText,
  ChevronRight,
  Star,
  X,
  Download,
  RotateCcw,
  Ban,
  CheckCircle2,
} from "lucide-react";

import useAuthStore from "@/store/auth.store";
import customerService from "@/service/modules/customer.service";

type OrderItem = {
  productId?: number | string;
  name?: string;
  sku?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

type Shipment = {
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  trackingStatus?: string | null;
  estimatedDelivery?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
};

type TimelineItem = {
  status?: string;
  at?: string;
};

type ReturnItem = {
  productId?: number | string;
  name?: string;
  quantity?: number | string;
};

type ReturnRequest = {
  returnNumber?: string;
  status?: string;
  reason?: string;
  resolutionType?: string;
  details?: string;
  items?: ReturnItem[];
  refundStatus?: string | null;
  refundAmount?: number | null;
  pickup?: unknown;
  timeline?: TimelineItem[];
  createdAt?: string;
  updatedAt?: string;
};

type Order = {
  orderNumber?: string;
  quoteNumber?: string;
  cartToken?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  refundedAmount?: number;
  paidAt?: string;
  currency?: string;
  total?: number;
  shipping?: number;
  items?: OrderItem[];
  shippingAddress?: {
    recipientName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shipment?: Shipment | null;
  cancellationReason?: string | null;
  timeline?: TimelineItem[];
  cancellationRequested?: boolean;
  cancellationRequestedAt?: string | null;
  canRequestCancellation?: boolean;
  canRequestReturn?: boolean;
  invoiceAvailable?: boolean;
  paymentUrl?: string;
  placedAt?: string;
};

type Review = {
  productId?: number | string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

type ReturnReason =
  | "DAMAGED"
  | "WRONG_ITEM"
  | "QUALITY"
  | "NOT_AS_DESCRIBED"
  | "CHANGED_MIND"
  | "OTHER";

const inputClass =
  "w-full border border-[#DED6CA] bg-white px-3 py-3 text-sm text-[#2B2B2B] outline-none focus:border-[#8C6D1F]";

const buttonClass =
  "inline-flex items-center justify-center gap-2 border border-[#2B2B2B] px-4 py-2.5 text-xs font-medium transition-colors hover:bg-[#2B2B2B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

function formatPrice(amount?: number, currency = "INR") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date?: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status?: string) {
  return (status || "UNKNOWN").replaceAll("_", " ");
}

function getStatusClass(status?: string) {
  const value = status?.toUpperCase() || "";

  if (
    ["DELIVERED", "COMPLETED", "PAID", "APPROVED", "REFUNDED"].includes(value)
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    ["CANCELLED", "FAILED", "REJECTED"].includes(value)
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    [
      "PENDING",
      "PAYMENT_PENDING",
      "PROCESSING",
      "SHIPPED",
      "CONFIRMED",
      "REQUESTED",
      "IN_REVIEW",
    ].includes(value)
  ) {
    return "bg-amber-50 text-amber-800";
  }

  return "bg-stone-100 text-stone-600";
}

function extractOrders(response: any): Order[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.orders)) return response.orders;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.orders)) return response.data.orders;
  return [];
}

function extractReviews(response: any): Review[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.reviews)) return response.reviews;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.reviews)) return response.data.reviews;
  return [];
}

function extractReturns(response: any): ReturnRequest[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.returns)) return response.returns;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.returns)) return response.data.returns;
  return [];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

function getOrderKey(order: Order, index: number) {
  return order.orderNumber || order.cartToken || String(index);
}

export default function OrdersPage() {
  const router = useRouter();

  const customerToken = useAuthStore((state) => state.customerToken);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  const [returnsByOrder, setReturnsByOrder] = useState<
    Record<string, ReturnRequest[]>
  >({});

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState<ReturnReason>("DAMAGED");
  const [resolutionType, setResolutionType] = useState<"REFUND" | "REPLACEMENT">("REFUND");
  const [returnDetails, setReturnDetails] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<
    Record<string, number>
  >({});

  const [reviewProductId, setReviewProductId] = useState<number | string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");

  const setOrderFeedback = (key: string, value: Feedback) => {
    setFeedback((previous) => ({ ...previous, [key]: value }));
  };

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await customerService.getOrders();
      setOrders(extractOrders(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    setReviewsLoaded(false);

    try {
      const response = await customerService.getReviews();
      const reviews = extractReviews(response);

      setReviewedProductIds(
        reviews
          .map((review) => review.productId)
          .filter((id): id is number | string => id !== undefined && id !== null)
          .map(String)
      );
    } catch (err) {
      console.error("Unable to load customer reviews:", err);
      setReviewedProductIds([]);
    } finally {
      setReviewsLoaded(true);
    }
  }, []);

  const loadReturns = useCallback(async (order: Order) => {
    if (!order.cartToken) return;

    try {
      const response = await customerService.getReturns(order.cartToken);

      setReturnsByOrder((previous) => ({
        ...previous,
        [order.cartToken!]: extractReturns(response),
      }));
    } catch (err) {
      console.error("Unable to load return history:", err);
    }
  }, []);

  const refreshOrderData = useCallback(async () => {
    await loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!customerToken) return;

    loadOrders();
    loadReviews();
  }, [customerToken, loadOrders, loadReviews]);

  useEffect(() => {
    if (customerToken === null) {
      const timer = window.setTimeout(() => {
        if (!localStorage.getItem("customerToken")) {
          router.replace("/login");
        }
      }, 100);

      return () => window.clearTimeout(timer);
    }
  }, [customerToken, router]);

  useEffect(() => {
    orders.forEach((order) => {
      if (
        order.cartToken &&
        order.canRequestReturn &&
        !returnsByOrder[order.cartToken]
      ) {
        loadReturns(order);
      }
    });
  }, [orders, returnsByOrder, loadReturns]);

  const handleCancelSubmit = async (
    event: FormEvent<HTMLFormElement>,
    order: Order,
    key: string
  ) => {
    event.preventDefault();

    if (!order.cartToken || !cancelReason.trim()) {
      setOrderFeedback(key, {
        type: "error",
        message: "Please enter a cancellation reason.",
      });
      return;
    }

    setBusyAction(key);

    try {
      const response = await customerService.requestCancellation(
        order.cartToken,
        cancelReason.trim()
      );

      setOrders((previous) =>
        previous.map((item) =>
          item.cartToken === order.cartToken
            ? { ...item, ...response }
            : item
        )
      );

      setOrderFeedback(key, {
        type: "success",
        message: response?.ticketNumber
          ? `Cancellation request submitted. Support ticket: ${response.ticketNumber}`
          : "Cancellation request submitted successfully.",
      });

      setCancelReason("");
      setActivePanel(null);
      await refreshOrderData();
    } catch (err) {
      setOrderFeedback(key, {
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleReturnSubmit = async (
    event: FormEvent<HTMLFormElement>,
    order: Order,
    key: string
  ) => {
    event.preventDefault();

    if (!order.cartToken) {
      setOrderFeedback(key, {
        type: "error",
        message: "Order cart token is unavailable.",
      });
      return;
    }

    const selectedItems = (order.items || [])
      .filter((item) => item.productId !== undefined)
      .map((item) => ({
        productId: item.productId!,
        quantity: Number(
          returnQuantities[String(item.productId)] || 0
        ),
      }))
      .filter((item) => item.quantity > 0);

    if (selectedItems.length === 0) {
      setOrderFeedback(key, {
        type: "error",
        message: "Select at least one item and quantity to return.",
      });
      return;
    }

    setBusyAction(key);

    try {
      const payload = {
        reason: returnReason,
        resolutionType,
        details: returnDetails.trim(),
        items: selectedItems,
      };

      const response = await customerService.requestReturn(
        order.cartToken,
        payload
      );

      setOrderFeedback(key, {
        type: "success",
        message: response?.returnNumber
          ? `Return request ${response.returnNumber} submitted successfully.`
          : "Return request submitted successfully.",
      });

      setActivePanel(null);
      setReturnDetails("");
      setReturnQuantities({});

      await loadReturns(order);
      await refreshOrderData();
    } catch (err) {
      setOrderFeedback(key, {
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleReviewSubmit = async (
    event: FormEvent<HTMLFormElement>,
    order: Order,
    key: string
  ) => {
    event.preventDefault();

    if (!reviewProductId) return;

    setBusyAction(key);

    try {
      await customerService.submitProductReview(reviewProductId, {
        rating: reviewRating,
        title: reviewTitle.trim(),
        body: reviewBody.trim(),
      });

      setReviewedProductIds((previous) =>
        previous.includes(String(reviewProductId))
          ? previous
          : [...previous, String(reviewProductId)]
      );

      setOrderFeedback(key, {
        type: "success",
        message: "Review submitted successfully. It may appear after store approval.",
      });

      setReviewProductId(null);
      setReviewTitle("");
      setReviewBody("");
      setReviewRating(5);
      setActivePanel(null);
    } catch (err) {
      setOrderFeedback(key, {
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleInvoiceDownload = async (order: Order, key: string) => {
    if (!order.cartToken) {
      setOrderFeedback(key, {
        type: "error",
        message: "Invoice token is unavailable for this order.",
      });
      return;
    }

    setBusyAction(`invoice-${key}`);

    try {
      const blob = await customerService.getInvoice(order.cartToken);

      if (!(blob instanceof Blob)) {
        throw new Error("The invoice response was not a valid PDF file.");
      }

      const pdfBlob = blob.type === "application/pdf"
        ? blob
        : new Blob([blob], { type: "application/pdf" });

      const url = window.URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `${order.orderNumber || "NOORINE-invoice"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);

      setOrderFeedback(key, {
        type: "success",
        message: "Invoice download started.",
      });
    } catch (err) {
      setOrderFeedback(key, {
        type: "error",
        message: getErrorMessage(err),
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-[#FAF6EF]">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#8C6D1F]" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF6EF] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1100px]">

        {/* Heading */}
        <div className="mb-8 border-b border-[#E5DED4] pb-6">
          <Link
            href="/account"
            className="mb-5 inline-flex items-center gap-2 text-xs text-[#817A72] transition-colors hover:text-[#8C6D1F]"
          >
            <ArrowLeft size={15} />
            Back to My Account
          </Link>

          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-[#8C6D1F]">
            NOORINE / MY ACCOUNT
          </p>

          <h1 className="font-serif text-4xl font-medium text-[#2B2B2B] sm:text-5xl">
            My Orders
          </h1>

          <p className="mt-2 text-sm text-[#817A72]">
            View your purchases, manage returns and track your deliveries.
          </p>

          <button
            type="button"
            onClick={() => {
              loadOrders();
              loadReviews();
            }}
            className="mt-4 inline-flex items-center gap-2 text-xs text-[#8C6D1F] hover:underline"
          >
            <RefreshCw size={14} />
            Refresh Orders
          </button>
        </div>

        {/* Summary */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="border border-[#E5DED4] bg-white p-5">
            <p className="text-xs text-[#817A72]">Total Orders</p>
            <p className="mt-2 font-serif text-3xl">{orders.length}</p>
          </div>

          <div className="border border-[#E5DED4] bg-white p-5">
            <p className="text-xs text-[#817A72]">Delivered Orders</p>
            <p className="mt-2 font-serif text-3xl">
              {orders.filter(
                (order) => order.status?.toUpperCase() === "DELIVERED"
              ).length}
            </p>
          </div>

          <div className="border border-[#E5DED4] bg-white p-5">
            <p className="text-xs text-[#817A72]">Return Requests</p>
            <p className="mt-2 font-serif text-3xl">
              {Object.values(returnsByOrder).reduce(
                (total, list) => total + list.length,
                0
              )}
            </p>
          </div>
        </div>

        {/* Page Error */}
        {error && (
          <div className="mb-6 flex flex-col gap-3 border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-800"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        {/* Orders */}
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order, index) => {
              const key = getOrderKey(order, index);
              const token = order.cartToken || "";
              const orderReturns = returnsByOrder[token] || [];

              const isDelivered = ["DELIVERED", "COMPLETED"].includes(
                order.status?.toUpperCase() || ""
              );

              const panelOpen = (panel: string) =>
                activePanel === `${key}-${panel}`;

              const togglePanel = (panel: string) => {
                setActivePanel((current) =>
                  current === `${key}-${panel}`
                    ? null
                    : `${key}-${panel}`
                );
              };

              return (
                <article
                  key={key}
                  className="overflow-hidden border border-[#E5DED4] bg-white"
                >
                  {/* Order Header */}
                  <div className="flex flex-col gap-4 border-b border-[#E5DED4] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8C6D1F]">
                        ORDER NUMBER
                      </p>

                      <h2 className="font-serif text-xl font-semibold">
                        {order.orderNumber || "—"}
                      </h2>

                      <p className="mt-2 flex items-center gap-2 text-xs text-[#817A72]">
                        <CalendarDays size={14} />
                        Placed on {formatDate(order.placedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1.5 text-[10px] font-medium ${getStatusClass(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>

                      {order.paymentStatus && (
                        <span className={`rounded-full px-3 py-1.5 text-[10px] font-medium ${getStatusClass(order.paymentStatus)}`}>
                          Payment: {formatStatus(order.paymentStatus)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">

                    {/* Items */}
                    <div className="mb-6">
                      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#817A72]">
                        Order Items
                      </h3>

                      {order.items?.length ? (
                        <div className="space-y-4">
                          {order.items.map((item, itemIndex) => {
                            const productId = item.productId;
                            const alreadyReviewed =
                              productId !== undefined &&
                              reviewedProductIds.includes(String(productId));

                            return (
                              <div
                                key={`${productId || item.sku || itemIndex}`}
                                className="border-b border-[#F0EBE4] pb-4 last:border-0 last:pb-0"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#F5F0E7] text-[#8C6D1F]">
                                      <ShoppingBag size={18} />
                                    </div>

                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">
                                        {item.name || "Product"}
                                      </p>

                                      {item.sku && (
                                        <p className="mt-1 text-[11px] text-[#817A72]">
                                          SKU: {item.sku}
                                        </p>
                                      )}

                                      <p className="mt-1 text-xs text-[#817A72]">
                                        Qty: {item.quantity ?? "—"}
                                        {item.unit ? ` ${item.unit}` : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <p className="shrink-0 text-sm font-medium">
                                    {formatPrice(item.lineTotal, order.currency || "INR")}
                                  </p>
                                </div>

                                {/* Review */}
                                {isDelivered && productId !== undefined && (
                                  <div className="mt-3 pl-14">
                                    {!reviewsLoaded ? (
                                      <span className="text-[11px] text-[#817A72]">
                                        Checking review status…
                                      </span>
                                    ) : alreadyReviewed ? (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                                        <CheckCircle2 size={14} />
                                        Review submitted
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReviewProductId(productId);
                                          setReviewRating(5);
                                          setReviewTitle("");
                                          setReviewBody("");
                                          togglePanel(`review-${productId}`);
                                        }}
                                        className="inline-flex items-center gap-2 text-xs font-medium text-[#8C6D1F] hover:underline"
                                      >
                                        <Star size={14} />
                                        Write a Review
                                      </button>
                                    )}
                                  </div>
                                )}

                                {panelOpen(`review-${productId}`) && (
                                  <form
                                    onSubmit={(event) =>
                                      handleReviewSubmit(event, order, key)
                                    }
                                    className="mt-4 space-y-4 border border-[#E5DED4] bg-[#FAF6EF] p-4"
                                  >
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-serif text-lg">
                                        Write a Review
                                      </h4>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActivePanel(null);
                                          setReviewProductId(null);
                                        }}
                                        aria-label="Close review form"
                                      >
                                        <X size={18} />
                                      </button>
                                    </div>

                                    <div>
                                      <label className="mb-2 block text-xs text-[#625B52]">
                                        Your Rating
                                      </label>

                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                          <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setReviewRating(rating)}
                                            aria-label={`${rating} stars`}
                                          >
                                            <Star
                                              size={23}
                                              className={
                                                rating <= reviewRating
                                                  ? "fill-[#C9A24B] text-[#C9A24B]"
                                                  : "text-[#C9A24B]"
                                              }
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <input
                                      className={inputClass}
                                      placeholder="Review title"
                                      value={reviewTitle}
                                      onChange={(event) =>
                                        setReviewTitle(event.target.value)
                                      }
                                      required
                                      maxLength={120}
                                    />

                                    <textarea
                                      className={inputClass}
                                      placeholder="Share your experience..."
                                      value={reviewBody}
                                      onChange={(event) =>
                                        setReviewBody(event.target.value)
                                      }
                                      required
                                      rows={4}
                                      maxLength={2000}
                                    />

                                    <button
                                      type="submit"
                                      disabled={busyAction === key}
                                      className="bg-[#2B2B2B] px-5 py-3 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#8C6D1F] disabled:opacity-50"
                                    >
                                      {busyAction === key ? "Submitting..." : "Submit Review"}
                                    </button>
                                  </form>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-[#817A72]">
                          No item details available.
                        </p>
                      )}
                    </div>

                    {/* Payment and Total */}
                    <div className="mb-6 grid gap-4 border-y border-[#E5DED4] py-5 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 flex items-center gap-2 text-xs text-[#817A72]">
                          <CreditCard size={15} />
                          Payment Method
                        </p>

                        <p className="text-sm font-medium">
                          {order.paymentMethod || "—"}
                        </p>

                        {order.paidAt && (
                          <p className="mt-1 text-xs text-[#817A72]">
                            Paid on {formatDate(order.paidAt)}
                          </p>
                        )}

                        {typeof order.refundedAmount === "number" &&
                          order.refundedAmount > 0 && (
                            <p className="mt-2 text-xs text-green-700">
                              Refunded: {formatPrice(order.refundedAmount, order.currency || "INR")}
                            </p>
                          )}
                      </div>

                      <div className="sm:text-right">
                        <p className="mb-1 text-xs text-[#817A72]">
                          Order Total
                        </p>

                        <p className="font-serif text-2xl font-semibold">
                          {formatPrice(order.total, order.currency || "INR")}
                        </p>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="mb-6 border border-[#E5DED4] p-4">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#817A72]">
                          Delivery Address
                        </h3>

                        <p className="text-sm font-medium">
                          {order.shippingAddress.recipientName || "—"}
                        </p>

                        <p className="mt-1 text-xs leading-6 text-[#625B52]">
                          {[
                            order.shippingAddress.addressLine1,
                            order.shippingAddress.addressLine2,
                            order.shippingAddress.city,
                            order.shippingAddress.state,
                            order.shippingAddress.postalCode,
                            order.shippingAddress.country,
                          ].filter(Boolean).join(", ")}
                        </p>

                        {order.shippingAddress.phone && (
                          <p className="mt-1 text-xs text-[#817A72]">
                            Phone: {order.shippingAddress.phone}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Shipment */}
                    {order.shipment && (
                      <div className="mb-6 bg-[#FAF6EF] p-4 sm:p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Truck size={18} className="text-[#8C6D1F]" />
                          <h3 className="font-serif text-lg">
                            Shipment Details
                          </h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {order.shipment.courier && (
                            <div>
                              <p className="text-[11px] text-[#817A72]">Courier</p>
                              <p className="mt-1 text-sm font-medium">
                                {order.shipment.courier}
                              </p>
                            </div>
                          )}

                          {order.shipment.trackingNumber && (
                            <div>
                              <p className="text-[11px] text-[#817A72]">Tracking Number</p>
                              <p className="mt-1 break-all text-sm font-medium">
                                {order.shipment.trackingNumber}
                              </p>
                            </div>
                          )}

                          {order.shipment.trackingStatus && (
                            <div>
                              <p className="text-[11px] text-[#817A72]">Tracking Status</p>
                              <p className="mt-1 text-sm font-medium">
                                {formatStatus(order.shipment.trackingStatus)}
                              </p>
                            </div>
                          )}

                          {order.shipment.estimatedDelivery && (
                            <div>
                              <p className="text-[11px] text-[#817A72]">Estimated Delivery</p>
                              <p className="mt-1 text-sm font-medium">
                                {formatDate(order.shipment.estimatedDelivery)}
                              </p>
                            </div>
                          )}

                          {order.shipment.deliveredAt && (
                            <div>
                              <p className="text-[11px] text-[#817A72]">Delivered At</p>
                              <p className="mt-1 text-sm font-medium">
                                {formatDate(order.shipment.deliveredAt)}
                              </p>
                            </div>
                          )}
                        </div>

                        {order.shipment.trackingUrl && (
                          <a
                            href={order.shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex items-center gap-2 border border-[#2B2B2B] px-4 py-2.5 text-xs font-medium transition-colors hover:bg-[#2B2B2B] hover:text-white"
                          >
                            Track Shipment
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Order Timeline */}
                    {order.timeline?.length ? (
                      <div className="mb-6">
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#817A72]">
                          Order Timeline
                        </h3>

                        <div className="space-y-3">
                          {order.timeline.map((event, eventIndex) => (
                            <div
                              key={`${event.status || "event"}-${eventIndex}`}
                              className="flex items-start gap-3"
                            >
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9A24B]" />

                              <div>
                                <p className="text-xs font-medium">
                                  {formatStatus(event.status)}
                                </p>
                                <p className="mt-1 text-[11px] text-[#817A72]">
                                  {formatDate(event.at)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Cancellation Information */}
                    {order.cancellationRequested && (
                      <p className="mb-4 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        Cancellation request submitted
                        {order.cancellationRequestedAt
                          ? ` on ${formatDate(order.cancellationRequestedAt)}`
                          : ""}
                      </p>
                    )}

                    {order.cancellationReason && (
                      <p className="mb-4 text-xs text-red-700">
                        Cancellation reason: {order.cancellationReason}
                      </p>
                    )}

                    {/* Feedback */}
                    {feedback[key] && (
                      <div
                        className={`mb-4 flex items-start gap-2 border p-3 text-xs ${
                          feedback[key].type === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {feedback[key].type === "success" && (
                          <CheckCircle2 size={15} className="shrink-0" />
                        )}
                        <span>{feedback[key].message}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 border-t border-[#E5DED4] pt-5">

                      {order.status?.toUpperCase() === "PAYMENT_PENDING" &&
                        order.paymentUrl && (
                          <a
                            href={order.paymentUrl}
                            className="inline-flex items-center gap-2 bg-[#2B2B2B] px-5 py-3 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#8C6D1F]"
                          >
                            Complete Payment
                            <ExternalLink size={14} />
                          </a>
                        )}

                      {order.invoiceAvailable && (
                        <button
                          type="button"
                          onClick={() => handleInvoiceDownload(order, key)}
                          disabled={busyAction === `invoice-${key}`}
                          className={buttonClass}
                        >
                          {busyAction === `invoice-${key}` ? (
                            <LoaderCircle size={15} className="animate-spin" />
                          ) : (
                            <Download size={15} />
                          )}
                          Download Invoice
                        </button>
                      )}

                      {order.canRequestCancellation &&
                        !order.cancellationRequested &&
                        token && (
                          <button
                            type="button"
                            onClick={() => togglePanel("cancel")}
                            className={buttonClass}
                          >
                            <Ban size={15} />
                            Cancel Order
                          </button>
                        )}

                      {order.canRequestReturn && token && (
                        <button
                          type="button"
                          onClick={() => togglePanel("return")}
                          className={buttonClass}
                        >
                          <RotateCcw size={15} />
                          Request Return
                        </button>
                      )}
                    </div>

                    {!token &&
                      (order.canRequestCancellation || order.canRequestReturn || order.invoiceAvailable) && (
                        <p className="mt-3 text-xs text-amber-700">
                          Order action token is unavailable. Please contact support.
                        </p>
                      )}

                    {/* Cancellation Form */}
                    {panelOpen("cancel") && (
                      <form
                        onSubmit={(event) =>
                          handleCancelSubmit(event, order, key)
                        }
                        className="mt-5 space-y-4 border border-[#E5DED4] bg-[#FAF6EF] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-xl">Cancel Order</h3>
                          <button
                            type="button"
                            onClick={() => setActivePanel(null)}
                            aria-label="Close cancellation form"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <p className="text-xs leading-5 text-[#817A72]">
                          Your request will be sent to our team. The team will review the request and process cancellation and refund where applicable.
                        </p>

                        <textarea
                          className={inputClass}
                          rows={3}
                          placeholder="Please tell us why you want to cancel..."
                          value={cancelReason}
                          onChange={(event) => setCancelReason(event.target.value)}
                          required
                          maxLength={1000}
                        />

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={busyAction === key}
                            className="bg-[#2B2B2B] px-5 py-3 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#8C6D1F] disabled:opacity-50"
                          >
                            {busyAction === key ? "Submitting..." : "Submit Cancellation"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setActivePanel(null)}
                            className={buttonClass}
                          >
                            Keep Order
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Return Form */}
                    {panelOpen("return") && (
                      <form
                        onSubmit={(event) =>
                          handleReturnSubmit(event, order, key)
                        }
                        className="mt-5 space-y-4 border border-[#E5DED4] bg-[#FAF6EF] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif text-xl">Request a Return</h3>
                          <button
                            type="button"
                            onClick={() => setActivePanel(null)}
                            aria-label="Close return form"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <p className="text-xs leading-5 text-[#817A72]">
                          Select the products and quantities you want to return. The team will review your request.
                        </p>

                        <div>
                          <label className="mb-2 block text-xs text-[#625B52]">
                            Return Reason
                          </label>
                          <select
                            className={inputClass}
                            value={returnReason}
                            onChange={(event) =>
                              setReturnReason(event.target.value as ReturnReason)
                            }
                          >
                            <option value="DAMAGED">Damaged</option>
                            <option value="WRONG_ITEM">Wrong Item</option>
                            <option value="QUALITY">Quality Issue</option>
                            <option value="NOT_AS_DESCRIBED">Not as Described</option>
                            <option value="CHANGED_MIND">Changed Mind</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs text-[#625B52]">
                            Preferred Resolution
                          </label>
                          <select
                            className={inputClass}
                            value={resolutionType}
                            onChange={(event) =>
                              setResolutionType(
                                event.target.value as "REFUND" | "REPLACEMENT"
                              )
                            }
                          >
                            <option value="REFUND">Refund</option>
                            <option value="REPLACEMENT">Replacement</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs text-[#625B52]">
                            Select Items and Quantities
                          </label>

                          <div className="space-y-3">
                            {(order.items || []).map((item, itemIndex) => {
                              if (item.productId === undefined) return null;

                              const productKey = String(item.productId);
                              const quantity = Number(item.quantity || 0);

                              return (
                                <div
                                  key={`${productKey}-${itemIndex}`}
                                  className="flex items-center justify-between gap-4 border border-[#E5DED4] bg-white p-3"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {item.name || "Product"}
                                    </p>
                                    <p className="mt-1 text-xs text-[#817A72]">
                                      Purchased quantity: {quantity}
                                    </p>
                                  </div>

                                  <input
                                    type="number"
                                    min={0}
                                    max={quantity}
                                    value={returnQuantities[productKey] ?? 0}
                                    onChange={(event) => {
                                      const nextValue = Math.max(
                                        0,
                                        Math.min(
                                          quantity,
                                          Number(event.target.value) || 0
                                        )
                                      );

                                      setReturnQuantities((previous) => ({
                                        ...previous,
                                        [productKey]: nextValue,
                                      }));
                                    }}
                                    className="w-20 border border-[#DED6CA] bg-white px-2 py-2 text-center text-sm"
                                    aria-label={`Return quantity for ${item.name || "product"}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs text-[#625B52]">
                            Additional Details (Optional)
                          </label>
                          <textarea
                            className={inputClass}
                            rows={3}
                            value={returnDetails}
                            onChange={(event) =>
                              setReturnDetails(event.target.value)
                            }
                            placeholder="Tell us more about the issue..."
                            maxLength={1500}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={busyAction === key}
                          className="bg-[#2B2B2B] px-5 py-3 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#8C6D1F] disabled:opacity-50"
                        >
                          {busyAction === key ? "Submitting..." : "Submit Return Request"}
                        </button>
                      </form>
                    )}

                    {/* Return History */}
                    {orderReturns.length > 0 && (
                      <div className="mt-6 border-t border-[#E5DED4] pt-5">
                        <h3 className="mb-4 font-serif text-xl">
                          Return History
                        </h3>

                        <div className="space-y-4">
                          {orderReturns.map((returnRequest, returnIndex) => (
                            <div
                              key={returnRequest.returnNumber || returnIndex}
                              className="border border-[#E5DED4] bg-[#FAF6EF] p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold">
                                    {returnRequest.returnNumber || "Return Request"}
                                  </p>
                                  <p className="mt-1 text-[11px] text-[#817A72]">
                                    {formatDate(returnRequest.createdAt)}
                                  </p>
                                </div>

                                <span className={`rounded-full px-3 py-1.5 text-[10px] font-medium ${getStatusClass(returnRequest.status)}`}>
                                  {formatStatus(returnRequest.status)}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                                <p>
                                  <span className="text-[#817A72]">Reason: </span>
                                  {formatStatus(returnRequest.reason)}
                                </p>
                                <p>
                                  <span className="text-[#817A72]">Resolution: </span>
                                  {formatStatus(returnRequest.resolutionType)}
                                </p>

                                {returnRequest.refundStatus && (
                                  <p>
                                    <span className="text-[#817A72]">Refund: </span>
                                    {formatStatus(returnRequest.refundStatus)}
                                  </p>
                                )}

                                {typeof returnRequest.refundAmount === "number" && (
                                  <p>
                                    <span className="text-[#817A72]">Refund Amount: </span>
                                    {formatPrice(returnRequest.refundAmount, order.currency || "INR")}
                                  </p>
                                )}
                              </div>

                              {returnRequest.details && (
                                <p className="mt-3 text-xs leading-5 text-[#625B52]">
                                  {returnRequest.details}
                                </p>
                              )}

                              {returnRequest.items?.length ? (
                                <div className="mt-3 space-y-1">
                                  {returnRequest.items.map((returnItem, itemIndex) => (
                                    <p
                                      key={`${returnItem.productId || itemIndex}`}
                                      className="text-xs text-[#625B52]"
                                    >
                                      {returnItem.name || "Product"} · Qty: {returnItem.quantity}
                                    </p>
                                  ))}
                                </div>
                              ) : null}

                              {returnRequest.timeline?.length ? (
                                <div className="mt-4 border-t border-[#E5DED4] pt-3">
                                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#817A72]">
                                    Return Timeline
                                  </p>

                                  {returnRequest.timeline.map((event, eventIndex) => (
                                    <div
                                      key={`${event.status || "event"}-${eventIndex}`}
                                      className="mb-2 flex items-start gap-2"
                                    >
                                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#C9A24B]" />
                                      <p className="text-xs">
                                        {formatStatus(event.status)}
                                        <span className="ml-2 text-[#817A72]">
                                          {formatDate(event.at)}
                                        </span>
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-[#E5DED4] bg-white px-5 py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F0E7] text-[#8C6D1F]">
              <Package size={27} strokeWidth={1.4} />
            </div>

            <h2 className="font-serif text-2xl">No orders yet</h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#817A72]">
              You haven't placed any orders yet. Explore our collection and find something you love.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 bg-[#2B2B2B] px-6 py-3 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#8C6D1F]"
            >
              Explore Collection
              <ChevronRight size={15} />
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}
