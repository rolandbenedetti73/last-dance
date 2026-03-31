import type {
  ArticleWithoutContent,
  Site,
} from "@pantheon-systems/cpub-react-sdk";
import { getArticleURLFromSite } from "@pantheon-systems/cpub-react-sdk/server";
import Link from "next/link";
import { useCallback, useState } from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

export function HomepageArticleGrid({
  articles,
  site,
}: {
  articles: ArticleWithoutContent[];
  site: Site;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:w-2/3 2xl:w-full 2xl:grid-cols-3 3xl:grid-cols-4 2xl:justify-center",
      )}
    >
      {articles.map((article, index) => (
        <ArticleGridCard
          key={article.id}
          article={article}
          isWide={articles.length === 1 || (articles.length > 2 && index === 2)}
          site={site}
        />
      ))}
    </div>
  );
}

export function ArticleGrid({
  articles,
  basePath = "/articles",
  site,
}: {
  articles: ArticleWithoutContent[];
  basePath?: string;
  site: Site;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4")}>
      {articles.map((article) => (
        <ArticleGridCard
          key={article.id}
          article={article}
          basePath={basePath}
          site={site}
        />
      ))}
    </div>
  );
}

interface ArticleGridCardProps {
  article: ArticleWithoutContent;
  basePath?: string;
  imageAltText?: string;
  isWide?: boolean;
  site: Site;
  useSmart?: boolean;
}

// Image size presets for different breakpoints (based on actual measured container sizes)
const IMAGE_SIZES = {
  mobile: { width: 604, height: 340 }, // Mobile: aspect-video 16:9
  sm: { width: 604, height: 340 }, // sm: still mobile-ish
  lg: { width: 726, height: 196 }, // lg: 2 cols
  xl: { width: 458, height: 196 }, // xl: 3 cols
  "2xl": { width: 447, height: 196 }, // 2xl: 3 cols
  "3xl": { width: 382, height: 196 }, // 3xl: 4 cols
} as const;

// Utility to create image URL with size params
function createImageUrl(
  url: string,
  width: number,
  height: number,
  useSmart: boolean = true,
): string | null {
  try {
    const u = new URL(
      url,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost",
    );
    u.searchParams.set("width", width.toString());
    u.searchParams.set("height", height.toString());
    if (useSmart) {
      u.searchParams.set("smart", "true");
    }
    return u.toString();
  } catch {
    return null;
  }
}

// Generate srcset for responsive images
function generateImageSrcSet(
  url: string | null,
  useSmart: boolean = true,
): {
  src: string | null;
  srcSet: string | null;
  sizes: string;
} {
  if (!url) {
    return { src: null, srcSet: null, sizes: "" };
  }

  // Generate srcset with 1x and 2x (retina) versions
  const srcSetEntries = [
    // 1x versions
    `${createImageUrl(url, IMAGE_SIZES.mobile.width, IMAGE_SIZES.mobile.height, useSmart)} ${IMAGE_SIZES.mobile.width}w`,
    `${createImageUrl(url, IMAGE_SIZES.sm.width, IMAGE_SIZES.sm.height, useSmart)} ${IMAGE_SIZES.sm.width}w`,
    `${createImageUrl(url, IMAGE_SIZES.lg.width, IMAGE_SIZES.lg.height, useSmart)} ${IMAGE_SIZES.lg.width}w`,
    `${createImageUrl(url, IMAGE_SIZES.xl.width, IMAGE_SIZES.xl.height, useSmart)} ${IMAGE_SIZES.xl.width}w`,
    `${createImageUrl(url, IMAGE_SIZES["2xl"].width, IMAGE_SIZES["2xl"].height, useSmart)} ${IMAGE_SIZES["2xl"].width}w`,
    `${createImageUrl(url, IMAGE_SIZES["3xl"].width, IMAGE_SIZES["3xl"].height, useSmart)} ${IMAGE_SIZES["3xl"].width}w`,
    // 2x versions for retina
    `${createImageUrl(url, IMAGE_SIZES.mobile.width * 2, IMAGE_SIZES.mobile.height * 2, useSmart)} ${IMAGE_SIZES.mobile.width * 2}w`,
    `${createImageUrl(url, IMAGE_SIZES.sm.width * 2, IMAGE_SIZES.sm.height * 2, useSmart)} ${IMAGE_SIZES.sm.width * 2}w`,
    `${createImageUrl(url, IMAGE_SIZES.lg.width * 2, IMAGE_SIZES.lg.height * 2, useSmart)} ${IMAGE_SIZES.lg.width * 2}w`,
    `${createImageUrl(url, IMAGE_SIZES.xl.width * 2, IMAGE_SIZES.xl.height * 2, useSmart)} ${IMAGE_SIZES.xl.width * 2}w`,
    `${createImageUrl(url, IMAGE_SIZES["2xl"].width * 2, IMAGE_SIZES["2xl"].height * 2, useSmart)} ${IMAGE_SIZES["2xl"].width * 2}w`,
  ].filter((entry) => !entry.includes("null"));

  // Sizes attribute tells browser which image to use at each breakpoint
  const sizes = [
    "(max-width: 640px) 604px", // Mobile: aspect-video
    "(max-width: 1024px) 604px", // sm: still mobile-ish
    "(max-width: 1280px) 726px", // lg: 2 columns
    "(max-width: 1536px) 458px", // xl: 3 columns
    "(max-width: 1920px) 447px", // 2xl: 3 columns
    "382px", // 3xl: 4 columns
  ].join(", ");

  return {
    src: createImageUrl(url, IMAGE_SIZES.xl.width, IMAGE_SIZES.xl.height), // Fallback
    srcSet: srcSetEntries.join(", "),
    sizes,
  };
}

