import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { selectCallGroups, selectCallGroupStates } from '@/entities/callGroup/model/callGroupSelectors';
import { selectGroupOrder } from '@/features/realtime/model/groupOrderSlice';
import { groupOrderActions } from '@/features/realtime/model/groupOrderSlice';
import { selectHiddenGroups } from '@/features/realtime/model/viewSettingsSlice';
import { useDragReorder } from '@/shared/lib/hooks/useDragReorder';
import { useTick } from '@/shared/lib/hooks/useTick';
import { formatElapsed } from '@/shared/lib/format/time';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { useCallgroupDequeueMutation } from '@/entities/callGroup/api/callGroupApi';
import type { QueueItem } from '@/entities/callGroup/model/callGroupSlice';

export function CallQueueSidebar() {
  const groups = useAppSelector(selectCallGroups);
  const groupStates = useAppSelector(selectCallGroupStates);
  const groupOrder = useAppSelector(selectGroupOrder);
  const hiddenGroups = useAppSelector(selectHiddenGroups);
  const dispatch = useAppDispatch();
  const now = useTick(1000);

  const myUserId = useAppSelector(selectUserId);
  const myManageTags = useAppSelector((s) =>
    myUserId ? s.user.entities[myUserId]?.manageTags : undefined,
  );
  const isAdminOrSupervisor = !!myManageTags?.some(
    (t) => t === 'administrator' || t === 'supervisor',
  );

  const [dequeue] = useCallgroupDequeueMutation();

  const queueMap = new Map(groupStates.map((gs) => [gs.id, (gs.queue ?? []) as QueueItem[]]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  const orderedIds = [...groupOrder];
  for (const g of groups) {
    if (!orderedIds.includes(g.id)) orderedIds.push(g.id);
  }
  const visibleIds = orderedIds.filter(
    (gid) => groupMap.has(gid) && !hiddenGroups.includes(gid),
  );

  const { onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverIndex } = useDragReorder(
    (from, to) => {
      const draggedId = visibleIds[from];
      const targetId = visibleIds[to];
      if (draggedId && targetId) {
        dispatch(groupOrderActions.moveGroupById({ draggedId, targetId }));
      }
    },
  );

  const handleDequeue = (item: QueueItem) => {
    if (!item.id) return;
    const ok = window.confirm('Вы действительно хотите удалить вызов из очереди?');
    if (!ok) return;
    dequeue({ id: item.id });
  };

  return (
    <div className="sidebar">
      <div className="sidebar__title">Очередь звонков</div>
      {visibleIds.map((gid, idx) => {
        const g = groupMap.get(gid);
        if (!g) return null;
        const queue = queueMap.get(gid) ?? [];
        const qLen = queue.length;

        return (
          <div
            key={gid}
            className={`sidebar__group ${dragOverIndex === idx ? 'drag-over' : ''}`}
            draggable
            onDragStart={onDragStart(idx)}
            onDragOver={onDragOver(idx)}
            onDragLeave={onDragLeave}
            onDrop={onDrop(idx)}
            onDragEnd={onDragEnd}
          >
            <div className="sidebar__group-header">
              <img src="/icons/group.svg" alt="" className="group-icon" />
              <span className="sidebar__group-name">{g.commonName ?? g.name}</span>
              {qLen > 0 && <span className="sidebar__queue-badge">{qLen}</span>}
            </div>

            {qLen > 0 && (
              <table className="sidebar__queue-table">
                <tbody>
                  {queue.map((item, i) => {
                    const waitMs = item.enqueuedTimeSec ? item.enqueuedTimeSec * 1000 : 0;
                    const waitSec = waitMs ? Math.max(0, Math.floor((now - waitMs) / 1000)) : 0;
                    return (
                      <tr
                        key={item.id ?? i}
                        className={item.blocked ? 'sidebar__queue-row--blocked' : ''}
                      >
                        <td className="sidebar__queue-cell-number">{item.cidNumber ?? ''}</td>
                        <td className="sidebar__queue-cell-time">
                          {waitMs ? formatElapsed(waitSec) : ''}
                        </td>
                        <td className="sidebar__queue-cell-name">{item.cidName ?? ''}</td>
                        {isAdminOrSupervisor && (
                          <td className="sidebar__queue-cell-action">
                            <button
                              className="sidebar__queue-dequeue"
                              title="Удалить из очереди"
                              onClick={(e) => { e.stopPropagation(); handleDequeue(item); }}
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
