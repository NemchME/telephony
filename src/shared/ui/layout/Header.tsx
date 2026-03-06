import { useState, type KeyboardEvent } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import {
  selectUserCommonName,
  selectUserName,
  selectUserNumbers,
} from '@/entities/session/model/sessionSelectors';
import { useTerminateMutation } from '@/entities/session/api/authApi';
import { useMakeCallMutation } from '@/entities/call/api/callApi';
import { StatusDropdown } from '@/pages/MainPage/ui/StatusDropdown';
import { SettingsModal } from '@/pages/MainPage/ui/SettingsModal';
import { UserGroupsModal } from '@/pages/MainPage/ui/UserGroupsModal';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const commonName = useAppSelector(selectUserCommonName);
  const userName = useAppSelector(selectUserName);
  const userNumbers = useAppSelector(selectUserNumbers);
  const [terminate] = useTerminateMutation();
  const [makeCall, { isLoading: isCallLoading }] = useMakeCallMutation();
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState('');
  const [callError, setCallError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userGroupsOpen, setUserGroupsOpen] = useState(false);

  const displayName = commonName ?? userName ?? '';
  const mainNumber = userNumbers[0] ?? '';

  const handleLogout = async () => {
    try {
      await terminate().unwrap();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleMakeCall = async () => {
    const cdpn = phoneInput.trim();
    if (!cdpn || !mainNumber) return;
    setCallError(null);
    try {
      await makeCall({ cgpn: mainNumber, cdpn }).unwrap();
      setPhoneInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка вызова';
      setCallError(msg);
      setTimeout(() => setCallError(null), 3000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMakeCall();
    }
  };

  return (
    <>
      <div className="header">
        <span className="header__title">Call-Центр</span>
        <span className="header__user-info">
          {displayName} {mainNumber}
        </span>
        <StatusDropdown />
        <div className="header__spacer" />
        <input
          className="header__phone-input"
          type="text"
          value={phoneInput}
          onChange={(e) => setPhoneInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Номер..."
        />
        <button
          className="header__call-btn"
          onClick={handleMakeCall}
          disabled={isCallLoading || !phoneInput.trim()}
          title={callError ?? undefined}
        >
          {isCallLoading ? '...' : '📞 Звонок'}
        </button>
        {callError && <span className="header__call-error">{callError}</span>}
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
