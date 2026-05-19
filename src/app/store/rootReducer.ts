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
import { missedCallsReducer } from '@/entities/missedCalls/model/missedCallsSlice';
import { crmReducer } from '@/entities/crm/model/crmSlice';

export const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,

  session: sessionReducer,
  user: userReducer,
  callGroup: callGroupReducer,
  bundle: bundleReducer,
  cdr: cdrReducer,
  verto: vertoReducer,
  missedCalls: missedCallsReducer,
  crm: crmReducer,

  groupOrder: groupOrderReducer,
  viewSettings: viewSettingsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
