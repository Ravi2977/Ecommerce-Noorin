
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import {
  Heart,
  Star,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import useWishlistStore from "@/store/wishlist.store";
import useCartStore from "@/store/cart.store";

type ProductImage = {
  url?: string;
  imageUrl?: string;
};

export type Product = {
  id: number | string;
  slug: string;
  name: string;
  price?: number | string | null;
  compareAtPrice?: number | string | null;
  currency?: string;
  badge?: string | null;
  images?: (string | ProductImage)[];
  imageDetails?: ProductImage[];
  imageUrl?: string;
  category?: {
    name?: string;
    slug?: string;
  };
  rating?: {
    average?: number | null;
    count?: number;
  };
  averageRating?: number | null;
  reviewCount?: number;
  inStock?: boolean;
  comingSoon?: boolean;
  variantRequired?: boolean;
};

type ProductCardProps = {
  product: Product;
  priority?: boolean;
  showWishlist?: boolean;
};

function getProductImage(product: Product): string | null {
  const firstImage = product.images?.[0];

  if (typeof firstImage === "string") {
    return firstImage || null;
  }

  return (
    firstImage?.url ||
    firstImage?.imageUrl ||
    product.imageDetails?.[0]?.url ||
    product.imageDetails?.[0]?.imageUrl ||
    product.imageUrl ||
    null
  );
}

function formatPrice(
  price: number | string,
  currency = "INR"
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(price));
}

