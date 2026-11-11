
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Package,
  MapPin,
  Heart,
  Star,
  Headset,
  LockKeyhole,
  LogOut,
  ChevronRight,
  ArrowRight,
  ShoppingBag,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import useAuthStore from "@/store/auth.store";
import customerService from "@/service/modules/customer.service";

type Customer = {
  id?: number | string;
  name?: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  createdAt?: string;
};

type Order = {
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  total?: number;
  currency?: string;
  placedAt?: string;
  items?: Array<{
    name?: string;
    quantity?: number;
  }>;
};

type DashboardData = {
  customer: Customer | null;
  orders: Order[];
  wishlist: unknown[];
  addresses: unknown[];
};

const navigation = [
  { label: "Overview", href: "/account", icon: UserRound },
  { label: "My Profile", href: "/account/profile", icon: UserRound },
  { label: "My Orders", href: "/account/orders", icon: Package },
  { label: "My Addresses", href: "/account/addresses", icon: MapPin },
  { label: "My Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "My Reviews", href: "/account/reviews", icon: Star },
  { label: "Support", href: "/account/support", icon: Headset },
  {
    label: "Change Password",
    href: "/account/password",
    icon: LockKeyhole,
  },
];

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

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name?: string) {
  if (!name?.trim()) return "N";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getStatusClass(status?: string) {
  const value = status?.toUpperCase() || "";

  if (
    ["DELIVERED", "COMPLETED", "PAID", "APPROVED"].includes(value)
  ) {
    return "bg-green-50 text-green-700";
  }

  if (
    ["CANCELLED", "FAILED", "REJECTED", "REFUNDED"].includes(value)
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    ["PENDING", "PAYMENT_PENDING", "PROCESSING", "SHIPPED"].includes(value)
  ) {
    return "bg-amber-50 text-amber-800";
  }

  return "bg-stone-100 text-stone-600";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load account information.";
}

export default function AccountPage() {
  const router = useRouter();

  const customerToken = useAuthStore((state) => state.customerToken);
  const customer = useAuthStore((state) => state.customer);
  const setCustomer = useAuthStore((state) => state.setCustomer);
  const logout = useAuthStore((state) => state.logout);
  const initializeAuth = useAuthStore(
    (state) => state.initializeAuth
  );

  const [dashboard, setDashboard] = useState<DashboardData>({
    customer: null,
    orders: [],
    wishlist: [],
    addresses: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        customerService.getProfile(),
        customerService.getOrders(),
        customerService.getWishlist(),
        customerService.getAddresses(),
      ]);

      const [profileResult, ordersResult, wishlistResult, addressesResult] =
        results;

      if (profileResult.status === "rejected") {
        throw profileResult.reason;
      }

      const profileResponse = profileResult.value;
      const profile =
        profileResponse?.customer ??
        profileResponse?.data?.customer ??
        profileResponse?.data ??
        profileResponse;

      if (!profile || typeof profile !== "object") {
        throw new Error("Customer profile could not be loaded.");
      }

      const orders =
        ordersResult.status === "fulfilled"
          ? Array.isArray(ordersResult.value)
            ? ordersResult.value
            : ordersResult.value?.orders || []
          : [];

      const wishlist =
        wishlistResult.status === "fulfilled"
          ? Array.isArray(wishlistResult.value)
            ? wishlistResult.value
            : wishlistResult.value?.items || []
          : [];

      const addresses =
        addressesResult.status === "fulfilled"
          ? Array.isArray(addressesResult.value)
            ? addressesResult.value
            : addressesResult.value?.addresses || []
          : Array.isArray(profile.addresses)
            ? profile.addresses
            : [];

      setCustomer(profile);

      setDashboard({
        customer: profile,
        orders,
        wishlist,
        addresses,
      });

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [setCustomer]);

  useEffect(() => {
    initializeAuth();

    if (!customerToken) {
      router.replace("/login");
      return;
    }

    loadDashboard();
  }, [customerToken, initializeAuth, loadDashboard, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  const activeCustomer = dashboard.customer || customer;

  const recentOrders = dashboard.orders.slice(0, 3);

  const stats = [
    {
      label: "Total Orders",
      value: dashboard.orders.length,
      icon: Package,
      href: "/account/orders",
    },
    {
      label: "Saved Addresses",
      value: dashboard.addresses.length,
      icon: MapPin,
      href: "/account/addresses",
    },
    {
      label: "Wishlist Items",
      value: dashboard.wishlist.length,
      icon: Heart,
      href: "/account/wishlist",
    },
  ];

  if (!customerToken) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#FAF6EF]">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#8C6D1F]" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF6EF] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1440px]">

        {/* Page Heading */}
        <div className="mb-8 border-b border-[#E5DED4] pb-6">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.25em] text-[#8C6D1F]">
            NOORINE / MY ACCOUNT
          </p>

          <h1 className="font-serif text-4xl font-medium text-[#2B2B2B] sm:text-5xl">
            My Account
          </h1>

          <p className="mt-2 text-sm text-[#77716A]">
            Manage your profile, orders and shopping preferences.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex flex-col gap-3 border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-800"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">

          {/* Sidebar */}
          <aside className="h-fit border border-[#E5DED4] bg-white">

            <div className="border-b border-[#E5DED4] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F3EBDD] font-serif text-xl text-[#8C6D1F]">
                  {getInitials(activeCustomer?.name)}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-serif text-lg font-semibold">
                    {activeCustomer?.name || "Welcome"}
                  </p>

                  <p className="truncate text-xs text-[#817A72]">
                    {activeCustomer?.email || ""}
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-3">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const active = index === 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between gap-3 px-4 py-3 text-sm transition-colors ${
                      active
                        ? "bg-[#F5F0E7] font-medium text-[#8C6D1F]"
                        : "text-[#625D56] hover:bg-[#FAF6EF] hover:text-[#8C6D1F]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} strokeWidth={1.6} />
                      {item.label}
                    </span>

                    <ChevronRight size={15} />
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[#E5DED4] p-3">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <LogOut size={17} />
                )}
                {isLoggingOut ? "Signing out..." : "Logout"}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0">

            {/* Welcome Card */}
            <div className="mb-7 flex flex-col gap-5 border border-[#E5DED4] bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-[#8C6D1F]">
                  YOUR NOORINE ACCOUNT
                </p>

                <h2 className="font-serif text-3xl font-medium text-[#2B2B2B]">
                  Hello, {activeCustomer?.name?.split(" ")[0] || "there"}!
                </h2>

                <p className="mt-2 text-sm text-[#817A72]">
                  Welcome back. Your everyday shine starts here.
                </p>
              </div>

              <Link
                href="/products"
                className="inline-flex w-fit items-center gap-2 border border-[#2B2B2B] px-5 py-3 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-[#2B2B2B] hover:text-white"
              >
                Continue Shopping
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Profile Summary */}
            <div className="mb-7 border border-[#E5DED4] bg-white p-6 sm:p-7">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-medium">
                    Personal Information
                  </h3>
                  <p className="mt-1 text-xs text-[#817A72]">
                    Your account details
                  </p>
                </div>

                <Link
                  href="/account/profile"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#8C6D1F] hover:underline"
                >
                  Edit Profile
                  <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-[#817A72]">
                    Full Name
                  </p>
                  <p className="text-sm font-medium">
                    {activeCustomer?.name || "—"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-[#817A72]">
                    Email Address
                  </p>
                  <p className="break-all text-sm font-medium">
                    {activeCustomer?.email || "—"}
                  </p>
                  {activeCustomer?.emailVerified !== undefined && (
                    <span className={`mt-1 inline-block text-[10px] ${
                      activeCustomer.emailVerified
                        ? "text-green-700"
                        : "text-amber-700"
                    }`}>
                      {activeCustomer.emailVerified
                        ? "Verified"
                        : "Not verified"}
                    </span>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs text-[#817A72]">
                    Phone Number
                  </p>
                  <p className="text-sm font-medium">
                    {activeCustomer?.phone || "Not added"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-[#817A72]">
                    Member Since
                  </p>
                  <p className="text-sm font-medium">
                    {formatDate(activeCustomer?.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Account Statistics */}
            <div className="mb-7 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <Link
                    key={stat.label}
                    href={stat.href}
                    className="group border border-[#E5DED4] bg-white p-5 transition-colors hover:border-[#C9A24B]"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-xs text-[#817A72]">
                        {stat.label}
                      </span>

                      <Icon
                        size={19}
                        className="text-[#8C6D1F]"
                        strokeWidth={1.5}
                      />
                    </div>

                    <div className="flex items-end justify-between">
                      <span className="font-serif text-3xl">
                        {isLoading ? "—" : stat.value}
                      </span>

                      <ChevronRight
                        size={17}
                        className="text-[#B6AA98] transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Recent Orders */}
            <div className="border border-[#E5DED4] bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5DED4] p-6">
                <div>
                  <h3 className="font-serif text-2xl font-medium">
                    Recent Orders
                  </h3>
                  <p className="mt-1 text-xs text-[#817A72]">
                    Your latest purchases
                  </p>
                </div>

                <Link
                  href="/account/orders"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#8C6D1F] hover:underline"
                >
                  View All
                  <ChevronRight size={14} />
                </Link>
              </div>

              {isLoading ? (
                <div className="flex min-h-40 items-center justify-center">
                  <LoaderCircle className="h-6 w-6 animate-spin text-[#8C6D1F]" />
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="divide-y divide-[#E5DED4]">
                  {recentOrders.map((order, index) => (
                    <div
                      key={order.orderNumber || index}
                      className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F5F0E7] text-[#8C6D1F]">
                          <ShoppingBag size={18} />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {order.orderNumber || "Order"}
                          </p>

                          <p className="mt-1 text-xs text-[#817A72]">
                            {formatDate(order.placedAt)}
                            {order.items?.length
                              ? ` · ${order.items.length} product(s)`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-sm font-medium">
                          {formatPrice(order.total, order.currency || "INR")}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-medium ${getStatusClass(
                            order.status || order.paymentStatus
                          )}`}
                        >
                          {(order.status || order.paymentStatus || "UNKNOWN")
                            .replaceAll("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F0E7] text-[#8C6D1F]">
                    <Package size={23} strokeWidth={1.5} />
                  </div>

                  <h4 className="font-serif text-xl">
                    No orders yet
                  </h4>

                  <p className="mt-2 max-w-xs text-xs leading-5 text-[#817A72]">
                    Your purchases will appear here once you place your first order.
                  </p>

                  <Link
                    href="/products"
                    className="mt-5 border border-[#2B2B2B] px-5 py-3 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-[#2B2B2B] hover:text-white"
                  >
                    Explore Collection
                  </Link>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-7 flex flex-col gap-4 border border-[#E5DED4] bg-[#F3EBDD] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-serif text-xl">
                  Need a little help?
                </h3>
                <p className="mt-1 text-xs text-[#746B5E]">
                  Our support team is here to assist you.
                </p>
              </div>

              <Link
                href="/account/support"
                className="inline-flex w-fit items-center gap-2 text-xs font-medium text-[#8C6D1F] hover:underline"
              >
                Contact Support
                <ArrowRight size={15} />
              </Link>
            </div>

          </main>
        </div>
      </div>
    </section>
  );
}
