"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";

type CartItemData = {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string | null;
  inStock: boolean;
  maxQuantity?: number;
};

type Props = {
  item: CartItemData;
  locale: string;
  currency?: string;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CartItemRow({ item, locale, currency = "MOP", onUpdateQuantity, onRemove }: Props) {
  return (
    <li className="flex py-6">
      {/* Image */}
      <div className="size-24 shrink-0 overflow-hidden rounded-md border border-gray-200">
        {item.image ? (
          <img src={item.image} alt={item.name} className="size-full object-cover object-center" />
        ) : (
          <div className="size-full flex items-center justify-center bg-gray-100 text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>{item.name}</h3>
            <p className="ml-4">{currency} {(item.price * item.quantity).toFixed(2)}</p>
          </div>
          {item.variant && (
            <p className="mt-1 text-sm text-gray-500">{item.variant}</p>
          )}
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          {/* Quantity selector */}
          <div className="flex items-center gap-2">
            <label className="text-gray-500">
              {t(locale, "數量", "Qty", "Qtd", "数量")}
            </label>
            <select
              value={item.quantity}
              onChange={(e) => onUpdateQuantity?.(item.id, parseInt(e.target.value))}
              className="rounded-md border border-gray-300 py-1 pl-2 pr-7 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Array.from({ length: Math.min(item.maxQuantity || 10, 10) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={() => onRemove?.(item.id)}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {t(locale, "移除", "Remove", "Remover", "削除")}
          </button>
        </div>
      </div>
    </li>
  );
}
