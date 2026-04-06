import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { selectCallGroups, selectCallGroupAgents } from '@/entities/callGroup/model/callGroupSelectors';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { useUpdateAgentStatusMutation } from '@/entities/callGroup/api/callGroupApi';
import { callGroupActions } from '@/entities/callGroup/model/callGroupSlice';

type Props = {
  onClose: () => void;
};

export function UserGroupsModal({ onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const groups = useAppSelector(selectCallGroups);
  const agents = useAppSelector(selectCallGroupAgents);
  const myUserId = useAppSelector(selectUserId);
  const dispatch = useAppDispatch();
  const [updateAgentStatus] = useUpdateAgentStatusMutation();

  const myAgents = agents.filter((a) => a.userID === myUserId);
  const myAgentMap = new Map(myAgents.map((a) => [a.callGroupID, a]));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleToggle = (groupId: string) => {
    const agent = myAgentMap.get(groupId);
    if (!agent) return;
    const newStatus = agent.status === 1 ? 0 : 1;
    updateAgentStatus({ callGroupID: groupId, userID: myUserId!, status: newStatus });
    dispatch(callGroupActions.upsertCallGroupAgent({ ...agent, status: newStatus }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" ref={ref}>
        <div className="modal-dialog__header">
          <span className="modal-dialog__title">Мои группы</span>
          <button className="modal-dialog__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-dialog__body">
          <div className="user-groups-list">
            {groups.filter((g) => myAgentMap.has(g.id)).map((g) => {
              const agent = myAgentMap.get(g.id)!;
              const isActive = agent.status === 1;
              return (
                <label key={g.id} className="user-groups-item">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => handleToggle(g.id)}
                  />
                  <span className={`status-dot ${isActive ? 'status-dot--online' : 'status-dot--offline'}`} />
                  <span>{g.commonName ?? g.name}</span>
                  {g.numbers && g.numbers.length > 0 && (
                    <span className="badge">{g.numbers.join(', ')}</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
        <div className="modal-dialog__footer">
          <button className="modal-dialog__close-btn" onClick={onClose}>ОК</button>
        </div>
      </div>
    </div>
  );
}
