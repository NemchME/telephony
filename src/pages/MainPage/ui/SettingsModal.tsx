import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { useUpdateUserSettingsMutation } from '@/entities/user/api/userApi';
import { selectUserEntities } from '@/entities/user/model/userSelectors';

const RINGTONES = [
  'Asterisk_ring1', 'Asterisk_ring2', 'Asterisk_ring3', 'Asterisk_ring4',
  'Asterisk_ring5', 'Asterisk_ring6', 'Asterisk_ring7', 'Asterisk_ring8',
  'Asterisk_ring9', 'Asterisk_ring10', 'Asterisk_ring11', 'Asterisk_ring12',
  'Asterisk_ring13', 'Asterisk_ring14', 'Asterisk_ring15', 'Asterisk_ring16',
];

const LS_STUN = 'settings.useStun';

type ServerSettings = {
  ringtone?: string;
  endCallSound?: boolean;
};

function loadStun(): boolean {
  try {
    const v = localStorage.getItem(LS_STUN);
    if (v === null) return false;
    return v === 'true';
  } catch { return false; }
}

function parseServerSettings(raw: string | undefined | null): ServerSettings {
  if (!raw) return {};
  try { return JSON.parse(raw) as ServerSettings; } catch { return {}; }
}

export function getSettings(userSettingsJson: string | undefined | null): {
  ringtone: string;
  endCallSound: boolean;
  useStun: boolean;
} {
  const s = parseServerSettings(userSettingsJson);
  return {
    ringtone: s.ringtone ?? 'Asterisk_ring1',
    endCallSound: s.endCallSound ?? true,
    useStun: loadStun(),
  };
}

type Props = {
  onClose: () => void;
};

export function SettingsModal({ onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userId = useAppSelector(selectUserId);
  const userEntities = useAppSelector(selectUserEntities);
  const user = userId ? userEntities[userId] : undefined;
  const serverSettings = parseServerSettings(user?.settings);
  const [updateSettings] = useUpdateUserSettingsMutation();

  const [ringtone, setRingtone] = useState(serverSettings.ringtone ?? 'Asterisk_ring1');
  const [endCallSound, setEndCallSound] = useState(serverSettings.endCallSound ?? true);
  const [useStun, setUseStun] = useState(loadStun);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const saveToServer = (newRingtone: string, newEndCallSound: boolean) => {
    if (!userId) return;
    const json: ServerSettings = { ringtone: newRingtone, endCallSound: newEndCallSound };
    updateSettings({ userId, settings: JSON.stringify(json) });
  };

  const handleRingtoneChange = (name: string) => {
    setRingtone(name);
    saveToServer(name, endCallSound);
  };

  const handlePlayRingtone = (name: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(`/sounds/${name}.mp3`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handleEndCallSoundChange = (v: boolean) => {
    setEndCallSound(v);
    saveToServer(ringtone, v);
  };

  const handleUseStunChange = (v: boolean) => {
    setUseStun(v);
    try { localStorage.setItem(LS_STUN, String(v)); } catch {}
  };

  return (
    <div className="modal-overlay">
      <div className="modal-dialog settings-modal" ref={ref}>
        <div className="modal-dialog__header">
          <span className="modal-dialog__title">Настройки</span>
          <button className="modal-dialog__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-dialog__body">

          <div className="settings-section">
            <div className="settings-section__title">Мелодия звонка</div>
            <div className="settings-ringtones">
              {RINGTONES.map((r) => (
                <label key={r} className="settings-ringtone-item">
                  <input
                    type="radio"
                    name="ringtone"
                    checked={ringtone === r}
                    onChange={() => handleRingtoneChange(r)}
                  />
                  <span className="settings-ringtone-name">{r.replace('Asterisk_', '').replace('ring', 'Мелодия ')}</span>
                  <button
                    className="settings-ringtone-play"
                    onClick={(e) => { e.preventDefault(); handlePlayRingtone(r); }}
                    title="Прослушать"
                  >
                    ▶
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={endCallSound}
                onChange={(e) => handleEndCallSoundChange(e.target.checked)}
              />
              Звук завершения вызова
            </label>
          </div>

          <div className="settings-section">
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={useStun}
                onChange={(e) => handleUseStunChange(e.target.checked)}
              />
              Использовать STUN (для работы за NAT)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
