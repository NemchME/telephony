import type { RootState } from '@/app/store/store';

export const selectSession = (s: RootState) => s.session;
export const selectSessionID = (s: RootState) => s.session.sessionID;
export const selectUserName = (s: RootState) => s.session.userName;
export const selectUserId = (s: RootState) => s.session.userId;
export const selectUserCommonName = (s: RootState) => s.session.userCommonName;
export const selectUserNumbers = (s: RootState) => s.session.userNumbers;
export const selectAvailStatus = (s: RootState) => s.session.availStatus;
export const selectVertoUrl = (s: RootState) => s.session.vertoUrl;
export const selectIsAuthed = (s: RootState) => Boolean(s.session.sessionID);
export const selectWsStatus = (s: RootState) => s.session.wsStatus;
