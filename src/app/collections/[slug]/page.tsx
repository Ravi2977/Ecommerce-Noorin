
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import collectionService from "@/service/modules/collection.service";
import ProductCard from "@/components/product/ProductCard";
import JsonLd from "@/components/seo/JsonLd";

type AnyData = Record<string, any>;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in"
).replace(/\/+$/, "");

function getData(response: any): any {
  return response?.data ?? response ?? {};
}

// Fetch collection details and its products
async function getCollection(slug: string, page = 0) {
  try {
    const response = await collectionService.getBySlugServer(
      slug,
      {
        page,
        size: 24,
      }
    );

    return getData(response);
  } catch (error) {
    console.error("Collection loading failed:", error);
    return null;
  }
}

// Dynamic SEO Metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);

  if (!collection) {
    return {
      title: "Collection Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    collection.seo?.title ||
    collection.seoTitle ||
    collection.metaTitle ||
    collection.name;

  const description =
    collection.seo?.description ||
    collection.seoDescription ||
    collection.metaDescription ||
    collection.description ||
    `Explore ${collection.name} collection at NOORINE.`;

  const image =
    collection.bannerImage ||
    collection.image ||
    undefined;

  return {
    title,
    description,

    alternates: {
      canonical: `/collections/${collection.slug}`,
    },

    openGraph: {
      type: "website",
      title,
      description,
      url: `${SITE_URL}/collections/${collection.slug}`,
      images: image
        ? [{ url: image, alt: collection.name }]
        : [],
    },

    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const parsedPage = Number(query.page || 0);

  const requestedPage =
    Number.isInteger(parsedPage) && parsedPage >= 0
      ? parsedPage
      : 0;

  const collection = await getCollection(slug, requestedPage);

  if (!collection) {
    notFound();
  }

  // Collection products pagination
  const productData = collection.products || {};

  const products = Array.isArray(productData)
    ? productData
    : productData.content || [];

  const totalPages = Number(productData.totalPages || 0);
  const totalElements = Number(
    productData.totalElements ?? collection.productCount ?? products.length
  );

  const collectionUrl =
    `${SITE_URL}/collections/${collection.slug}`;

  const bannerImage = collection.bannerImage || null;
  const collectionImage = collection.image || null;

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
        name: collection.name,
        item: collectionUrl,
      },
    ],
  };

  // Collection Product List Schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: collection.name,
    numberOfItems: totalElements,
    itemListElement: products.map(
      (product: AnyData, index: number) => ({
        "@type": "ListItem",
        position: requestedPage * 24 + index + 1,
        name: product.name,
        url: `${SITE_URL}/products/${product.slug}`,
      })
    ),
  };

  // Collection Page Schema
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: collection.name,
    description: collection.description || undefined,
    url: collectionUrl,

    ...(collectionImage && {
      image: collectionImage,
    }),

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

      {/* BREADCRUMB */}
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
            {collection.name}
          </span>
        </nav>
      </div>

      {/* COLLECTION COVER */}
      <section className="mx-auto w-full max-w-[1440px] px-5 pt-7 sm:px-8 lg:px-10">

        {bannerImage ? (
          <div className="relative mb-16 sm:mb-20">

            {/* Banner Image */}
            <div className="relative aspect-[16/7] w-full overflow-hidden border border-[#E5DED4] bg-[#F0E8DE] sm:aspect-[16/5] lg:aspect-[16/4.5]">
              <img
                src={bannerImage}
                alt={`${collection.name} banner`}
                className="h-full w-full object-cover object-center"
                loading="eager"
              />
            </div>

            {/* Circular Collection Image */}
            {collectionImage && (
              <div className="absolute -bottom-16 left-1/2 z-10 h-32 w-32 -translate-x-1/2 overflow-hidden rounded-full border-[5px] border-[#FAF6EF] bg-white shadow-[0_4px_20px_rgba(43,43,43,0.12)] sm:-bottom-20 sm:h-40 sm:w-40">
                <img
                  src={collectionImage}
                  alt={collection.name}
                  className="h-full w-full rounded-full object-cover object-center"
                  loading="eager"
                />
              </div>
            )}

          </div>
        ) : (
          collectionImage && (
            <div className="flex justify-center py-5">
              <div className="h-32 w-32 overflow-hidden rounded-full border-[5px] border-white bg-white shadow-md sm:h-40 sm:w-40">
                <img
                  src={collectionImage}
                  alt={collection.name}
                  className="h-full w-full rounded-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          )
        )}

        {/* COLLECTION DETAILS */}
        <div className="px-2 pb-10 text-center">

          <h1 className="font-serif text-4xl leading-tight text-[#2B2B2B] sm:text-5xl lg:text-6xl">
            {collection.name}
          </h1>

          {collection.description && (
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#77716A] sm:text-base lg:text-lg">
              {collection.description}
            </p>
          )}

          <span className="mx-auto mt-6 block h-px w-32 bg-[#C9A24B]" />

          {collection.endsAt && (
            <p className="mt-4 text-xs text-[#8C6D1F]">
              Collection ends:{" "}
              {new Date(collection.endsAt).toLocaleDateString("en-IN")}
            </p>
          )}

        </div>
      </section>

      {/* COLLECTION PRODUCTS */}
      <section className="mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20">

        <div className="mb-7 flex items-center justify-between border-b border-[#E5DED4] pb-4">
          <p className="text-xs tracking-wide text-[#77716A]">
            {totalElements} Products
          </p>

          <p className="text-xs uppercase tracking-widest text-[#8C6D1F]">
            {collection.name}
          </p>
        </div>

        {/* PRODUCT GRID */}
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
              There are currently no products in this collection.
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
        {totalPages > 1 && (
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">

            {requestedPage > 0 && (
              <Link
                href={`/collections/${collection.slug}?page=${requestedPage - 1}`}
                className="border border-[#D9CFC3] px-5 py-3 text-xs uppercase tracking-widest transition-colors hover:border-[#C9A24B]"
              >
                Previous
              </Link>
            )}

            <span className="text-xs text-[#77716A]">
              Page {requestedPage + 1} of {totalPages}
            </span>

            {requestedPage + 1 < totalPages && (
              <Link
                href={`/collections/${collection.slug}?page=${requestedPage + 1}`}
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
