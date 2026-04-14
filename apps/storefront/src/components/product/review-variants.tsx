/**
 * ReviewVariants — Tailwind Plus Review components
 *
 * 3 variants:
 *  - "multi-column"     : Reviews in 2-3 column grid
 *  - "with-chart"       : Rating distribution chart + review list
 *  - "with-avatars"     : Simple list with user avatars
 */

import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  avatar?: string;
};

type Props = {
  reviews: Review[];
  averageRating: number;
  totalCount: number;
  ratingDistribution?: { stars: number; count: number }[];
  variant?: "multi-column" | "with-chart" | "with-avatars";
  locale: string;
};

const t = (locale: string, tc: string, en: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt: en, ja: en };
  return m[locale] || en;
};

function Stars({ rating, size = "size-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <StarSolidIcon key={s} className={`${size} ${s <= rating ? "text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

export default function ReviewVariants({ reviews, averageRating, totalCount, ratingDistribution, variant = "with-avatars", locale }: Props) {

  // ── Multi-column grid ──────────────────────────────────
  if (variant === "multi-column") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-gray-900">{t(locale, "顧客評價", "Customer Reviews")}</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-gray-200 p-6">
              <Stars rating={review.rating} />
              <p className="mt-4 text-sm text-gray-600">{review.content}</p>
              <div className="mt-4 flex items-center gap-3">
                {review.avatar ? (
                  <img src={review.avatar} alt="" className="size-8 rounded-full bg-gray-100" />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-sf-accent-light text-xs font-semibold text-sf-accent">
                    {review.author.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{review.author}</p>
                  <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── With summary chart ─────────────────────────────────
  if (variant === "with-chart") {
    const dist = ratingDistribution || [5, 4, 3, 2, 1].map((s) => ({ stars: s, count: 0 }));
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-gray-900">{t(locale, "顧客評價", "Customer Reviews")}</h2>
        <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Summary */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
              <div>
                <Stars rating={Math.round(averageRating)} size="size-5" />
                <p className="mt-1 text-sm text-gray-500">{totalCount} {t(locale, "則評價", "reviews")}</p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {dist.sort((a, b) => b.stars - a.stars).map((item) => {
                const pct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
                return (
                  <div key={item.stars} className="flex items-center gap-3">
                    <span className="w-4 text-right text-sm font-medium text-gray-600">{item.stars}</span>
                    <StarSolidIcon className="size-4 text-yellow-400" />
                    <div className="flex-1 rounded-full bg-gray-200 h-2">
                      <div className="rounded-full bg-yellow-400 h-2" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm text-gray-500">{item.count}</span>
                  </div>
                );
              })}
            </div>
            <button type="button" className="mt-8 w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              {t(locale, "撰寫評價", "Write a review")}
            </button>
          </div>

          {/* Reviews list */}
          <div className="mt-10 lg:col-span-8 lg:mt-0">
            <div className="divide-y divide-gray-200">
              {reviews.map((review) => (
                <div key={review.id} className="py-8">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-sf-accent-light text-sm font-semibold text-sf-accent">
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.author}</p>
                      <Stars rating={review.rating} />
                    </div>
                    <time className="ml-auto text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</time>
                  </div>
                  <p className="mt-4 text-sm text-gray-600">{review.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Simple with avatars (default) ──────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-lg font-medium text-gray-900">{t(locale, "顧客評價", "Customer Reviews")}</h2>
      <div className="mt-2 flex items-center gap-2">
        <Stars rating={Math.round(averageRating)} />
        <span className="text-sm text-gray-500">{averageRating.toFixed(1)} ({totalCount})</span>
      </div>

      <div className="mt-8 divide-y divide-gray-200">
        {reviews.map((review) => (
          <div key={review.id} className="py-8">
            <div className="flex items-start gap-4">
              {review.avatar ? (
                <img src={review.avatar} alt="" className="size-12 rounded-full bg-gray-100" />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                  {review.author.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">{review.author}</h4>
                  <time className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</time>
                </div>
                <Stars rating={review.rating} />
                <p className="mt-3 text-sm text-gray-600">{review.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
