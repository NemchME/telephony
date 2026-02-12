import type { WsEvent } from "@/shared/api/ws/wsClient";
import type { AppDispatch } from "@/app/store/store";

export type CdrWsHandler = (evt: WsEvent, dispatch: AppDispatch) => void;

export const cdrEvents: Record<string, CdrWsHandler> = {};