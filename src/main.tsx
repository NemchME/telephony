import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import { AppProviders } from "@/app/providers/AppProviders";
import App from "@/app/App";
import { registerServiceWorker } from "@/shared/lib/notifications/notifications";

void registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);