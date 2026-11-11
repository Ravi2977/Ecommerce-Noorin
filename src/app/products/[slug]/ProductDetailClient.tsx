
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  PackageCheck,
  Plus,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Star,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";

import ProductCard from "@/components/product/ProductCard";
import useCartStore  from "@/store/cart.store";
import ProductReviews from "@/components/product/ProductReviews";
/* =========================================================
   TYPES
========================================================= */

type ProductImage =
  | string
  | {
      url?: string;
      imageUrl?: string;
      src?: string;
      alt?: string;
    };

type ProductOption = {
  name?: string;
  values?: unknown[];
};

type ProductVariant = {
  id?: number | string;
  name?: string;
  sku?: string;
  attributes?: Record<string, unknown>;
  price?: number | null;
  compareAtPrice?: number | null;
  onSale?: boolean;
  discountPercent?: number | null;
  imageUrl?: string | null;
  images?: ProductImage[];
  inStock?: boolean;
  stockQuantity?: number | null;
  priceTiers?: unknown[];
};

type Product = {
  id: number;
  slug: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  shortDescription?: string | null;

  category?: {
    id?: number;
    name?: string;
    slug?: string;
    path?: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  } | null;

  rating?: {
    average?: number | null;
    count?: number;
  } | null;

  unit?: string;
  currency?: string;
  price?: number | null;
  compareAtPrice?: number | null;
  onSale?: boolean;
  discountPercent?: number | null;
  saleEndsAt?: string | null;

  featured?: boolean;
  badge?: string | null;

  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number | null;

  priceTiers?: unknown[];
  attributes?: Record<string, unknown> | null;
  variants?: ProductVariant[];
  options?: ProductOption[];
  variantRequired?: boolean;

  images?: ProductImage[];
  imageDetails?: ProductImage[];

  inStock?: boolean;
  stockQuantity?: number | null;
  comingSoon?: boolean;

  highlights?: string[];
  tags?: string[];

  brand?: string | null;
  gtin?: string | null;
  mpn?: string | null;
  videoUrl?: string | null;

  weight?:
    | { value?: number; unit?: string }
    | number
    | null;

  dimensions?:
    | {
        length?: number;
        width?: number;
        height?: number;
        unit?: string;
      }
    | string
    | null;

  countryOfOrigin?: string | null;
  warranty?: string | null;
  returnable?: boolean;

  faq?: Array<{
    question?: string;
    answer?: string;
  }>;

  relatedProducts?: Product[];
};

type ImageItem = {
  url: string;
  alt: string;
};

/* =========================================================
   HELPERS
========================================================= */

function formatText(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatText).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => {
        const text = formatText(item);
        return text ? `${formatLabel(key)}: ${text}` : "";
      })
      .filter(Boolean)
      .join(" · ");
  }

  return "";
}

