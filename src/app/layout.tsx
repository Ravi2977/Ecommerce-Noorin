
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";

import "./globals.css";

import { cn } from "@/lib/utils";
import storeServerService from "@/service/modules/store.server.service";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";

type StoreConfig = {
  name?: string;

  seo?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };

  store?: {
    logoUrl?: string;
    faviconUrl?: string;
    tagline?: string;
    supportEmail?: string;
    supportPhone?: string;
    whatsappNumber?: string;
    address?: string;
    businessHours?: string;
    footerText?: string;
  };

  announcement?: {
    text?: string;
    link?: string;
  };

  pages?: unknown[];
  paymentIcons?: string[];
  socialLinks?: Record<string, string>;
};

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in"
).replace(/\/+$/, "");

async function getStoreConfig(): Promise<StoreConfig> {
  try {
    const response = await storeServerService.getConfigServer();
    return response?.data ?? response ?? {};
  } catch (error) {
    console.error("Store config loading failed:", error);
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStoreConfig();

  const seoTitle = config.seo?.title || "NOORINE | Everyday Shine";

  const seoDescription =
    config.seo?.description ||
    "Discover elegant everyday jewellery at NOORINE.";

  const seoImage = config.seo?.imageUrl;
  const storeName = config.name || "NOORINE";

  return {
    metadataBase: new URL(SITE_URL),

    title: {
      default: seoTitle,
      template: `%s | ${storeName}`,
    },

    description: seoDescription,
    applicationName: storeName,

    alternates: {
      canonical: "/",
    },

    icons: {
      icon: config.store?.faviconUrl || undefined,
      shortcut: config.store?.faviconUrl || undefined,
      apple: config.store?.faviconUrl || undefined,
    },

    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: storeName,
      title: seoTitle,
      description: seoDescription,
      images: seoImage
        ? [
            {
              url: seoImage,
              alt: storeName,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: seoImage ? [seoImage] : [],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const config = await getStoreConfig();

  const store = config.store;
  const storeName = config.name || "NOORINE";

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: SITE_URL,

    ...(store?.logoUrl && {
      logo: store.logoUrl,
    }),

    ...(config.seo?.description && {
      description: config.seo.description,
    }),

    ...(store?.supportEmail && {
      email: store.supportEmail,
    }),

    ...(store?.supportPhone && {
      telephone: store.supportPhone,
    }),

    ...(store?.address && {
      address: store.address,
    }),

    ...(store?.whatsappNumber && {
      contactPoint: {
        "@type": "ContactPoint",
        telephone: `+${store.whatsappNumber}`,
        contactType: "customer support",
        ...(store.supportEmail && {
          email: store.supportEmail,
        }),
      },
    }),

    ...(config.socialLinks &&
      Object.keys(config.socialLinks).length > 0 && {
        sameAs: Object.values(config.socialLinks).filter(Boolean),
      }),
  };

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: storeName,
      url: SITE_URL,
    },
  };

  return (
    <html lang="en" className={cn("min-h-full")}>
      <body className="flex min-h-screen flex-col bg-[#FAF6EF] font-sans text-[#2B2B2B]">
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />

        <Header config={config} />

        <main className="flex-1">{children}</main>

        <Footer config={config} />
      </body>
    </html>
  );
}
