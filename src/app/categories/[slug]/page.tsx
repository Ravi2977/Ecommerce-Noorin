
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import categoryService from "@/service/modules/category.service";
import productServerService from "@/service/modules/product.server.service";
import ProductCard from "@/components/product/ProductCard";
import JsonLd from "@/components/seo/JsonLd";

type AnyData = Record<string, any>;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in"
).replace(/\/+$/, "");

function getData(response: any): any {
  return response?.data ?? response ?? {};
}

// Fetch categories and find the requested category by slug
async function getCategory(slug: string): Promise<AnyData | null> {
  try {
    const response = await categoryService.getAllServer();
    const data = getData(response);

    const categories = Array.isArray(data)
      ? data
      : data?.content || data?.items || [];

    return (
      categories.find(
        (category: AnyData) => category.slug === slug
      ) || null
    );
  } catch (error) {
    console.error("Category loading failed:", error);
    return null;
  }
}

// Fetch products using category ID
async function getCategoryProducts(categoryId: number, page = 0) {
  try {
    const response = await productServerService.getAll({
      categoryId,
      page,
      size: 24,
    });

    const data = getData(response);

    return {
      products: data?.content || [],
      totalPages: Number(data?.totalPages || 0),
      totalElements: Number(data?.totalElements || 0),
      currentPage: Number(data?.page || 0),
    };
  } catch (error) {
    console.error("Category products loading failed:", error);

    return {
      products: [],
      totalPages: 0,
      totalElements: 0,
      currentPage: 0,
    };
  }
}

