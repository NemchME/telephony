import { apiSlice } from "@/app/store/api/apiSlice";
import { setSession, clearSession } from "@/entities/session/model/sessionSlice";

type LoginArgs = { login: string; password: string };

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, LoginArgs>({
      query: ({ login, password }) => ({
        method: "Authentificate",
        data: { login, password },
        requestPurpose: "clientView",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          const payload = data?.data ?? data;

          dispatch(
            setSession({
              sessionID: payload.sessionID ?? null,
              userName: payload.userName ?? payload.userName ?? payload.user?.name ?? null,
              user: payload.user ?? null,
              vertoUrl: payload.vertoUrl ?? null,
            })
          );
        } catch {
          // noop
        }
      },
    }),

    terminate: builder.mutation<void, void>({
      query: () => ({ method: "Terminate" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearSession());
        }
      },
    }),
  }),
});

export const { useLoginMutation, useTerminateMutation } = authApi;