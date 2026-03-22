"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/shared/card";
import { customers, customerStats } from "@/data/mock";
import {
  Search,
  Plus,
  Download,
  Users,
  UserPlus,
  Activity,
  ShoppingBag,
  Crown,
  Star,
  Award,
  User,
  MoreHorizontal,
  Mail,
  ChevronRight,
} from "lucide-react";

const tierConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  regular: { label: "Regular", icon: User, color: "text-text-secondary", bg: "bg-surface-hover" },
  silver: { label: "Silver", icon: Star, color: "text-text-secondary", bg: "bg-surface-hover" },
  gold: { label: "Gold", icon: Award, color: "text-warning", bg: "bg-warning-light" },
  vip: { label: "VIP", icon: Crown, color: "text-accent", bg: "bg-accent-light" },
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          c.email.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customerStats.total} registered members`}
      >
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all">
            <Plus className="h-4 w-4" />
            Add customer
          </button>
        </div>
      </PageHeader>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: "Total customers", value: customerStats.total.toLocaleString(), color: "text-text-primary" },
          { icon: UserPlus, label: "New this month", value: `+${customerStats.newThisMonth}`, color: "text-success" },
          { icon: Activity, label: "Active this week", value: customerStats.activeThisWeek.toLocaleString(), color: "text-accent" },
          { icon: ShoppingBag, label: "Avg. spend", value: customerStats.avgSpend, color: "text-text-primary" },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center shrink-0">
                <stat.icon className="h-5 w-5 text-text-tertiary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className={cn("text-xl font-semibold tabular-nums", stat.color)}>
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            aria-label="Search customers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        <span className="text-xs text-text-tertiary ml-auto">
          {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Customer table */}
      <Card padding="none">
        <table className="w-full text-sm" aria-label="Customers list">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Customer
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Tier
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Total spent
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Visits
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Points
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Last visit
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => {
              const tier = tierConfig[customer.tier];
              const TierIcon = tier.icon;
              return (
                <tr
                  key={customer.id}
                  className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-surface-hover flex items-center justify-center shrink-0 text-sm font-semibold text-text-secondary">
                        {customer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {customer.name}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">
                          {customer.phone} · {customer.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                        tier.bg,
                        tier.color
                      )}
                    >
                      <TierIcon className="h-3 w-3" />
                      {tier.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-text-primary">
                    MOP {customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                    {customer.visits}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                    {customer.points.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {customer.lastVisit}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Send message"
                        aria-label={`Send message to ${customer.name}`}
                        className="p-1 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="More"
                        aria-label={`More actions for ${customer.name}`}
                        className="p-1 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
