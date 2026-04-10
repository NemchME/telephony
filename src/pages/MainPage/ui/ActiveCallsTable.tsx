import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { useTick } from '@/shared/lib/hooks/useTick';
import { formatElapsed } from '@/shared/lib/format/time';
import { useHangupCallMutation } from '@/entities/call/api/callApi';
import { vertoClient } from '@/shared/api/verto/vertoClient';
import { destroySession } from '@/shared/api/verto/webrtcManager';
import { vertoActions } from '@/entities/call/model/vertoSlice';
import { bundleActions, type BundleService } from '@/entities/bundle/model/bundleSlice';
import {
  selectUserCommonName,
  selectUserName,
  selectUserNumbers,
} from '@/entities/session/model/sessionSelectors';

type ActiveCall = {
  id: string;
  bundleId: string;
  sideANumber: string;
  sideAUser: string;
  sideBNumber: string;
  sideBUser: string;
  state: string;
  dialedNumber: string;
  talkTime: number;
  isRinging: boolean;
  isVertoOnly?: boolean;
};

const TERMINATED_STATES = new Set([
  'hangup', 'destroy', 'completed', 'failed', 'canceled',
  'terminated', 'disconnected', 'released', 'bye',
]);

function translateState(state: string): string {
  switch (state) {
    case 'ringing': return 'Вызов';
    case 'trying': return 'Набор';
    case 'active': case 'connected': return 'Разговор';
    case 'bridged': return 'Разговор';
    case 'held': return 'Удержание';
    case 'early': return 'Набор';
    case 'unbridged': return 'Ожидание';
    case 'routing': return 'Маршрутизация';
    default: return state;
  }
}

function toMs(v: unknown): number {
  if (!v) return 0;
  const n = Number(v);
  if (n > 1e15) return Math.floor(n / 1000);
  if (n > 1e12) return n;
  return n * 1000;
}

