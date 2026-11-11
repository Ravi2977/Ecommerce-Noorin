import type { MetadataRoute } from "next";

import productService from "@/service/modules/product.service";
import categoryService from "@/service/modules/category.service";
import collectionService from "@/service/modules/collection.service";
import pageService from "@/service/modules/page.service";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in";

type SitemapItem = {
  url: string;
  lastModified?: string | Date;
};

function getLastModified(value?: string | Date | null) {
  if (!value) return new Date();

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function getDynamicUrls(): Promise<SitemapItem[]> {
  const urls: SitemapItem[] = [];

  try {
    const response = await productService.getAllServer({
      page: 0,
      size: 100,
    });

    const products = response?.content || [];

    products.forEach((product: any) => {
      if (product.slug) {
        urls.push({
          url: `${SITE_URL}/products/${product.slug}`,
          lastModified: getLastModified(product.updatedAt),
        });
      }
    });
  } catch (error) {
    console.error("Sitemap products fetch failed:", error);
  }

  try {
    const response = await categoryService.getAllServer();
    const categories = Array.isArray(response) ? response : [];

    categories.forEach((category: any) => {
      if (category.slug) {
        urls.push({
          url: `${SITE_URL}/categories/${category.slug}`,
          lastModified: getLastModified(category.updatedAt),
        });
      }
    });
  } catch (error) {
    console.error("Sitemap categories fetch failed:", error);
  }

  try {
    const response = await collectionService.getAllServer();
    const collections = Array.isArray(response) ? response : [];

    collections.forEach((collection: any) => {
      if (collection.slug) {
        urls.push({
          url: `${SITE_URL}/collections/${collection.slug}`,
          lastModified: getLastModified(collection.updatedAt),
        });
      }
    });
  } catch (error) {
    console.error("Sitemap collections fetch failed:", error);
  }

  try {
    const response = await pageService.getAllServer();
    const pages = Array.isArray(response) ? response : [];

    pages.forEach((page: any) => {
      if (page.slug) {
        urls.push({
          url: `${SITE_URL}/pages/${page.slug}`,
          lastModified: getLastModified(page.lastUpdated),
        });
      }
    });
  } catch (error) {
    console.error("Sitemap pages fetch failed:", error);
  }

  return urls;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const dynamicUrls = await getDynamicUrls();

  return [
    ...staticUrls,
    ...dynamicUrls.map((item) => ({
      url: item.url,
      lastModified: item.lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