function formatLabel(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatPrice(
  value: number | null | undefined,
  currency = "INR"
): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function getImages(product: Product): ImageItem[] {
  const seen = new Set<string>();

  return [
    ...(product.images || []),
    ...(product.imageDetails || []),
  ]
    .map((item): ImageItem | null => {
      const url =
        typeof item === "string"
          ? item
          : item.url || item.imageUrl || item.src;

      if (!url) return null;

      return {
        url,
        alt:
          typeof item === "string"
            ? product.name
            : item.alt || product.name,
      };
    })
    .filter((item): item is ImageItem => {
      if (!item || seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
}

function getAvailability(
  inStock?: boolean,
  quantity?: number | null,
  comingSoon?: boolean
) {
  if (comingSoon) {
    return { label: "Coming Soon", available: false };
  }

  if (
    inStock === false ||
    (typeof quantity === "number" && quantity <= 0)
  ) {
    return { label: "Out of Stock", available: false };
  }

  if (inStock === true) {
    return { label: "In Stock", available: true };
  }

  return {
    label: "Availability on request",
    available: false,
  };
}

function formatWeight(weight: Product["weight"]): string | null {
  if (weight === null || weight === undefined) return null;

  if (typeof weight === "number") {
    return `${weight} kg`;
  }

  if (typeof weight.value === "number") {
    return `${weight.value} ${weight.unit || ""}`.trim();
  }

  return null;
}

function formatDimensions(
  dimensions: Product["dimensions"]
): string | null {
  if (!dimensions) return null;
  if (typeof dimensions === "string") return dimensions;

  const { length, width, height, unit = "" } = dimensions;

  const values = [length, width, height].filter(
    (value) => typeof value === "number"
  );

  if (!values.length) return null;

  return `${values.join(" × ")} ${unit}`.trim();
}

function formatDate(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getVideoEmbedUrl(url?: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];

      return id
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com"
    ) {
      const id =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];

      return id
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : null;
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];

      return id
        ? `https://player.vimeo.com/video/${id}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

function isDirectVideo(url?: string | null): boolean {
  return Boolean(url && /\.(mp4|webm|ogg|mov)(?:$|[?#])/i.test(url));
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function SectionHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <h2 className="mb-7 text-center font-serif text-3xl leading-tight text-[#2B2B2B] sm:text-4xl">
      {children}
    </h2>
  );
}

/* =========================================================
   MAIN PRODUCT DETAIL COMPONENT
========================================================= */

export default function ProductDetailClient({
  product,
}: {
  product: Product;
}) {
  const images = useMemo(() => getImages(product), [product]);

  const variants = product.variants || [];
  const options = product.options || [];

  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  const [quantity, setQuantity] = useState(
    Math.max(1, product.minimumOrderQuantity || 1)
  );

  const [addingToCart, setAddingToCart] = useState(false);

  // Existing Zustand cart store
  const addItem = useCartStore((state) => state.addItem);

  /* ---------------------------------------------------------
     INITIAL OPTION SELECTION
  --------------------------------------------------------- */

  useEffect(() => {
    const initial: Record<string, string> = {};

    options.forEach((option) => {
      if (option.name && option.values?.length) {
        initial[option.name] = formatText(option.values[0]);
      }
    });

    setSelectedOptions(initial);
    setActiveImage(0);
    setQuantity(Math.max(1, product.minimumOrderQuantity || 1));
  }, [product.id, product.slug]);

  /* ---------------------------------------------------------
     SELECTED VARIANT
  --------------------------------------------------------- */

  const selectedVariant = useMemo(() => {
    if (!variants.length) return null;

    const selectedEntries = Object.entries(selectedOptions);

    if (!selectedEntries.length) return variants[0];

    return (
      variants.find((variant) =>
        selectedEntries.every(([key, value]) => {
          const actual = variant.attributes?.[key];

          return (
            actual !== undefined &&
            formatText(actual).toLowerCase() === value.toLowerCase()
          );
        })
      ) || null
    );
  }, [variants, selectedOptions]);

  const currentPrice =
    selectedVariant?.price ?? product.price;

  const currentComparePrice =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice;

  const currentSku =
    selectedVariant?.sku || product.sku;

  const currentStock =
    selectedVariant?.stockQuantity ?? product.stockQuantity;

  const currentAvailability = getAvailability(
    selectedVariant?.inStock ?? product.inStock,
    currentStock,
    product.comingSoon
  );

  const hasComparePrice =
    typeof currentPrice === "number" &&
    typeof currentComparePrice === "number" &&
    currentComparePrice > currentPrice;

  const currentDiscount =
    selectedVariant?.discountPercent ??
    product.discountPercent ??
    (hasComparePrice
      ? Math.round(
          ((currentComparePrice! - currentPrice!) /
            currentComparePrice!) *
            100
        )
      : null);

  const currency = product.currency || "INR";
  const saleEndText = formatDate(product.saleEndsAt);

  const validRating =
    typeof product.rating?.average === "number" &&
    product.rating.average > 0 &&
    typeof product.rating.count === "number" &&
    product.rating.count > 0;

  /* ---------------------------------------------------------
     QUANTITY AND CART
  --------------------------------------------------------- */

  const minimumQuantity = Math.max(
    1,
    product.minimumOrderQuantity || 1
  );

  const maximumQuantity =
    product.maximumOrderQuantity != null
      ? Math.max(minimumQuantity, product.maximumOrderQuantity)
      : typeof currentStock === "number"
        ? Math.max(minimumQuantity, currentStock)
        : 999;

  const canAddToCart =
    currentAvailability.available &&
    (!product.variantRequired || Boolean(selectedVariant)) &&
    (!selectedVariant || selectedVariant.inStock !== false) &&
    quantity >= minimumQuantity &&
    quantity <= maximumQuantity &&
    (typeof currentStock !== "number" || quantity <= currentStock);

  async function handleAddToCart() {
    if (addingToCart) return;

    if (product.variantRequired && !selectedVariant) {
      toast.error("Please select a valid product variant.");
      return;
    }

    if (!canAddToCart) {
      toast.error("Selected quantity is not available.");
      return;
    }

    try {
      setAddingToCart(true);

      await addItem({
  productId: product.id,
  quantity: quantity,
  variant: selectedVariant?.name ?? null,
});

      toast.success(`${product.name} added to your bag.`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to add product to cart."
      );
    } finally {
      setAddingToCart(false);
    }
  }

  /* ---------------------------------------------------------
     VARIANT IMAGE AND GALLERY ORDER
  --------------------------------------------------------- */

  const variantImage =
    selectedVariant?.imageUrl ||
    (selectedVariant?.images?.[0]
      ? typeof selectedVariant.images[0] === "string"
        ? selectedVariant.images[0]
        : selectedVariant.images[0].url ||
          selectedVariant.images[0].imageUrl ||
          null
      : null);

  const galleryImages = useMemo(() => {
    if (!variantImage) return images;

    const selectedIndex = images.findIndex(
      (image) => image.url === variantImage
    );

    if (selectedIndex <= 0) return images;

    return [
      images[selectedIndex],
      ...images.filter((_, index) => index !== selectedIndex),
    ];
  }, [images, variantImage]);

  useEffect(() => {
    setActiveImage(0);
  }, [variantImage]);

  /* ---------------------------------------------------------
     LIGHTBOX KEYBOARD CONTROLS
  --------------------------------------------------------- */

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }

      if (event.key === "ArrowRight" && galleryImages.length > 1) {
        setActiveImage((current) => (current + 1) % galleryImages.length);
      }

      if (event.key === "ArrowLeft" && galleryImages.length > 1) {
        setActiveImage(
          (current) =>
            (current - 1 + galleryImages.length) % galleryImages.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, galleryImages.length]);

  function changeImage(direction: number) {
    setActiveImage(
      (current) =>
        (current + direction + galleryImages.length) %
        galleryImages.length
    );
  }

  function selectOption(optionName: string, value: string) {
    setSelectedOptions((current) => ({
      ...current,
      [optionName]: value,
    }));
  }

  function selectVariant(variant: ProductVariant) {
    const nextOptions = Object.fromEntries(
      Object.entries(variant.attributes || {}).map(([key, value]) => [
        key,
        formatText(value),
      ])
    );

    setSelectedOptions((current) => ({
      ...current,
      ...nextOptions,
    }));
  }

  /* ---------------------------------------------------------
     PRODUCT SPECIFICATIONS
  --------------------------------------------------------- */

  const detailRows = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [];

    Object.entries(product.attributes || {}).forEach(([key, value]) => {
      const label =
        key.toLowerCase() === "s" &&
        options.some((option) => option.name === "Size")
          ? "Size"
          : formatLabel(key);

      const valueText = formatText(value);

      if (valueText) {
        rows.push({ label, value: valueText });
      }
    });

    Object.entries(selectedVariant?.attributes || {}).forEach(
      ([key, value]) => {
        const valueText = formatText(value);

        if (valueText) {
          rows.push({
            label: formatLabel(key),
            value: valueText,
          });
        }
      }
    );

    if (product.brand) {
      rows.push({ label: "Brand", value: product.brand });
    }

    if (currentSku) {
      rows.push({ label: "SKU", value: currentSku });
    }

    if (product.gtin) {
      rows.push({ label: "GTIN", value: product.gtin });
    }

    if (product.mpn) {
      rows.push({ label: "MPN", value: product.mpn });
    }

    if (product.unit) {
      rows.push({ label: "Unit", value: product.unit });
    }

    const weight = formatWeight(product.weight);

    if (weight) {
      rows.push({ label: "Weight", value: weight });
    }

    const dimensions = formatDimensions(product.dimensions);

    if (dimensions) {
      rows.push({ label: "Dimensions", value: dimensions });
    }

    if (product.countryOfOrigin) {
      rows.push({
        label: "Country of Origin",
        value: product.countryOfOrigin,
      });
    }

    if (product.warranty) {
      rows.push({ label: "Warranty", value: product.warranty });
    }

    if (product.returnable !== undefined) {
      rows.push({
        label: "Returnable",
        value: product.returnable ? "Yes" : "No",
      });
    }

    return rows.filter(
      (row, index, all) =>
        all.findIndex(
          (item) => item.label.toLowerCase() === row.label.toLowerCase()
        ) === index
    );
  }, [product, selectedVariant, currentSku, options]);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#FAF6EF] text-[#2B2B2B]">

      {/* BREADCRUMB */}

      <div className="mx-auto max-w-[1700px] px-4 pt-6 sm:px-6 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-[#2B2B2B]/55"
        >
          <Link
            href="/"
            className="transition-colors duration-300 hover:text-[#8C6D1F]"
          >
            Home
          </Link>

          {(product.category?.path ||
            (product.category ? [product.category] : [])
          ).map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center gap-2"
            >
              <ChevronRight size={13} />
              <Link
                href={`/categories/${category.slug}`}
                className="transition-colors duration-300 hover:text-[#8C6D1F]"
              >
                {category.name}
              </Link>
            </span>
          ))}

          <ChevronRight size={13} />
          <span className="text-[#2B2B2B]">{product.name}</span>
        </nav>
      </div>

      {/* MAIN PRODUCT LAYOUT */}

      <section className="mx-auto grid max-w-[1700px] grid-cols-1 items-start gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.55fr_0.95fr] lg:gap-12 lg:px-10 lg:py-10">

        {/* PRODUCT GALLERY */}

        <div className="min-w-0">
          {galleryImages.length > 0 || product.videoUrl ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
              {galleryImages.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => {
                    setActiveImage(index);
                    setLightboxOpen(true);
                  }}
                  aria-label={`Enlarge product image ${index + 1}`}
                  className={`group relative block aspect-[1.08/1] w-full overflow-hidden bg-white ${
                    index === 0 ? "border border-[#C9A24B]/20" : ""
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || product.name}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none ${
                      index === 0
                        ? "object-contain p-4 sm:p-6 lg:p-8"
                        : "object-cover"
                    }`}
                  />

                  {index === 0 && product.badge && (
                    <span className="absolute left-3 top-3 bg-[#FAF6EF] px-3 py-2 text-[9px] uppercase tracking-[0.18em] text-[#8C6D1F] sm:left-4 sm:top-4">
                      {product.badge}
                    </span>
                  )}

                  {index === 0 && product.onSale && (
                    <span className="absolute right-3 top-3 bg-[#2B2B2B] px-3 py-2 text-[9px] uppercase tracking-widest text-white sm:right-4 sm:top-4">
                      {currentDiscount != null
                        ? `${currentDiscount}% OFF`
                        : "Sale"}
                    </span>
                  )}

                  <span className="pointer-events-none absolute bottom-3 right-3 inline-flex translate-y-2 items-center gap-2 bg-[#FAF6EF]/90 px-3 py-2 text-[9px] uppercase tracking-wider opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transition-none">
                    <ZoomIn size={13} />
                    View Image
                  </span>
                </button>
              ))}

              {/* PRODUCT VIDEO */}

              {product.videoUrl && (
                <div className="relative aspect-[1.08/1] w-full overflow-hidden bg-[#2B2B2B]">
                  {isDirectVideo(product.videoUrl) ? (
                    <video
                      src={product.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                      aria-label={`${product.name} product video`}
                    />
                  ) : getVideoEmbedUrl(product.videoUrl) ? (
                    <iframe
                      src={getVideoEmbedUrl(product.videoUrl)!}
                      title={`${product.name} product video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      className="h-full w-full border-0"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-white">
                      <span className="font-serif text-xl">
                        Product Video
                      </span>
                      <a
                        href={product.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border-b border-white/50 pb-1 text-xs transition-colors duration-300 hover:text-[#C9A24B]"
                      >
                        Watch Video
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-[#D9B8AE]/15">
              <span className="font-serif text-4xl tracking-widest text-[#8C6D1F]/50">
                NOORINE
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT INFORMATION */}

        <div className="flex min-w-0 flex-col lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2 lg:[scrollbar-width:thin]">

          {/* CATEGORY */}

          {product.category?.name && (
            <Link
              href={`/categories/${product.category.slug || ""}`}
              className="mb-4 w-fit text-[10px] uppercase tracking-[0.3em] text-[#8C6D1F] transition-colors duration-300 hover:text-[#2B2B2B]"
            >
              {product.category.name}
            </Link>
          )}

          {/* NAME */}

          <h1 className="font-serif text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">
            {product.name}
          </h1>

          {currentSku && (
            <p className="mt-3 text-xs tracking-wider text-[#2B2B2B]/50">
              SKU: {currentSku}
            </p>
          )}

          {/* RATING */}

          {validRating && (
            <div className="mt-5 flex items-center gap-2">
              <div className="flex gap-1 text-[#C9A24B]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={14}
                    fill={
                      index < Math.round(product.rating!.average!)
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>

              <span className="text-xs text-[#2B2B2B]/60">
                {product.rating!.average!.toFixed(1)} (
                {product.rating!.count} reviews)
              </span>
            </div>
          )}

          {/* PRICE */}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {formatPrice(currentPrice, currency) && (
              <span className="text-2xl font-medium">
                {formatPrice(currentPrice, currency)}
              </span>
            )}

            {hasComparePrice && (
              <span className="text-base text-[#2B2B2B]/40 line-through">
                {formatPrice(currentComparePrice, currency)}
              </span>
            )}

            {product.onSale && currentDiscount != null && (
              <span className="bg-[#D9B8AE]/30 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[#8C6D1F]">
                {currentDiscount}% OFF
              </span>
            )}
          </div>

          {product.onSale && saleEndText && (
            <p className="mt-2 text-xs text-[#8C6D1F]">
              Offer ends: {saleEndText}
            </p>
          )}

          {/* SHORT DESCRIPTION */}

          {product.shortDescription && (
            <p className="mt-4 text-sm leading-7 text-[#2B2B2B]/70">
              {product.shortDescription}
            </p>
          )}

          {/* STOCK */}

          <div className="mt-7 flex flex-wrap items-center gap-2 border-y border-[#2B2B2B]/10 py-4">
            <span
              className={`h-2 w-2 rounded-full ${
                currentAvailability.available
                  ? "bg-green-600"
                  : "bg-[#C9A24B]"
              }`}
            />

            <span className="text-xs font-medium">
              {currentAvailability.label}
            </span>

            {typeof currentStock === "number" && currentStock > 0 && (
              <span className="text-xs text-[#2B2B2B]/50">
                ({currentStock} available)
              </span>
            )}
          </div>

          {/* ORDER LIMITS */}

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#2B2B2B]/60">
            {product.minimumOrderQuantity != null && (
              <span>
                Minimum order: {product.minimumOrderQuantity}
              </span>
            )}

            {product.maximumOrderQuantity != null && (
              <span>
                Maximum order: {product.maximumOrderQuantity}
              </span>
            )}

            {product.unit && <span>Unit: {product.unit}</span>}
          </div>

          {/* OPTIONS */}

          {options.length > 0 && (
            <div className="mt-8 space-y-6">
              {options.map((option, index) => {
                const values = (option.values || [])
                  .map(formatText)
                  .filter(Boolean);

                if (!option.name || !values.length) return null;

                const selected = selectedOptions[option.name] || "";

                return (
                  <fieldset key={`${option.name}-${index}`}>
                    <legend className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
                      {option.name}
                      <span className="normal-case tracking-normal text-[#8C6D1F]">
                        {selected}
                      </span>
                    </legend>

                    <div className="flex flex-wrap gap-2">
                      {values.map((value) => {
                        const active = selected === value;

                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              selectOption(option.name!, value)
                            }
                            aria-pressed={active}
                            className={`min-h-10 border px-4 py-2 text-xs transition-all duration-300 ease-in-out motion-reduce:transition-none ${
                              active
                                ? "border-[#2B2B2B] bg-[#2B2B2B] text-white"
                                : "border-[#2B2B2B]/20 bg-transparent hover:border-[#8C6D1F] hover:bg-[#D9B8AE]/15 hover:text-[#8C6D1F]"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
          )}

          {/* SELECTED VARIANT */}

          {variants.length > 0 && (
            <div className="mt-7 border border-[#2B2B2B]/10 bg-white/30 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xs font-medium uppercase tracking-[0.18em]">
                  Selected Variant
                </h2>

                {selectedVariant?.name && (
                  <span className="bg-[#D9B8AE]/25 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#8C6D1F]">
                    {selectedVariant.name}
                  </span>
                )}
              </div>

              {selectedVariant ? (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {Object.entries(selectedVariant.attributes || {}).map(
                    ([key, value]) => (
                      <div key={key}>
                        <p className="text-[10px] uppercase tracking-wider text-[#2B2B2B]/45">
                          {formatLabel(key)}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {formatText(value)}
                        </p>
                      </div>
                    )
                  )}

                  {selectedVariant.sku && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#2B2B2B]/45">
                        Variant SKU
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {selectedVariant.sku}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#2B2B2B]/45">
                      Available Stock
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {typeof selectedVariant.stockQuantity === "number"
                        ? selectedVariant.stockQuantity
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs leading-6 text-[#8C6D1F]">
                  Please select a valid combination of product options
                  to view its variant details.
                </p>
              )}
            </div>
          )}

          {/* BULK PRICING */}

          {(selectedVariant?.priceTiers?.length ||
            (!selectedVariant && product.priceTiers?.length)) ? (
            <div className="mt-7">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.18em]">
                Bulk Pricing
              </h2>

              <div className="divide-y divide-[#2B2B2B]/10 border-y border-[#2B2B2B]/10">
                {(selectedVariant?.priceTiers?.length
                  ? selectedVariant.priceTiers
                  : product.priceTiers || []
                ).map((tier, index) => (
                  <p
                    key={index}
                    className="py-3 text-sm text-[#2B2B2B]/70"
                  >
                    {formatText(tier)}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          {/* QUANTITY SELECTOR */}

          <div className="mt-8 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs uppercase tracking-[0.18em] text-[#2B2B2B]/70">
                Quantity
              </span>

              <div className="flex items-center border border-[#2B2B2B]/20">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={
                    quantity <= minimumQuantity || addingToCart
                  }
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(minimumQuantity, current - 1)
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-[#D9B8AE]/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus size={15} />
                </button>

                <span className="min-w-12 text-center text-sm tabular-nums">
                  {quantity}
                </span>

                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={
                    quantity >= maximumQuantity ||
                    addingToCart
                  }
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(maximumQuantity, current + 1)
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center transition hover:bg-[#D9B8AE]/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* ADD TO CART BUTTON */}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart || addingToCart}
              className="flex min-h-14 w-full items-center justify-center gap-3 bg-[#2B2B2B] px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-white transition-all duration-300 hover:bg-[#8C6D1F] disabled:cursor-not-allowed disabled:bg-[#2B2B2B]/40"
            >
              {addingToCart ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Adding to Bag...
                </>
              ) : !currentAvailability.available ? (
                currentAvailability.label
              ) : (
                <>
                  <ShoppingBag size={17} />
                  Add to Cart
                </>
              )}
            </button>

            {product.maximumOrderQuantity != null && (
              <p className="text-center text-[10px] tracking-wide text-[#2B2B2B]/50">
                Maximum {product.maximumOrderQuantity} pieces per order
              </p>
            )}

            {product.variantRequired && !selectedVariant && (
              <p className="text-center text-xs text-[#8C6D1F]">
                Please select a valid product variant.
              </p>
            )}
          </div>

          {/* TRUST INFORMATION */}

          <div className="mt-8 grid grid-cols-1 gap-4 border-y border-[#2B2B2B]/10 py-5 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <PackageCheck
                size={19}
                className="shrink-0 text-[#8C6D1F]"
              />
              <span className="text-xs text-[#2B2B2B]/70">
                Delivery across India
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck
                size={19}
                className="shrink-0 text-[#8C6D1F]"
              />
              <span className="text-xs text-[#2B2B2B]/70">
                Secure shopping
              </span>
            </div>

            {product.returnable !== undefined && (
              <div className="flex items-center gap-3 sm:col-span-2">
                <RefreshCcw
                  size={19}
                  className="shrink-0 text-[#8C6D1F]"
                />
                <span className="text-xs text-[#2B2B2B]/70">
                  {product.returnable
                    ? "Return eligible"
                    : "Non-returnable product"}
                </span>
              </div>
            )}
          </div>

          {/* CONTINUE SHOPPING */}

          <Link
            href="/products"
            className="group mt-8 inline-flex w-fit items-center gap-2 border-b border-[#8C6D1F]/60 pb-2 text-xs uppercase tracking-[0.2em] transition-all duration-300 ease-in-out hover:gap-3 hover:border-[#8C6D1F] hover:text-[#8C6D1F] motion-reduce:transition-none"
          >
            <ArrowLeft
              size={14}
              className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none"
            />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </section>

      {/* PRODUCT DESCRIPTION AND DETAILS */}

      <section className="border-t border-[#2B2B2B]/10">
        <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:space-y-14 lg:py-16">

          {product.description && (
            <div>
              <p className="mb-3 text-center text-[10px] uppercase tracking-[0.3em] text-[#8C6D1F]">
                Know More
              </p>
              <SectionHeading>
                Product Description
              </SectionHeading>
              <div className="whitespace-pre-line text-sm leading-8 text-[#2B2B2B]/70">
                {product.description}
              </div>
            </div>
          )}

          {/* SPECIFICATIONS */}

          {detailRows.length > 0 && (
            <div>
              <SectionHeading>
                Product Specifications
              </SectionHeading>

              <div className="divide-y divide-[#2B2B2B]/10 border-y border-[#2B2B2B]/10">
                {detailRows.map((row, index) => (
                  <div
                    key={`${row.label}-${index}`}
                    className="flex flex-col gap-1 py-4 text-sm transition-colors duration-300 hover:bg-[#D9B8AE]/10 sm:flex-row sm:items-center sm:justify-between sm:gap-6 motion-reduce:transition-none"
                  >
                    <span className="text-[#2B2B2B]/55">
                      {row.label}
                    </span>
                    <span className="break-words text-left text-[#2B2B2B] sm:text-right">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HIGHLIGHTS */}

          {product.highlights?.length ? (
            <div>
              <SectionHeading>
                Product Highlights
              </SectionHeading>

              <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-x-12 gap-y-5 sm:grid-cols-2">
                {product.highlights.map((highlight, index) => (
                  <li
                    key={`${highlight}-${index}`}
                    className="flex items-start gap-3 text-sm leading-7 text-[#2B2B2B]/75"
                  >
                    <Check
                      size={17}
                      className="mt-1 shrink-0 text-[#8C6D1F]"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* TAGS */}

          {product.tags?.length ? (
            <div>
              <SectionHeading>
                Product Tags
              </SectionHeading>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {product.tags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="inline-flex min-h-11 items-center justify-center border border-[#2B2B2B]/15 px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-[#2B2B2B]/65 transition-all duration-300 ease-out hover:border-[#C9A24B] hover:bg-[#D9B8AE]/15 hover:text-[#8C6D1F] motion-reduce:transition-none"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <ProductReviews
       slug={product.slug} />

      {/* FAQ */}

      {product.faq?.length ? (
        <section className="border-t border-[#2B2B2B]/10">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
            <SectionHeading>
              Frequently Asked Questions
            </SectionHeading>

            <div className="divide-y divide-[#2B2B2B]/10 border-y border-[#2B2B2B]/10">
              {product.faq.map((item, index) => (
                <details
                  key={`${item.question || "faq"}-${index}`}
                  className="group py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium transition-colors duration-300 hover:text-[#8C6D1F]">
                    {item.question || `Question ${index + 1}`}
                    <ChevronRight
                      size={17}
                      className="shrink-0 text-[#8C6D1F] transition-transform duration-300 group-open:rotate-90 motion-reduce:transition-none"
                    />
                  </summary>

                  {item.answer && (
                    <p className="mt-4 text-sm leading-7 text-[#2B2B2B]/65">
                      {item.answer}
                    </p>
                  )}
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* RELATED PRODUCTS */}

      {product.relatedProducts?.length ? (
        <section className="border-t border-[#2B2B2B]/10">
          <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
            <div className="mb-9 flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#8C6D1F]">
                  You May Also Like
                </p>
                <h2 className="font-serif text-3xl text-[#2B2B2B] sm:text-4xl">
                  Related Products
                </h2>
              </div>

              <Link
                href="/products"
                className="group hidden items-center gap-2 text-xs uppercase tracking-wider text-[#8C6D1F] transition-all duration-300 hover:gap-3 hover:text-[#2B2B2B] sm:inline-flex motion-reduce:transition-none"
              >
                View All
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
              {product.relatedProducts.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* FULLSCREEN IMAGE GALLERY */}

      {lightboxOpen && galleryImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Product image gallery"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-3 text-white transition-all duration-300 hover:rotate-90 hover:bg-white/25 motion-reduce:transition-none"
            aria-label="Close gallery"
          >
            <X size={22} />
          </button>

          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                changeImage(-1);
              }}
              className="absolute left-3 z-10 rounded-full bg-white/10 p-3 text-white transition-colors duration-300 hover:bg-white/25 sm:left-6 motion-reduce:transition-none"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <img
            src={galleryImages[activeImage]?.url}
            alt={galleryImages[activeImage]?.alt || product.name}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] max-w-[90vw] object-contain"
          />

          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                changeImage(1);
              }}
              className="absolute right-3 z-10 rounded-full bg-white/10 p-3 text-white transition-colors duration-300 hover:bg-white/25 sm:right-6 motion-reduce:transition-none"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <span className="absolute bottom-5 text-xs tracking-widest text-white/70">
            {activeImage + 1} / {galleryImages.length}
          </span>
        </div>
      )}
    </main>
  );
}
