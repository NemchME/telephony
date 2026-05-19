import { useRef, useEffect } from 'react';
import { getOutputDeviceId } from '@/shared/lib/audio/audioDevices';

type Props = {
  cdrId: string;
};

let currentlyPlaying: HTMLAudioElement | null = null;

export function RecordingPlayer({ cdrId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const outId = getOutputDeviceId();
    if (outId && 'setSinkId' in HTMLMediaElement.prototype) {
      (el as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> })
        .setSinkId(outId)
        .catch(() => { /* ignore */ });
    }
  }, []);

  const handlePlay = () => {
    if (currentlyPlaying && currentlyPlaying !== audioRef.current) {
      try { currentlyPlaying.pause(); } catch { /* ignore */ }
    }
    currentlyPlaying = audioRef.current;
  };

  if (!cdrId) return null;

  return (
    <audio
      ref={audioRef}
      controls
      preload="none"
      src={`/api/recordings/${cdrId}?stereo=0`}
      onPlay={handlePlay}
      style={{ height: 28, maxWidth: 240 }}
    />
  );
}
