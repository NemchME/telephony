import { apiSlice } from '@/app/store/api/apiSlice';
import { rpcMethods } from '@/shared/api/rpc/methods';

export type MakeCallArgs = {
  cgpn: string;
  cdpn: string;
};

export type HangupCallArgs = {
  callId: string;
};

export type TransferCallArgs = {
  callId: string;
  destination: string;
};

export const callApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    makeCall: build.mutation<unknown, MakeCallArgs>({
      query: ({ cgpn, cdpn }) => rpcMethods.callCreate(cgpn, cdpn),
    }),
    hangupCall: build.mutation<unknown, HangupCallArgs>({
      query: ({ callId }) => rpcMethods.callHangup(callId),
    }),
    transferCall: build.mutation<unknown, TransferCallArgs>({
      query: ({ callId, destination }) => rpcMethods.callTransfer(callId, destination),
    }),
    consultTransferCall: build.mutation<unknown, TransferCallArgs>({
      query: ({ callId, destination }) => rpcMethods.callConsultTransfer(callId, destination),
    }),
  }),
});

export const {
  useMakeCallMutation,
  useHangupCallMutation,
  useTransferCallMutation,
  useConsultTransferCallMutation,
} = callApi;
