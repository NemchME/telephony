import { useState, useCallback, useMemo, useRef, useEffect, type KeyboardEvent } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import {
  selectUserCommonName,
  selectUserName,
  selectUserNumbers,
  selectWsStatus,
  selectUseVerto,
  selectUserId,
} from '@/entities/session/model/sessionSelectors';
import { useTerminateMutation } from '@/entities/session/api/authApi';
import { vertoActions } from '@/entities/call/model/vertoSlice';
import { answerInboundCall, rejectInboundCall, stopRingtone } from '@/entities/call/model/vertoMiddleware';
import { vertoClient } from '@/shared/api/verto/vertoClient';
import { createOutboundSession, destroySession, toggleMute, isMuted } from '@/shared/api/verto/webrtcManager';
import { useHangupCallMutation } from '@/entities/call/api/callApi';
import { useUpdateMyAvailStatusMutation } from '@/entities/user/api/userApi';
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
  const [updateStatus] = useUpdateMyAvailStatusMutation();
  const bundles = useAppSelector((s) => s.bundle);
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [transferInput, setTransferInput] = useState('');
  const [callError, setCallError] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userGroupsOpen, setUserGroupsOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const store = useStore();

  const useVerto = useAppSelector(selectUseVerto);
  const userId = useAppSelector(selectUserId);
  const myNetworkStatus = useAppSelector((s) => userId ? s.user.states[userId]?.networkStatus : undefined);

  const allUsers = useAppSelector((s) => s.user);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const displayName = commonName ?? userName ?? '';
  const mainNumber = userNumbers[0] ?? '';

  const suggestions = useMemo(() => {
    const q = phoneInput.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    const results: { id: string; label: string; number: string }[] = [];
    for (const uid of allUsers.ids) {
      const u = allUsers.entities[uid];
      if (!u || uid === userId) continue;
      const name = (u.commonName ?? u.name ?? '').toLowerCase();
      const nums = u.numbers ?? [];
      const nameMatch = name.includes(q);
      const numMatch = nums.some((n) => n.includes(q));
      if (nameMatch || numMatch) {
        const num = nums[0] ?? '';
        if (num) {
          results.push({
            id: uid,
            label: `${u.commonName ?? u.name ?? uid} (${num})`,
            number: num,
          });
        }
      }
      if (results.length >= 8) break;
    }
    return results;
  }, [phoneInput, allUsers, userId]);

  const incomingCall = vertoCalls
    .map((id) => vertoCallMap[id])
    .find((c) => c && c.direction === 'inbound' && c.state === 'ringing') ?? null;

  const activeCallID = vertoCalls[0] ?? null;
  const activeCall = activeCallID ? vertoCallMap[activeCallID] : null;
  const hasActiveCall = activeCall != null && activeCall.state !== 'hangup' && activeCall.state !== 'destroy';

  const activeServiceId = (() => {
    for (const id of bundles.ids) {
      const b = bundles.entities[id];
      if (!b) continue;
      for (const svc of b.services) {
        if (svc.type === 'Call') return svc.id;
      }
    }
    return null;
  })();

  if (import.meta.env.DEV && hasActiveCall) {
    console.log('[Header] activeServiceId:', activeServiceId, 'bundles:', bundles.ids.length);
  }

  const handleLogout = async () => {
    try {
      if (userId) {
        await updateStatus({ userId, availStatus: 'avail', busyStatus: '_' }).unwrap().catch(() => {});
      }
      await terminate().unwrap();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const resolveToNumber = useCallback((input: string): string | null => {
    const q = input.trim();
    if (!q) return null;
    if (/^[\d+\-() ]+$/.test(q)) return q;
    const lower = q.toLowerCase();
    for (const uid of allUsers.ids) {
      const u = allUsers.entities[uid];
      if (!u) continue;
      const name = (u.commonName ?? u.name ?? '').toLowerCase();
      if (name === lower || name.includes(lower)) {
        const num = u.numbers?.[0];
        if (num) return num;
      }
    }
    return q;
  }, [allUsers]);

  const handleMakeCall = useCallback(async () => {
    const cdpn = resolveToNumber(phoneInput);
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
  }, [phoneInput, vertoState, displayName, mainNumber, dispatch, resolveToNumber]);

  const handleHangup = useCallback(async () => {
    if (!activeCallID) return;

    setMuted(false);
    setIsConsulting(false);
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

  const activeBundleId = bundles.ids[0] ?? null;

  const [isConsulting, setIsConsulting] = useState(false);

  const handleBlindTransfer = useCallback(async () => {
    const dest = resolveToNumber(transferInput);
    if (!dest || !activeCallID) return;
    console.log('[Transfer] blind transfer destination:', dest, 'callID:', activeCallID);
    try {
      await vertoClient.blindTransfer(dest, activeCallID);
    } catch (err) {
      console.error('[Transfer] blind failed:', err);
    }
    setTransferInput('');
  }, [transferInput, activeCallID, resolveToNumber]);

  const handleAttendedTransfer = useCallback(async () => {
    const dest = resolveToNumber(transferInput);
    if (!dest || !activeCallID) return;
    console.log('[Transfer] attended transfer destination:', dest, 'callID:', activeCallID);
    try {
      await vertoClient.attendedTransfer(dest, activeCallID);
      setIsConsulting(true);
    } catch (err) {
      console.error('[Transfer] attended failed:', err);
    }
    setTransferInput('');
  }, [transferInput, activeCallID, resolveToNumber]);

  const handleBackFromConsult = useCallback(async () => {
    if (!activeCallID) return;
    try {
      await vertoClient.bye(activeCallID);
    } catch { /* ignore */ }
    setIsConsulting(false);
  }, [activeCallID]);

  const handleTransferKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlindTransfer();
    }
  };

  const handleSelectSuggestion = useCallback((number: string) => {
    setPhoneInput(number);
    setShowSuggestions(false);
    setSuggestionIndex(-1);
    phoneInputRef.current?.focus();
  }, []);

  const handlePhoneInputChange = useCallback((value: string) => {
    setPhoneInput(value);
    setShowSuggestions(true);
    setSuggestionIndex(-1);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex((prev) => Math.max(prev - 1, -1));
        return;
      }
      if (e.key === 'Enter' && suggestionIndex >= 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[suggestionIndex].number);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      handleMakeCall();
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          phoneInputRef.current && !phoneInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

        {useVerto && (
          <span className="header__verto-status" title={`Verto: ${vertoState}`}>
            {vertoStatusIcon}
          </span>
        )}

        {!useVerto ? (
          <span className="header__device-msg">
            {myNetworkStatus === 1
              ? 'Вы пользуетесь другим устройством'
              : 'Не подключено ни одно устройство. Вы находитесь offline'}
          </span>
        ) : (
          <>
            <div className="header__phone-wrapper">
              <input
                ref={phoneInputRef}
                className="header__phone-input"
                type="text"
                value={phoneInput}
                onChange={(e) => handlePhoneInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Номер или имя..."
                disabled={hasActiveCall}
              />
              {showSuggestions && suggestions.length > 0 && !hasActiveCall && (
                <div className="header__suggestions" ref={suggestionsRef}>
                  {suggestions.map((s, i) => (
                    <div
                      key={s.id}
                      className={`header__suggestion-item ${i === suggestionIndex ? 'header__suggestion-item--active' : ''}`}
                      onMouseDown={() => handleSelectSuggestion(s.number)}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
            {isConsulting ? (
              <button
                className="header__back-btn"
                onClick={handleBackFromConsult}
                title="Вернуться к звонящему"
              >
                ← Назад
              </button>
            ) : (
              <>
                <input
                  className="header__transfer-input"
                  type="text"
                  value={transferInput}
                  onChange={(e) => setTransferInput(e.target.value)}
                  onKeyDown={handleTransferKeyDown}
                  placeholder="Номер или имя..."
                />
                <button
                  className="header__transfer-btn"
                  onClick={handleBlindTransfer}
                  disabled={!transferInput.trim() || !activeCallID}
                  title="Слепой перевод"
                >
                  ↗ Перевод
                </button>
                <button
                  className="header__transfer-btn"
                  onClick={handleAttendedTransfer}
                  disabled={!transferInput.trim() || !activeCallID}
                  title="Перевод с консультацией"
                >
                  ↗ С консультацией
                </button>
              </>
            )}
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

          </>
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
