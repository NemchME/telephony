import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { selectUserId } from '@/entities/session/model/sessionSelectors';
import { useUpdateUserSettingsMutation } from '@/entities/user/api/userApi';
import { selectUserEntities } from '@/entities/user/model/userSelectors';
import { useResetUserStateMutation } from '@/entities/callGroup/api/callGroupApi';
import {
  getInputDeviceId,
  setInputDeviceId,
  getOutputDeviceId,
  setOutputDeviceId,
  listAudioDevices,
  primeDeviceLabels,
  applySinkId,
  supportsSinkId,
} from '@/shared/lib/audio/audioDevices';

const RINGTONES = ['apple_ring', 'bell_ring'] as const;

const RINGTONE_LABEL: Record<string, string> = {
  apple_ring: 'Apple',
  bell_ring: 'Колокольчик',
};

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
    ringtone: s.ringtone ?? 'apple_ring',
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
  const [resetUserState] = useResetUserStateMutation();

  const initialRingtone = serverSettings.ringtone && (RINGTONES as readonly string[]).includes(serverSettings.ringtone)
    ? serverSettings.ringtone
    : 'apple_ring';
  const [ringtone, setRingtone] = useState(initialRingtone);
  const [endCallSound, setEndCallSound] = useState(serverSettings.endCallSound ?? true);
  const [useStun, setUseStun] = useState(loadStun);

  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [inputId, setInputIdState] = useState<string>(getInputDeviceId() ?? '');
  const [outputId, setOutputIdState] = useState<string>(getOutputDeviceId() ?? '');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await primeDeviceLabels();
      const list = await listAudioDevices();
      if (cancelled) return;
      setInputs(list.inputs);
      setOutputs(list.outputs);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch { /* ignore */ }
        audioRef.current = null;
      }
    };
  }, []);

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
    applySinkId(audio);
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

  const handleInputChange = (id: string) => {
    setInputIdState(id);
    setInputDeviceId(id || null);
  };

  const handleOutputChange = (id: string) => {
    setOutputIdState(id);
    setOutputDeviceId(id || null);
  };

  const handleResetMyState = () => {
    if (!userId) return;
    const ok = window.confirm('Сбросить ваше текущее состояние? Этот эффект — как у кнопки «Сброс» в списке пользователей, но всегда доступен.');
    if (!ok) return;
    resetUserState({ userID: userId });
  };

  const handleTestOutput = () => {
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* ignore */ }
    }
    const audio = new Audio('/sounds/end_call.mp3');
    audio.volume = 0.5;
    applySinkId(audio);
    audioRef.current = audio;
    audio.play().catch(() => {});
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
                  <span className="settings-ringtone-name">{RINGTONE_LABEL[r] ?? r}</span>
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
            <div className="settings-section__title">Аудио-устройства</div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Микрофон</label>
              <select
                value={inputId}
                onChange={(e) => handleInputChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">По умолчанию</option>
                {inputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Микрофон (${d.deviceId.slice(0, 6)})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4 }}>
                Устройство вывода (звонок, рингтон)
                {!supportsSinkId() && <span style={{ color: '#e74c3c', fontSize: 11 }}> — не поддерживается браузером</span>}
              </label>
              <select
                value={outputId}
                onChange={(e) => handleOutputChange(e.target.value)}
                style={{ width: '100%' }}
                disabled={!supportsSinkId()}
              >
                <option value="">По умолчанию</option>
                {outputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Динамик (${d.deviceId.slice(0, 6)})`}
                  </option>
                ))}
              </select>
              <button
                style={{ marginTop: 6 }}
                onClick={handleTestOutput}
                disabled={!supportsSinkId()}
              >
                Тест
              </button>
            </div>
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

          <div className="settings-section">
            <button
              onClick={handleResetMyState}
              disabled={!userId}
              style={{
                padding: '6px 14px',
                background: '#f7c5c0',
                border: '1px solid #c95349',
                borderRadius: 4,
                cursor: userId ? 'pointer' : 'not-allowed',
                fontWeight: 500,
              }}
            >
              Сбросить своё состояние
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
