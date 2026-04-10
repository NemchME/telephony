import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';

export type User = {
  id: string;
  name?: string;
  login?: string;
  commonName?: string;
  adminStatus?: number;
  availStatus?: string;
  busyStatus?: string;
  numbers?: string[];
  profiles?: string[];
  groupVision?: string[];
  lastModifiedTime?: number;
};

export type UsersResponse = { elements: User[] };

export type UserState = {
  id: string;
  config?: User;
  networkStatus?: number;
  busyCount?: number;
  lastModified?: number;
  lastModifiedAvailStatus?: number;
};

export type UserStatesResponse = { elements: UserState[] };

export const userApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    users: build.query<UsersResponse, void>({
      query: () => rpcMethods.usersList({}),
      providesTags: ['User'],
    }),

    userStates: build.query<UserStatesResponse, void>({
      query: () => rpcMethods.userStatesList({}),
      providesTags: ['UserState'],
    }),

    updateMyAvailStatus: build.mutation<void, { userId: string; availStatus: string; busyStatus?: string }>({
      query: ({ userId, availStatus, busyStatus }) => rpcMethods.userSetAvailStatus(userId, availStatus, busyStatus),
      invalidatesTags: ['User', 'UserState'],
    }),

    updateUserSettings: build.mutation<void, { userId: string; settings: string }>({
      query: ({ userId, settings }) => rpcMethods.userUpdateSettings(userId, settings),
    }),
  }),
});

export const {
  useUsersQuery,
  useUserStatesQuery,
  useUpdateMyAvailStatusMutation,
  useUpdateUserSettingsMutation,
} = userApi;