export function ActiveCallsTable() {
  const now = useTick(1000);
  const bundles = useAppSelector((s) => s.bundle);
  const dispatch = useAppDispatch();
  const [hangupCall] = useHangupCallMutation();
  const vertoCallIds = useAppSelector((s) => s.verto.callIds);
  const vertoCallMap = useAppSelector((s) => s.verto.calls);
  const myName = useAppSelector(selectUserCommonName) ?? useAppSelector(selectUserName) ?? '';
  const myNumbers = useAppSelector(selectUserNumbers);
  const myNumber = myNumbers[0] ?? '';

  const handleHangup = async (call: ActiveCall) => {
    if (!call.isVertoOnly) {
      hangupCall({ callId: call.id });
    }

    if (import.meta.env.DEV) {
      console.log('[Hangup] serviceId:', call.id, 'bundleId:', call.bundleId);
    }

    if (call.bundleId) {
      dispatch(bundleActions.removeBundle(call.bundleId));
    }

    for (const vcId of vertoCallIds) {
      try {
        await vertoClient.bye(vcId);
      } catch {
        // ignore
      }
      destroySession(vcId);
      dispatch(vertoActions.updateCallState({ callID: vcId, state: 'hangup' }));
      setTimeout(() => dispatch(vertoActions.removeCall(vcId)), 1000);
    }
  };

  const calls: ActiveCall[] = [];
  let hasAnyActiveBundleService = false;

  for (const id of bundles.ids) {
    const b = bundles.entities[id];
    if (!b) continue;

    const callServices = b.services.filter((s: BundleService) => s.type === 'Call');
    const routingServices = b.services.filter((s: BundleService) => s.type === 'Routing');

    let hasActiveCalls = false;

    for (const svc of callServices) {
      const connState = svc.connState ?? '';

      if (TERMINATED_STATES.has(connState)) continue;
      if (svc.hangupTime) continue;

      hasActiveCalls = true;
      hasAnyActiveBundleService = true;
      const createdMs = toMs(svc.createdTime ?? svc.answeredTime);
      const elapsed = createdMs ? Math.max(0, Math.floor((now - createdMs) / 1000)) : 0;
      const isRinging = connState === 'ringing' || connState === 'early';

      calls.push({
        id: svc.id,
        bundleId: b.id,
        sideANumber: String(svc.cgpn ?? svc['caller.commonNumber'] ?? ''),
        sideAUser: String(svc['caller.commonName'] ?? ''),
        sideBNumber: String(svc.cdpn ?? svc['callee.commonNumber'] ?? ''),
        sideBUser: String(svc['callee.commonName'] ?? ''),
        state: connState,
        dialedNumber: String(svc.cdpn ?? ''),
        talkTime: elapsed,
        isRinging,
      });
    }

    if (!hasActiveCalls) {
      for (const svc of routingServices) {
        const connState = svc.connState ?? '';
        if (TERMINATED_STATES.has(connState)) continue;
        if (svc.hangupTime) continue;

        hasAnyActiveBundleService = true;
        const createdMs = toMs(svc.createdTime ?? svc.answeredTime);
        const elapsed = createdMs ? Math.max(0, Math.floor((now - createdMs) / 1000)) : 0;

        calls.push({
          id: svc.id,
          bundleId: b.id,
          sideANumber: String(svc.cgpn ?? svc['caller.commonNumber'] ?? ''),
          sideAUser: String(svc['caller.commonName'] ?? ''),
          sideBNumber: String(svc.cdpn ?? svc['callee.commonNumber'] ?? ''),
          sideBUser: String(svc['callee.commonName'] ?? ''),
          state: connState || 'routing',
          dialedNumber: String(svc.cdpn ?? ''),
          talkTime: elapsed,
          isRinging: true,
        });
      }
    }
  }

  for (const vcId of vertoCallIds) {
    if (hasAnyActiveBundleService) continue;
    const vc = vertoCallMap[vcId];
    if (!vc) continue;
    if (vc.state === 'hangup' || vc.state === 'destroy') continue;

    const elapsed = vc.startedAt ? Math.max(0, Math.floor((now - vc.startedAt) / 1000)) : 0;
    const isRinging = vc.state === 'trying' || vc.state === 'ringing' || vc.state === 'early';

    calls.push({
      id: vcId,
      bundleId: '',
      sideANumber: vc.direction === 'outbound' ? myNumber : (vc.callerIdNumber ?? ''),
      sideAUser: vc.direction === 'outbound' ? myName : (vc.callerIdName ?? ''),
      sideBNumber: vc.direction === 'outbound' ? (vc.destinationNumber ?? '') : myNumber,
      sideBUser: vc.direction === 'outbound' ? '' : myName,
      state: vc.state ?? 'trying',
      dialedNumber: vc.destinationNumber ?? '',
      talkTime: elapsed,
      isRinging,
      isVertoOnly: true,
    });
  }

  return (
    <div className="active-calls">
      <table className="cc-table">
        <thead>
          <tr>
            <th colSpan={2} style={{ textAlign: 'center' }}>Сторона А</th>
            <th colSpan={2} style={{ textAlign: 'center' }}>Сторона Б</th>
            <th>Состояние</th>
            <th>Набранный номер</th>
            <th>Время разговора</th>
            <th></th>
          </tr>
          <tr>
            <th>Номер</th>
            <th>Пользователь</th>
            <th>Номер</th>
            <th>Пользователь</th>
            <th />
            <th />
            <th />
            <th />
          </tr>
        </thead>
        <tbody>
          {calls.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', color: '#999', padding: 8 }}>
                Нет активных вызовов
              </td>
            </tr>
          ) : (
            calls.map((c) => (
              <tr key={c.id}>
                <td>{c.sideANumber}</td>
                <td>{c.sideAUser}</td>
                <td>{c.sideBNumber}</td>
                <td>{c.sideBUser}</td>
                <td>{translateState(c.state)}</td>
                <td>{c.dialedNumber}</td>
                <td>{formatElapsed(c.talkTime)}</td>
                <td>
                  <button
                    className={c.isRinging ? 'cancel-call-btn' : 'hangup-btn'}
                    onClick={() => handleHangup(c)}
                    title={c.isRinging ? 'Отменить звонок' : 'Завершить'}
                  >
                    {c.isRinging ? '✕ Отмена' : '✕'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
