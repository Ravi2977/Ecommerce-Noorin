import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import collectionService from "@/service/modules/collection.service";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in";

export const instant = false;

type Collection = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  productCount?: number;
  showOnHome?: boolean;
  endsAt?: string | null;
  updatedAt?: string;
  seo?: {
    title?: string;
    description?: string;
    noIndex?: boolean;
  };
};

async function getCollections(): Promise<Collection[]> {
  try {
    const response = await collectionService.getAllServer();

    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error("Collections fetch failed:", error);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shop Jewellery Collections",
    description:
      "Explore NOORINE jewellery collections. Discover elegant artificial jewellery for weddings, celebrations and everyday styling.",

    alternates: {
      canonical: `${SITE_URL}/collections`,
    },

    openGraph: {
      title: "Jewellery Collections | NOORINE",
      description:
        "Discover elegant jewellery collections at NOORINE.",
      url: `${SITE_URL}/collections`,
      siteName: "NOORINE",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: "Jewellery Collections | NOORINE",
      description:
        "Discover elegant jewellery collections at NOORINE.",
    },
  };
}

function formatDate(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function CollectionsPage() {
  const collections = await getCollections();

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
        name: "Collections",
        item: `${SITE_URL}/collections`,
      },
    ],
  };

  const collectionListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "NOORINE Jewellery Collections",
    numberOfItems: collections.length,
    itemListElement: collections.map((collection, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: collection.name,
      url: `${SITE_URL}/collections/${collection.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionListSchema} />

      {/* ================= PAGE HEADER ================= */}
      <section className="w-full border-b border-[#2B2B2B]/10 px-4 py-16 text-center sm:py-20 lg:py-24">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center">

          <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.4em] text-[#8C6D1F]">
            Curated For You
          </p>

          <h1 className="w-full text-center font-serif text-4xl font-medium leading-tight text-[#2B2B2B] sm:text-5xl lg:text-6xl">
            Our Collections
          </h1>

          <nav
            aria-label="Breadcrumb"
            className="mt-8 flex items-center justify-center gap-3 text-xs text-[#2B2B2B]/55"
          >
            <Link
              href="/"
              className="transition hover:text-[#8C6D1F]"
            >
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <span className="text-[#2B2B2B]">
              Collections
            </span>
          </nav>
        </div>
      </section>

      {/* ================= COLLECTION GRID ================= */}
      <section className="mx-auto w-full max-w-[1500px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">

        {collections.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">

            {collections.map((collection) => {
              const displayImage =
                collection.bannerImage || collection.image;

              const formattedEndDate = formatDate(
                collection.endsAt
              );

              return (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug}`}
                  className="group block"
                >
                  {/* Collection Image */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#D9B8AE]/20">

                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={`${collection.name} collection`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-serif text-4xl text-[#8C6D1F]/50">
                          NOORINE
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/10 transition-colors duration-500 group-hover:bg-black/20" />

                    {/* Collection Image Label */}
                    <div className="absolute bottom-5 left-5 right-5 text-center">
                      <span className="inline-block bg-[#FAF6EF]/95 px-5 py-2 font-serif text-lg text-[#2B2B2B]">
                        {collection.name}
                      </span>
                    </div>
                  </div>

                  {/* Collection Details */}
                  <div className="flex flex-col items-center px-3 pt-6 text-center">

                    <h2 className="font-serif text-2xl font-medium text-[#2B2B2B] transition-colors duration-300 group-hover:text-[#8C6D1F]">
                      {collection.name}
                    </h2>

                    {collection.description && (
                      <p className="mt-3 line-clamp-2 max-w-md text-center text-sm leading-6 text-[#2B2B2B]/60">
                        {collection.description}
                      </p>
                    )}

                    {typeof collection.productCount === "number" && (
                      <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#8C6D1F]">
                        {collection.productCount} Products
                      </p>
                    )}

                    {formattedEndDate && (
                      <p className="mt-2 text-xs text-[#2B2B2B]/50">
                        Available until {formattedEndDate}
                      </p>
                    )}

                    <span className="mt-5 inline-flex items-center justify-center gap-2 border-b border-[#8C6D1F]/50 pb-1 text-[10px] uppercase tracking-[0.2em] text-[#2B2B2B] transition-all duration-300 group-hover:gap-3 group-hover:text-[#8C6D1F]">
                      Explore Collection
                      <ArrowRight size={13} />
                    </span>

                  </div>
                </Link>
              );
            })}

          </div>
        ) : (
          <div className="flex min-h-[350px] flex-col items-center justify-center text-center">

            <h2 className="font-serif text-3xl text-[#2B2B2B]">
              Collections Coming Soon
            </h2>

            <p className="mx-auto mt-4 max-w-md text-center text-sm leading-7 text-[#2B2B2B]/60">
              Our jewellery collections are being prepared.
              Please check back soon.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex items-center justify-center gap-2 border-b border-[#8C6D1F] pb-1 text-xs uppercase tracking-widest text-[#8C6D1F]"
            >
              Explore Products
              <ArrowRight size={14} />
            </Link>

          </div>
        )}
      </section>
    </main>
  );
}
