"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock3,
    Copy,
    Download,
    ExternalLink,
    Loader2,
    MapPin,
    Package,
    PackageCheck,
    RefreshCw,
    ShieldCheck,
    Truck,
} from "lucide-react";
import { toast } from "sonner";
import ordersService from "@/service/modules/order.service";

type OrderItem = {
    productId: number;
    name: string;
    sku?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
};

type OrderAddress = {
    recipientName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
};

type OrderShipment = {
    courier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    trackingStatus?: string | null;
    estimatedDelivery?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
};

type OrderTimelineItem = { status: string; at: string };

type OrderDetails = {
    orderNumber: string;
    quoteNumber?: string;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    refundedAmount?: number;
    paidAt?: string | null;
    currency?: string;
    total: number;
    shipping?: number;
    items: OrderItem[];
    shippingAddress?: OrderAddress;
    shipment?: OrderShipment | null;
    cancellationReason?: string | null;
    timeline?: OrderTimelineItem[];
    cancellationRequested?: boolean;
    cancellationRequestedAt?: string | null;
    canRequestCancellation?: boolean;
    canRequestReturn?: boolean;
    invoiceAvailable?: boolean;
};

const EMAIL_SESSION_KEY = "noorine_checkout_email";

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

const formatMoney = (value?: number | null, currency = "INR") =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));

const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
};

const labelize = (value?: string | null) =>
    String(value || "PENDING")
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusTone = (status?: string) => {
    const value = String(status || "").toUpperCase();
    if (["PAID", "CONFIRMED", "DELIVERED", "COMPLETED"].includes(value))
        return "border-green-200 bg-green-50 text-green-800";
    if (["FAILED", "CANCELLED", "REJECTED", "REFUNDED"].includes(value))
        return "border-red-200 bg-red-50 text-red-700";
    return "border-[#e5d5b8] bg-[#f8f2e8] text-[#80621f]";
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
            <span className="text-[#81786d]">{label}</span>
            <span className="text-right font-medium text-[#2B2B2B]">{value}</span>
        </div>
    );
}