export function ArticleGridCard({
  article,
  basePath = "/articles",
  imageAltText,
  isWide = false,
  site,
  useSmart = true,
}: ArticleGridCardProps) {
  const targetHref = getArticleURLFromSite(article, site, basePath);
  const rawImageSrc = (article.metadata?.["image"] as string) || null;
  const imageProps = generateImageSrcSet(rawImageSrc, useSmart);

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-clip rounded-xl shadow-lg ring-1 ring-gray-300/50",
        isWide
          ? "sm:col-span-2 sm:flex-row 2xl:col-span-1 2xl:flex-col 2xl:only:col-span-2 2xl:only:flex-row"
          : "",
      )}
    >
      <div
        className={cn(
          "aspect-video w-full flex-shrink-0 overflow-hidden sm:h-[196px]",
          isWide
            ? "sm:h-full sm:max-w-[49%] 2xl:h-[196px] 2xl:max-w-[100%] 2xl:group-only:h-full 2xl:group-only:max-w-[49%]"
            : "max-w-[100%]",
        )}
      >
        <GridItemCoverImage
          imageProps={imageProps}
          imageAltText={imageAltText || `Cover image for ${article.title}`}
        />
      </div>
      <div
        className={cn(
          "flex flex-grow flex-col justify-between p-8",
          isWide && "sm:py-24 2xl:py-8 2xl:group-only:py-24",
        )}
      >
        <div>
          <h1 className="mb-3 text-xl font-semibold leading-7">
            {article.title}
          </h1>
          {article.metadata?.["Description"] ? (
            <p className="line-clamp-3 min-h-[4.5rem] text-gray-600">
              {article.metadata?.["Description"]?.toString() || ""}
            </p>
          ) : null}
        </div>
        <Link href={targetHref} className="mt-8">
          <Button size="large">View</Button>
        </Link>
      </div>
    </div>
  );
}

function GridItemCoverImage({
  imageProps,
  imageAltText,
}: {
  imageProps: { src: string | null; srcSet: string | null; sizes: string };
  imageAltText?: string | null | undefined;
}) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) {
      setHasLoaded(true);
    }
  }, []);

  return (
    <>
      {imageProps.src != null ? (
        <img
          ref={imgRef}
          src={imageProps.src}
          srcSet={imageProps.srcSet || undefined}
          sizes={imageProps.sizes}
          alt={imageAltText || undefined}
          onLoad={() => setHasLoaded(true)}
          className={cn("h-full w-full object-cover", {
            block: hasLoaded,
            hidden: !hasLoaded,
          })}
        />
      ) : null}

      {imageProps.src == null || !hasLoaded ? (
        <div className="h-full w-full bg-gradient-to-t from-neutral-800 to-neutral-100" />
      ) : null}
    </>
  );
}
