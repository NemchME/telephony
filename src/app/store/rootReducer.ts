import { combineReducers } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import { sessionReducer } from "@/entities/session/model/sessionSlice";

export const rootReducer = combineReducers({
  session: sessionReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});