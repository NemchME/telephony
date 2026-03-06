import { useState, useEffect, useRef } from 'react';

const RINGTONES = [
  'Asterisk_ring1', 'Asterisk_ring2', 'Asterisk_ring3', 'Asterisk_ring4',
  'Asterisk_ring5', 'Asterisk_ring6', 'Asterisk_ring7', 'Asterisk_ring8',
  'Asterisk_ring9', 'Asterisk_ring10', 'Asterisk_ring11', 'Asterisk_ring12',
  'Asterisk_ring13', 'Asterisk_ring14', 'Asterisk_ring15', 'Asterisk_ring16',
];

const LS_RINGTONE = 'settings.ringtone';
const LS_END_SOUND = 'settings.endCallSound';
const LS_STUN = 'settings.useStun';

function loadSetting(key: string, def: string): string {
  try { return localStorage.getItem(key) ?? def; } catch { return def; }
}

function loadBool(key: string, def: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return def;
    return v === 'true';
  } catch { return def; }
}

function saveSetting(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

type Props = {
  onClose: () => void;
};

export function SettingsModal({ onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ringtone, setRingtone] = useState(() => loadSetting(LS_RINGTONE, 'Asterisk_ring1'));
  const [endCallSound, setEndCallSound] = useState(() => loadBool(LS_END_SOUND, true));
  const [useStun, setUseStun] = useState(() => loadBool(LS_STUN, false));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleRingtoneChange = (name: string) => {
    setRingtone(name);
    saveSetting(LS_RINGTONE, name);
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
    saveSetting(LS_END_SOUND, String(v));
  };

  const handleUseStunChange = (v: boolean) => {
    setUseStun(v);
    saveSetting(LS_STUN, String(v));
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
