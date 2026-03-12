import { combineReducers } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';

import { sessionReducer } from '@/entities/session/model/sessionSlice';
import { userReducer } from '@/entities/user/model/userSlice';
import { callGroupReducer } from '@/entities/callGroup/model/callGroupSlice';
import { bundleReducer } from '@/entities/bundle/model/bundleSlice';
import { cdrReducer } from '@/entities/cdr/model/cdrSlice';

import { groupOrderReducer } from '@/features/realtime/model/groupOrderSlice';
import { viewSettingsReducer } from '@/features/realtime/model/viewSettingsSlice';
import { vertoReducer } from '@/entities/call/model/vertoSlice';

export const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,

  session: sessionReducer,
  user: userReducer,
  callGroup: callGroupReducer,
  bundle: bundleReducer,
  cdr: cdrReducer,
  verto: vertoReducer,

  groupOrder: groupOrderReducer,
  viewSettings: viewSettingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
