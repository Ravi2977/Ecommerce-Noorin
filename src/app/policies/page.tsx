
import Link from "next/link";
import type { Metadata } from "next";

import pageService from "@/service/modules/page.service";

export const metadata: Metadata = {
  title: "Policies & Information | NOORINE",
  description:
    "Read NOORINE's terms and conditions, privacy, shipping, return, refund and cancellation policies.",
  alternates: {
    canonical: "https://noorine.in/policies",
  },
};

type CmsPage = {
  slug: string;
  title: string;
  showInFooter?: boolean;
  type?: string;
  footerGroup?: string;
  lastUpdated?: string;
};

type AnyData = Record<string, any>;

function getData(response: any): any {
  return response?.data ?? response ?? {};
}

const GROUPS = [
  {
    key: "POLICIES",
    title: "Policies",
    description: "Everything you need to know before and after shopping with us.",
  },
  {
    key: "COMPANY",
    title: "Our Company",
    description: "Get to know more about NOORINE.",
  },
  {
    key: "HELP",
    title: "Help & Support",
    description: "We're here to help with your questions.",
  },
];

async function getPages(): Promise<CmsPage[]> {
  try {
    const response = await pageService.getAllServer();
    const data = getData(response);

    const pages = Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
        ? data.content
        : [];

    return pages.filter(
      (page: CmsPage) =>
        page?.slug &&
        page?.title &&
        page.showInFooter !== false
    );
  } catch (error) {
    console.error("CMS pages fetch failed:", error);
    return [];
  }
}

function formatDate(date?: string) {
  if (!date) return null;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

export default async function PoliciesPage() {
  const pages = await getPages();

  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      {/* Page Header */}
      <section className="border-b border-[#2B2B2B]/10 px-5 py-12 text-center sm:py-16">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.35em] text-[#8C6D1F]">
          NOORINE · EVERYDAY SHINE
        </p>

        <h1 className="font-serif text-4xl font-medium text-[#2B2B2B] sm:text-5xl">
          Policies & Information
        </h1>

        <p className="mx-auto mt-4 text-sm leading-7 text-[#2B2B2B]/65">
          Everything you need to know about shopping with NOORINE.
          Your trust and satisfaction matter to us.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#2B2B2B]/55">
          <Link href="/" className="transition hover:text-[#8C6D1F]">
            Home
          </Link>
          <span>/</span>
          <span>Policies</span>
        </div>

        <span className="mx-auto mt-7 block h-px w-16 bg-[#C9A24B]" />
      </section>

      {/* CMS Pages */}
      <section className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        {pages.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="font-serif text-3xl text-[#2B2B2B]">
              Information unavailable
            </h2>
            <p className="mt-3 text-sm text-[#2B2B2B]/60">
              We're unable to load this information right now.
              Please try again later.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {GROUPS.map((group) => {
              const groupPages = pages.filter(
                (page) => page.footerGroup === group.key
              );

              if (!groupPages.length) return null;

              return (
                <section key={group.key}>
                  <div className="mb-7">
                    <h2 className="font-serif text-3xl text-[#2B2B2B] sm:text-4xl">
                      {group.title}
                    </h2>

                    <p className="mt-2 text-sm text-[#2B2B2B]/60">
                      {group.description}
                    </p>

                    <span className="mt-4 block h-px w-12 bg-[#C9A24B]" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {groupPages.map((page) => (
                      <Link
                        key={page.slug}
                        href={`/pages/${page.slug}`}
                        className="group flex min-h-[112px] items-center justify-between gap-4 border border-[#2B2B2B]/10 bg-white/40 px-5 py-5 transition duration-300 hover:border-[#C9A24B]/70 hover:bg-white/80 sm:px-6"
                      >
                        <div>
                          <h3 className="font-serif text-xl text-[#2B2B2B] transition group-hover:text-[#8C6D1F]">
                            {page.title}
                          </h3>

                          {page.lastUpdated && (
                            <p className="mt-2 text-[11px] text-[#2B2B2B]/50">
                              Updated {formatDate(page.lastUpdated)}
                            </p>
                          )}
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C9A24B]/50 text-lg text-[#8C6D1F] transition group-hover:bg-[#2B2B2B] group-hover:text-white">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
