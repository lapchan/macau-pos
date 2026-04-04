import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/outline";

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
  ratingDistribution: { stars: number; count: number }[];
  locale: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rating ? (
          <StarSolidIcon key={star} className="size-4 text-yellow-400" />
        ) : (
          <StarIcon key={star} className="size-4 text-gray-300" />
        )
      )}
    </div>
  );
}

export default function ProductReviews({ reviews, averageRating, totalCount, ratingDistribution, locale }: Props) {
  return (
    <div id="reviews" className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <h2 className="text-lg font-medium text-gray-900">
        {t(locale, "顧客評價", "Customer Reviews", "Avaliações dos Clientes", "カスタマーレビュー")}
      </h2>

      <div className="mt-6 lg:grid lg:grid-cols-12 lg:gap-x-8">
        {/* Rating summary */}
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
            <div>
              <StarRating rating={Math.round(averageRating)} />
              <p className="mt-1 text-sm text-gray-500">
                {t(locale, `${totalCount} 則評價`, `Based on ${totalCount} reviews`, `Baseado em ${totalCount} avaliações`, `${totalCount}件のレビュー`)}
              </p>
            </div>
          </div>

          {/* Distribution bars */}
          <div className="mt-6 space-y-3">
            {ratingDistribution.sort((a, b) => b.stars - a.stars).map((item) => {
              const pct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
              return (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="w-6 text-right text-sm font-medium text-gray-600">{item.stars}</span>
                  <StarSolidIcon className="size-4 text-yellow-400" />
                  <div className="flex-1 rounded-full bg-gray-200 h-2.5">
                    <div
                      className="rounded-full bg-yellow-400 h-2.5 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-gray-500">{item.count}</span>
                </div>
              );
            })}
          </div>

          {/* Write a review button */}
          <div className="mt-8">
            <button
              type="button"
              className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              {t(locale, "撰寫評價", "Write a review", "Escrever avaliação", "レビューを書く")}
            </button>
          </div>
        </div>

        {/* Review list */}
        <div className="mt-10 lg:col-span-8 lg:mt-0">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                {t(locale, "暫無評價。成為第一位評價的人！", "No reviews yet. Be the first to review!", "Nenhuma avaliação ainda.", "まだレビューはありません。")}
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <div className="-my-12 divide-y divide-gray-200">
                {reviews.map((review) => (
                  <div key={review.id} className="py-12">
                    <div className="flex items-center gap-3">
                      {review.avatar ? (
                        <img src={review.avatar} alt="" className="size-10 rounded-full bg-gray-100" />
                      ) : (
                        <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{review.author}</h4>
                        <StarRating rating={review.rating} />
                      </div>
                      <time className="ml-auto text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString(locale === "en" ? "en-US" : "zh-TW")}
                      </time>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
