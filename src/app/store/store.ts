import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { apiSlice } from './api/apiSlice';
import { wsMiddleware } from './wsMiddleware';
import { listenerMiddleware } from './listenerMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault()
      .prepend(listenerMiddleware.middleware)
      .concat(apiSlice.middleware)
      .concat(wsMiddleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;