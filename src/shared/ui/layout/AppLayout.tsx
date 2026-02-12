import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Box sx={{ display: "grid", gridTemplateRows: "64px 1fr", minHeight: "100vh" }}>
      <TopBar />
      <Box sx={{ display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <Sidebar />
        <Box component="main" sx={{ p: 2 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}