import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';
import { setSession, clearSession } from '@/entities/session/model/sessionSlice';

export type LoginRequest = { login: string; password: string };

export type LoginResponse = {
  data: {
    id?: string;
    userID?: string;
    userName: string;
    user?: unknown;
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

        dispatch(
          setSession({
            sessionID: data.data.sessionID,
            userName: data.data.userName,
            user: data.data.user ?? null,
            vertoUrl: data.data.vertoUrl ?? null,
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