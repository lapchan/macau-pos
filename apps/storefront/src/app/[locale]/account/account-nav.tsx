"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserIcon,
  MapPinIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

const iconMap = {
  user: UserIcon,
  orders: ShoppingBagIcon,
  address: MapPinIcon,
} as const;

type Props = {
  items: { href: string; label: string; iconName: keyof typeof iconMap }[];
};

export default function AccountNav({ items }: Props) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
      {items.map((item) => {
        const Icon = iconMap[item.iconName];
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-gray-100 text-indigo-600"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Icon className={`hidden size-5 shrink-0 lg:block ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
