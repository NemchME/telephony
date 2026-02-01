import type { PropsWithChildren } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store/store";
import { CssBaseline } from "@mui/material";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
        <CssBaseline />
        {children}
    </Provider>
  );
}