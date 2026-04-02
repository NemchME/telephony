import { useEffect, useRef, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import {
  selectUserNumbers,
  selectUserCommonName,
  selectUserName,
  selectUseVerto,
} from '@/entities/session/model/sessionSelectors';
import { vertoActions } from '@/entities/call/model/vertoSlice';
import { vertoClient } from '@/shared/api/verto/vertoClient';
import { createOutboundSession } from '@/shared/api/verto/webrtcManager';

type Props = {
  number: string;
  name: string;
  onClose: () => void;
};

export function QuickDialDialog({ number, name, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const myNumbers = useAppSelector(selectUserNumbers);
  const myName = useAppSelector(selectUserCommonName) ?? useAppSelector(selectUserName) ?? '';
  const useVerto = useAppSelector(selectUseVerto);
  const vertoState = useAppSelector((s) => s.verto.connectionState);
  const vertoCalls = useAppSelector((s) => s.verto.callIds);
  const vertoCallMap = useAppSelector((s) => s.verto.calls);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeVertoCallID = vertoCalls.find((id) => {
    const c = vertoCallMap[id];
    return c && c.state !== 'hangup' && c.state !== 'destroy';
  }) ?? null;

  const hasActiveVertoCall = activeVertoCallID !== null;
  const mainNumber = myNumbers[0] ?? '';

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

  const handleCall = async () => {
    if (!useVerto || vertoState !== 'connected') {
      setError('Verto не подключён');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (hasActiveVertoCall) {
      setError('Уже есть активный звонок');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setCalling(true);
    try {
      const tempCallID = crypto.randomUUID();
      const { offerSdp } = await createOutboundSession(tempCallID);

      dispatch(vertoActions.addCall({
        callID: tempCallID,
        direction: 'outbound',
        destinationNumber: number,
        callerIdName: myName,
        callerIdNumber: mainNumber,
        state: 'trying',
        startedAt: Date.now(),
      }));

      const result = await vertoClient.invite(tempCallID, number, myName, mainNumber, offerSdp);

      if (result.callID && result.callID !== tempCallID) {
        dispatch(vertoActions.removeCall(tempCallID));
        dispatch(vertoActions.addCall({
          callID: result.callID,
          direction: 'outbound',
          destinationNumber: number,
          callerIdName: myName,
          callerIdNumber: mainNumber,
          state: 'ringing',
          startedAt: Date.now(),
        }));
      } else {
        dispatch(vertoActions.updateCallState({ callID: tempCallID, state: 'ringing' }));
      }

      onClose();
    } catch (err) {
      console.error('[QuickDial] call failed:', err);
      setError(err instanceof Error ? err.message : 'Ошибка вызова');
      setTimeout(() => setError(null), 5000);
    } finally {
      setCalling(false);
    }
  };

  const handleBlindTransfer = async () => {
    if (!activeVertoCallID) return;
    try {
      await vertoClient.blindTransfer(number, activeVertoCallID);
    } catch (err) {
      console.error('[QuickDial] blind transfer failed:', err);
    }
    onClose();
  };

  const handleAttendedTransfer = async () => {
    if (!activeVertoCallID) return;
    try {
      await vertoClient.attendedTransfer(number, activeVertoCallID);
    } catch (err) {
      console.error('[QuickDial] attended transfer failed:', err);
    }
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
          {error && <div className="quick-dial-dialog__error">{error}</div>}
          <div className="quick-dial-dialog__actions">
            <button
              className="quick-dial-dialog__btn quick-dial-dialog__btn--call"
              onClick={handleCall}
              disabled={calling || hasActiveVertoCall || !useVerto || vertoState !== 'connected'}
            >
              {calling ? '...' : '📞 Звонок'}
            </button>
            <button
              className="quick-dial-dialog__btn"
              onClick={handleBlindTransfer}
              disabled={!hasActiveVertoCall}
              title={!hasActiveVertoCall ? 'Нет активного вызова' : 'Перенаправить'}
            >
              ↗ Перенаправить
            </button>
            <button
              className="quick-dial-dialog__btn"
              onClick={handleAttendedTransfer}
              disabled={!hasActiveVertoCall}
              title={!hasActiveVertoCall ? 'Нет активного вызова' : 'Перевод с консультацией'}
            >
              ↗↗ Конс. перевод
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
