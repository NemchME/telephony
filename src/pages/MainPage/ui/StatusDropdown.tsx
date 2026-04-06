import { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { selectAvailStatus, selectUserId } from '@/entities/session/model/sessionSelectors';
import { setAvailStatus } from '@/entities/session/model/sessionSlice';
import { useUpdateMyAvailStatusMutation } from '@/entities/user/api/userApi';

const STATUSES = [
  { value: 'avail_avail', dot: 'online', label: 'Нормальное' },
  { value: 'direct_direct', dot: 'online', label: 'Только прямые вызовы' },
  { value: 'dnd_dnd', dot: 'dnd', label: 'Не беспокоить' },
  { value: 'away_away', dot: 'away', label: 'Отошёл' },
] as const;

const EXTRA_STATUSES = [
  { value: 'direct_filling-in-information', dot: 'online', label: 'Заполнение информации' },
  { value: 'dnd_lunch-break', dot: 'dnd', label: 'Обеденный перерыв' },
  { value: 'dnd_technical-break', dot: 'dnd', label: 'Технический перерыв' },
  { value: 'direct_diagnostics-and-configuration', dot: 'online', label: 'Диагностика и конфигурирование' },
] as const;

const ALL_STATUSES = [...STATUSES, ...EXTRA_STATUSES];

export function parseCompoundStatus(compound: string): { avail: string; sub: string } {
  const idx = compound.indexOf('_');
  if (idx === -1) return { avail: compound, sub: compound };
  return { avail: compound.slice(0, idx), sub: compound.slice(idx + 1) };
}

export function getStatusLabel(compound: string): string {
  const found = ALL_STATUSES.find((s) => s.value === compound);
  if (found) return found.label;
  const { avail } = parseCompoundStatus(compound);
  const base = STATUSES.find((s) => parseCompoundStatus(s.value).avail === avail);
  return base?.label ?? compound;
}

export function getUserStatusLabel(availStatus: string, busyStatus: string): string {
  if (busyStatus && busyStatus !== '_' && busyStatus !== availStatus) {
    return getStatusLabel(`${availStatus}_${busyStatus}`);
  }
  return getStatusLabel(`${availStatus}_${availStatus}`);
}

export function statusToDotClass(compound: string): string {
  const { avail } = parseCompoundStatus(compound);
  if (avail === 'dnd') return 'status-dot--dnd';
  if (avail === 'away') return 'status-dot--away';
  return 'status-dot--online';
}

export function StatusDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const currentStatus = useAppSelector(selectAvailStatus) ?? 'avail_avail';
  const userId = useAppSelector(selectUserId);
  const [updateStatus] = useUpdateMyAvailStatusMutation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentLabel = getStatusLabel(currentStatus);
  const dotClass = statusToDotClass(currentStatus);

  const isActive = (value: string) => currentStatus === value;

  const handleSelect = (value: string) => {
    setOpen(false);
    if (!userId) return;
    dispatch(setAvailStatus(value));
    const { avail, sub } = parseCompoundStatus(value);
    updateStatus({ userId, availStatus: avail, busyStatus: sub });
  };

  return (
    <div className="status-dropdown" ref={ref}>
      <div className="status-dropdown__trigger" onClick={() => setOpen(!open)}>
        <span className={`status-dot ${dotClass}`} style={{ width: 8, height: 8 }} />
        <span>{currentLabel}</span>
        <span style={{ fontSize: 8, marginLeft: 4 }}>&#9660;</span>
      </div>
      {open && (
        <div className="status-dropdown__menu">
          {STATUSES.map((s) => (
            <div
              key={s.value}
              className={`status-dropdown__item ${isActive(s.value) ? 'status-dropdown__item--active' : ''}`}
              onClick={() => handleSelect(s.value)}
            >
              <span className={`status-dot status-dot--${s.dot}`} style={{ width: 8, height: 8 }} />
              {isActive(s.value) ? '✓ ' : ''}
              {s.label}
            </div>
          ))}
          <div className="status-dropdown__separator">Дополнительные статусы</div>
          {EXTRA_STATUSES.map((s) => (
            <div
              key={s.value}
              className={`status-dropdown__item ${isActive(s.value) ? 'status-dropdown__item--active' : ''}`}
              onClick={() => handleSelect(s.value)}
            >
              <span className={`status-dot status-dot--${s.dot}`} style={{ width: 8, height: 8 }} />
              {isActive(s.value) ? '✓ ' : ''}
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
