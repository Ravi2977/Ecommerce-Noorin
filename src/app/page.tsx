import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  CreditCard,
  Gift,
  Headphones,
  Heart,
  // Instagram,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";

import homeService from "@/service/modules/home.service";
import HeroSlider from "@/components/home/HeroSlider";
import ProductCard from "@/components/product/ProductCard";

type AnyData = Record<string, any>;

const SECTION_CLASS =
  "mx-auto w-full max-w-[1440px] px-5 py-12 sm:px-8 lg:px-10 lg:py-16";

/* =========================================
   HELPERS
========================================= */

function getData(response: any): AnyData {
  return response?.data ?? response ?? {};
}

function getImageUrl(item: AnyData) {
  return (
    item?.imageUrl ||
    item?.bannerImage ||
    item?.image ||
    null
  );
}

function asArray<T = AnyData>(value: any): T[] {
  return Array.isArray(value) ? value : [];
}

/* "2026-11-12T21:29" -> "12 Nov" (no timezone shifting) */
function formatEndDate(value?: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  if (!match) return null;

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function getInstagramLink(data: AnyData) {
  const handle: string = data?.handle || "";

  if (/^https?:\/\//i.test(handle)) return handle;
  if (handle) return `https://www.instagram.com/${handle.replace(/^@/, "")}`;

  return "https://www.instagram.com/";
}

function getInstagramLabel(data: AnyData) {
  const handle: string = data?.handle || "";
  const last = handle.replace(/\/+$/, "").split("/").pop() || "";

  return last ? `@${last.replace(/^@/, "")}` : "Instagram";
}

const TRUST_ICONS: Record<string, LucideIcon> = {
  SHIELD: ShieldCheck,
  TRUCK: Truck,
  DELIVERY: Truck,
  RETURN: RotateCcw,
  REFRESH: RotateCcw,
  HEART: Heart,
  GIFT: Gift,
  STAR: Star,
  CREDIT_CARD: CreditCard,
  PAYMENT: CreditCard,
  SUPPORT: Headphones,
  HEADPHONES: Headphones,
  CHECK: BadgeCheck,
  BADGE: BadgeCheck,
};

/* =========================================
   SMALL SHARED UI
========================================= */

function SectionHeading({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  if (!title && !subtitle) return null;

  return (
    <div className="mb-9 text-center sm:mb-12">
      {title && (
        <h2 className="font-serif text-3xl leading-tight text-[#2B2B2B] sm:text-4xl lg:text-[42px]">
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="mx-auto mt-3 text-sm leading-6 bg-pr text-[#77716A]">
          {subtitle}
        </p>
      )}

      <span className="mx-auto mt-5 block h-px w-16 bg-[#C9A24B]" />
    </div>
  );
}

function ResponsiveImage({
  desktop,
  mobile,
  alt,
  className,
}: {
  desktop?: string | null;
  mobile?: string | null;
  alt: string;
  className?: string;
}) {
  const main = desktop || mobile;
  if (!main) return null;

  return (
    <picture className="block h-full w-full">
      {mobile && <source media="(max-width: 767px)" srcSet={mobile} />}
      <img src={main} alt={alt} loading="lazy" className={className} />
    </picture>
  );
}

function Stars({
  rating,
  showEmpty = false,
  className = "",
}: {
  rating: number | string;
  showEmpty?: boolean;
  className?: string;
}) {
  const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  if (!value && !showEmpty) return null;

  return (
    <div
      role="img"
      aria-label={`${value} out of 5 stars`}
      className={`flex items-center gap-0.5 ${className}`}
    >
      {Array.from({ length: showEmpty ? 5 : value }, (_, i) => (
        <span
          key={i}
          className={i < value ? "text-[#C9A24B]" : "text-[#DDD3C4]"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* =========================================
   PRODUCTS
========================================= */

function ProductSection({
  block,
  prioritizeFirst,
}: {
  block: AnyData;
  prioritizeFirst: boolean;
}) {
  const products = asArray(block.items ?? block.products);

  if (!products.length) return null;

  return (
    <section className={SECTION_CLASS}>
      <SectionHeading title={block.title} subtitle={block.subtitle} />

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-10">
        {products.map((product: AnyData, index: number) => (
          <ProductCard
            product={product}
            priority={prioritizeFirst && index === 0}
            key={product.id ?? index}
          />
        ))}
      </div>

      {block.buttonText && block.buttonLink && (
        <div className="mt-9 text-center">
          <Link
            href={block.buttonLink}
            className="inline-flex min-h-11 items-center justify-center border border-[#2B2B2B] px-7 py-3 text-xs font-semibold uppercase tracking-widest text-[#2B2B2B] transition-colors hover:bg-[#2B2B2B] hover:text-white"
          >
            {block.buttonText}
          </Link>
        </div>
      )}
    </section>
  );
}

/* =========================================
   CATEGORY TILES
========================================= */

function CategorySection({ block }: { block: AnyData }) {
  const categories = asArray(block.items);

  if (!categories.length) return null;

  return (
    <section className={SECTION_CLASS}>
      <SectionHeading
        title={block.title || "Shop By Category"}
        subtitle={block.subtitle}
      />

      <div className="flex flex-wrap justify-center gap-6 sm:gap-8 lg:gap-10">
        {categories.map((category: AnyData, index: number) => {
          const image = getImageUrl(category);
          const slug = category.categorySlug || category.slug || "";
          const name =
            category.title || category.categoryName || category.name;

          return (
            <Link
              key={category.id ?? index}
              href={`/categories/${slug}`}
              className="group w-[calc(50%-12px)] max-w-[260px] text-center sm:w-[220px] lg:w-[260px]"
            >
              <div className="relative aspect-square w-full overflow-hidden border border-[#E5DED4] bg-white">
                {image ? (
                  <img
                    src={image}
                    alt={category.imageAlt || name}
                    loading="lazy"
                    className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-serif text-xl tracking-widest text-[#C9A24B]">
                      NOORINE
                    </span>
                  </div>
                )}
              </div>

              <h3 className="mt-4 font-serif text-xl leading-snug text-[#2B2B2B] transition-colors group-hover:text-[#8C6D1F] sm:text-2xl">
                {name}
              </h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================
   OFFER BANNERS (GRID or CAROUSEL)
========================================= */

function OfferCard({ banner }: { banner: AnyData }) {
  const buttonText = banner.buttonText || "Shop Now";

  return (
    <Link
      href={banner.link || banner.buttonLink || "/products"}
      className="group relative block min-w-0 overflow-hidden border border-[#C9A24B] bg-[#F0E8DE]"
    >
      <div className="relative aspect-[16/8] w-full overflow-hidden sm:aspect-[16/7]">
        <ResponsiveImage
          desktop={banner.imageUrl}
          mobile={banner.mobileImageUrl}
          alt={banner.title || "NOORINE offer"}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 sm:justify-end sm:p-5">
          <div className="max-w-full rounded-sm bg-[#FAF6EF]/95 px-4 py-3 text-center shadow-md">
            {banner.title && (
              <p className="text-sm font-semibold leading-snug text-[#2B2B2B] sm:text-base">
                {banner.title}
              </p>
            )}

            {banner.subtitle && (
              <p className="mt-0.5 text-xs leading-snug text-[#77716A]">
                {banner.subtitle}
              </p>
            )}

            {(banner.couponCode || banner.coupon) && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-[#8C6D1F] sm:text-xs">
                Code: {banner.couponCode || banner.coupon}
              </p>
            )}

            <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-[#2B2B2B] underline underline-offset-4 sm:text-xs">
              {buttonText}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function OffersSection({ block }: { block: AnyData }) {
  const banners = asArray(block.items);

  if (!banners.length) return null;

  const isCarousel = block.style?.toUpperCase() === "CAROUSEL";

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
      <SectionHeading title={block.title} subtitle={block.subtitle} />

      {isCarousel ? (
        <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {banners.map((banner: AnyData, index: number) => (
            <div
              key={banner.id ?? index}
              className={`min-w-0 shrink-0 snap-start ${
                banners.length === 1
                  ? "basis-full"
                  : "basis-[88%] md:basis-[calc(50%-12px)]"
              }`}
            >
              <OfferCard banner={banner} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {banners.map((banner: AnyData, index: number) => (
            <OfferCard key={banner.id ?? index} banner={banner} />
          ))}
        </div>
      )}
    </section>
  );
}

/* =========================================
   DEALS
========================================= */

function DealsSection({ block }: { block: AnyData }) {
  const deals = asArray(block.items);

  if (!deals.length) return null;

  return (
    <section className="bg-[#EFE5D9] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading
          title={block.title || "Deals of the Day"}
          subtitle={block.subtitle}
        />

        <div
          className={`grid grid-cols-1 gap-5 ${
            deals.length === 1 ? "mx-auto max-w-xl" : "sm:grid-cols-2"
          }`}
        >
          {deals.map((deal: AnyData, index: number) => {
            const endDate = formatEndDate(deal.endsAt);

            return (
              <div
                key={deal.id || deal.couponCode || index}
                className="flex flex-col items-center overflow-hidden border border-[#D9C8B5] bg-[#FAF6EF] text-center"
              >
                {deal.imageUrl && (
                  <div className="aspect-[16/7] w-full overflow-hidden bg-[#F0E8DE]">
                    <img
                      src={deal.imageUrl}
                      alt={deal.title || "Deal"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col items-center px-6 py-9 sm:px-8">
                  {deal.title && (
                    <h3 className="font-serif text-3xl text-[#2B2B2B] sm:text-4xl">
                      {deal.title}
                    </h3>
                  )}

                  {deal.subtitle && (
                    <p className="mt-2 text-sm text-[#77716A]">
                      {deal.subtitle}
                    </p>
                  )}

                  {deal.couponCode && (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8C6D1F]">
                      {deal.couponCode}
                    </p>
                  )}

                  {endDate && (
                    <p className="mt-2 text-xs text-[#77716A]">
                      Ends {endDate}
                    </p>
                  )}

                  {deal.buttonText && (
                    <Link
                      href={deal.link || deal.buttonLink || "/products"}
                      className="mt-6 inline-flex min-h-11 items-center justify-center bg-[#2B2B2B] px-7 py-3 text-xs font-semibold uppercase tracking-widest text-[#FAF6EF] transition-colors hover:bg-[#8C6D1F]"
                    >
                      {deal.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =========================================
   COLLECTIONS
========================================= */

function CollectionsSection({ block }: { block: AnyData }) {
  const collections = asArray(block.items);

  if (!collections.length) return null;

  return (
    <section className={SECTION_CLASS}>
      <SectionHeading
        title={block.title || "Explore Our Collections"}
        subtitle={block.subtitle}
      />

      <div
        className={`grid grid-cols-1 gap-6 lg:gap-8 ${
          collections.length === 1
            ? "mx-auto max-w-4xl"
            : "sm:grid-cols-2"
        }`}
      >
        {collections.map((collection: AnyData, index: number) => {
          const image = collection.bannerImage || getImageUrl(collection);

          return (
            <Link
              key={collection.id ?? index}
              href={`/collections/${collection.slug}`}
              className="group relative block aspect-[16/10] min-w-0 overflow-hidden bg-[#E9DFD2] sm:aspect-[16/11]"
            >
              {image && (
                <img
                  src={image}
                  alt={collection.name || "Collection"}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}

              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-5 sm:p-8">
                <div className="max-w-full text-white">
                  <h3 className="font-serif text-3xl text-white sm:text-4xl">
                    {collection.name}
                  </h3>

                  {collection.description && (
                    <p className="mt-2 line-clamp-2 max-w-lg text-sm leading-6 text-white/90">
                      {collection.description}
                    </p>
                  )}

                  <span className="mt-4 inline-block border-b border-white pb-1 text-xs uppercase tracking-widest text-white">
                    Explore Collection
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================
   TRUST BADGES
========================================= */

function TrustBadgesSection({ block }: { block: AnyData }) {
  const badges = asArray(block.items);

  if (!badges.length) return null;

  return (
    <section className="border-y border-[#E5DED4] bg-white px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-start justify-center gap-x-12 gap-y-6">
        {badges.map((badge: AnyData, index: number) => {
          const Icon =
            TRUST_ICONS[String(badge.icon || "").toUpperCase()] || Sparkles;

          const content = (
            <>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C9A24B] text-[#8C6D1F]">
                <Icon size={22} strokeWidth={1.5} />
              </span>

              <span>
                {badge.title && (
                  <span className="block text-sm font-semibold text-[#2B2B2B]">
                    {badge.title}
                  </span>
                )}

                {badge.subtitle && (
                  <span className="mt-0.5 block text-xs text-[#77716A]">
                    {badge.subtitle}
                  </span>
                )}
              </span>
            </>
          );

          const className = "flex items-center gap-4 text-left";

          return badge.link ? (
            <Link
              key={badge.id ?? index}
              href={badge.link}
              className={`${className} transition-opacity hover:opacity-75`}
            >
              {content}
            </Link>
          ) : (
            <div key={badge.id ?? index} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================
   TESTIMONIALS
========================================= */

function TestimonialsSection({ block }: { block: AnyData }) {
  const testimonials = asArray(block.items);

  if (!testimonials.length) return null;

  return (
    <section className="bg-[#F0E8DE] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading title={block.title} subtitle={block.subtitle} />

        <div
          className={`grid grid-cols-1 gap-6 ${
            testimonials.length === 1
              ? "mx-auto max-w-md"
              : "sm:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {testimonials.map((testimonial: AnyData, index: number) => (
            <article
              key={testimonial.id || index}
              className="flex flex-col border border-[#E5DED4] bg-[#FAF6EF] p-5 transition-all duration-300 hover:border-[#C9A24B] hover:shadow-md sm:p-7"
            >
              {testimonial.imageUrl && (
                <div className="mb-5 aspect-[4/3] w-full overflow-hidden bg-[#F0E8DE]">
                  <img
                    src={testimonial.imageUrl}
                    alt={`${testimonial.name || "Customer"} testimonial`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <Stars rating={testimonial.rating} />

              {testimonial.text && (
                <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed text-[#2B2B2B] sm:text-xl">
                  “{testimonial.text}”
                </blockquote>
              )}

              <div className="mt-6 border-t border-[#E5DED4] pt-4">
                {testimonial.name && (
                  <p className="text-sm font-semibold text-[#2B2B2B]">
                    {testimonial.name}
                  </p>
                )}

                {testimonial.location && (
                  <p className="mt-1 text-xs text-[#8C6D1F]">
                    {testimonial.location}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================
   REVIEWS
========================================= */

function ReviewsSection({ block }: { block: AnyData }) {
  const reviews = asArray(block.items);
  const summary = block.summary || {};

  if (!reviews.length) return null;

  return (
    <section className={SECTION_CLASS}>
      <SectionHeading
        title={summary.headline || block.title}
        subtitle={block.subtitle}
      />

      {Number(summary.average) > 0 && (
        <div className="-mt-4 mb-10 flex flex-col items-center gap-1 text-center sm:-mt-6">
          <Stars
            rating={summary.average}
            showEmpty
            className="text-2xl"
          />

          <p className="text-sm text-[#2B2B2B]">
            <span className="font-semibold">
              {Number(summary.average).toFixed(1)}
            </span>{" "}
            out of 5
            {summary.count ? ` · ${summary.count} reviews` : ""}
          </p>

          {summary.subline && (
            <p className="text-xs text-[#77716A]">{summary.subline}</p>
          )}
        </div>
      )}

      <div
        className={`grid grid-cols-1 gap-6 ${
          reviews.length === 1
            ? "mx-auto max-w-md"
            : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {reviews.map((review: AnyData, index: number) => (
          <article
            key={`${review.createdAt}-${index}`}
            className="flex flex-col border border-[#E5DED4] bg-white p-5 transition-colors duration-300 hover:border-[#C9A24B] sm:p-7"
          >
            <Stars rating={review.rating} showEmpty />

            {review.title && (
              <h3 className="mt-3 font-serif text-xl text-[#2B2B2B]">
                {review.title}
              </h3>
            )}

            {review.body && (
              <p className="mt-2 flex-1 text-sm leading-6 text-[#77716A]">
                {review.body}
              </p>
            )}

            <div className="mt-5 border-t border-[#E5DED4] pt-4">
              <p className="text-sm font-semibold text-[#2B2B2B]">
                {review.authorName}
              </p>

              {review.verifiedPurchase && (
                <p className="mt-1 text-xs text-[#8C6D1F]">
                  ✓ Verified purchase
                </p>
              )}

              {review.product?.name && (
                <Link
                  href={
                    review.product.slug
                      ? `/products/${review.product.slug}`
                      : "/products"
                  }
                  className="mt-1 line-clamp-1 block text-xs text-[#77716A] underline underline-offset-4 transition-colors hover:text-[#8C6D1F]"
                >
                  {review.product.name}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* =========================================
   WHY CHOOSE US
========================================= */

function WhyChooseUsSection({ data }: { data: AnyData }) {
  if (!data || (!data.title && !data.story)) return null;

  const image = getImageUrl(data);
  const points = asArray<any>(data.points);

  return (
    <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-20">
      {image && (
        <div className="overflow-hidden bg-[#F0E8DE]">
          <img
            src={image}
            alt={data.title || "About NOORINE"}
            loading="lazy"
            className="max-h-[600px] w-full object-cover"
          />
        </div>
      )}

      <div className="py-3">
        {data.title && (
          <h2 className="font-serif text-3xl leading-tight text-[#2B2B2B] sm:text-4xl lg:text-5xl">
            {data.title}
          </h2>
        )}

        {data.story && (
          <div className="mt-6 space-y-5">
            {String(data.story)
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((paragraph: string, index: number) => (
                <p
                  key={index}
                  className="text-sm leading-7 text-[#77716A] sm:text-base sm:leading-8"
                >
                  {paragraph.trim()}
                </p>
              ))}
          </div>
        )}

        {points.length > 0 && (
          <ul className="mt-7 space-y-4">
            {points.map((point: any, index: number) => (
              <li
                key={point?.id || index}
                className="flex items-start gap-3 text-sm leading-6 text-[#2B2B2B]"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A24B]" />

                <span>
                  {typeof point === "string"
                    ? point
                    : point.title || point.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* =========================================
   INSTAGRAM
========================================= */

function InstagramSection({ data }: { data: AnyData }) {
  const posts = asArray(data?.posts);

  if (!data || (!data.title && !posts.length)) return null;

  const profileLink = getInstagramLink(data);

  return (
    <section className={SECTION_CLASS}>
      <SectionHeading title={data.title} />

      {posts.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {posts.map((post: AnyData, index: number) => (
            <a
              key={post.id ?? index}
              href={post.link || profileLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open on Instagram"
              className="group relative block aspect-square w-[calc(50%-4px)] overflow-hidden bg-[#E9DFD2] sm:w-[calc(33.333%-8px)] lg:w-[calc(16.666%-10px)]"
            >
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="NOORINE on Instagram"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}

              <span className="absolute inset-0 flex items-center justify-center bg-[#2B2B2B]/0 text-white opacity-0 transition-all duration-300 group-hover:bg-[#2B2B2B]/40 group-hover:opacity-100">
                {/* <Instagram size={26} strokeWidth={1.5} /> */}
              </span>
            </a>
          ))}
        </div>
      )}

      <div className="mt-9 text-center">
        <a
          href={profileLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#2B2B2B] px-7 py-3 text-xs font-semibold uppercase tracking-widest text-[#2B2B2B] transition-colors hover:bg-[#2B2B2B] hover:text-white"
        >
          {/* <Instagram size={16} /> */}
          {getInstagramLabel(data)}
        </a>
      </div>
    </section>
  );
}

/* =========================================
   NEWSLETTER
========================================= */

function NewsletterSection({ data }: { data: AnyData }) {
  if (!data || !data.title) return null;

  return (
    <section className="bg-[#2B2B2B] px-5 py-14 text-[#FAF6EF] sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        {data.subtitle && (
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#C9A24B]">
            {data.subtitle}
          </p>
        )}

        <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl lg:text-[42px]">
          {data.title}
        </h2>

        {data.incentive && (
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#FAF6EF]/75">
            {data.incentive}
          </p>
        )}

        <span className="mx-auto mt-5 block h-px w-16 bg-[#C9A24B]" />

        {/* TODO: point `action` to your newsletter subscribe endpoint */}
        <form
          action="/api/newsletter"
          method="post"
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>

          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            placeholder="Your email address"
            className="min-h-12 w-full flex-1 border border-[#FAF6EF]/30 bg-transparent px-4 text-sm text-[#FAF6EF] placeholder:text-[#FAF6EF]/50 focus:border-[#C9A24B] focus:outline-none"
          />

          <button
            type="submit"
            className="min-h-12 bg-[#C9A24B] px-7 text-xs font-semibold uppercase tracking-widest text-[#2B2B2B] transition-colors hover:bg-[#FAF6EF]"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

/* =========================================
   LAYOUT BUILDER
   Uses backend `layout` (order is controlled by admin).
   Falls back to the older top-level fields if `layout` is missing.
========================================= */

function buildFallbackLayout(home: AnyData): AnyData[] {
  const blocks: AnyData[] = [];

  const slides = asArray(home.heroSlides);
  if (slides.length) {
    blocks.push({ id: "hero", type: "HERO", settings: home.hero, items: slides });
  }

  if (asArray(home.categoryTiles).length) {
    blocks.push({ id: "categories", type: "CATEGORY_TILES", items: home.categoryTiles });
  }

  if (asArray(home.offerBanners).length) {
    blocks.push({ id: "offers", type: "OFFERS", style: "GRID", items: home.offerBanners });
  }

  const sections = asArray(home.sections);
  const keyOf = (s: AnyData) => s.key || s.type;
  const productBlock = (s: AnyData) => ({
    id: `products-${keyOf(s)}`,
    type: "PRODUCTS",
    title: s.title,
    subtitle: s.subtitle,
    items: s.products,
  });

  sections.filter((s) => keyOf(s) === "FEATURED").forEach((s) => blocks.push(productBlock(s)));

  if (asArray(home.collections).length) {
    blocks.push({ id: "collections", type: "COLLECTIONS", items: home.collections });
  }

  sections.filter((s) => keyOf(s) === "NEW_ARRIVALS").forEach((s) => blocks.push(productBlock(s)));
  sections
    .filter((s) => !["FEATURED", "NEW_ARRIVALS"].includes(keyOf(s)))
    .forEach((s) => blocks.push(productBlock(s)));

  if (asArray(home.deals?.items).length) {
    blocks.push({ id: "deals", type: "DEALS", title: home.deals.title, items: home.deals.items });
  }

  if (asArray(home.testimonials?.items).length) {
    blocks.push({
      id: "testimonials",
      type: "TESTIMONIALS",
      title: home.testimonials.title,
      subtitle: home.testimonials.subtitle,
      items: home.testimonials.items,
    });
  }

  if (asArray(home.recentReviews).length) {
    blocks.push({ id: "reviews", type: "REVIEWS", summary: home.reviewSummary, items: home.recentReviews });
  }

  if (home.whyChooseUs) {
    blocks.push({ id: "why", type: "WHY_CHOOSE_US", data: home.whyChooseUs });
  }

  if (home.instagram) {
    blocks.push({ id: "instagram", type: "INSTAGRAM", data: home.instagram });
  }

  return blocks;
}

/* =========================================
   HOMEPAGE
========================================= */

export default async function HomePage() {
  let home: AnyData = {};

  try {
    const response = await homeService.getHomeServer();
    home = getData(response);
  } catch (error) {
    console.error("Homepage data loading failed:", error);
  }

  const layout: AnyData[] = asArray(home.layout).length
    ? asArray(home.layout)
    : buildFallbackLayout(home);

  /* Only the first product grid gets image priority */
  const firstProductBlock = layout.find(
    (block) =>
      block.type === "PRODUCTS" &&
      asArray(block.items ?? block.products).length > 0
  );

  function renderBlock(block: AnyData, index: number): ReactNode {
    const key = `${block.id ?? block.type}-${index}`;

    switch (block.type) {
      case "HERO": {
        const slides = asArray(block.items).filter(
          (slide: AnyData) => slide.active !== false
        );

        if (!slides.length) return null;

        return (
          <HeroSlider
            key={key}
            slides={slides as any}
            settings={block.settings ?? home.hero}
          />
        );
      }

      case "CATEGORY_TILES":
        return <CategorySection key={key} block={block} />;

      case "OFFERS":
        return <OffersSection key={key} block={block} />;

      case "PRODUCTS":
        return (
          <ProductSection
            key={key}
            block={block}
            prioritizeFirst={block === firstProductBlock}
          />
        );

      case "DEALS":
        return <DealsSection key={key} block={block} />;

      case "COLLECTIONS":
        return <CollectionsSection key={key} block={block} />;

      case "TRUST_BADGES":
        return <TrustBadgesSection key={key} block={block} />;

      case "TESTIMONIALS":
        return <TestimonialsSection key={key} block={block} />;

      case "REVIEWS":
        return <ReviewsSection key={key} block={block} />;

      case "WHY_CHOOSE_US":
        return <WhyChooseUsSection key={key} data={block.data ?? block} />;

      case "INSTAGRAM":
        return <InstagramSection key={key} data={block.data ?? block} />;

      case "NEWSLETTER":
        return <NewsletterSection key={key} data={block.data ?? block} />;

      default:
        return null;
    }
  }

  return (
    <main className="min-h-screen w-full overflow-x-clip bg-[#FAF6EF] text-[#2B2B2B]">
      {layout.map((block, index) => renderBlock(block, index))}
    </main>
  );
}