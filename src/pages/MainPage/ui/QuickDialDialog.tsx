import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { selectUserNumbers } from '@/entities/session/model/sessionSelectors';
import { useMakeCallMutation, useTransferCallMutation, useConsultTransferCallMutation } from '@/entities/call/api/callApi';

type Props = {
  number: string;
  name: string;
  onClose: () => void;
};

export function QuickDialDialog({ number, name, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const myNumbers = useAppSelector(selectUserNumbers);
  const bundles = useAppSelector((s) => s.bundle);
  const [makeCall] = useMakeCallMutation();
  const [transferCall] = useTransferCallMutation();
  const [consultTransfer] = useConsultTransferCallMutation();

  const activeCallId = (() => {
    for (const id of bundles.ids) {
      const b = bundles.entities[id];
      if (!b) continue;
      for (const svc of b.services) {
        if (svc.type === 'Call' && svc.connState) return svc.id;
      }
    }
    return null;
  })();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const handleCall = () => {
    const cgpn = myNumbers[0];
    if (!cgpn) return;
    makeCall({ cgpn, cdpn: number });
    onClose();
  };

  const handleTransfer = () => {
    if (!activeCallId) return;
    transferCall({ callId: activeCallId, destination: number });
    onClose();
  };

  const handleConsultTransfer = () => {
    if (!activeCallId) return;
    consultTransfer({ callId: activeCallId, destination: number });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog quick-dial-dialog" ref={ref}>
        <div className="modal-dialog__header">
          <span className="modal-dialog__title">{name}</span>
          <button className="modal-dialog__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-dialog__body">
          <div className="quick-dial-dialog__number">{number}</div>
          <div className="quick-dial-dialog__actions">
            <button className="quick-dial-dialog__btn quick-dial-dialog__btn--call" onClick={handleCall}>
              📞 Звонок
            </button>
            <button
              className="quick-dial-dialog__btn"
              onClick={handleTransfer}
              disabled={!activeCallId}
              title={!activeCallId ? 'Нет активного вызова' : 'Перенаправить'}
            >
              ↗ Перенаправить
            </button>
            <button
              className="quick-dial-dialog__btn"
              onClick={handleConsultTransfer}
              disabled={!activeCallId}
              title={!activeCallId ? 'Нет активного вызова' : 'Консультативный перевод'}
            >
              ↗↗ Конс. перевод
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
