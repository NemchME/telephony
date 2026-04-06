import { useState, useMemo } from 'react';
import { useCdrSearchQuery, type CdrRow } from '@/entities/cdr/api/cdrApi';
import { formatDateTime, formatElapsed } from '@/shared/lib/format/time';
import { QuickDialDialog } from './QuickDialDialog';

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

  const filter = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const todayStart = now - 86400 * 30;
    return { begin: todayStart, end: now, limit: rowsPerPage, offset };
  }, [rowsPerPage, offset]);

  const { data, isFetching } = useCdrSearchQuery(filter);

  const records = data?.elements ?? [];
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
          </tr>
        </thead>
        <tbody>
          {isFetching && records.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 8, color: '#999' }}>Загрузка...</td></tr>
          ) : records.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: 8, color: '#999' }}>Нет записей</td></tr>
          ) : (
            records.map((r: CdrRow, i: number) => {
              const createdMs = toMs(r.createdTime);
              const answeredMs = toMs(r.answeredTime);
              const hangupMs = toMs(r.hangupTime);
              const duration = answeredMs && hangupMs ? Math.floor((hangupMs - answeredMs) / 1000) : 0;
              const isIncoming = r.cids === 'called' || r.cids === 'callee';
              const callType = isIncoming ? 'Входящий' : 'Исходящий';
              const number = isIncoming
                ? (r.cgpn || r['caller.commonNumber'] || '')
                : (r.cdpn || r['callee.commonNumber'] || '');
              const name = isIncoming
                ? (r['caller.commonName'] || '')
                : (r['callee.commonName'] || '');

              return (
                <tr key={r.id ?? i}>
                  <td>{createdMs ? formatDateTime(createdMs) : ''}</td>
                  <td>
                    {number ? (
                      <span className="cdr-link" onClick={() => handleCallNumber(number, name)} title={`Позвонить: ${number}`}>
                        {number}
                      </span>
                    ) : ''}
                  </td>
                  <td>
                    {name ? (
                      <span className="cdr-link" onClick={() => handleCallNumber(number, name)} title={`Позвонить: ${number}`}>
                        {name}
                      </span>
                    ) : ''}
                  </td>
                  <td>{callType}</td>
                  <td>{duration > 0 ? formatElapsed(duration) : ''}</td>
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
