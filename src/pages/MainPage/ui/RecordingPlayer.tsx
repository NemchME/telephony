import { useRef, useEffect, useState } from 'react';
import { getOutputDeviceId } from '@/shared/lib/audio/audioDevices';

type Props = {
  cdrId: string;
  /** Если задан — будет использован вместо cdrId в URL записи. */
  recordingId?: string;
};

let currentlyPlaying: HTMLAudioElement | null = null;

export function RecordingPlayer({ cdrId, recordingId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const id = recordingId ?? cdrId;
  const remoteUrl = `/api/recordings/${id}?stereo=0`;

  // Применяем sink id (выбранное устройство вывода) к audio элементу.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const outId = getOutputDeviceId();
    if (outId && 'setSinkId' in HTMLMediaElement.prototype) {
      (el as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> })
        .setSinkId(outId)
        .catch(() => { /* ignore */ });
    }
  }, [blobUrl]);

  // Очистка blob URL при анмаунте, чтобы не держать память.
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handleLoad = async () => {
    if (loading || blobUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(remoteUrl, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error('Запись пуста (0 байт)');
      }
      const obj = URL.createObjectURL(blob);
      setBlobUrl(obj);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
      setError(msg);
      if (import.meta.env.DEV) {
        console.warn('[RecordingPlayer] failed:', remoteUrl, err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (currentlyPlaying && currentlyPlaying !== audioRef.current) {
      try { currentlyPlaying.pause(); } catch { /* ignore */ }
    }
    currentlyPlaying = audioRef.current;
  };

  if (!id) return null;

  if (blobUrl) {
    return (
      <audio
        ref={audioRef}
        controls
        autoPlay
        src={blobUrl}
        onPlay={handlePlay}
        style={{ height: 28, maxWidth: 240 }}
      />
    );
  }

  if (error) {
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
        <span style={{ color: '#e74c3c' }} title={error}>✕ {error}</span>
        <a href={remoteUrl} target="_blank" rel="noreferrer" style={{ color: '#1976d2' }}>
          открыть
        </a>
      </span>
    );
  }

  return (
    <button
      onClick={handleLoad}
      disabled={loading}
      title="Загрузить запись"
      style={{
        padding: '2px 10px',
        fontSize: 12,
        cursor: loading ? 'wait' : 'pointer',
        background: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: 4,
      }}
    >
      {loading ? '⏳ Загрузка...' : '▶ Прослушать'}
    </button>
  );
}