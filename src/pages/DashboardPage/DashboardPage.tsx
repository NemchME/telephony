import { Stack } from "@mui/material";
import { SummaryCards } from "./ui/SummaryCards";
import { LiveBundlesPanel } from "./ui/LiveBundlesPanel";

export function DashboardPage() {
  return (
    <Stack spacing={2}>
      <SummaryCards />
      <LiveBundlesPanel />
    </Stack>
  );
}