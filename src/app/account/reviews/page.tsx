
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import customerService from "@/service/modules/customer.service";

type Review = {
  id: number;
  authorName?: string;
  rating: number;
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  storeReply?: string | null;
  createdAt: string;
  productId: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

function formatDate(date?: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusStyle(status: Review["status"]) {
  switch (status) {
    case "APPROVED":
      return "bg-green-50 text-green-700 border-green-100";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-amber-50 text-amber-700 border-amber-100";
  }
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customerService.getReviews();

      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setReviews(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your reviews. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <main className="min-h-[55vh] bg-[#FAF6EF]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">

        {/* Page Heading */}
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8C6D1F]">
            Your Feedback
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-cormorant)] text-4xl font-medium leading-tight text-[#2B2B2B] sm:text-5xl lg:text-6xl">
                My Reviews
              </h1>

              <p className="mt-2 text-sm text-[#777] sm:text-base">
                All your product reviews in one place.
              </p>
            </div>

            {!loading && reviews.length > 0 && (
              <span className="rounded-full border border-[#E5D9C7] bg-white px-4 py-2 text-xs font-medium text-[#6B6258]">
                {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
              </span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-[#E5DED4] bg-white p-6 sm:p-8"
              >
                <div className="h-4 w-28 rounded bg-[#EEE8DF]" />
                <div className="mt-5 h-5 w-48 rounded bg-[#EEE8DF]" />
                <div className="mt-4 h-3 w-full rounded bg-[#EEE8DF]" />
                <div className="mt-2 h-3 w-2/3 rounded bg-[#EEE8DF]" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-white px-5 py-14 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <span className="text-xl text-red-600">!</span>
            </div>

            <h2 className="mt-5 font-[family-name:var(--font-cormorant)] text-3xl text-[#2B2B2B]">
              Something went wrong
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777]">
              {error}
            </p>

            <button
              onClick={loadReviews}
              className="mt-6 bg-[#2B2B2B] px-7 py-3 text-xs font-medium uppercase tracking-widest text-white transition hover:bg-[#8C6D1F]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reviews.length === 0 && (
          <div className="flex min-h-[310px] flex-col items-center justify-center rounded-xl border border-[#E5DED4] bg-white px-5 py-14 text-center sm:min-h-[350px] sm:px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF6EF]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8 text-[#8C6D1F]"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <path
                  d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="mt-5 font-[family-name:var(--font-cormorant)] text-3xl font-medium text-[#2B2B2B] sm:text-4xl">
              No reviews yet
            </h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-[#888]">
              Your product reviews will appear here once you share your
              experience with us.
            </p>

            <Link
              href="/shop"
              
              className="
    mt-7 inline-flex min-h-[52px] items-center justify-center
    gap-3 border border-[#2B2B2B]
    px-9 py-4 text-[10px] font-medium
    uppercase tracking-[0.2em]
    transition-all duration-300
    hover:border-[#8C6D1F] hover:bg-[#8C6D1F]
  "
            >
              Explore Products
            </Link>
          </div>
        )}

        {/* Reviews List */}
        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-5">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border border-[#E5DED4] bg-white p-5 transition-shadow duration-300 hover:shadow-sm sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div
                      className="flex items-center gap-1"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span
                          key={index}
                          className={`text-lg ${
                            index < review.rating
                              ? "text-[#C9A24B]"
                              : "text-[#DED8CE]"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>

                    <h2 className="mt-2 text-base font-semibold text-[#2B2B2B] sm:text-lg">
                      {review.title || "Product Review"}
                    </h2>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusStyle(
                      review.status
                    )}`}
                  >
                    {review.status}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-[#666]">
                  {review.body}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#F0EBE3] pt-4 text-xs text-[#888]">
                  <span>{formatDate(review.createdAt)}</span>

                  {review.verifiedPurchase && (
                    <span className="font-medium text-green-700">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>

                {review.storeReply && (
                  <div className="mt-5 rounded-lg border border-[#EEE5D8] bg-[#FAF6EF] p-4 sm:p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8C6D1F]">
                      Reply from NOORINE
                    </p>

                    <p className="mt-2 text-sm leading-7 text-[#555]">
                      {review.storeReply}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
