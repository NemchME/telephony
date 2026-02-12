
import type { AppDispatch } from "@/app/store/store";
import type { WsEvent } from "@/shared/api/ws/wsClient";

export type UserWsHandler = (evt: WsEvent, dispatch: AppDispatch) => void;

export const userEvents: Record<string, UserWsHandler> = {};