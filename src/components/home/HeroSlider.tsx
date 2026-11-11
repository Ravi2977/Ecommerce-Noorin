"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/* =========================================
   TYPES
========================================= */

type HeroSlide = {
  id: number | string;
  mediaType?: "IMAGE" | "VIDEO" | string;
  imageUrl?: string | null;
  mobileImageUrl?: string | null;
  videoUrl?: string | null;
  mobileVideoUrl?: string | null;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  showText?: boolean;
  showButton?: boolean;
  textAlign?: "LEFT" | "CENTER" | "RIGHT" | string;
  verticalAlign?: "TOP" | "MIDDLE" | "BOTTOM" | string;
  textColor?: "LIGHT" | "DARK" | string;
  buttonStyle?: "SOLID" | "WHITE" | "OUTLINE" | "GOLD" | string;
  overlay?: number | string;
  slideLink?: string | null;
  active?: boolean;
};

type HeroSettings = {
  autoplay?: boolean;
  intervalSeconds?: number;
  showArrows?: boolean;
  showDots?: boolean;
  pauseOnHover?: boolean;
  transition?: "SLIDE" | "FADE" | string;
  height?: "SMALL" | "MEDIUM" | "LARGE" | string;
};

type HeroSliderProps = {
  slides?: HeroSlide[];
  settings?: HeroSettings | null;
};

/* =========================================
   STYLE MAPS
========================================= */

// Desktop ratio matches the 2048x747 banner, mobile matches 750x872.
const HEIGHT_CLASSES: Record<string, string> = {
  SMALL: "aspect-[750/640] md:aspect-[2048/560]",
  MEDIUM: "aspect-[750/760] md:aspect-[2048/650]",
  LARGE: "aspect-[750/872] md:aspect-[2048/747]",
};

const H_ALIGN: Record<string, string> = {
  LEFT: "items-start text-left",
  CENTER: "items-center text-center",
  RIGHT: "items-end text-right",
};

const V_ALIGN: Record<string, string> = {
  TOP: "justify-start pt-12 sm:pt-16",
  MIDDLE: "justify-center py-12 sm:py-16",
  BOTTOM: "justify-end pb-14 sm:pb-20",
};

const BUTTON_BASE =
  "pointer-events-auto mt-6 inline-flex min-h-[48px] max-w-full items-center justify-center rounded-sm border px-7 py-3 text-center text-xs font-semibold leading-normal tracking-[0.12em] shadow-md transition-all duration-300 sm:mt-8 sm:min-h-[52px] sm:px-9 sm:text-sm";

function getButtonClass(style: string | undefined, dark: boolean) {
  switch (style?.toUpperCase()) {
    case "WHITE":
      return "border-white bg-white text-[#2B2B2B] hover:border-[#C9A24B] hover:bg-[#C9A24B] hover:text-white";

    case "OUTLINE":
      return dark
        ? "border-[#2B2B2B] bg-transparent text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-[#FAF6EF]"
        : "border-white bg-transparent text-white hover:bg-white hover:text-[#2B2B2B]";

    case "GOLD":
      return "border-[#C9A24B] bg-[#C9A24B] text-[#2B2B2B] hover:border-[#8C6D1F] hover:bg-[#8C6D1F] hover:text-white";

    // SOLID (theme default)
    default:
      return "border-[#2B2B2B] bg-[#2B2B2B] text-[#FAF6EF] hover:border-[#8C6D1F] hover:bg-[#8C6D1F] hover:text-white";
  }
}

/* =========================================
   HELPERS
========================================= */

const VIDEO_SAFETY_TIMEOUT_MS = 60000;

