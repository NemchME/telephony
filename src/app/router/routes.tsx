import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";
import { AppLayout } from "@/shared/ui/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";

import { LoginPage } from "@/pages/LoginPage";
import { CallGroupsPage } from "@/pages/CallGroupsPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </RequireAuth>
    ),
  },

    {
    path: '/call-groups',
    element: (
      <RequireAuth>
        <AppLayout>
          <CallGroupsPage/>
        </AppLayout>
      </RequireAuth>
    ),
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);