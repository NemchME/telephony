import { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { selectRoster, presenceToDotClass } from '@/features/realtime/model/agentRosterSelectors';
import type { GroupHeaderRow, AgentRow } from '@/features/realtime/model/agentRosterSelectors';
import { groupOrderActions } from '@/features/realtime/model/groupOrderSlice';
import { useDragReorder } from '@/shared/lib/hooks/useDragReorder';
import { useTick } from '@/shared/lib/hooks/useTick';
import { formatElapsed, elapsedSince } from '@/shared/lib/format/time';
import { useResetAgentStateMutation } from '@/entities/callGroup/api/callGroupApi';
import { selectCallGroups } from '@/entities/callGroup/model/callGroupSelectors';
import {
  viewSettingsActions,
  selectHideInactive,
  selectShowDuration,
  selectHiddenGroups,
} from '@/features/realtime/model/viewSettingsSlice';
import { getStatusLabel } from './StatusDropdown';
import { QuickDialDialog } from './QuickDialDialog';

export function UsersPanel() {
  const roster = useAppSelector(selectRoster);
  const dispatch = useAppDispatch();
  const now = useTick(1000);

  const hideInactive = useAppSelector(selectHideInactive);
  const showDuration = useAppSelector(selectShowDuration);
  const hiddenGroups = useAppSelector(selectHiddenGroups);
  const allGroups = useAppSelector(selectCallGroups);

  const filteredRoster = roster.filter((row) => {
    if (row.kind === 'group') {
      return !hiddenGroups.includes(row.groupId);
    }
    if (hiddenGroups.includes(row.groupId)) return false;
    if (hideInactive && row.presence === 'OFFLINE') return false;
    return true;
  });

  const { onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverIndex } = useDragReorder(
    (from, to) => dispatch(groupOrderActions.moveGroup({ from, to })),
  );

  let currentGroupDragIndex = -1;

  const [viewOpen, setViewOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);

  const [quickDial, setQuickDial] = useState<{ number: string; name: string } | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (viewRef.current && !viewRef.current.contains(e.target as Node)) setViewOpen(false);
      if (groupsRef.current && !groupsRef.current.contains(e.target as Node)) setGroupsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div>
      <div className="users-panel__header">
        <span className="users-panel__title">Пользователи</span>

        <div className="dropdown-wrapper" ref={viewRef}>
          <button
            className={`dropdown-btn ${viewOpen ? 'dropdown-btn--active' : ''}`}
            onClick={() => { setViewOpen(!viewOpen); setGroupsOpen(false); }}
          >
            Вид ▼
          </button>
          {viewOpen && (
            <div className="dropdown-menu">
              <label className="dropdown-menu__item">
                <input
                  type="checkbox"
                  checked={hideInactive}
                  onChange={() => dispatch(viewSettingsActions.toggleHideInactive())}
                />
                Скрыть неактивных
              </label>
              <label className="dropdown-menu__item">
                <input
                  type="checkbox"
                  checked={showDuration}
                  onChange={() => dispatch(viewSettingsActions.toggleShowDuration())}
                />
                Показывать время
              </label>
            </div>
          )}
        </div>

        <div className="dropdown-wrapper" ref={groupsRef}>
          <button
            className={`dropdown-btn ${groupsOpen ? 'dropdown-btn--active' : ''}`}
            onClick={() => { setGroupsOpen(!groupsOpen); setViewOpen(false); }}
          >
            Группы ▼
          </button>
          {groupsOpen && (
            <div className="dropdown-menu">
              {allGroups.map((g) => (
                <label key={g.id} className="dropdown-menu__item">
                  <input
                    type="checkbox"
                    checked={!hiddenGroups.includes(g.id)}
                    onChange={() => dispatch(viewSettingsActions.toggleGroupVisibility(g.id))}
                  />
                  {g.commonName ?? g.name}
                </label>
              ))}
              {allGroups.length > 0 && (
                <div
                  className="dropdown-menu__action"
                  onClick={() => dispatch(viewSettingsActions.showAllGroups())}
                >
                  Показать все
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        {filteredRoster.map((row) => {
          if (row.kind === 'group') {
            currentGroupDragIndex++;
            const gIdx = currentGroupDragIndex;
            return (
              <GroupRow
                key={`g-${row.groupId}`}
                row={row}
                dragIndex={gIdx}
                isDragOver={dragOverIndex === gIdx}
                onDragStart={onDragStart(gIdx)}
                onDragOver={onDragOver(gIdx)}
                onDragLeave={onDragLeave}
                onDrop={onDrop(gIdx)}
                onDragEnd={onDragEnd}
              />
            );
          }
          return (
            <AgentRowItem
              key={`a-${row.userId}-${row.groupId}`}
              row={row}
              now={now}
              showDuration={showDuration}
              onQuickDial={setQuickDial}
            />
          );
        })}
      </div>

      {quickDial && (
        <QuickDialDialog
          number={quickDial.number}
          name={quickDial.name}
          onClose={() => setQuickDial(null)}
        />
      )}
    </div>
  );
}

function GroupRow({
  row,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  row: GroupHeaderRow;
  dragIndex: number;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      className={`user-list__group ${isDragOver ? 'drag-over' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <span className="status-dot status-dot--online" />
      <strong>{row.groupName}</strong>
      {row.numbers.map((n, i) => (
        <span key={i} className="badge">{n}</span>
      ))}
      <span className="badge">{row.groupTechName}</span>
      {row.queueLength > 0 && (
        <span className="sidebar__queue-badge">{row.queueLength}</span>
      )}
    </div>
  );
}

function AgentRowItem({
  row,
  showDuration,
  onQuickDial,
}: {
  row: AgentRow;
  now: number;
  showDuration: boolean;
  onQuickDial: (info: { number: string; name: string }) => void;
}) {
  const dotClass = presenceToDotClass(row.presence);
  const elapsed = row.lastModifiedStatus ? elapsedSince(row.lastModifiedStatus) : null;
  const busyLabel = row.busyCount > 0 ? 'Разг.' : 'Не разг.';
  const [resetState] = useResetAgentStateMutation();

  const isWebClientActive = row.networkStatus === 1;

  const handleNumberClick = (cdpn: string) => {
    onQuickDial({ number: cdpn, name: row.displayName });
  };

  const handleResetState = () => {
    resetState({ callGroupID: row.groupId, userID: row.userId });
  };

  return (
    <div className={`user-list__agent ${row.presence === 'ONLINE_BUSY' ? 'user-list__agent--selected' : ''}`}>
      {isWebClientActive && (
        <span className="web-client-icon" title="Веб-клиент активен">🌐</span>
      )}
      <span className={`status-dot ${dotClass}`} />
      <span className="user-list__agent-name">{row.displayName}</span>
      {row.numbers.map((n, i) => (
        <span
          key={i}
          className="badge badge--clickable"
          title={`Действия: ${n}`}
          onClick={() => handleNumberClick(n)}
        >
          📞 {n}
        </span>
      ))}
      <span className="badge">{row.username}</span>
      <span className="badge">{getStatusLabel(row.availStatus)}</span>
      {showDuration && elapsed !== null && <span className="badge">{formatElapsed(elapsed)}</span>}
      <span className="badge">{busyLabel}</span>
      {row.groupId !== '__standalone__' && (
        <button
          className="user-list__refresh-btn"
          onClick={handleResetState}
          title="Сбросить состояние пользователя"
        >
          ↻
        </button>
      )}
    </div>
  );
}