function isVideoSlide(slide?: HeroSlide) {
  return (
    slide?.mediaType?.toUpperCase() === "VIDEO" &&
    Boolean(slide.videoUrl || slide.mobileVideoUrl)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/* =========================================
   COMPONENT
========================================= */

export default function HeroSlider({
  slides = [],
  settings,
}: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hovered, setHovered] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hoverPausedRef = useRef(false);

  const slideCount = slides.length;
  const hasMultipleSlides = slideCount > 1;
  const index = slideCount ? Math.min(activeIndex, slideCount - 1) : 0;
  const currentSlide = slides[index];
  const currentIsVideo = isVideoSlide(currentSlide);

  /* Backend settings */
  const autoplay = settings?.autoplay !== false;
  const showArrows = settings?.showArrows !== false;
  const showDots = settings?.showDots !== false;
  const pauseOnHover = settings?.pauseOnHover !== false;
  const isSlideTransition = settings?.transition?.toUpperCase() === "SLIDE";
  const intervalMs =
    clamp(Number(settings?.intervalSeconds) || 5, 2, 30) * 1000;
  const heightClass =
    HEIGHT_CLASSES[settings?.height?.toUpperCase() ?? "LARGE"] ??
    HEIGHT_CLASSES.LARGE;

  hoverPausedRef.current = hovered && pauseOnHover;

  const goToNext = useCallback(() => {
    setActiveIndex((current) =>
      current >= slideCount - 1 ? 0 : current + 1
    );
  }, [slideCount]);

  const goToPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current <= 0 ? slideCount - 1 : current - 1
    );
  }, [slideCount]);

  /* Mobile / desktop media switching */
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  /* Autoplay timer.
     Image slides use the interval from the backend.
     Video slides move on when the video ends (or after a safety timeout). */
  useEffect(() => {
    if (!autoplay || !hasMultipleSlides) return;
    if (hovered && pauseOnHover) return;

    const timeout = window.setTimeout(
      goToNext,
      currentIsVideo ? VIDEO_SAFETY_TIMEOUT_MS : intervalMs
    );

    return () => window.clearTimeout(timeout);
  }, [
    autoplay,
    hasMultipleSlides,
    hovered,
    pauseOnHover,
    currentIsVideo,
    intervalMs,
    goToNext,
    index,
  ]);

  /* Play only the active video, pause the rest */
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;

      if (i === index) {
        video.currentTime = 0;
        video.play().catch(() => {
          /* autoplay blocked, poster image stays visible */
        });
      } else {
        video.pause();
      }
    });
  }, [index, slideCount]);

  /* Swipe support */
  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;

    if (!start || !hasMultipleSlides) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goToNext();
      else goToPrevious();
    }
  };

  if (!currentSlide) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-[#E9DFD2]"
      aria-roledescription="carousel"
      aria-label="NOORINE featured collections"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider */}
      <div className={`relative w-full ${heightClass}`}>
        <div
          className={
            isSlideTransition
              ? "flex h-full w-full transition-transform duration-700 ease-in-out"
              : "relative h-full w-full"
          }
          style={
            isSlideTransition
              ? { transform: `translateX(-${index * 100}%)` }
              : undefined
          }
        >
          {slides.map((slide, i) => {
            const isActive = i === index;

            /* Media */
            const desktopImage = slide.imageUrl || slide.mobileImageUrl;
            const mobileImage = slide.mobileImageUrl || slide.imageUrl;
            const showVideo = isVideoSlide(slide);

            const videoSrc = isMobile
              ? slide.mobileVideoUrl || slide.videoUrl
              : slide.videoUrl || slide.mobileVideoUrl;

            const poster = (isMobile ? mobileImage : desktopImage) || undefined;

            /* Text and button settings */
            const dark = slide.textColor?.toUpperCase() === "DARK";
            const hKey = slide.textAlign?.toUpperCase() ?? "LEFT";
            const vKey = slide.verticalAlign?.toUpperCase() ?? "MIDDLE";
            const overlay = clamp(Number(slide.overlay) || 0, 0, 100);

            const hasText =
              slide.showText !== false &&
              Boolean(slide.title || slide.subtitle);

            const hasButton =
              slide.showButton !== false &&
              Boolean(slide.buttonText && slide.buttonLink);

            const TitleTag = i === 0 ? "h1" : "h2";

            return (
              <div
                key={slide.id}
                aria-hidden={!isActive}
                className={
                  isSlideTransition
                    ? "relative h-full w-full shrink-0 overflow-hidden"
                    : `absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        isActive
                          ? "z-10 opacity-100"
                          : "pointer-events-none z-0 opacity-0"
                      }`
                }
              >
                {/* Image (also acts as the poster layer for video slides) */}
                {(desktopImage || mobileImage) && (
                  <picture>
                    {mobileImage && (
                      <source
                        media="(max-width: 767px)"
                        srcSet={mobileImage}
                      />
                    )}

                    {desktopImage && (
                      <img
                        src={desktopImage}
                        alt={slide.title || "NOORINE collection"}
                        className="absolute inset-0 h-full w-full object-cover object-center"
                        fetchPriority={i === 0 ? "high" : "auto"}
                      />
                    )}
                  </picture>
                )}

                {/* Video */}
                {showVideo && videoSrc && (
                  <video
                    key={videoSrc}
                    ref={(element) => {
                      videoRefs.current[i] = element;
                      if (element) element.muted = true;
                    }}
                    src={videoSrc}
                    poster={poster}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    autoPlay={isActive}
                    muted
                    playsInline
                    loop={!hasMultipleSlides || !autoplay}
                    preload={i === 0 ? "auto" : "metadata"}
                    aria-hidden="true"
                    onEnded={(event) => {
                      if (!isActive) return;

                      if (hoverPausedRef.current) {
                        event.currentTarget.currentTime = 0;
                        event.currentTarget.play().catch(() => {});
                        return;
                      }

                      goToNext();
                    }}
                    onError={() => {
                      if (isActive && hasMultipleSlides && autoplay) {
                        goToNext();
                      }
                    }}
                  />
                )}

                {/* Overlay (value comes from backend, 0 to 100) */}
                {overlay > 0 && (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundColor: dark
                        ? `rgba(250, 246, 239, ${overlay / 100})`
                        : `rgba(0, 0, 0, ${overlay / 100})`,
                    }}
                  />
                )}

                {/* Extra bottom shade so light text stays readable */}
                {!dark && vKey === "BOTTOM" && (hasText || hasButton) && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                )}

                {/* Whole-slide link */}
                {slide.slideLink && (
                  <Link
                    href={slide.slideLink}
                    aria-label={slide.title || "View collection"}
                    tabIndex={isActive ? 0 : -1}
                    className="absolute inset-0 z-10"
                  />
                )}

                {/* Text and button */}
                {(hasText || hasButton) && (
                  <div className="pointer-events-none absolute inset-0 z-20">
                    <div
                      className={`mx-auto flex h-full w-full max-w-[1440px] flex-col px-6 sm:px-10 lg:px-16 ${
                        V_ALIGN[vKey] ?? V_ALIGN.MIDDLE
                      } ${H_ALIGN[hKey] ?? H_ALIGN.LEFT} ${
                        dark ? "text-[#2B2B2B]" : "text-white"
                      }`}
                    >
                      <div
                        className={`flex w-full flex-col ${
                          hKey === "CENTER" ? "max-w-2xl" : "max-w-xl"
                        } ${H_ALIGN[hKey] ?? H_ALIGN.LEFT}`}
                      >
                        {hasText && slide.subtitle && (
                          <p
                            className={`mb-3 text-xs font-medium uppercase leading-relaxed tracking-[0.18em] sm:mb-4 sm:text-sm sm:tracking-[0.25em] ${
                              dark ? "" : "drop-shadow-md"
                            }`}
                          >
                            {slide.subtitle}
                          </p>
                        )}

                        {hasText && slide.title && (
                          <TitleTag
                            className={`max-w-full text-balance font-serif text-4xl font-medium leading-[1.08] sm:text-5xl lg:text-7xl ${
                              dark ? "" : "drop-shadow-md"
                            }`}
                          >
                            {slide.title}
                          </TitleTag>
                        )}

                        {hasButton && slide.buttonLink && (
                          <Link
                            href={slide.buttonLink}
                            tabIndex={isActive ? 0 : -1}
                            className={`${BUTTON_BASE} ${getButtonClass(
                              slide.buttonStyle,
                              dark
                            )}`}
                          >
                            {slide.buttonText}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Previous Button */}
      {hasMultipleSlides && showArrows && (
        <button
          type="button"
          onClick={goToPrevious}
          aria-label="Previous slide"
          className="
            absolute left-3 top-1/2 z-30
            flex h-9 w-9 -translate-y-1/2
            items-center justify-center
            rounded-full border border-white/80
            bg-[#2B2B2B]/55 text-white
            shadow-md backdrop-blur-sm
            transition-colors hover:bg-[#8C6D1F]
            sm:left-6 sm:h-11 sm:w-11
          "
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Next Button */}
      {hasMultipleSlides && showArrows && (
        <button
          type="button"
          onClick={goToNext}
          aria-label="Next slide"
          className="
            absolute right-3 top-1/2 z-30
            flex h-9 w-9 -translate-y-1/2
            items-center justify-center
            rounded-full border border-white/80
            bg-[#2B2B2B]/55 text-white
            shadow-md backdrop-blur-sm
            transition-colors hover:bg-[#8C6D1F]
            sm:right-6 sm:h-11 sm:w-11
          "
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* Slide Indicators */}
      {hasMultipleSlides && showDots && (
        <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 sm:bottom-6">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={index === i ? "true" : undefined}
              className={`h-2 rounded-full shadow-sm transition-all duration-300 ${
                index === i
                  ? "w-7 bg-[#C9A24B]"
                  : "w-2 bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}