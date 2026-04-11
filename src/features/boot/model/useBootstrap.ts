import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectIsAuthed } from '@/entities/session/model/sessionSelectors';
import { userApi } from '@/entities/user/api/userApi';
import { callGroupApi } from '@/entities/callGroup/api/callGroupApi';
import { bundleApi } from '@/entities/bundle/api/bundleApi';
import { userActions } from '@/entities/user/model/userSlice';
import {
  setCallGroups,
  setCallGroupAgents,
  setCallGroupAgentStates,
  setCallGroupStates,
} from '@/entities/callGroup/model/callGroupSlice';
import { bundleActions } from '@/entities/bundle/model/bundleSlice';
import { groupOrderActions } from '@/features/realtime/model/groupOrderSlice';

export function useBootstrap() {
  const dispatch = useAppDispatch();
  const isAuthed = useAppSelector(selectIsAuthed);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (!isAuthed) {
      setBooted(false);
      return;
    }

    let cancelled = false;

    async function boot() {
      try {
        const opts = { forceRefetch: true } as const;
        const [usersRes, userStatesRes, groupsRes, agentsRes, agentStatesRes, groupStatesRes, bundlesRes] =
          await Promise.all([
            dispatch(userApi.endpoints.users.initiate(undefined, opts)).unwrap(),
            dispatch(userApi.endpoints.userStates.initiate(undefined, opts)).unwrap(),
            dispatch(callGroupApi.endpoints.getCallGroups.initiate(undefined, opts)).unwrap(),
            dispatch(callGroupApi.endpoints.getCallGroupAgents.initiate(undefined, opts)).unwrap(),
            dispatch(callGroupApi.endpoints.getCallGroupAgentStates.initiate(undefined, opts)).unwrap(),
            dispatch(callGroupApi.endpoints.getCallGroupStates.initiate(undefined, opts)).unwrap(),
            dispatch(bundleApi.endpoints.getBundleState.initiate(undefined, opts)).unwrap(),
          ]);

        if (cancelled) return;

        dispatch(userActions.upsertMany(usersRes?.elements ?? []));
        dispatch(userActions.setUserStates(userStatesRes?.elements ?? []));
        dispatch(setCallGroups(groupsRes?.elements ?? []));
        dispatch(setCallGroupAgents(agentsRes?.elements ?? []));
        dispatch(setCallGroupAgentStates(agentStatesRes?.elements ?? []));
        dispatch(setCallGroupStates(groupStatesRes?.elements ?? []));

        const bundles = bundlesRes?.elements ?? [];
        dispatch(bundleActions.setAll(bundles));

        dispatch(groupOrderActions.ensureContains((groupsRes?.elements ?? []).map((g: { id: string }) => g.id)));

        setBooted(true);
      } catch (err) {
        console.error('Bootstrap failed:', err);
        if (!cancelled) setBooted(true);
      }
    }

    boot();
    return () => { cancelled = true; };
  }, [isAuthed, dispatch]);

  return booted;
}
