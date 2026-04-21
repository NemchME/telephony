import { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { selectRoster, presenceToDotClass } from '@/features/realtime/model/agentRosterSelectors';
import type { GroupHeaderRow, AgentRow } from '@/features/realtime/model/agentRosterSelectors';
import { groupOrderActions } from '@/features/realtime/model/groupOrderSlice';
import { useDragReorder } from '@/shared/lib/hooks/useDragReorder';
import { useTick } from '@/shared/lib/hooks/useTick';
import { formatElapsed, elapsedSince } from '@/shared/lib/format/time';
import { useResetUserStateMutation } from '@/entities/callGroup/api/callGroupApi';
import { selectCallGroups } from '@/entities/callGroup/model/callGroupSelectors';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import {
  viewSettingsActions,
  selectHideInactive,
  selectShowDuration,
  selectHiddenGroups,
} from '@/features/realtime/model/viewSettingsSlice';
import { getUserStatusLabel } from './StatusDropdown';
import { QuickDialDialog } from './QuickDialDialog';

export function UsersPanel() {
  const roster = useAppSelector(selectRoster);
  const dispatch = useAppDispatch();
  const now = useTick(1000);

  const hideInactive = useAppSelector(selectHideInactive);
  const showDuration = useAppSelector(selectShowDuration);
  const hiddenGroups = useAppSelector(selectHiddenGroups);
  const allGroups = useAppSelector(selectCallGroups);
  const myUserId = useAppSelector(selectUserId);
  const myManageTags = useAppSelector((s) =>
    myUserId ? s.user.entities[myUserId]?.manageTags : undefined,
  );
  const isAdminOrSupervisor = !!myManageTags?.some(
    (t) => t === 'admin' || t === 'administrator' || t === 'root' || t === 'supervisor',
  );

  const filteredRoster = roster.filter((row) => {
    if (row.kind === 'group') {
      return !hiddenGroups.includes(row.groupId);
    }
    if (hiddenGroups.includes(row.groupId)) return false;
    if (hideInactive && (row.presence === 'OFFLINE' || row.leftGroup)) return false;
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

      <div className={`roster-table ${showDuration ? '' : 'roster-table--no-duration'}`}>
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
                onQuickDial={setQuickDial}
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
              isAdminOrSupervisor={isAdminOrSupervisor}
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
  onQuickDial,
}: {
  row: GroupHeaderRow;
  dragIndex: number;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onQuickDial: (info: { number: string; name: string }) => void;
}) {
  const handleNumberClick = (num: string) => {
    onQuickDial({ number: num, name: row.groupName });
  };

  const handleGroupNameClick = () => {
    const num = row.numbers[0];
    if (num) onQuickDial({ number: num, name: row.groupName });
  };

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
      <img src="/icons/group.svg" alt="" className="group-icon" />
      <strong
        className={row.numbers.length > 0 ? 'group-name--clickable' : ''}
        onClick={handleGroupNameClick}
        title={row.numbers.length > 0 ? `Позвонить: ${row.groupName}` : undefined}
      >
        {row.groupName}
      </strong>
      {row.numbers.map((n, i) => (
        <span
          key={i}
          className="badge badge--clickable"
          title={`Позвонить: ${n}`}
          onClick={() => handleNumberClick(n)}
        >
          📞 {n}
        </span>
      ))}
      <span
        className="badge badge--clickable"
        title={row.numbers[0] ? `Позвонить: ${row.groupTechName}` : undefined}
        onClick={handleGroupNameClick}
      >
        {row.groupTechName}
      </span>
      {row.queueLength > 0 && (
        <span className="sidebar__queue-badge">{row.queueLength}</span>
      )}
    </div>
  );
}

function AgentRowItem({
  row,
  now,
  showDuration,
  onQuickDial,
  isAdminOrSupervisor,
}: {
  row: AgentRow;
  now: number;
  showDuration: boolean;
  onQuickDial: (info: { number: string; name: string }) => void;
  isAdminOrSupervisor: boolean;
}) {
  const dotClass = presenceToDotClass(row.presence);
  const availElapsed = row.lastModifiedAvailStatus ? elapsedSince(row.lastModifiedAvailStatus) : null;
  const busyElapsed = row.lastModifiedUserState ? elapsedSince(row.lastModifiedUserState) : null;
  const groupElapsed = row.lastModifiedStatus ? elapsedSince(row.lastModifiedStatus) : null;
  const busyLabel = row.busyCount > 0 ? 'Разг.' : 'Не разг.';
  const [resetUserState] = useResetUserStateMutation();

  const isWebClientActive = row.networkStatus === 1;

  const statusLabel = getUserStatusLabel(row.availStatus, row.busyStatus);

  const handleNumberClick = (cdpn: string) => {
    onQuickDial({ number: cdpn, name: row.displayName });
  };

  const handleUsernameClick = () => {
    const num = row.numbers[0];
    if (num) {
      onQuickDial({ number: num, name: row.displayName });
    }
  };

  const handleResetState = () => {
    const ok = window.confirm(`Вы действительно хотите сбросить состояние пользователя «${row.displayName}»?`);
    if (!ok) return;
    resetUserState({ userID: row.userId });
  };

  return (
    <div
      className={`user-list__agent ${row.presence === 'ONLINE_BUSY' ? 'user-list__agent--selected' : ''} ${row.leftGroup ? 'user-list__agent--left-group' : ''} ${!row.leftGroup && row.presence !== 'OFFLINE' && row.presence !== 'UNKNOWN' ? 'user-list__agent--online' : ''}`}
    >
      <span className="user-list__col--icon">
        {isWebClientActive && <span className="web-client-icon" title="Веб-клиент активен">🌐</span>}
      </span>
      <span className={`status-dot ${dotClass}`} />
      <span
        className="user-list__agent-name user-list__agent-name--clickable"
        onClick={handleUsernameClick}
        title={row.numbers[0] ? `Позвонить ${row.displayName}` : undefined}
      >
        {row.displayName}
      </span>
      <span className="user-list__col--numbers">
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
      </span>
      <span
        className="user-list__col--username badge badge--clickable"
        title={`Позвонить ${row.displayName}`}
        onClick={handleUsernameClick}
      >
        {row.username}
      </span>
      <span className="user-list__col--status badge">{statusLabel}</span>
      {showDuration && (
        <span className="user-list__col--time user-list__col--time--avail badge" title="Время с изменения availStatus">
          {availElapsed !== null ? formatElapsed(availElapsed) : ''}
        </span>
      )}
      <span className="user-list__col--busy badge">{busyLabel}</span>
      {showDuration && (
        <span className="user-list__col--time user-list__col--time--busy badge" title="Время с изменения busyStatus">
          {busyElapsed !== null ? formatElapsed(busyElapsed) : ''}
        </span>
      )}
      {showDuration && (
        <span className="user-list__col--time user-list__col--time--group badge" title="Время с входа/выхода из группы">
          {groupElapsed !== null ? formatElapsed(groupElapsed) : ''}
        </span>
      )}
      <span className="user-list__col--actions">
        {isAdminOrSupervisor && (
          <button
            className="user-list__refresh-btn"
            onClick={handleResetState}
            title="Сбросить состояние пользователя"
          >
            🔄
          </button>
        )}
      </span>
    </div>
  );
}