// Dynamic SEO Metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: "Category Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    category.seo?.title ||
    category.seoTitle ||
    category.metaTitle ||
    category.name;

  const description =
    category.seo?.description ||
    category.seoDescription ||
    category.metaDescription ||
    category.description ||
    `Explore ${category.name} collection at NOORINE.`;

  const categoryImage =
    category.bannerImage || category.image || undefined;

  return {
    title,
    description,

    alternates: {
      canonical: `/categories/${category.slug}`,
    },

    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/categories/${category.slug}`,
      images: categoryImage
        ? [{ url: categoryImage, alt: category.name }]
        : [],
    },

    twitter: {
      card: categoryImage ? "summary_large_image" : "summary",
      title,
      description,
      images: categoryImage ? [categoryImage] : [],
    },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const parsedPage = Number(query.page || 0);

  const requestedPage =
    Number.isInteger(parsedPage) && parsedPage >= 0
      ? parsedPage
      : 0;

  const result = await getCategoryProducts(
    category.id,
    requestedPage
  );

  const products = result.products;

  const categoryUrl = `${SITE_URL}/categories/${category.slug}`;

  const bannerImage = category.bannerImage || null;
  const categoryImage = category.image || null;

  // Breadcrumb Schema
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
        name: category.name,
        item: categoryUrl,
      },
    ],
  };

  // Product Listing Schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    numberOfItems: result.totalElements,
    itemListElement: products.map(
      (product: AnyData, index: number) => ({
        "@type": "ListItem",
        position: requestedPage * 24 + index + 1,
        url: `${SITE_URL}/products/${product.slug}`,
        name: product.name,
      })
    ),
  };

  // Category Page Schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description || undefined,
    url: categoryUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "NOORINE",
      url: SITE_URL,
    },
    mainEntity: itemListSchema,
  };

  return (
    <main className="min-h-screen overflow-x-clip bg-[#FAF6EF] text-[#2B2B2B]">

      {/* JSON-LD SCHEMAS */}
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionPageSchema} />

      {/* BREADCRUMB NAVIGATION */}
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-6 sm:px-8 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-[#77716A]"
        >
          <Link
            href="/"
            className="transition-colors hover:text-[#8C6D1F]"
          >
            Home
          </Link>

          <span>/</span>

          <span className="text-[#2B2B2B]">
            {category.name}
          </span>
        </nav>
      </div>

      {/* =========================================
          CATEGORY COVER + OVERLAPPING IMAGE
      ========================================= */}

      <section className="mx-auto w-full max-w-[1440px] px-5 pt-7 sm:px-8 lg:px-10">

        {/* Banner with overlapping circular image */}
        {bannerImage ? (
          <div className="relative mb-16 sm:mb-20">

            {/* Cover Banner */}
            <div className="relative aspect-[16/7] w-full overflow-hidden border border-[#E5DED4] bg-[#F0E8DE] sm:aspect-[16/5] lg:aspect-[16/4.5]">
              <img
                src={bannerImage}
                alt={`${category.name} banner`}
                className="h-full w-full object-cover object-center"
                loading="eager"
              />
            </div>

            {/* Circular Category Image */}
            {categoryImage && (
              <div className="absolute -bottom-16 left-1/2 z-10 h-32 w-32 -translate-x-1/2 overflow-hidden rounded-full border-[5px] border-[#FAF6EF] bg-white shadow-[0_4px_20px_rgba(43,43,43,0.12)] sm:-bottom-20 sm:h-40 sm:w-40">
                <img
                  src={categoryImage}
                  alt={category.imageAlt || category.name}
                  className="h-full w-full rounded-full object-cover object-center"
                  loading="eager"
                />
              </div>
            )}

          </div>
        ) : (
          /* Fallback when banner is not available */
          categoryImage && (
            <div className="flex justify-center py-5">
              <div className="h-32 w-32 overflow-hidden rounded-full border-[5px] border-white bg-white shadow-md sm:h-40 sm:w-40">
                <img
                  src={categoryImage}
                  alt={category.imageAlt || category.name}
                  className="h-full w-full rounded-full object-cover object-center"
                  loading="eager"
                />
              </div>
            </div>
          )
        )}

        {/* CATEGORY DETAILS */}
        <div className="px-2 pb-10 text-center">

          <h1 className="font-serif text-4xl leading-tight text-[#2B2B2B] sm:text-5xl lg:text-6xl">
            {category.name}
          </h1>

          {category.description && (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#77716A] sm:text-base lg:text-lg">
              {category.description}
            </p>
          )}

          <span className="mx-auto mt-6 block h-px w-32 bg-[#C9A24B]" />

        </div>
      </section>

      {/* =========================================
          CATEGORY PRODUCTS
      ========================================= */}

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20">

        {/* Product Count */}
        <div className="mb-7 flex items-center justify-between border-b border-[#E5DED4] pb-4">
          <p className="text-xs tracking-wide text-[#77716A]">
            {result.totalElements} Products
          </p>

          <p className="text-xs uppercase tracking-widest text-[#8C6D1F]">
            {category.name}
          </p>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-10">
            {products.map(
              (product: AnyData, index: number) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 4}
                />
              )
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h2 className="font-serif text-2xl text-[#2B2B2B]">
              No Products Found
            </h2>

            <p className="mt-3 text-sm text-[#77716A]">
              There are currently no products in this category.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex border border-[#2B2B2B] px-7 py-3 text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-[#2B2B2B] hover:text-white"
            >
              Explore All Products
            </Link>
          </div>
        )}

        {/* PAGINATION */}
        {result.totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">

            {requestedPage > 0 && (
              <Link
                href={`/categories/${category.slug}?page=${requestedPage - 1}`}
                className="border border-[#D9CFC3] px-5 py-3 text-xs uppercase tracking-widest transition-colors hover:border-[#C9A24B]"
              >
                Previous
              </Link>
            )}

            <span className="text-xs text-[#77716A]">
              Page {requestedPage + 1} of {result.totalPages}
            </span>

            {requestedPage + 1 < result.totalPages && (
              <Link
                href={`/categories/${category.slug}?page=${requestedPage + 1}`}
                className="border border-[#D9CFC3] px-5 py-3 text-xs uppercase tracking-widest transition-colors hover:border-[#C9A24B]"
              >
                Next
              </Link>
            )}

          </div>
        )}

      </section>
    </main>
  );
}
