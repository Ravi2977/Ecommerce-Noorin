
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import productService from "@/service/modules/product.service";

type ProductReview = {
  id: number;
  authorName: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  verifiedPurchase: boolean;
  storeReply?: string | null;
  createdAt: string;
};

type ProductReviewsResponse = {
  summary: {
    average: number;
    count: number;
    distribution: Record<string, number>;
  };
  content: ProductReview[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type ProductReviewsProps = {
  slug: string;
};

const PAGE_SIZE = 10;

function ReviewStars({
  rating,
  size = 15,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          fill={index < rating ? "currentColor" : "none"}
          className={
            index < rating
              ? "text-[#C9A24B]"
              : "text-[#C9A24B]/30"
          }
        />
      ))}
    </div>
  );
}

function formatReviewDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ProductReviews({
  slug,
}: ProductReviewsProps) {
  const [reviews, setReviews] =
    useState<ProductReviewsResponse | null>(null);

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await productService.getReviews(slug, {
        page,
        size: PAGE_SIZE,
      });

      const result = response?.data ?? response;

      if (!result || !Array.isArray(result.content)) {
        throw new Error("Invalid reviews response.");
      }

      setReviews(result as ProductReviewsResponse);
    } catch (err) {
      console.error("Product reviews fetch failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reviews. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [slug, page, retryCount]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await productService.getReviews(slug, {
          page,
          size: PAGE_SIZE,
        });

        const result = response?.data ?? response;

        if (!result || !Array.isArray(result.content)) {
          throw new Error("Invalid reviews response.");
        }

        if (active) {
          setReviews(result as ProductReviewsResponse);
        }
      } catch (err) {
        console.error("Product reviews fetch failed:", err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load reviews. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [slug, page, retryCount]);

  const summary = reviews?.summary;
  const reviewList = reviews?.content ?? [];
  const totalPages = reviews?.totalPages ?? 0;

  return (
    <section
      id="product-reviews"
      className="border-t border-[#2B2B2B]/10"
    >
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">

        <div className="mb-10 text-center">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[#8C6D1F]">
            Customer Experiences
          </p>

          <h2 className="mb-4 font-serif text-3xl leading-tight text-[#2B2B2B] sm:text-4xl">
            Customer Reviews
          </h2>

          <p className="mx-auto max-w-xl text-sm leading-7 text-[#2B2B2B]/60">
            Discover what our customers think about this product.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-4">
            <Loader2
              size={28}
              className="animate-spin text-[#8C6D1F]"
            />
            <p className="text-xs tracking-wider text-[#2B2B2B]/50">
              Loading customer reviews...
            </p>
          </div>
        ) : error ? (
          <div className="border border-[#2B2B2B]/10 bg-white p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-4 border-b border-[#8C6D1F] pb-1 text-xs uppercase tracking-wider text-[#8C6D1F]"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* RATING SUMMARY */}
            <div className="mb-10 grid grid-cols-1 gap-8 border-y border-[#2B2B2B]/10 bg-white/40 px-5 py-8 sm:grid-cols-[0.8fr_1.2fr] sm:px-8">

              <div className="flex flex-col items-center justify-center text-center">
                <span className="font-serif text-6xl text-[#2B2B2B]">
                  {(summary?.average ?? 0).toFixed(1)}
                </span>

                <div className="mt-3">
                  <ReviewStars
                    rating={Math.round(summary?.average ?? 0)}
                    size={19}
                  />
                </div>

                <p className="mt-3 text-xs text-[#2B2B2B]/55">
                  Based on {summary?.count ?? 0} reviews
                </p>
              </div>

              {/* STAR DISTRIBUTION */}
              <div className="flex flex-col justify-center gap-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count =
                    summary?.distribution?.[String(star)] ?? 0;

                  const total = summary?.count ?? 0;

                  const percentage =
                    total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div
                      key={star}
                      className="flex items-center gap-3"
                    >
                      <span className="w-8 text-xs text-[#2B2B2B]/70">
                        {star}{" "}
                        <span className="text-[#C9A24B]">★</span>
                      </span>

                      <div className="h-2 flex-1 overflow-hidden bg-[#2B2B2B]/10">
                        <div
                          className="h-full bg-[#C9A24B] transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <span className="w-8 text-right text-xs tabular-nums text-[#2B2B2B]/55">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REVIEW LIST */}
            {reviewList.length > 0 ? (
              <div className="divide-y divide-[#2B2B2B]/10 border-y border-[#2B2B2B]/10">
                {reviewList.map((review) => (
                  <article
                    key={review.id}
                    className="py-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-[#2B2B2B]">
                          {review.authorName}
                        </h3>

                        {review.verifiedPurchase && (
                          <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#8C6D1F]">
                            <ShieldCheck size={13} />
                            Verified Purchase
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-[#2B2B2B]/45">
                        {formatReviewDate(review.createdAt)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <ReviewStars rating={review.rating} />
                    </div>

                    {review.title && (
                      <h4 className="mt-3 text-sm font-medium text-[#2B2B2B]">
                        {review.title}
                      </h4>
                    )}

                    {review.body && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#2B2B2B]/65">
                        {review.body}
                      </p>
                    )}

                    {/* STORE REPLY */}
                    {review.storeReply && (
                      <div className="mt-5 border-l-2 border-[#C9A24B] bg-white/70 px-4 py-4">
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8C6D1F]">
                          NOORINE Response
                        </p>

                        <p className="mt-2 text-sm leading-7 text-[#2B2B2B]/70">
                          {review.storeReply}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <MessageCircle
                  size={32}
                  className="mx-auto text-[#C9A24B]/60"
                />

                <h3 className="mt-4 font-serif text-2xl text-[#2B2B2B]">
                  No Reviews Yet
                </h3>

                <p className="mt-2 text-sm text-[#2B2B2B]/55">
                  Be the first to share your experience with this product.
                </p>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-[#2B2B2B]/55">
                  Showing page {page + 1} of {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 0}
                    onClick={() =>
                      setPage((current) => Math.max(0, current - 1))
                    }
                    className="flex h-10 w-10 items-center justify-center border border-[#2B2B2B]/20 transition hover:border-[#8C6D1F] hover:text-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous reviews page"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <span className="min-w-10 text-center text-xs tabular-nums">
                    {page + 1} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages - 1}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalPages - 1, current + 1)
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center border border-[#2B2B2B]/20 transition hover:border-[#8C6D1F] hover:text-[#8C6D1F] disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next reviews page"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
