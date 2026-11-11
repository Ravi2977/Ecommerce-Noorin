import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import productServerService from "@/service/modules/product.server.service";
import ProductDetailClient, { type Product } from "./ProductDetailClient";

export const instant = false;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in").replace(/\/+$/, "");

type ProductImage = string | { url?: string; imageUrl?: string; src?: string; alt?: string };

async function getProduct(slug: string): Promise<Product | null> {
  try {
const response = await productServerService.getBySlug(slug);
    const product = response?.data ?? response ?? null;
    if (!product || typeof product !== "object" || !("id" in product) || !("slug" in product)) return null;
    return product as Product;
  } catch (error) {
    console.error("Product fetch failed:", error);
    return null;
  }
}

function getProductImages(product: Product) {
  const seen = new Set<string>();
  return [...(product.images || []), ...(product.imageDetails || [])]
    .map((item) => {
      const url = typeof item === "string" ? item : item.url || item.imageUrl || item.src;
      return url ? { url, alt: typeof item === "string" ? product.name : item.alt || product.name } : null;
    })
    .filter((item): item is { url: string; alt: string } => Boolean(item?.url) && !seen.has(item!.url) && Boolean(seen.add(item!.url)));
}

function canonicalUrl(product: Product) {
  if (product.seo?.canonicalUrl) {
    try {
      const parsed = new URL(product.seo.canonicalUrl, SITE_URL);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.toString();
    } catch {
      // Fall back to the canonical product route.
    }
  }
  return `${SITE_URL}/products/${product.slug}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await productServerService.getBySlug(slug);
  if (!product) return { title: "Product Not Found", robots: { index: false, follow: false } };

  const title = product.seo?.title || product.name;
  const description = product.seo?.description || product.shortDescription || product.description || `Explore ${product.name} at NOORINE.`;
  const images = getProductImages(product);
  const socialImages = product.seo?.image ? [product.seo.image] : images.map((image) => image.url);
  const keywords = product.seo?.keywords;
  const canonical = canonicalUrl(product);

  return {
    title,
    description,
    keywords: Array.isArray(keywords) ? keywords : typeof keywords === "string" ? keywords.split(",").map((item) => item.trim()) : undefined,
    alternates: { canonical },
    robots: product.seo?.noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: { type: "website", title, description, url: canonical, siteName: "NOORINE", images: socialImages.map((url) => ({ url, alt: product.name })) },
    twitter: { card: socialImages.length ? "summary_large_image" : "summary", title, description, images: socialImages.length ? socialImages : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  if (product.requestedSlugIsCurrent === false && product.slug !== slug) permanentRedirect(`/products/${product.slug}`);

  const images = getProductImages(product);
  const canonical = canonicalUrl(product);
  const priceAvailable = typeof product.price === "number" && Number.isFinite(product.price) && product.price >= 0;
  const stockSchema = product.comingSoon
    ? "https://schema.org/PreOrder"
    : product.inStock === false || (typeof product.stockQuantity === "number" && product.stockQuantity <= 0)
      ? "https://schema.org/OutOfStock"
      : product.inStock === true
        ? "https://schema.org/InStock"
        : undefined;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seo?.description || product.shortDescription || product.description || undefined,
    sku: product.sku || undefined,
    gtin: product.gtin || undefined,
    mpn: product.mpn || undefined,
    url: canonical,
    image: images.length ? images.map((image) => image.url) : product.seo?.image || undefined,
    category: product.category?.name || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    ...(priceAvailable ? {
      offers: {
        "@type": "Offer",
        url: canonical,
        price: product.price,
        priceCurrency: product.currency || "INR",
        ...(stockSchema ? { availability: stockSchema } : {}),
        itemCondition: "https://schema.org/NewCondition",
      },
    } : {}),
    ...(typeof product.rating?.average === "number" && product.rating.average > 0 && typeof product.rating.count === "number" && product.rating.count > 0 ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count },
    } : {}),
  };

  const categoryPath = product.category?.path?.length ? product.category.path : product.category ? [product.category] : [];
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    ...categoryPath.map((category, index) => ({ "@type": "ListItem", position: index + 2, name: category.name, item: `${SITE_URL}/categories/${category.slug}` })),
    { "@type": "ListItem", position: categoryPath.length + 2, name: product.name, item: canonical },
  ];
  const breadcrumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbItems };

  return <>
    <JsonLd data={productSchema} />
    <JsonLd data={breadcrumbSchema} />
    <ProductDetailClient product={product} />
  </>;
}
