
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import useCartStore from "@/store/cart.store";

type CartItem = {
  productId: number;
  name: string;
  slug?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string | null;
  category?: string | null;
  variant?: string | null;
  warnings?: string[];
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number | null;
};

type Cart = {
  token?: string;
  currency?: string | null;
  items?: CartItem[];
  itemCount?: number;
  subtotal?: number;
  coupon?: {
    code?: string;
  } | null;
  discount?: number;
  shipping?: {
    label?: string;
    amount?: number;
  };
  taxAmount?: number;
  totalBeforeTax?: number;
  total?: number;
  freeShippingThreshold?: number;
  remainingForFreeShipping?: number;
  canCheckout?: boolean;
  warnings?: string[];
  checkoutMessage?: string | null;
};

const FREE_SHIPPING_THRESHOLD = 999;

function money(value?: number | null, currency = "INR") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export default function CartPage() {
  const {
    cart,
    isLoading,
    error,
    initializeCart,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    clearItems,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState<number | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  const currentCart = cart as Cart | null;
  const items = currentCart?.items || [];
  const currency = currentCart?.currency || "INR";

  useEffect(() => {
    void initializeCart();
  }, [initializeCart]);

  const subtotal = currentCart?.subtotal ?? 0;
  const discount = currentCart?.discount ?? 0;
  const shipping = currentCart?.shipping?.amount ?? 0;
  const tax = currentCart?.taxAmount ?? 0;
  const total = currentCart?.total ?? 0;

  const threshold =
    currentCart?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;

  const remaining = Math.max(
    0,
    currentCart?.remainingForFreeShipping ?? threshold - subtotal
  );

  const shippingProgress =
    threshold > 0
      ? Math.min(100, (subtotal / threshold) * 100)
      : 100;

  const displayError = pageError || (
    error ? getErrorMessage(error) : ""
  );

 async function handleQuantityChange(
  item: CartItem,
  quantity: number
) {
  if (quantity < 0) return;

  const minimum = item.minimumOrderQuantity ?? 1;
  const maximum = item.maximumOrderQuantity ?? null;

  if (quantity > 0 && quantity < minimum) {
    setPageError(`Minimum order quantity is ${minimum}.`);
    return;
  }

  if (maximum !== null && quantity > maximum) {
    setPageError(`Maximum order quantity is ${maximum}.`);
    return;
  }

  setPageError("");
  setItemLoading(item.productId);

  try {
    if (quantity === 0) {
      await removeItem({
        productId: item.productId,
        variant: item.variant ?? null,
      });

      toast.success("Product removed from your bag.");
    } else {
      await updateItem({
        productId: item.productId,
        quantity,
        variant: item.variant ?? null,
      });

      toast.success("Bag updated successfully.");
    }
  } catch (err) {
    const message = getErrorMessage(err);
    setPageError(message);
    toast.error(message);
  } finally {
    setItemLoading(null);
  }
}

async function handleRemove(item: CartItem) {
  setPageError("");
  setItemLoading(item.productId);

  try {
    await removeItem({
      productId: item.productId,
      variant: item.variant ?? null,
    });

    toast.success("Product removed from your bag.");
  } catch (err) {
    const message = getErrorMessage(err);
    setPageError(message);
    toast.error(message);
  } finally {
    setItemLoading(null);
  }
}

 

  async function handleApplyCoupon(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const code = couponCode.trim();

    if (!code) {
      setPageError("Please enter a coupon code.");
      return;
    }

    setPageError("");
    setCouponLoading(true);

    try {
      await applyCoupon({ code });
      setCouponCode("");
      toast.success("Coupon applied successfully.");
    } catch (err) {
      const message = getErrorMessage(err);
      setPageError(message);
      toast.error(message);
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleRemoveCoupon() {
    setPageError("");
    setCouponLoading(true);

    try {
      await removeCoupon();
      toast.success("Coupon removed successfully.");
    } catch (err) {
      const message = getErrorMessage(err);
      setPageError(message);
      toast.error(message);
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleClearCart() {
    if (!window.confirm("Remove all items from your shopping bag?")) {
      return;
    }

    setPageError("");
    setClearLoading(true);

    try {
      await clearItems();
      toast.success("Your shopping bag has been cleared.");
    } catch (err) {
      const message = getErrorMessage(err);
      setPageError(message);
      toast.error(message);
    } finally {
      setClearLoading(false);
    }
  }

  if (isLoading && !currentCart) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#FAF6EF]">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="animate-spin text-[#8C6D1F]"
            size={32}
          />
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#2B2B2B]/60">
            Loading your shopping bag
          </p>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="flex min-h-[75vh] items-center justify-center bg-[#FAF6EF] px-4 py-16">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#C9A24B]/40">
            <ShoppingBag size={34} className="text-[#8C6D1F]" />
          </div>

          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#8C6D1F]">
            Your Shopping Bag
          </p>

          <h1 className="font-serif text-4xl text-[#2B2B2B]">
            Your bag is empty
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#2B2B2B]/60">
            Discover something beautiful and add a little shine to
            your everyday style.
          </p>

          <Link
            href="/products"
            className="group mt-8 inline-flex min-h-12 items-center justify-center gap-3 border border-[#2B2B2B] bg-[#2B2B2B] px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white transition-colors duration-300 hover:border-[#8C6D1F] hover:bg-[#8C6D1F] hover:text-white"
            style={{ color: "#FFFFFF", textDecoration: "none" }}
          >
            <span>Explore Collection</span>
            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF] text-[#2B2B2B]">
      <div className="mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">

        {/* Page Header */}

        <div className="mb-8 border-b border-[#2B2B2B]/10 pb-7">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#8C6D1F]">
            NOORINE · EVERYDAY SHINE
          </p>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl">
                Shopping Bag
              </h1>

              <p className="mt-2 text-sm text-[#2B2B2B]/55">
                {currentCart?.itemCount ??
                  items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                items in your bag
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearCart}
              disabled={clearLoading}
              className="inline-flex h-10 items-center justify-center gap-2 border border-red-200 bg-transparent px-4 text-xs font-medium text-red-700 transition-all duration-200 hover:border-red-700 hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                color: clearLoading ? "#999999" : "#B91C1C",
                backgroundColor: "transparent",
              }}
            >
              {clearLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Clear Bag
            </button>
          </div>
        </div>

        {/* Free Shipping Progress */}

        <div className="mb-8 border border-[#C9A24B]/25 bg-white/40 p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Truck size={19} className="shrink-0 text-[#8C6D1F]" />

              <p className="text-sm">
                {remaining > 0 ? (
                  <>
                    Add{" "}
                    <strong className="text-[#8C6D1F]">
                      {money(remaining, currency)}
                    </strong>{" "}
                    more for free shipping
                  </>
                ) : (
                  <strong className="text-[#8C6D1F]">
                    You have unlocked free shipping!
                  </strong>
                )}
              </p>
            </div>

            <span className="text-xs tabular-nums text-[#2B2B2B]/50">
              {Math.round(shippingProgress)}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden bg-[#2B2B2B]/10">
            <div
              className="h-full bg-[#C9A24B] transition-all duration-500"
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Error Message */}

        {displayError && (
          <div
            role="alert"
            className="mb-6 flex items-start justify-between gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{displayError}</span>

            <button
              type="button"
              onClick={() => setPageError("")}
              aria-label="Dismiss error"
              className="shrink-0 text-red-700 hover:text-red-900"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Cart Layout */}

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.6fr_0.8fr] lg:gap-14">

          {/* Cart Products */}

          <section>
            <div className="mb-5 hidden grid-cols-[1fr_auto_auto] gap-6 border-b border-[#2B2B2B]/10 pb-3 text-[10px] uppercase tracking-[0.2em] text-[#2B2B2B]/45 sm:grid">
              <span>Product</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>

            <div className="divide-y divide-[#2B2B2B]/10">
              {items.map((item) => (
                <article
                  key={item.productId}
                  className="grid grid-cols-[100px_1fr] gap-4 py-6 sm:grid-cols-[130px_1fr_auto] sm:items-center sm:gap-6"
                >
                  {/* Product Image */}

                  <div className="aspect-square overflow-hidden bg-white">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-2 transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-serif text-2xl text-[#8C6D1F]/50">
                        N
                      </div>
                    )}
                  </div>

                  {/* Product Details */}

                  <div className="min-w-0">
                    {item.category && (
                      <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#8C6D1F]">
                        {item.category}
                      </p>
                    )}

                    <h2 className="font-serif text-xl leading-snug sm:text-2xl">
                      {item.slug ? (
                        <Link
                          href={`/products/${item.slug}`}
                          className="text-[#2B2B2B] transition-colors hover:text-[#8C6D1F]"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        item.name
                      )}
                    </h2>

                    <p className="mt-2 text-sm text-[#2B2B2B]/65">
                      {money(item.unitPrice, currency)}
                    </p>

                    {item.warnings?.map((warning, index) => (
                      <p
                        key={`${item.productId}-warning-${index}`}
                        className="mt-2 text-xs text-[#8C6D1F]"
                      >
                        {warning}
                      </p>
                    ))}

                    {/* Quantity Controls */}

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="inline-flex h-10 items-center border border-[#2B2B2B]/20 bg-white/40">
                        <button
                          type="button"
                          disabled={
                            itemLoading === item.productId ||
                            item.quantity <= (item.minimumOrderQuantity ?? 1)
                          }
                          onClick={() =>
                            handleQuantityChange(
                              item,
                              item.quantity - 1
                            )
                          }
                          aria-label="Decrease quantity"
                          className="inline-flex h-full w-10 shrink-0 items-center justify-center bg-transparent text-[#2B2B2B] transition-colors hover:bg-[#D9B8AE]/30 hover:text-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="flex min-w-9 items-center justify-center text-xs tabular-nums">
                          {itemLoading === item.productId ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            item.quantity
                          )}
                        </span>

                        <button
                          type="button"
                          disabled={
                            itemLoading === item.productId ||
                            (item.maximumOrderQuantity != null &&
                              item.quantity >= item.maximumOrderQuantity)
                          }
                          onClick={() =>
                            handleQuantityChange(
                              item,
                              item.quantity + 1
                            )
                          }
                          aria-label="Increase quantity"
                          className="inline-flex h-full w-10 shrink-0 items-center justify-center bg-transparent text-[#2B2B2B] transition-colors hover:bg-[#D9B8AE]/30 hover:text-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={itemLoading === item.productId}
                        onClick={() => handleRemove(item)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 bg-transparent text-xs text-[#2B2B2B]/50 transition-colors hover:text-red-700 disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>

                    {item.maximumOrderQuantity != null && (
                      <p className="mt-2 text-[10px] text-[#2B2B2B]/40">
                        Maximum quantity: {item.maximumOrderQuantity}
                      </p>
                    )}
                  </div>

                  {/* Item Total */}

                  <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:block sm:text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#2B2B2B]/45 sm:hidden">
                      Item Total
                    </span>

                    <span className="text-sm font-medium tabular-nums">
                      {money(item.lineTotal, currency)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Continue Shopping */}

            <Link
              href="/products"
              className="group mt-7 inline-flex min-h-10 items-center gap-2 text-xs uppercase tracking-[0.15em] text-[#8C6D1F] transition-all duration-300 hover:gap-3"
            >
              <ArrowLeft
                size={14}
                className="transition-transform duration-300 group-hover:-translate-x-1"
              />
              Continue Shopping
            </Link>
          </section>

          {/* Order Summary */}

          <aside className="border border-[#2B2B2B]/10 bg-[#FCFAF6] p-5 sm:p-7 lg:sticky lg:top-24">

            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-[#8C6D1F]">
              Your Order
            </p>

            <h2 className="mb-7 font-serif text-3xl sm:text-4xl">
              Order Summary
            </h2>

            {/* Coupon Section */}

            <div className="mb-7">
              <label
                htmlFor="coupon-code"
                className="mb-3 flex items-center gap-2 text-sm font-medium"
              >
                <Tag size={17} className="text-[#8C6D1F]" />
                Apply Coupon
              </label>

              {currentCart?.coupon?.code ? (
                <div className="flex min-h-[82px] items-center justify-between gap-3 border border-green-300 bg-green-50 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Check
                      size={20}
                      className="shrink-0 text-green-700"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-green-800">
                        {currentCart.coupon.code}
                      </p>

                      <p className="mt-1 text-xs text-green-700">
                        Coupon applied successfully
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    disabled={couponLoading}
                    className="inline-flex h-9 shrink-0 items-center justify-center border border-red-200 bg-transparent px-4 text-xs font-medium text-red-700 transition-colors hover:border-red-700 hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      color: couponLoading ? "#999999" : "#B91C1C",
                      backgroundColor: "transparent",
                    }}
                  >
                    {couponLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      "Remove"
                    )}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleApplyCoupon}
                  className="flex min-h-12 w-full border border-[#2B2B2B]/20 bg-transparent"
                >
                  <input
                    id="coupon-code"
                    type="text"
                    value={couponCode}
                    onChange={(event) =>
                      setCouponCode(event.target.value.toUpperCase())
                    }
                    placeholder="Enter coupon code"
                    autoComplete="off"
                    className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-xs uppercase tracking-wider text-[#2B2B2B] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-[#2B2B2B]/35 focus:ring-0"
                  />

                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="inline-flex h-12 min-w-[100px] shrink-0 items-center justify-center gap-2 border-0 bg-[#2B2B2B] px-5 text-[11px] font-medium uppercase tracking-wider text-white transition-colors duration-300 hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      color: "#FFFFFF",
                      backgroundColor: "#2B2B2B",
                    }}
                  >
                    {couponLoading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Price Breakdown */}

            <div className="space-y-5 border-t border-[#2B2B2B]/10 pt-6">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#2B2B2B]/60">
                  Subtotal
                </span>

                <span className="tabular-nums">
                  {money(subtotal, currency)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-green-700">
                    Discount
                  </span>

                  <span className="font-medium text-green-700 tabular-nums">
                    -{money(discount, currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#2B2B2B]/60">
                  Shipping
                </span>

                <span className="tabular-nums">
                  {shipping === 0 ? (
                    <span className="font-medium text-green-700">
                      Free
                    </span>
                  ) : (
                    money(shipping, currency)
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-[#2B2B2B]/60">
                  GST
                </span>

                <span className="tabular-nums">
                  {money(tax, currency)}
                </span>
              </div>
            </div>

            {/* Grand Total */}

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#2B2B2B]/15 pt-6">
              <span className="font-serif text-2xl sm:text-3xl">
                Total
              </span>

              <span className="text-xl font-semibold tabular-nums sm:text-2xl">
                {money(total, currency)}
              </span>
            </div>

            <p className="mt-2 text-right text-[11px] text-[#2B2B2B]/45">
              Inclusive of applicable taxes
            </p>

            {/* Checkout Button */}

            <Link
              href="/checkout"
              aria-disabled={!currentCart?.canCheckout}
              onClick={(event) => {
                if (!currentCart?.canCheckout) {
                  event.preventDefault();
                  toast.error(
                    currentCart?.checkoutMessage ||
                    "Your cart is not ready for checkout."
                  );
                }
              }}
              className="mt-8 flex h-14 w-full items-center justify-center gap-3 border border-[#2B2B2B] bg-[#2B2B2B] px-5 text-center text-[11px] font-medium uppercase tracking-[0.17em] text-white transition-colors duration-300 hover:border-[#8C6D1F] hover:bg-[#8C6D1F] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-2"
              style={{
                color: "#FFFFFF",
                backgroundColor: "#2B2B2B",
                fontSize: "11px",
                lineHeight: "1",
                textDecoration: "none",
                opacity: currentCart?.canCheckout ? 1 : 0.45,
                cursor: currentCart?.canCheckout
                  ? "pointer"
                  : "not-allowed",
              }}
            >
              <span style={{ color: "#FFFFFF" }}>
                Proceed to Checkout
              </span>

              <ArrowRight size={16} color="#FFFFFF" />
            </Link>

            {/* Trust Information */}

            <div className="mt-5 flex items-center justify-center gap-2 text-center">
              <ShieldCheck
                size={15}
                className="shrink-0 text-[#8C6D1F]"
              />

              <p className="text-[10px] leading-5 text-[#2B2B2B]/50">
                Secure checkout · Safe payments · All India Delivery
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