export default function OrderConfirmationPage() {
    const params = useParams<{ orderNumber: string }>();
    const searchParams = useSearchParams();
    const orderNumber = decodeURIComponent(String(params?.orderNumber || ""));
    const [orderNumberInput, setOrderNumberInput] = useState(orderNumber);

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [email, setEmail] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const paymentReturnStatus = searchParams.get("status");
    const paymentLinkStatus = searchParams.get("razorpay_payment_link_status");
    const quoteFromUrl = searchParams.get("quote");
    const razorpayPaymentId = searchParams.get("razorpay_payment_id");

    const fetchOrder = useCallback(
        async (lookupOrderNumber: string, lookupEmail: string) => {
            const cleanOrderNumber = lookupOrderNumber.trim();
            const cleanEmail = lookupEmail.trim();

            if (!cleanOrderNumber || !cleanEmail) {
                setLoading(false);
                setError("Please enter both your order number and checkout email.");
                return;
            }

            setSubmitting(true);
            setError("");

            try {
                const response = await ordersService.lookup({
                    orderNumber: cleanOrderNumber,
                    email: cleanEmail,
                });

                const data = unwrap(response) as OrderDetails;

                if (!data?.orderNumber) {
                    throw new Error("The order lookup response was invalid.");
                }

                setOrder(data);
                setOrderNumberInput(cleanOrderNumber);
                setEmail(cleanEmail);

                sessionStorage.setItem(EMAIL_SESSION_KEY, cleanEmail);
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    "Unable to retrieve this order. Please check your order number and email.";

                setError(message);
                setOrder(null);
            } finally {
                setLoading(false);
                setSubmitting(false);
            }
        },
        []
    );

    useEffect(() => {
        setOrderNumberInput(orderNumber);

        const savedEmail = sessionStorage.getItem(EMAIL_SESSION_KEY) || "";

        if (savedEmail && orderNumber) {
            setEmailInput(savedEmail);
            void fetchOrder(orderNumber, savedEmail);
        } else {
            setLoading(false);
            setError("Enter your order number and checkout email to retrieve your order.");
        }
    }, [orderNumber, fetchOrder]);
    const isPaymentSuccessful =
        paymentReturnStatus === "success" || paymentLinkStatus === "paid";

    const copyOrderNumber = async () => {
        try {
            await navigator.clipboard.writeText(order?.orderNumber || orderNumber);
            toast.success("Order number copied.");
        } catch {
            toast.error("Unable to copy order number.");
        }
    };

    const addressLines = useMemo(() => {
        const address = order?.shippingAddress;
        if (!address) return [];
        return [
            address.addressLine1,
            address.addressLine2,
            [address.city, address.state].filter(Boolean).join(", "),
            [address.postalCode, address.country].filter(Boolean).join(" "),
        ].filter(Boolean);
    }, [order?.shippingAddress]);

    const submitLookup = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void fetchOrder(orderNumberInput, emailInput);
    };

    if (loading) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-[#FAF6EF] px-5">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-[#8C6D1F]" />
                    <p className="font-serif text-2xl text-[#2B2B2B]">Retrieving your order</p>
                    <p className="mt-2 text-xs tracking-widest text-[#81786d]">PLEASE WAIT...</p>
                </div>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-[#FAF6EF] px-5 py-16">
                <div className="mx-auto max-w-lg border border-[#e5dccf] bg-white p-7 text-center md:p-10">
                    <Package className="mx-auto mb-4 h-10 w-10 text-[#8C6D1F]" />
                    <p className="mb-2 text-[10px] tracking-[0.28em] text-[#8C6D1F]">NOORINE · EVERYDAY SHINE</p>
                    <h1 className="font-serif text-3xl text-[#2B2B2B]">Find your order</h1>
                    <p className="mt-3 text-sm leading-6 text-[#81786d]">
                        Enter the email address used at checkout to securely retrieve order {orderNumber}.
                    </p>
                    <form onSubmit={submitLookup} className="mt-7 text-left">
                        <div className="mb-5">
                            <label
                                htmlFor="order-number"
                                className="mb-2 block text-[11px] uppercase tracking-[0.15em] text-[#625b52]"
                            >
                                Order Number
                            </label>

                            <input
                                id="order-number"
                                type="text"
                                required
                                autoComplete="off"
                                value={orderNumberInput}
                                onChange={(event) => setOrderNumberInput(event.target.value)}
                                placeholder="e.g. ORD-20261110-XXXXXXXX"
                                className="w-full border border-[#ded6ca] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none focus:border-[#8C6D1F]"
                            />
                        </div>
                        <label htmlFor="order-email" className="mb-2 block text-[11px] uppercase tracking-[0.15em] text-[#625b52]">
                            Checkout email address
                        </label>
                        <input
                            id="order-email"
                            type="email"
                            required
                            autoComplete="email"
                            value={emailInput}
                            onChange={(event) => setEmailInput(event.target.value)}
                            placeholder="you@example.com"
                            className="w-full border border-[#ded6ca] bg-white px-4 py-3 text-sm text-[#2B2B2B] outline-none focus:border-[#8C6D1F]"
                        />
                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-5 flex w-full items-center justify-center gap-2 bg-[#2B2B2B] px-6 py-4 text-xs uppercase tracking-[0.16em] text-white hover:bg-[#8C6D1F] disabled:opacity-60"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={15} />}
                            Retrieve order
                        </button>
                    </form>
                    <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#756d63] hover:text-[#8C6D1F]">
                        <ArrowLeft size={14} /> Continue shopping
                    </Link>
                </div>
            </main>
        );
    }

    const shipment = order.shipment;
    const timeline = order.timeline || [];

    return (
        <main className="min-h-screen bg-[#FAF6EF] pb-20">
            <section className="border-b border-[#e9e1d5] px-5 py-10 md:px-10 md:py-14">
                <div className="mx-auto max-w-5xl">
                    <Link href="/products" className="mb-7 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#766d62] hover:text-[#8C6D1F]">
                        <ArrowLeft size={14} /> Continue shopping
                    </Link>
                    <div className="border border-[#e5dccf] bg-white px-5 py-9 text-center md:px-10">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4e9] text-green-700">
                            <CheckCircle2 size={34} strokeWidth={1.6} />
                        </div>
                        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.3em] text-[#8C6D1F]">NOORINE · EVERYDAY SHINE</p>
                        <h1 className="font-serif text-3xl text-[#2B2B2B] md:text-5xl">
                            {order.paymentStatus === "PAID" ? "Thank you for your order" : "Your order details"}
                        </h1>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#81786d]">
                            {order.paymentStatus === "PAID"
                                ? "Your payment has been recorded. We’ll keep you updated as your order progresses."
                                : "We’ve retrieved your order. Check the latest payment and order status below."}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                            <span className={`border px-3 py-1.5 text-[10px] uppercase tracking-widest ${statusTone(order.status)}`}>{labelize(order.status)}</span>
                            <span className={`border px-3 py-1.5 text-[10px] uppercase tracking-widest ${statusTone(order.paymentStatus)}`}>Payment {labelize(order.paymentStatus)}</span>
                        </div>
                        <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
                            <span className="text-xs text-[#81786d]">Order number</span>
                            <strong className="text-sm tracking-wide text-[#2B2B2B]">{order.orderNumber}</strong>
                            <button onClick={copyOrderNumber} type="button" aria-label="Copy order number" className="p-1 text-[#8C6D1F] hover:text-[#2B2B2B]"><Copy size={15} /></button>
                        </div>
                        {order.quoteNumber && <p className="mt-2 text-xs text-[#81786d]">Payment reference: {order.quoteNumber}</p>}
                        {isPaymentSuccessful && order.paymentStatus !== "PAID" && (
                            <p className="mx-auto mt-4 max-w-xl text-xs text-[#80621f]">Razorpay has redirected back with a successful payment status. The order lookup has not yet marked the payment as PAID; please refresh the order status shortly.</p>
                        )}
                    </div>
                </div>
            </section>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-5 py-9 md:px-10 lg:grid-cols-[1fr_330px]">
                <div className="space-y-6">
                    <section className="border border-[#e5dccf] bg-white p-5 md:p-7">
                        <div className="mb-5 flex items-center gap-3">
                            <PackageCheck className="text-[#8C6D1F]" size={21} />
                            <h2 className="font-serif text-2xl text-[#2B2B2B]">Items in your order</h2>
                        </div>
                        <div className="divide-y divide-[#eee7dc]">
                            {(order.items || []).map((item, index) => (
                                <div key={`${item.productId}-${item.sku || index}`} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-[#2B2B2B]">{item.name}</p>
                                        {item.sku && <p className="mt-1 text-[11px] text-[#81786d]">SKU: {item.sku}</p>}
                                        <p className="mt-1 text-xs text-[#81786d]">Qty: {item.quantity}{item.unit ? ` ${item.unit}` : ""} × {formatMoney(item.unitPrice, order.currency)}</p>
                                    </div>
                                    <p className="shrink-0 text-sm font-medium text-[#2B2B2B]">{formatMoney(item.lineTotal, order.currency)}</p>
                                </div>
                            ))}
                            {!order.items?.length && <p className="py-4 text-sm text-[#81786d]">No item details were returned for this order.</p>}
                        </div>
                    </section>

                    <section className="border border-[#e5dccf] bg-white p-5 md:p-7">
                        <div className="mb-5 flex items-center gap-3">
                            <MapPin className="text-[#8C6D1F]" size={21} />
                            <h2 className="font-serif text-2xl text-[#2B2B2B]">Delivery address</h2>
                        </div>
                        {order.shippingAddress ? (
                            <div className="text-sm leading-7 text-[#5e574e]">
                                <p className="font-medium text-[#2B2B2B]">{order.shippingAddress.recipientName}</p>
                                {addressLines.map((line, index) => <p key={index}>{line}</p>)}
                                {order.shippingAddress.phone && <p className="mt-1">{order.shippingAddress.phone}</p>}
                            </div>
                        ) : <p className="text-sm text-[#81786d]">No shipping address was returned.</p>}
                    </section>

                    <section className="border border-[#e5dccf] bg-white p-5 md:p-7">
                        <div className="mb-5 flex items-center gap-3">
                            <Truck className="text-[#8C6D1F]" size={21} />
                            <h2 className="font-serif text-2xl text-[#2B2B2B]">Shipment & tracking</h2>
                        </div>
                        {shipment ? (
                            <div className="space-y-2">
                                {shipment.courier && <DetailRow label="Courier" value={shipment.courier} />}
                                {shipment.trackingNumber && <DetailRow label="Tracking number" value={shipment.trackingNumber} />}
                                {shipment.trackingStatus && <DetailRow label="Tracking status" value={shipment.trackingStatus} />}
                                {shipment.estimatedDelivery && <DetailRow label="Estimated delivery" value={formatDate(shipment.estimatedDelivery)} />}
                                {shipment.shippedAt && <DetailRow label="Shipped on" value={formatDate(shipment.shippedAt)} />}
                                {shipment.deliveredAt && <DetailRow label="Delivered on" value={formatDate(shipment.deliveredAt)} />}
                                {shipment.trackingUrl && (
                                    <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 bg-[#2B2B2B] px-5 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#8C6D1F]">
                                        Track shipment <ExternalLink size={13} />
                                    </a>
                                )}
                            </div>
                        ) : <p className="text-sm leading-6 text-[#81786d]">Tracking details will appear here once your order is shipped.</p>}
                    </section>

                    <section className="border border-[#e5dccf] bg-white p-5 md:p-7">
                        <div className="mb-5 flex items-center gap-3">
                            <Clock3 className="text-[#8C6D1F]" size={21} />
                            <h2 className="font-serif text-2xl text-[#2B2B2B]">Order timeline</h2>
                        </div>
                        {timeline.length ? (
                            <ol className="space-y-4">
                                {timeline.map((entry, index) => (
                                    <li key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3">
                                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1e9dc] text-[#8C6D1F]"><Check size={13} /></span>
                                        <div>
                                            <p className="text-sm font-medium text-[#2B2B2B]">{labelize(entry.status)}</p>
                                            <p className="mt-1 text-xs text-[#81786d]">{formatDate(entry.at)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        ) : <p className="text-sm text-[#81786d]">Order updates will appear here.</p>}
                    </section>
                </div>

                <aside className="h-fit border border-[#e5dccf] bg-white p-5 md:p-6 lg:sticky lg:top-8">
                    <h2 className="font-serif text-2xl text-[#2B2B2B]">Payment summary</h2>
                    <div className="mt-4 divide-y divide-[#eee7dc]">
                        <DetailRow label="Payment method" value={labelize(order.paymentMethod || "—")} />
                        <DetailRow label="Payment status" value={<span className="text-green-700">{labelize(order.paymentStatus)}</span>} />
                        {order.paidAt && <DetailRow label="Paid at" value={formatDate(order.paidAt)} />}
                        <DetailRow label="Shipping" value={formatMoney(order.shipping, order.currency)} />
                        {Number(order.refundedAmount || 0) > 0 && <DetailRow label="Refunded" value={formatMoney(order.refundedAmount, order.currency)} />}
                    </div>
                    <div className="mt-4 border-t border-[#dcd1c1] pt-4">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-[#2B2B2B]">Order total</span>
                            <span className="font-serif text-2xl text-[#2B2B2B]">{formatMoney(order.total, order.currency)}</span>
                        </div>
                    </div>
                    {order.invoiceAvailable && (
                        <div className="mt-5 rounded-sm border border-[#e5dccf] bg-[#faf8f4] p-3 text-xs leading-5 text-[#756d63]">
                            <Download size={16} className="mb-2 text-[#8C6D1F]" />
                            Invoice is available for this order. Invoice download endpoint is not included in the lookup response contract.
                        </div>
                    )}
                    {order.cancellationReason && <p className="mt-4 text-xs text-red-700">Cancellation reason: {order.cancellationReason}</p>}
                    {order.cancellationRequested && <p className="mt-3 text-xs text-[#80621f]">Cancellation request submitted{order.cancellationRequestedAt ? ` on ${formatDate(order.cancellationRequestedAt)}` : ""}.</p>}
                    <button type="button" onClick={() => void fetchOrder(email)} disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 border border-[#cfc4b4] px-4 py-3 text-[10px] uppercase tracking-widest text-[#625b52] hover:border-[#8C6D1F] hover:text-[#8C6D1F] disabled:opacity-50">
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Refresh order status
                    </button>
                    <p className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] text-[#81786d]"><ShieldCheck size={13} /> Secure order lookup</p>
                </aside>
            </div>
        </main>
    );
}
