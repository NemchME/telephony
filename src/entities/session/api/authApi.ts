import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';
import { setSession, clearSession } from '@/entities/session/model/sessionSlice';
import type { SessionUser } from '@/entities/session/model/sessionSlice';
import { userActions } from '@/entities/user/model/userSlice';
import { callGroupActions } from '@/entities/callGroup/model/callGroupSlice';
import { bundleActions } from '@/entities/bundle/model/bundleSlice';
import { cdrActions } from '@/entities/cdr/model/cdrSlice';

export type LoginRequest = { login: string; password: string; useVerto?: boolean };

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
      busyStatus?: string;
      dod?: string;
      crmList?: string[];
      domainID?: string;
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
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        const u = data.data.user;

        const userId = data.data.userID ?? u?.id;

        let normalizedUser = u;
        if (u && u.availStatus != null && (!u.busyStatus || u.busyStatus === '_')) {
          normalizedUser = { ...u, busyStatus: u.availStatus };
        }

        let compoundStatus: string | undefined;
        if (normalizedUser?.availStatus != null) {
          const avail = normalizedUser.availStatus;
          const busy = normalizedUser.busyStatus;
          compoundStatus =
            busy && busy !== '_' && busy !== avail ? `${avail}_${busy}` : `${avail}_${avail}`;
        }

        dispatch(
          setSession({
            sessionID: data.data.sessionID,
            userName: data.data.userName,
            ...(userId != null ? { userId } : {}),
            ...(normalizedUser?.commonName != null ? { userCommonName: normalizedUser.commonName } : {}),
            userNumbers: normalizedUser?.numbers ?? [],
            ...(compoundStatus != null ? { availStatus: compoundStatus } : {}),
            vertoUrl: data.data.vertoUrl ?? null,
            user: normalizedUser ? (normalizedUser as SessionUser) : null,
            useVerto: arg.useVerto ?? true,
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
          dispatch(userActions.reset());
          dispatch(callGroupActions.reset());
          dispatch(bundleActions.clear());
          dispatch(cdrActions.reset());
          dispatch(apiSlice.util.resetApiState());
          dispatch(clearSession());
        }
      },
      invalidatesTags: ['Session'],
    }),
  }),
});

export const { useLoginMutation, useTerminateMutation } = authApi;