
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  ChevronRight,
  LoaderCircle,
  ArrowRight,
} from "lucide-react";
import { usePathname } from "next/navigation";

import useCartStore from "@/store/cart.store";
import useWishlistStore from "@/store/wishlist.store";
import useAuthStore from "@/store/auth.store";

import productService from "@/service/modules/product.service";
import ProductCard from "@/components/product/ProductCard";

type HeaderConfig = {
  name?: string;
  store?: {
    logoUrl?: string;
    tagline?: string;
  };
  announcement?: {
    text?: string;
    link?: string;
  };
};

type HeaderProps = {
  config: HeaderConfig;
};

type SearchProduct = {
  id: number | string;
  slug: string;
  name: string;
  [key: string]: unknown;
};

const navigation = [
  { label: "Home", href: "/" },
  { label: "Shop All", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Collections", href: "/collections" },
];

function CartIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex">
      <ShoppingBag size={20} strokeWidth={1.6} />

      {count > 0 && (
        <span
          aria-label={`${count} items in cart`}
          className="absolute -right-2.5 -top-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8C6D1F] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[#FAF6EF]"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

function WishlistIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex">
      <Heart size={20} strokeWidth={1.6} />

      {count > 0 && (
        <span
          aria-label={`${count} items in wishlist`}
          className="absolute -right-2.5 -top-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#8C6D1F] px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-[#FAF6EF]"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </span>
  );
}

export default function Header({ config }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const pathname = usePathname();

  // Cart store
  const cart = useCartStore((state) => state.cart);
  const initializeCart = useCartStore(
    (state) => state.initializeCart
  );

  // Wishlist store
  const wishlistProducts = useWishlistStore(
    (state) => state.products
  );
  const initializeWishlist = useWishlistStore(
    (state) => state.initializeWishlist
  );

  // Authentication store
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const storeName = config.name || "NOORINE";
  const logoUrl = config.store?.logoUrl;
  const announcement = config.announcement;

  const wishlistCount = wishlistProducts.length;

  // Cart count
  const cartCount =
    typeof cart?.itemCount === "number"
      ? cart.itemCount
      : (cart?.items || []).reduce(
        (total, item) =>
          total + (Number(item.quantity) || 0),
        0
      );

  // Initialize cart
  useEffect(() => {
    initializeCart();
  }, [initializeCart]);

  // Initialize wishlist
  useEffect(() => {
    initializeWishlist().catch(() => { });
  }, [initializeWishlist]);

  // Live product search with debounce
  useEffect(() => {
    const query = searchTerm.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await productService.getAll({
          search: query,
          page: 0,
          size: 6,
          sort: "recommended",
        });

        if (cancelled) return;

        const result =
          response?.content ??
          response?.data?.content ??
          response?.data ??
          response?.products ??
          response;

        setSearchResults(
          Array.isArray(result) ? result : []
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Product search failed:", error);
        setSearchResults([]);
        setSearchError("Unable to search products. Please try again.");
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const closeMenu = () => setMenuOpen(false);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setSearchError("");
  };

  const searchPageUrl = `/products?search=${encodeURIComponent(
    searchTerm.trim()
  )}`;

  return (
    <header className="site-header relative z-40">
      {/* Announcement Bar */}
      {announcement?.text && (
        <div className="announcement-bar">
          {announcement.link ? (
            <Link
              href={announcement.link}
              className="inline-flex items-center justify-center gap-2"
            >
              <span>{announcement.text}</span>
              <ChevronRight size={13} />
            </Link>
          ) : (
            <span>{announcement.text}</span>
          )}
        </div>
      )}

      {/* Main Header */}
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[82px] lg:px-10">

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => {
            setMenuOpen((previous) => !previous);
            closeSearch();
          }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-[#2B2B2B] transition-colors hover:text-[#8C6D1F] lg:hidden"
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

        {/* Logo */}
        <Link
          href="/"
          onClick={() => {
            closeMenu();
            closeSearch();
          }}
          aria-label={`${storeName} home`}
          className="flex min-w-0 flex-1 items-center justify-center lg:flex-none lg:justify-start"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={180}
              height={65}
              unoptimized
              priority
              className="h-auto max-h-[48px] w-auto max-w-[150px] object-contain sm:max-w-[180px] lg:max-h-[58px]"
            />
          ) : (
            <span className="font-serif text-[27px] font-semibold tracking-[0.12em] text-[#2B2B2B] sm:text-3xl">
              {storeName}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex xl:gap-9"
        >
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative py-2 text-sm transition-colors duration-200
          after:absolute after:bottom-0 after:left-0 after:h-[1.5px]
          after:bg-[#8C6D1F] after:transition-all after:duration-300
          ${isActive
                    ? "font-medium text-[#8C6D1F] after:w-full"
                    : "text-[#2B2B2B] after:w-0 hover:text-[#8C6D1F] hover:after:w-full"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Actions */}
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-3">

          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen((previous) => !previous);
              setMenuOpen(false);
            }}
            aria-label={searchOpen ? "Close search" : "Search products"}
            aria-expanded={searchOpen}
            className="flex h-10 w-9 items-center justify-center transition-colors hover:text-[#8C6D1F] sm:w-10"
          >
            {searchOpen ? (
              <X size={21} strokeWidth={1.6} />
            ) : (
              <Search size={20} strokeWidth={1.6} />
            )}
          </button>

          {/* Logged-in Account */}
          {isAuthenticated ? (
            <Link
              href="/account"
              aria-label="My account"
              className="hidden h-10 w-10 items-center justify-center transition-colors hover:text-[#8C6D1F] sm:flex"
            >
              <UserRound size={20} strokeWidth={1.6} />
            </Link>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/login"
                className="text-xs font-medium uppercase tracking-wider text-[#2B2B2B] transition-colors hover:text-[#8C6D1F]"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="border border-[#8C6D1F] px-3 py-2 text-xs font-medium uppercase tracking-wider text-[#8C6D1F] transition-colors hover:bg-[#8C6D1F] hover:text-white"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Wishlist */}
          <Link
            href="/account/wishlist"
            aria-label={`Wishlist, ${wishlistCount} items`}
            className="hidden h-10 w-10 items-center justify-center transition-colors hover:text-[#8C6D1F] sm:flex"
          >
            <WishlistIcon count={wishlistCount} />
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label={`Shopping cart, ${cartCount} items`}
            className="flex h-10 w-9 items-center justify-center transition-colors hover:text-[#8C6D1F] sm:w-10"
          >
            <CartIcon count={cartCount} />
          </Link>
        </div>
      </div>

      {/* Product Search Panel */}
      {searchOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-t border-[#E5DED4] bg-[#FAF6EF] shadow-xl">
          <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6 lg:px-10">

            {/* Search Input */}
            <form
              action="/products"
              method="GET"
              className="flex items-center gap-3 border-b border-[#8C6D1F]/40 pb-3"
            >
              <Search
                size={20}
                className="shrink-0 text-[#8C6D1F]"
              />

              <input
                type="search"
                name="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search jewellery, earrings, necklaces..."
                autoComplete="off"
                autoFocus
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#2B2B2B] outline-none placeholder:text-[#2B2B2B]/40"
              />

              {searchLoading && (
                <LoaderCircle
                  size={19}
                  className="animate-spin text-[#8C6D1F]"
                />
              )}

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                  className="text-[#2B2B2B]/50 hover:text-[#8C6D1F]"
                >
                  <X size={18} />
                </button>
              )}
            </form>

            {/* Search Results */}
            <div className="pt-5">

              {searchTerm.trim().length < 2 ? (
                <p className="py-5 text-center text-sm text-[#2B2B2B]/50">
                  Start typing to discover your favourite jewellery.
                </p>
              ) : searchLoading ? (
                <div className="flex min-h-[130px] items-center justify-center gap-2 text-sm text-[#8C6D1F]">
                  <LoaderCircle size={20} className="animate-spin" />
                  Searching products...
                </div>
              ) : searchError ? (
                <div className="py-8 text-center text-sm text-red-600">
                  {searchError}
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-serif text-lg text-[#2B2B2B]">
                      Search Results
                    </h3>

                    <span className="text-xs text-[#2B2B2B]/50">
                      {searchResults.length} products
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {searchResults.map((product, index) => (
                      <div
                        key={product.id}
                        onClick={closeSearch}
                      >
                        <ProductCard
                          product={product}
                          priority={index < 4}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Link
                      href={searchPageUrl}
                      onClick={closeSearch}
                      className="inline-flex items-center gap-2 border-b border-[#8C6D1F] pb-1 text-xs font-medium uppercase tracking-widest text-[#8C6D1F] transition-colors hover:text-[#2B2B2B]"
                    >
                      View All Results
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <Search
                    size={30}
                    className="mx-auto mb-3 text-[#8C6D1F]/50"
                  />

                  <h3 className="font-serif text-xl text-[#2B2B2B]">
                    No products found
                  </h3>

                  <p className="mt-2 text-sm text-[#2B2B2B]/55">
                    Try searching with another product name.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-t border-[#E5DED4] bg-[#FAF6EF] shadow-lg lg:hidden">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex max-w-[1440px] flex-col px-5 py-3"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex min-h-[50px] items-center justify-between border-b border-[#E5DED4] text-sm tracking-wide transition-colors
  ${pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(`${item.href}/`))
                    ? "border-l-2 border-l-[#8C6D1F] pl-3 font-medium text-[#8C6D1F]"
                    : "text-[#2B2B2B] hover:text-[#8C6D1F]"
                  }`}
              >
                {item.label}
                <ChevronRight size={17} />
              </Link>
            ))}

            <div className="grid grid-cols-3 gap-3 py-5 sm:hidden">

              {/* Mobile Account / Login */}
              {isAuthenticated ? (
                <Link
                  href="/account"
                  onClick={closeMenu}
                  className="flex flex-col items-center gap-2 text-xs text-[#2B2B2B] transition-colors hover:text-[#8C6D1F]"
                >
                  <UserRound size={20} />
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex flex-col items-center gap-2 text-xs text-[#2B2B2B] transition-colors hover:text-[#8C6D1F]"
                >
                  <UserRound size={20} />
                  Login
                </Link>
              )}

              {/* Mobile Wishlist */}
              <Link
                href="/account/wishlist"
                onClick={closeMenu}
                aria-label={`Wishlist, ${wishlistCount} items`}
                className="flex flex-col items-center gap-2 text-xs text-[#2B2B2B] transition-colors hover:text-[#8C6D1F]"
              >
                <WishlistIcon count={wishlistCount} />
                Wishlist
              </Link>

              {/* Mobile Cart */}
              <Link
                href="/cart"
                onClick={closeMenu}
                aria-label={`Shopping cart, ${cartCount} items`}
                className="flex flex-col items-center gap-2 text-xs text-[#2B2B2B] transition-colors hover:text-[#8C6D1F]"
              >
                <CartIcon count={cartCount} />
                Cart
              </Link>
            </div>

            {/* Mobile Sign Up */}
            {!isAuthenticated && (
              <Link
                href="/signup"
                onClick={closeMenu}
                className="mb-3 border border-[#8C6D1F] py-3 text-center text-xs font-medium uppercase tracking-widest text-[#8C6D1F]"
              >
                Create an Account
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
