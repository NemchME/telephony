import type { RootState } from '@/app/store/store';

export const selectSession = (s: RootState) => s.session;

export const selectSessionID = (s: RootState) => s.session.sessionID;
export const selectUserName = (s: RootState) => s.session.userName;
export const selectVertoUrl = (s: RootState) => s.session.vertoUrl;

export const selectIsAuthed = (s: RootState) => Boolean(s.session.sessionID);