import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { selectCallGroups, selectCallGroupAgents } from '@/entities/callGroup/model/callGroupSelectors';
import { selectUserId } from '@/entities/session/model/sessionSelectors';

type Props = {
  onClose: () => void;
};

export function UserGroupsModal({ onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const groups = useAppSelector(selectCallGroups);
  const agents = useAppSelector(selectCallGroupAgents);
  const myUserId = useAppSelector(selectUserId);

  const myGroupIds = new Set(
    agents
      .filter((a) => a.userID === myUserId)
      .map((a) => a.callGroupID),
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" ref={ref}>
        <div className="modal-dialog__header">
          <span className="modal-dialog__title">Мои группы</span>
          <button className="modal-dialog__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-dialog__body">
          <div className="user-groups-list">
            {groups.map((g) => {
              const isMember = myGroupIds.has(g.id);
              return (
                <label key={g.id} className="user-groups-item">
                  <input
                    type="checkbox"
                    checked={isMember}
                    disabled
                    title="Управление членством недоступно из веб-клиента"
                  />
                  <span className={`status-dot ${isMember ? 'status-dot--online' : 'status-dot--offline'}`} />
                  <span>{g.commonName ?? g.name}</span>
                  {g.numbers && g.numbers.length > 0 && (
                    <span className="badge">{g.numbers.join(', ')}</span>
                  )}
                </label>
              );
            })}
          </div>
          <p className="user-groups-note">
            Управление членством в группах осуществляется администратором.
          </p>
        </div>
      </div>
    </div>
  );
}
