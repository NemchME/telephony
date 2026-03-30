import { useState, useCallback, type KeyboardEvent } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import {
  selectUserCommonName,
  selectUserName,
  selectUserNumbers,
  selectWsStatus,
} from '@/entities/session/model/sessionSelectors';
import { useTerminateMutation } from '@/entities/session/api/authApi';
import { vertoActions } from '@/entities/call/model/vertoSlice';
import { answerInboundCall, rejectInboundCall, stopRingtone } from '@/entities/call/model/vertoMiddleware';
import { vertoClient } from '@/shared/api/verto/vertoClient';
import { createOutboundSession, destroySession, toggleMute, isMuted } from '@/shared/api/verto/webrtcManager';
import { useHangupCallMutation } from '@/entities/call/api/callApi';
import { bundleActions, type BundleService } from '@/entities/bundle/model/bundleSlice';
import { useStore } from 'react-redux';
import { StatusDropdown } from '@/pages/MainPage/ui/StatusDropdown';
import { SettingsModal } from '@/pages/MainPage/ui/SettingsModal';
import { UserGroupsModal } from '@/pages/MainPage/ui/UserGroupsModal';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const dispatch = useAppDispatch();
  const commonName = useAppSelector(selectUserCommonName);
  const userName = useAppSelector(selectUserName);
  const userNumbers = useAppSelector(selectUserNumbers);
  const wsStatus = useAppSelector(selectWsStatus);
  const vertoState = useAppSelector((s) => s.verto.connectionState);
  const vertoCalls = useAppSelector((s) => s.verto.callIds);
  const vertoCallMap = useAppSelector((s) => s.verto.calls);
  const [terminate] = useTerminateMutation();
  const [hangupCallRpc] = useHangupCallMutation();
  const bundles = useAppSelector((s) => s.bundle);
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [callError, setCallError] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userGroupsOpen, setUserGroupsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const store = useStore();

  const displayName = commonName ?? userName ?? '';
  const mainNumber = userNumbers[0] ?? '';

  const incomingCall = vertoCalls
    .map((id) => vertoCallMap[id])
    .find((c) => c && c.direction === 'inbound' && c.state === 'ringing') ?? null;

  const activeCallID = vertoCalls[0] ?? null;
  const activeCall = activeCallID ? vertoCallMap[activeCallID] : null;
  const hasActiveCall = activeCall != null && activeCall.state !== 'hangup' && activeCall.state !== 'destroy';

  const handleLogout = async () => {
    try {
      await terminate().unwrap();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleMakeCall = useCallback(async () => {
    const cdpn = phoneInput.trim();
    if (!cdpn) return;
    setCallError(null);

    if (vertoState !== 'connected') {
      setCallError('Verto не подключён');
      setTimeout(() => setCallError(null), 3000);
      return;
    }

    setIsCalling(true);
    try {
      const tempCallID = crypto.randomUUID();
      const { offerSdp } = await createOutboundSession(tempCallID);

      dispatch(vertoActions.addCall({
        callID: tempCallID,
        direction: 'outbound',
        destinationNumber: cdpn,
        callerIdName: displayName,
        callerIdNumber: mainNumber,
        state: 'trying',
        startedAt: Date.now(),
      }));

      const result = await vertoClient.invite(tempCallID, cdpn, displayName, mainNumber, offerSdp);

      if (result.callID && result.callID !== tempCallID) {
        dispatch(vertoActions.removeCall(tempCallID));
        dispatch(vertoActions.addCall({
          callID: result.callID,
          direction: 'outbound',
          destinationNumber: cdpn,
          callerIdName: displayName,
          callerIdNumber: mainNumber,
          state: 'ringing',
          startedAt: Date.now(),
        }));
      } else {
        dispatch(vertoActions.updateCallState({ callID: tempCallID, state: 'ringing' }));
      }

      setPhoneInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка вызова';
      setCallError(msg);
      setTimeout(() => setCallError(null), 5000);
    } finally {
      setIsCalling(false);
    }
  }, [phoneInput, vertoState, displayName, mainNumber, dispatch]);

  const handleHangup = useCallback(async () => {
    if (!activeCallID) return;

    setMuted(false);
    stopRingtone();

    try {
      await vertoClient.bye(activeCallID);
    } catch { /* для ошибки */ }
    destroySession(activeCallID);
    dispatch(vertoActions.updateCallState({ callID: activeCallID, state: 'hangup' }));
    setTimeout(() => {
      dispatch(vertoActions.removeCall(activeCallID));
    }, 1000);

    for (const bid of bundles.ids) {
      const b = bundles.entities[bid];
      if (b) {
        const callServices = b.services.filter((s: BundleService) => s.type === 'Call');
        for (const svc of callServices) {
          hangupCallRpc({ callId: svc.id });
        }
      }
      dispatch(bundleActions.removeBundle(bid));
    }
  }, [activeCallID, dispatch, bundles, hangupCallRpc]);

  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall?.remoteSdp) return;
    await answerInboundCall(incomingCall.callID, incomingCall.remoteSdp, dispatch);
  }, [incomingCall, dispatch]);

  const handleRejectCall = useCallback(async () => {
    if (!incomingCall) return;
    stopRingtone();
    await rejectInboundCall(incomingCall.callID, dispatch, store.getState as () => import('@/app/store/rootReducer').RootState);
  }, [incomingCall, dispatch, store]);

  const handleToggleMute = useCallback(() => {
    if (!activeCallID) return;
    const nowMuted = toggleMute(activeCallID);
    setMuted(nowMuted);
  }, [activeCallID]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMakeCall();
    }
  };

  const vertoStatusIcon = vertoState === 'connected' ? '🟢'
    : vertoState === 'connecting' ? '🟡'
    : vertoState === 'error' ? '🔴'
    : '⚪';

  return (
    <>
      <div className="header">
        <span
          className={`header__ws-dot ws-dot--${wsStatus}`}
          title={
            wsStatus === 'connected' ? 'WebSocket подключён' :
            wsStatus === 'connecting' ? 'Подключение...' :
            wsStatus === 'reconnecting' ? 'Переподключение...' :
            'Отключён'
          }
        />
        <span className="header__title">Call-Центр</span>
        <span className="header__user-info">
          {displayName} {mainNumber}
        </span>
        <StatusDropdown />
        <div className="header__spacer" />

        <span className="header__verto-status" title={`Verto: ${vertoState}`}>
          {vertoStatusIcon}
        </span>

        <input
          className="header__phone-input"
          type="text"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Номер..."
          disabled={hasActiveCall}
        />

        {incomingCall ? (
          <>
            <span className="header__incoming-text">
              Входящий: {incomingCall.callerIdName || incomingCall.callerIdNumber || incomingCall.destinationNumber}
              {incomingCall.callerIdNumber && incomingCall.callerIdName ? ` (${incomingCall.callerIdNumber})` : ''}
            </span>
            <button className="header__accept-btn" onClick={handleAcceptCall}>
              📞 Принять
            </button>
            <button
              className="header__hangup-btn"
              onClick={handleRejectCall}
              title="Завершить звонок"
            >
              📕 Завершить
            </button>
          </>
        ) : hasActiveCall ? (
          <>
            <button
              className={`header__mute-btn ${muted ? 'header__mute-btn--active' : ''}`}
              onClick={handleToggleMute}
              title={muted ? 'Включить микрофон' : 'Выключить микрофон'}
            >
              {muted ? '🔇' : '🎙'}
            </button>
            <button
              className="header__hangup-btn"
              onClick={handleHangup}
              title="Завершить звонок"
            >
              📕 Завершить
            </button>
          </>
        ) : (
          <button
            className="header__call-btn"
            onClick={handleMakeCall}
            disabled={isCalling || !phoneInput.trim() || vertoState !== 'connected'}
            title={callError ?? (vertoState !== 'connected' ? 'Verto не подключён' : undefined)}
          >
            {isCalling ? '...' : '📞 Звонок'}
          </button>
        )}

        {callError && <span className="header__call-error">{callError}</span>}

        {activeCall && !incomingCall && (
          <span className="header__call-info">
            {activeCall.state === 'trying' && '⏳ Набор...'}
            {activeCall.state === 'ringing' && activeCall.direction === 'outbound' && '🔔 Вызов...'}
            {activeCall.state === 'early' && '🔔 Вызов...'}
            {activeCall.state === 'active' && `🗣 ${activeCall.destinationNumber}`}
            {activeCall.state === 'held' && `⏸ Удержание`}
            {activeCall.state === 'hangup' && '📕 Завершён'}
          </span>
        )}

        <div className="header__spacer" />
        <a
          className="header__icon-btn"
          href="/stat/"
          target="_blank"
          rel="noopener noreferrer"
          title="Статистика"
        >
          📊
        </a>
        <button
          className="header__icon-btn"
          title="Мои группы"
          onClick={() => setUserGroupsOpen(true)}
        >
          👤
        </button>
        <button
          className="header__icon-btn"
          title="Настройки"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
        <button className="header__icon-btn" title="Выход" onClick={handleLogout}>✕</button>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {userGroupsOpen && <UserGroupsModal onClose={() => setUserGroupsOpen(false)} />}
    </>
  );
}
