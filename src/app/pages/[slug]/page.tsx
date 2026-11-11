import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import pageService from "@/service/modules/page.service";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://noorine.in";

type CmsPage = {
  slug: string;
  title: string;
  content: string;
  type?: string;
  lastUpdated?: string;
  seoDescription?: string;
};

function getData(response: any): any {
  return response?.data ?? response ?? {};
}

async function getPage(slug: string): Promise<CmsPage | null> {
  try {
    const response = await pageService.getBySlugServer(slug);
    const data = getData(response);

    if (!data?.slug || !data?.title) {
      return null;
    }

    return data as CmsPage;
  } catch (error: any) {
    if (
      error?.response?.status === 404 ||
      error?.status === 404
    ) {
      return null;
    }

    console.error(`CMS page fetch failed (${slug}):`, error);
    return null;
  }
}

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    return {
      title: "Page Not Found | NOORINE",
    };
  }

  const description =
    page.seoDescription ||
    `${page.title} - Read more about NOORINE's policies and information.`;

  return {
    title: `${page.title} | NOORINE`,
    description,

    alternates: {
      canonical: `${SITE_URL}/pages/${page.slug}`,
    },

    openGraph: {
      title: `${page.title} | NOORINE`,
      description,
      url: `${SITE_URL}/pages/${page.slug}`,
      siteName: "NOORINE",
      type: "article",
    },

    twitter: {
      card: "summary",
      title: `${page.title} | NOORINE`,
      description,
    },
  };
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

function renderInline(text: string) {
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  return text.split(pattern).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-[#2B2B2B]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="bg-[#2B2B2B]/5 px-1.5 py-0.5 text-[0.9em] text-[#8C6D1F]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

    if (linkMatch) {
      const [, label, href] = linkMatch;

      const safeHref =
        href.startsWith("https://") ||
        href.startsWith("http://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("/")
          ? href
          : null;

      if (safeHref) {
        return (
          <a
            key={index}
            href={safeHref}
            className="text-[#8C6D1F] underline underline-offset-4 hover:text-[#2B2B2B]"
          >
            {label}
          </a>
        );
      }

      return label;
    }

    return part;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = (content || "").replace(/\r\n/g, "\n").split("\n");

  const blocks: Array<{
    type: "paragraph" | "list";
    items: string[];
  }> = [];

  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({
        type: "paragraph",
        items: [...paragraph],
      });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length) {
      blocks.push({
        type: "list",
        items: [...list],
      });
      list = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushList();

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push({
        type: "paragraph",
        items: [trimmed],
      });
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return (
    <div className="space-y-5 text-sm leading-8 text-[#2B2B2B]/75 sm:text-[15px]">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              key={index}
              className="ml-5 list-disc space-y-2 marker:text-[#C9A24B]"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-2">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        const text = block.items.join(" ");
        const headingMatch = text.match(/^(#{1,6})\s+(.+)$/);

        if (headingMatch) {
          const level = headingMatch[1].length;
          const heading = headingMatch[2];

          if (level <= 2) {
            return (
              <h2
                key={index}
                className="!mb-1 !mt-10 font-serif text-2xl font-medium leading-tight text-[#2B2B2B] sm:text-3xl"
              >
                {renderInline(heading)}
              </h2>
            );
          }

          return (
            <h3
              key={index}
              className="!mb-0 !mt-7 font-serif text-xl font-medium text-[#2B2B2B]"
            >
              {renderInline(heading)}
            </h3>
          );
        }

        return (
          <p key={index}>
            {renderInline(text)}
          </p>
        );
      })}
    </div>
  );
}

export default async function CmsPageDetails({
  params,
}: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#FAF6EF]">
      {/* Page Header */}
      <section className="border-b border-[#2B2B2B]/10 px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-[900px]">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.35em] text-[#8C6D1F]">
            NOORINE · EVERYDAY SHINE
          </p>

          <h1 className="font-serif text-4xl font-medium leading-tight text-[#2B2B2B] sm:text-5xl">
            {page.title}
          </h1>

          {page.lastUpdated && (
            <p className="mt-5 text-xs text-[#2B2B2B]/50">
              Last updated: {formatDate(page.lastUpdated)}
            </p>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-[#2B2B2B]/55">
            <Link href="/" className="transition hover:text-[#8C6D1F]">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/policies"
              className="transition hover:text-[#8C6D1F]"
            >
              Policies
            </Link>
            <span>/</span>
            <span className="text-[#2B2B2B]/75">{page.title}</span>
          </div>

          <span className="mt-7 block h-px w-16 bg-[#C9A24B]" />
        </div>
      </section>

      {/* Page Content */}
      <section className="mx-auto max-w-[900px] px-5 py-10 sm:px-8 sm:py-14">
        <article className="border border-[#2B2B2B]/10 bg-white/50 px-5 py-7 sm:px-10 sm:py-10">
          {page.content ? (
            <MarkdownContent content={page.content} />
          ) : (
            <p className="text-sm text-[#2B2B2B]/60">
              Content for this page is currently unavailable.
            </p>
          )}
        </article>

        <div className="mt-10 text-center">
          <Link
            href="/policies"
            className="inline-flex min-h-11 items-center justify-center border border-[#2B2B2B] px-7 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#2B2B2B] transition hover:bg-[#2B2B2B] hover:text-white"
          >
            Back to Policies
          </Link>
        </div>
      </section>
    </main>
  );
}
