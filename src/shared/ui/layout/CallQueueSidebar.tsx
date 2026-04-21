import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { selectCallGroups, selectCallGroupStates } from '@/entities/callGroup/model/callGroupSelectors';
import { selectGroupOrder } from '@/features/realtime/model/groupOrderSlice';
import { groupOrderActions } from '@/features/realtime/model/groupOrderSlice';
import { useDragReorder } from '@/shared/lib/hooks/useDragReorder';

export function CallQueueSidebar() {
  const groups = useAppSelector(selectCallGroups);
  const groupStates = useAppSelector(selectCallGroupStates);
  const groupOrder = useAppSelector(selectGroupOrder);
  const dispatch = useAppDispatch();

  const queueMap = new Map(groupStates.map((gs) => [gs.id, Array.isArray(gs.queue) ? gs.queue.length : 0]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  const orderedIds = [...groupOrder];
  for (const g of groups) {
    if (!orderedIds.includes(g.id)) orderedIds.push(g.id);
  }

  const { onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, dragOverIndex } = useDragReorder(
    (from, to) => dispatch(groupOrderActions.moveGroup({ from, to })),
  );

  return (
    <div className="sidebar">
      <div className="sidebar__title">Очередь звонков</div>
      {orderedIds.map((gid, idx) => {
        const g = groupMap.get(gid);
        if (!g) return null;
        const qLen = queueMap.get(gid) ?? 0;
        const dotClass = qLen > 0 ? 'status-dot--busy' : 'status-dot--online';

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
            <img src="/icons/group.svg" alt="" className="group-icon" />
            <span className="sidebar__group-name">
              {g.commonName ?? g.name}
            </span>
            {qLen > 0 && (
              <span className="sidebar__queue-badge">{qLen}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
