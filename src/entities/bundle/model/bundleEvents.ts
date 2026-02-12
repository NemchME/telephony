import type { WsEvent } from "@/shared/api/ws/wsClient";
import type { AppDispatch } from "@/app/store/store";

export type BundleWsHandler = (evt: WsEvent, dispatch: AppDispatch) => void;

export const bundleEvents: Record<string, BundleWsHandler> = {};