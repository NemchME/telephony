import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';
import { setSession, clearSession } from '@/entities/session/model/sessionSlice';
import type { SessionUser } from '@/entities/session/model/sessionSlice';

export type LoginRequest = { login: string; password: string };

export type LoginResponse = {
  data: {
    userID?: string;
    userName: string;
    user?: {
      id: string;
      name: string;
      commonName?: string;
      numbers?: string[];
      adminStatus?: number;
      availStatus?: string;
      dod?: string;
    };
    sessionID: string;
    vertoUrl?: string;
    devices?: unknown[];
  };
};

export const authApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, LoginRequest>({
      query: ({ login, password }) => rpcMethods.authenticate(login, password),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        const u = data.data.user;

        const userId = data.data.userID ?? u?.id;
        dispatch(
          setSession({
            sessionID: data.data.sessionID,
            userName: data.data.userName,
            ...(userId != null ? { userId } : {}),
            ...(u?.commonName != null ? { userCommonName: u.commonName } : {}),
            userNumbers: u?.numbers ?? [],
            ...(u?.availStatus != null ? { availStatus: u.availStatus } : {}),
            vertoUrl: data.data.vertoUrl ?? null,
            user: u ? (u as SessionUser) : null,
          }),
        );
      },
      invalidatesTags: ['Session'],
    }),

    terminate: build.mutation<void, void>({
      query: () => rpcMethods.terminate(),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearSession());
        }
      },
      invalidatesTags: ['Session'],
    }),
  }),
});

export const { useLoginMutation, useTerminateMutation } = authApi;
