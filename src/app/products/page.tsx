
import Link from "next/link";
import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";

import productServerService from "@/service/modules/product.server.service";
import categoryService from "@/service/modules/category.service";
import JsonLd from "@/components/seo/JsonLd";
import ProductCard from "@/components/product/ProductCard";

export const instant = false;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in";

const PAGE_SIZE = 24;

type SearchParams = {
  search?: string;
  categoryId?: string;
  onSale?: string;
  sort?: string;
  page?: string;
};

type Product = {
  id: number;
  slug: string;
  name: string;
  price: number;
  currency?: string;
  images?: unknown[];
  imageDetails?: unknown[];
  inStock?: boolean;
  comingSoon?: boolean;
  category?: {
    id?: number;
    name?: string;
    slug?: string;
  };
  rating?: {
    average?: number | null;
    count?: number;
  };
  averageRating?: number | null;
  reviewCount?: number;
  [key: string]: unknown;
};

type ProductResponse = {
  content?: Product[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

type Category = {
  id: number;
  name: string;
  slug: string;
};

function getQueryValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function getProducts(params: SearchParams) {
  const page = Math.max(0, Number(params.page || 0) || 0);

  const apiParams: Record<string, string | number | boolean> = {
    page,
    size: PAGE_SIZE,
    sort: params.sort || "recommended",
  };

  if (params.search?.trim()) {
    apiParams.search = params.search.trim();
  }

  if (params.categoryId) {
    apiParams.categoryId = params.categoryId;
  }

  if (params.onSale === "true") {
    apiParams.onSale = true;
  }

  try {
const response = await productServerService.getAll(apiParams);
    return response as ProductResponse;
  } catch (error) {
    console.error("Products fetch failed:", error);

    return {
      content: [],
      page,
      totalElements: 0,
      totalPages: 0,
    };
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const response = await categoryService.getAllServer();

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Categories fetch failed:", error);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shop All Jewellery",
    description:
      "Explore the complete NOORINE jewellery collection. Discover elegant artificial jewellery for everyday style and special occasions.",

    alternates: {
      canonical: `${SITE_URL}/products`,
    },

    openGraph: {
      title: "Shop All Jewellery | NOORINE",
      description:
        "Explore elegant artificial jewellery from NOORINE.",
      url: `${SITE_URL}/products`,
      siteName: "NOORINE",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: "Shop All Jewellery | NOORINE",
      description:
        "Explore elegant artificial jewellery from NOORINE.",
    },
  };
}

function buildPageUrl(
  currentParams: SearchParams,
  page: number
) {
  const query = new URLSearchParams();

  if (currentParams.search) {
    query.set("search", currentParams.search);
  }

  if (currentParams.categoryId) {
    query.set("categoryId", currentParams.categoryId);
  }

  if (currentParams.onSale) {
    query.set("onSale", currentParams.onSale);
  }

  if (currentParams.sort) {
    query.set("sort", currentParams.sort);
  }

  query.set("page", String(page));

  return `/products?${query.toString()}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const rawParams = await searchParams;

  const params: SearchParams = {
    search: getQueryValue(rawParams.search),
    categoryId: getQueryValue(rawParams.categoryId),
    onSale: getQueryValue(rawParams.onSale),
    sort: getQueryValue(rawParams.sort),
    page: getQueryValue(rawParams.page),
  };

  const [productResponse, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);

  const products = productResponse?.content || [];
  const currentPage = productResponse?.page ?? 0;
  const totalPages = productResponse?.totalPages ?? 0;
  const totalElements = productResponse?.totalElements ?? 0;

  const selectedCategory = categories.find(
    (category) => String(category.id) === params.categoryId
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${SITE_URL}/products`,
      },
    ],
  };

  const productListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "NOORINE Jewellery Collection",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/products/${product.slug}`,
      name: product.name,
    })),
  };

  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={productListSchema} />

      {/* Page Header */}
      <section className="border-b border-[#2B2B2B]/10 px-4 py-12 text-center sm:py-16">
        <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#8C6D1F]">
          Discover NOORINE
        </p>

        <h1 className="font-serif text-4xl font-medium text-[#2B2B2B] sm:text-5xl">
          {selectedCategory?.name || "Shop All Jewellery"}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#2B2B2B]/65">
          Discover jewellery that adds a touch of elegance to
          every moment.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#2B2B2B]/55">
          <Link href="/" className="hover:text-[#8C6D1F]">
            Home
          </Link>

          <span>/</span>

          <span>Products</span>

          {selectedCategory && (
            <>
              <span>/</span>
              <span>{selectedCategory.name}</span>
            </>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">
        <form
          action="/products"
          method="GET"
          className="mb-8 flex flex-col gap-4 border-b border-[#2B2B2B]/10 pb-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2B2B2B]/45"
              />

              <input
                type="search"
                name="search"
                defaultValue={params.search || ""}
                placeholder="Search jewellery..."
                className="h-11 w-full border border-[#2B2B2B]/15 bg-transparent pl-10 pr-3 text-sm outline-none transition focus:border-[#8C6D1F]"
              />
            </div>

            {/* Category */}
            <select
              name="categoryId"
              defaultValue={params.categoryId || ""}
              className="h-11 min-w-[160px] border border-[#2B2B2B]/15 bg-[#FAF6EF] px-3 text-sm outline-none focus:border-[#8C6D1F]"
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Sale Filter */}
            <label className="flex h-11 items-center gap-2 border border-[#2B2B2B]/15 px-3 text-sm">
              <input
                type="checkbox"
                name="onSale"
                value="true"
                defaultChecked={params.onSale === "true"}
                className="accent-[#8C6D1F]"
              />
              On Sale
            </label>

            {/* Reset pagination on new filter */}
            <input type="hidden" name="page" value="0" />

            {/* Apply Filters */}
            <button
              type="submit"
              className="flex h-11 items-center gap-2 bg-[#2B2B2B] px-5 text-xs uppercase tracking-wider text-white transition hover:bg-[#8C6D1F]"
            >
              <SlidersHorizontal size={14} />
              Apply
            </button>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-xs text-[#2B2B2B]/60">
              {totalElements} Products
            </span>

            <select
              name="sort"
              defaultValue={params.sort || "recommended"}
              className="h-11 min-w-[175px] border border-[#2B2B2B]/15 bg-transparent px-3 text-sm outline-none focus:border-[#8C6D1F]"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">
                Price: Low to High
              </option>
              <option value="price_desc">
                Price: High to Low
              </option>
            </select>
          </div>
        </form>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-7">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <h2 className="font-serif text-2xl text-[#2B2B2B]">
              No products found
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[#2B2B2B]/60">
              We couldn&apos;t find products matching your selection.
              Try changing your search or filters.
            </p>

            <Link
              href="/products"
              className="mt-6 border-b border-[#8C6D1F] pb-1 text-xs uppercase tracking-widest text-[#8C6D1F]"
            >
              Clear Filters
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="Products pagination"
            className="mt-14 flex items-center justify-center gap-5"
          >
            {currentPage > 0 ? (
              <Link
                href={buildPageUrl(params, currentPage - 1)}
                className="border-b border-[#8C6D1F] pb-1 text-xs uppercase tracking-wider text-[#2B2B2B]"
              >
                Previous
              </Link>
            ) : (
              <span className="text-xs uppercase tracking-wider text-[#2B2B2B]/30">
                Previous
              </span>
            )}

            <span className="text-sm text-[#2B2B2B]/65">
              {currentPage + 1} / {totalPages}
            </span>

            {currentPage + 1 < totalPages ? (
              <Link
                href={buildPageUrl(params, currentPage + 1)}
                className="border-b border-[#8C6D1F] pb-1 text-xs uppercase tracking-wider text-[#2B2B2B]"
              >
                Next
              </Link>
            ) : (
              <span className="text-xs uppercase tracking-wider text-[#2B2B2B]/30">
                Next
              </span>
            )}
          </nav>
        )}
      </section>
    </main>
  );
}
