"use client";

import TerminalGuard from "./terminal-guard";
import { useHeartbeat } from "@/lib/use-heartbeat";

export default function AppShell({ children }: { children: React.ReactNode }) {
  useHeartbeat();

  return <TerminalGuard>{children}</TerminalGuard>;
}
