import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import categoryService from "@/service/modules/category.service";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in";

export const instant = false;

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  bannerImage?: string | null;
  imageAlt?: string | null;
  productCount?: number;
  parentId?: number | null;
  depth?: number;
  updatedAt?: string;
};

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
    title: "Shop Jewellery by Category",
    description:
      "Explore NOORINE jewellery categories and discover elegant artificial jewellery for everyday wear and special occasions.",

    alternates: {
      canonical: `${SITE_URL}/categories`,
    },

    openGraph: {
      title: "Shop Jewellery by Category | NOORINE",
      description:
        "Discover elegant jewellery collections by category at NOORINE.",
      url: `${SITE_URL}/categories`,
      siteName: "NOORINE",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: "Shop Jewellery by Category | NOORINE",
      description:
        "Discover elegant jewellery collections by category at NOORINE.",
    },
  };
}

export default async function CategoriesPage() {
  const categories = await getCategories();

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
        name: "Categories",
        item: `${SITE_URL}/categories`,
      },
    ],
  };

  const categoryListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "NOORINE Jewellery Categories",
    numberOfItems: categories.length,
    itemListElement: categories.map((category, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: category.name,
      url: `${SITE_URL}/categories/${category.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={categoryListSchema} />

      {/* Page Header */}
      <section className="border-b border-[#2B2B2B]/10 px-4 py-14 text-center sm:py-20">
        <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#8C6D1F]">
          Explore NOORINE
        </p>

        <h1 className="font-serif text-4xl font-medium text-[#2B2B2B] sm:text-5xl">
          Shop By Category
        </h1>

        {/* <p className=" mt-4 max-w-xl text-sm leading-7 text-[#2B2B2B]/65">
          Find your perfect shine. Explore our jewellery categories
          and discover something beautiful for every occasion.
        </p> */}

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#2B2B2B]/55">
          <Link href="/" className="transition hover:text-[#8C6D1F]">
            Home
          </Link>

          <span>/</span>

          <span>Categories</span>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group block"
              >
                {/* Banner */}
                <div className="relative mb-20">
                  <div className="relative aspect-[16/8] overflow-hidden bg-[#D9B8AE]/20">
                    {category.bannerImage ? (
                      <img
                        src={category.bannerImage}
                        alt={
                          category.imageAlt ||
                          `${category.name} collection`
                        }
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-serif text-3xl text-[#8C6D1F]/50">
                          NOORINE
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
                  </div>

                  {/* Circular Category Image */}
                  <div className="absolute -bottom-16 left-1/2 h-32 w-32 -translate-x-1/2 overflow-hidden rounded-full border-[5px] border-[#FAF6EF] bg-[#FAF6EF] shadow-md sm:h-36 sm:w-36">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={
                          category.imageAlt ||
                          category.name
                        }
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#D9B8AE]/20">
                        <span className="font-serif text-2xl text-[#8C6D1F]">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Information */}
                <div className="px-3 text-center">
                  <h2 className="font-serif text-2xl font-medium text-[#2B2B2B] transition group-hover:text-[#8C6D1F]">
                    {category.name}
                  </h2>

                  {category.description && (
                    <p className="mx-auto mt-3 line-clamp-2 max-w-xs text-sm leading-6 text-[#2B2B2B]/60">
                      {category.description}
                    </p>
                  )}

                  {typeof category.productCount === "number" && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#8C6D1F]">
                      {category.productCount} Products
                    </p>
                  )}

                  <span className="mt-5 inline-flex items-center gap-2 border-b border-[#8C6D1F]/50 pb-1 text-[10px] uppercase tracking-[0.2em] text-[#2B2B2B] transition group-hover:gap-3 group-hover:text-[#8C6D1F]">
                    Explore Category
                    <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <h2 className="font-serif text-2xl text-[#2B2B2B]">
              Categories Coming Soon
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[#2B2B2B]/60">
              We are preparing our jewellery categories.
              Please check back soon.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 border-b border-[#8C6D1F] pb-1 text-xs uppercase tracking-widest text-[#8C6D1F]"
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
