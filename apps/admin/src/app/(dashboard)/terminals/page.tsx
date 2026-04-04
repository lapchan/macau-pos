import { getTerminals, getTerminalSummary } from "@/lib/terminal-queries";
import { getLocations } from "@/lib/location-queries";
import TerminalsClient from "./terminals-client";

export const metadata = { title: "Terminals" };

export default async function TerminalsPage() {
  let terminals: Awaited<ReturnType<typeof getTerminals>> = [];
  let summary: Awaited<ReturnType<typeof getTerminalSummary>> = {
    total: 0,
    online: 0,
    offline: 0,
    disabled: 0,
    maintenance: 0,
  };
  let locationList: Awaited<ReturnType<typeof getLocations>> = [];

  try {
    [terminals, summary] = await Promise.all([
      getTerminals(),
      getTerminalSummary(),
    ]);
  } catch (error) {
    console.error("Failed to fetch terminals:", error);
  }

  try {
    locationList = await getLocations();
  } catch (error) {
    console.error("[TerminalsPage] Failed to fetch locations:", error);
  }

  return <TerminalsClient terminals={terminals} summary={summary} locations={locationList} />;
}
