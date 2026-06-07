import { useState, useMemo } from 'react';
import { useCdrSearchQuery, type CdrRow } from '@/entities/cdr/api/cdrApi';
import { formatDateTime, formatElapsed } from '@/shared/lib/format/time';
import { useAppSelector } from '@/app/store/hooks';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { QuickDialDialog } from './QuickDialDialog';
import { RecordingPlayer } from './RecordingPlayer';

const LS_ROWS_KEY = 'cdr.rowsPerPage';

function getRowsPerPage(): number {
  try {
    const val = localStorage.getItem(LS_ROWS_KEY);
    return val ? parseInt(val, 10) || 50 : 50;
  } catch { return 50; }
}

function setRowsPerPageLS(n: number) {
  try { localStorage.setItem(LS_ROWS_KEY, String(n)); } catch {}
}

function toMs(v: unknown): number {
  if (!v) return 0;
  const n = Number(v);
  if (n > 1e15) return Math.floor(n / 1000);
  if (n > 1e12) return n;
  return n * 1000;
}

export function CallHistoryPanel() {
  const [rowsPerPage, setRowsPerPage] = useState(getRowsPerPage);
  const [offset, setOffset] = useState(0);
  const [quickDial, setQuickDial] = useState<{ number: string; name: string } | null>(null);
  const currentUserId = useAppSelector(selectUserId);
  const myDomainId = useAppSelector((s) =>
    currentUserId ? s.user.entities[currentUserId]?.domainID : undefined,
  );

  const filter = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const todayStart = now - 86400 * 30;
    return {
      begin: todayStart,
      end: now,
      limit: rowsPerPage,
      offset,
      ...(currentUserId != null ? { userID: currentUserId } : {}),
      ...(myDomainId != null ? { domainID: myDomainId } : {}),
    };
  }, [rowsPerPage, offset, currentUserId, myDomainId]);

  const { data, isFetching } = useCdrSearchQuery(filter);

  const rawRecords = data?.elements ?? [];

  const records = useMemo(() => {
    if (!currentUserId) return rawRecords;
    return rawRecords.filter((r) => {
      const callerUserId = (r['caller.userID'] as string | undefined) ?? '';
      const calleeUserId = (r['callee.userID'] as string | undefined) ?? '';

      if (!callerUserId && !calleeUserId) return true;
      return callerUserId === currentUserId || calleeUserId === currentUserId;
    });
  }, [rawRecords, currentUserId]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = Math.floor(offset / rowsPerPage) + 1;

  const handleRowsChange = (val: number) => {
    setRowsPerPage(val);
    setRowsPerPageLS(val);
    setOffset(0);
  };

  const handleCallNumber = (number: string, name: string) => {
    if (number) {
      setQuickDial({ number, name: name || number });
    }
  };

  return (
    <div>
      <div className="call-history__header">История звонков</div>
      <table className="cc-table">
        <thead>
          <tr>
            <th>Время вызова</th>
            <th>Номер</th>
            <th>Имя</th>
            <th>Тип звонка</th>
            <th>Длительность</th>
            <th>Запись</th>
          </tr>
        </thead>
        <tbody>
          {isFetching && records.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 8, color: '#999' }}>Загрузка...</td></tr>
          ) : records.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 8, color: '#999' }}>Нет записей</td></tr>
          ) : (
            records.map((r: CdrRow, i: number) => {
              const createdMs = toMs(r.createdTime);
              const answeredMs = toMs(r.answeredTime);
              const hangupMs = toMs(r.hangupTime);
              const duration = answeredMs && hangupMs ? Math.floor((hangupMs - answeredMs) / 1000) : 0;
              const callerUserId = (r['caller.userID'] as string | undefined) ?? '';
              const calleeUserId = (r['callee.userID'] as string | undefined) ?? '';
              const callerAuthorized = Boolean(r['caller.authorized']);
              const calleeAuthorized = Boolean(r['callee.authorized']);


              let isOutgoing = currentUserId != null && callerUserId === currentUserId;
              let isIncoming = currentUserId != null && calleeUserId === currentUserId;

              if (!isOutgoing && !isIncoming) {
                if (callerAuthorized && !calleeAuthorized) isOutgoing = true;
                else if (!callerAuthorized && calleeAuthorized) isIncoming = true;
              }

              const isMissed = isIncoming && duration === 0;
              const isOutgoingNoAnswer = isOutgoing && duration === 0;

              const callType = isMissed
                ? 'Пропущенный'
                : isOutgoing
                ? (isOutgoingNoAnswer ? 'Исходящий (нет ответа)' : 'Исходящий')
                : 'Входящий'

                

              const callTypeClass = isMissed
                ? 'cdr-type--missed'
                : isOutgoingNoAnswer
                ? 'cdr-type--no-answer'
                : '';

              const number = isOutgoing
                ? (r['callee.commonNumber'] as string | undefined) || r.cdpn || ''
                : (r['caller.commonNumber'] as string | undefined) || r.cgpn || '';
              const name = isOutgoing
                ? (r['callee.commonName'] as string | undefined) || ''
                : (r['caller.commonName'] as string | undefined) || '';
              const login = isOutgoing
                ? (r['callee.userName'] as string | undefined) || ''
                : (r['caller.userName'] as string | undefined) || '';
              // dialTarget — что отправлять в звонок: если есть number, иначе логин
              const dialTarget = number || login;

              return (
                <tr key={r.id ?? i}>
                  <td>{createdMs ? formatDateTime(createdMs) : ''}</td>
                  <td>
                    {number ? (
                      <span className="cdr-link" onClick={() => handleCallNumber(dialTarget, name || login || number)} title={`Позвонить: ${number}`}>
                        {number}
                      </span>
                    ) : ''}
                  </td>
                  <td>
                    {(name || login) ? (
                      <span
                        className="cdr-link"
                        onClick={() => dialTarget && handleCallNumber(dialTarget, name || login)}
                        title={dialTarget ? `Позвонить: ${dialTarget}` : undefined}
                      >
                        {name || login}
                      </span>
                    ) : ''}
                  </td>
                  <td className={callTypeClass}>{callType}</td>
                  <td>{duration > 0 ? formatElapsed(duration) : ''}</td>
                  <td>
                    {(() => {
                      const callerRec = (r.callerRecords ?? (r as Record<string, unknown>)['caller.records']) as unknown;
                      const calleeRec = (r.calleeRecords ?? (r as Record<string, unknown>)['callee.records']) as unknown;
                      const hasCaller = Array.isArray(callerRec) && callerRec.length > 0;
                      const hasCallee = Array.isArray(calleeRec) && calleeRec.length > 0;
                      if (import.meta.env.DEV && r.id && duration > 0 && (!hasCaller || !hasCallee)) {
                
                        console.debug('[CDR] no records for', r.id, {
                          callerRecords: r.callerRecords,
                          calleeRecords: r.calleeRecords,
                          'caller.records': (r as Record<string, unknown>)['caller.records'],
                          'callee.records': (r as Record<string, unknown>)['callee.records'],
                        });
                      }
                      const bundleId = (r as { bundleID?: string }).bundleID;
                      const recId = bundleId || r.id;
                      return duration > 0 && hasCaller && hasCallee && recId
                        ? <RecordingPlayer cdrId={r.id ?? ''} recordingId={recId} />
                        : '';
                    })()}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="pagination">
        <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - rowsPerPage))}>
          &laquo; Назад
        </button>
        <span>Стр. {currentPage} из {totalPages} (всего {total})</span>
        <button disabled={offset + rowsPerPage >= total} onClick={() => setOffset(offset + rowsPerPage)}>
          Вперёд &raquo;
        </button>
        <select value={rowsPerPage} onChange={(e) => handleRowsChange(Number(e.target.value))}>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
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
