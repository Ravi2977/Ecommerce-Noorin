
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import ProductCard, {
    type Product as ProductCardProduct,
} from "@/components/product/ProductCard";
import customerService from "@/service/modules/customer.service";

type WishlistProduct = ProductCardProduct & {
    id: number | string;
    slug: string;
    name: string;
    price?: number | string | null;
    compareAtPrice?: number | string | null;
    currency?: string;
    images?: (string | {
        url?: string;
        imageUrl?: string;
        src?: string;
        alt?: string;
    })[];
    imageDetails?: {
        url?: string;
        imageUrl?: string;
        src?: string;
        alt?: string;
    }[];
    category?: {
        name?: string;
        slug?: string;
    } | null;
    rating?: {
        average?: number | null;
        count?: number;
    } | null;
    inStock?: boolean;
    comingSoon?: boolean;
    badge?: string | null;
};

function extractWishlist(response: unknown): WishlistProduct[] {
    if (Array.isArray(response)) {
        return response as WishlistProduct[];
    }

    if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray(response.data)
    ) {
        return response.data as WishlistProduct[];
    }

    return [];
}

export default function WishlistPage() {
    const router = useRouter();

    const [products, setProducts] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | number | null>(null);
    const [error, setError] = useState("");

    const loadWishlist = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("customerToken")
                    : null;

            if (!token) {
                router.replace("/account/login?redirect=/account/wishlist");
                return;
            }

            const response = await customerService.getWishlist();
            setProducts(extractWishlist(response));
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unable to load your wishlist.";

            setError(message);
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        void loadWishlist();
    }, [loadWishlist]);

    const handleRemove = async (productId: string | number) => {
        if (removingId !== null) return;

        try {
            setRemovingId(productId);

            const response = await customerService.removeFromWishlist(productId);

            // The API returns the updated wishlist.
            setProducts(extractWishlist(response));

            toast.success("Product removed from your wishlist.");
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Unable to remove this product."
            );
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-[#FAF6EF] text-[#2B2B2B]">
            {/* Page Header */}
            <section className="border-b border-[#2B2B2B]/10 px-4 py-12 text-center sm:py-16">
                <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#8C6D1F]">
                    Your Personal Collection
                </p>

                <h1 className="font-serif text-4xl font-medium sm:text-5xl">
                    My Wishlist
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#2B2B2B]/60">
                    The pieces you love, all in one place. Revisit your favourite
                    jewellery whenever you like.
                </p>

                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#2B2B2B]/50">
                    <Link href="/" className="hover:text-[#8C6D1F]">
                        Home
                    </Link>
                    <span>/</span>
                    <Link href="/account" className="hover:text-[#8C6D1F]">
                        My Account
                    </Link>
                    <span>/</span>
                    <span className="text-[#2B2B2B]">Wishlist</span>
                </div>
            </section>

            <section className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
                {/* Section Heading */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#2B2B2B]/10 pb-5">
                    <div>
                        <h2 className="font-serif text-2xl sm:text-3xl">
                            Saved Favourites
                        </h2>

                        {!loading && (
                            <p className="mt-2 text-xs text-[#2B2B2B]/55">
                                {products.length}{" "}
                                {products.length === 1 ? "product" : "products"} saved
                            </p>
                        )}
                    </div>

                    <Link
                        href="/products"
                        className="inline-flex items-center gap-2 border-b border-[#8C6D1F] pb-1 text-[10px] uppercase tracking-[0.18em] text-[#8C6D1F] transition hover:text-[#2B2B2B]"
                    >
                        Continue Shopping
                        <ArrowLeft size={13} className="rotate-180" />
                    </Link>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-[#8C6D1F]" size={30} />
                        <p className="text-xs tracking-wider text-[#2B2B2B]/55">
                            Loading your wishlist...
                        </p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <p className="max-w-md text-sm text-red-700">{error}</p>

                        <button
                            type="button"
                            onClick={loadWishlist}
                            className="mt-5 bg-[#2B2B2B] px-6 py-3 text-xs uppercase tracking-wider text-white transition hover:bg-[#8C6D1F]"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty Wishlist */}
                {!loading && !error && products.length === 0 && (
                    <div className="flex min-h-[380px] flex-col items-center justify-center px-4 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#C9A24B]/30 bg-[#D9B8AE]/10">
                            <Heart size={32} strokeWidth={1.2} className="text-[#8C6D1F]" />
                        </div>

                        <h2 className="mt-7 font-serif text-3xl">
                            Your wishlist is waiting
                        </h2>

                        <p className="mt-3 max-w-sm text-sm leading-7 text-[#2B2B2B]/60">
                            You haven&apos;t saved any favourites yet. Explore our
                            collection and save the pieces you love.
                        </p>
                        <Link
                            href="/products"
                            style={{
                                backgroundColor: "#2B2B2B",
                                color: "#FAF6EF",
                            }}
                            className="
    mt-7 inline-flex min-h-[52px] items-center justify-center
    gap-3 border border-[#2B2B2B]
    px-9 py-4 text-[10px] font-medium
    uppercase tracking-[0.2em]
    transition-all duration-300
    hover:border-[#8C6D1F] hover:bg-[#8C6D1F]
  "
                        >
                            <span>Explore Collection</span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                )}

                {/* Wishlist Products */}
                {!loading && !error && products.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-7">
                        {products.map((product) => (
                            <div key={product.id} className="relative min-w-0">
                                <ProductCard
                                    product={product}
                                    showWishlist={false}
                                />

                                <button
                                    type="button"
                                    onClick={() => handleRemove(product.id)}
                                    disabled={removingId !== null}
                                    aria-label={`Remove ${product.name} from wishlist`}
                                    title="Remove from wishlist"
                                    className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center border border-[#E5DED4] bg-[#FAF6EF]/95 text-[#8C6D1F] shadow-sm transition hover:border-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:right-3 sm:top-3"
                                >
                                    {removingId === product.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <Trash2 size={16} strokeWidth={1.6} />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