export default function ProductCard({
  product,
  priority = false,
  showWishlist = true,
}: ProductCardProps) {
  const router = useRouter();

  const [updatingWishlist, setUpdatingWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const isWishlisted = useWishlistStore((state) =>
    state.isWishlisted(product.id)
  );

  const wishlistLoading = useWishlistStore(
    (state) => state.isLoading
  );

  const initializeWishlist = useWishlistStore(
    (state) => state.initializeWishlist
  );

  const addWishlistItem = useWishlistStore(
    (state) => state.addItem
  );

  const removeWishlistItem = useWishlistStore(
    (state) => state.removeItem
  );

  const addCartItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (!showWishlist) return;

    void initializeWishlist().catch(() => {
      // Wishlist initialization errors are handled separately.
    });
  }, [initializeWishlist, showWishlist]);

  const image = getProductImage(product);

  const hasPrice = product.price != null;

  const hasComparePrice =
    product.compareAtPrice != null &&
    Number(product.compareAtPrice) > Number(product.price);

  const rating =
    product.rating?.average ?? product.averageRating;

  const reviewCount =
    product.rating?.count ?? product.reviewCount ?? 0;

  const showRating =
    rating != null &&
    Number(rating) > 0 &&
    reviewCount > 0;

  const isOutOfStock =
    product.inStock === false && !product.comingSoon;

  const unavailable =
    isOutOfStock || product.comingSoon;

  const currency = product.currency || "INR";

  async function handleWishlistToggle(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (updatingWishlist) return;

    if (!localStorage.getItem("customerToken")) {
      router.push(
        `/account/login?redirect=${encodeURIComponent(
          `/products/${product.slug}`
        )}`
      );
      return;
    }

    try {
      setUpdatingWishlist(true);

      if (isWishlisted) {
        await removeWishlistItem(product.id);
        toast.success("Removed from your wishlist.");
      } else {
        await addWishlistItem(product.id);
        toast.success("Added to your wishlist.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update your wishlist."
      );
    } finally {
      setUpdatingWishlist(false);
    }
  }

  async function handleAddToCart(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (addingToCart || unavailable) return;

    // Variant-required products need option selection.
    if (product.variantRequired) {
      router.push(`/products/${product.slug}`);
      return;
    }

    try {
      setAddingToCart(true);

      await addCartItem({
        productId: product.id,
        quantity: 1,
        variant: null,
      });

      toast.success(`${product.name} added to your bag.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to add product to bag."
      );
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <div className="group relative block min-w-0 overflow-hidden border border-[#E5DED4] bg-[#FAF6EF] transition-all duration-300 hover:border-[#C9A24B] hover:shadow-[0_5px_20px_rgba(43,43,43,0.06)]">

      {/* Product Link */}
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="block"
      >
        {/* Product Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#F1EAE0]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                isOutOfStock ? "opacity-60" : ""
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <span className="font-serif text-2xl tracking-[0.2em] text-[#C9A24B]">
                NOORINE
              </span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-[#8C6D1F]">
                Everyday Shine
              </span>
            </div>
          )}

          {/* Product Badge */}
          {product.badge && (
            <span className="absolute left-2 top-2 z-10 max-w-[calc(100%-56px)] bg-[#2B2B2B] px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wider text-[#FAF6EF] sm:left-3 sm:top-3">
              {product.badge}
            </span>
          )}

          {/* Stock Status */}
          {(product.comingSoon || isOutOfStock) && (
            <span className="absolute bottom-2 left-2 z-10 bg-[#FAF6EF]/95 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#2B2B2B] sm:bottom-3 sm:left-3">
              {product.comingSoon ? "Coming Soon" : "Out of Stock"}
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
          <div className="flex min-h-4 items-center justify-between gap-2">
            {product.category?.name ? (
              <p className="truncate text-[9px] font-medium uppercase tracking-[0.16em] text-[#8C6D1F] sm:text-[10px]">
                {product.category.name}
              </p>
            ) : (
              <span />
            )}

            {showRating && (
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-[#8C6D1F]">
                <Star size={11} fill="currentColor" />
                {Number(rating).toFixed(1)}
              </span>
            )}
          </div>

          <h3 className="mt-1 line-clamp-2 font-serif text-lg leading-snug text-[#2B2B2B] transition-colors group-hover:text-[#8C6D1F] sm:text-xl">
            {product.name}
          </h3>

          {/* Product Price */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {hasPrice && (
              <span className="text-sm font-semibold text-[#2B2B2B] sm:text-base">
                {formatPrice(product.price!, currency)}
              </span>
            )}

            {hasComparePrice && (
              <span className="text-xs text-[#999] line-through">
                {formatPrice(product.compareAtPrice!, currency)}
              </span>
            )}
          </div>

          {showRating && (
            <p className="mt-1 text-[10px] text-[#888]">
              {reviewCount}{" "}
              {reviewCount === 1 ? "Review" : "Reviews"}
            </p>
          )}
        </div>
      </Link>

      {/* Wishlist Button */}
      {showWishlist && (
        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={updatingWishlist || wishlistLoading}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={isWishlisted}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DED4] bg-[#FAF6EF]/95 text-[#2B2B2B] shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-[#C9A24B] hover:bg-white hover:text-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-60 sm:right-3 sm:top-3 sm:h-10 sm:w-10"
        >
          {updatingWishlist ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Heart
              size={18}
              strokeWidth={1.7}
              fill={isWishlisted ? "#8C6D1F" : "none"}
              color={isWishlisted ? "#8C6D1F" : "currentColor"}
            />
          )}
        </button>
      )}

      {/* Add to Bag Button */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart || unavailable}
          className="flex min-h-10 w-full items-center justify-center gap-2 border border-[#2B2B2B] bg-[#2B2B2B] px-3 py-3 text-[9px] font-medium uppercase tracking-[0.18em] text-[#FAF6EF] transition-all duration-300 hover:border-[#8C6D1F] hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:border-[#2B2B2B]/20 disabled:bg-[#2B2B2B]/10 disabled:text-[#2B2B2B]/45 sm:text-[10px]"
        >
          {addingToCart ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Adding...
            </>
          ) : unavailable ? (
            product.comingSoon ? "Coming Soon" : "Out of Stock"
          ) : product.variantRequired ? (
            <>
              <ShoppingBag size={15} />
              Select Options
            </>
          ) : (
            <>
              <ShoppingBag size={15} strokeWidth={1.7} />
              Add to Bag
            </>
          )}
        </button>
      </div>
    </div>
  );
}
