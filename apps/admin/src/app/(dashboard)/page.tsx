"use client";

import { PageHeader } from "@/components/shared/page-header";
import { SetupProgressCard } from "@/components/dashboard/setup-progress-card";
import { PerformanceChartCard } from "@/components/dashboard/performance-chart-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { AIInsightsCard } from "@/components/dashboard/ai-insights-card";
import { TerminalStatusCard } from "@/components/dashboard/terminal-status-card";
import { CalendarDays } from "lucide-react";

export default function HomePage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <PageHeader title="Home" subtitle="Welcome back to your dashboard">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <CalendarDays className="h-4 w-4 text-text-tertiary" />
          {today}
        </div>
      </PageHeader>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SetupProgressCard />
          </div>
          <div>
            <QuickActionsCard />
          </div>
        </div>

        <PerformanceChartCard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AIInsightsCard />
          <TerminalStatusCard />
        </div>
      </div>
    </>
  );
}
