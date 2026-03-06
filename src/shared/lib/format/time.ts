export function formatElapsed(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDateTime(epoch: number): string {
  const ms = epoch < 1e12 ? epoch * 1000 : epoch < 1e15 ? epoch / 1000 : epoch;
  const d = new Date(ms < 1e12 ? epoch * 1000 : epoch > 1e15 ? epoch / 1000 : epoch);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())} ${getMonthName(d.getMonth())} ${d.getFullYear()}`;
}

function getMonthName(m: number): string {
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return months[m] ?? '';
}

export function formatTime(epoch: number): string {
  const d = toDate(epoch);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function elapsedSince(epoch: number): number {
  const ms = toMs(epoch);
  return Math.max(0, Math.floor((Date.now() - ms) / 1000));
}

function toMs(epoch: number): number {
  if (epoch > 1e15) return epoch / 1000;
  if (epoch > 1e12) return epoch;
  return epoch * 1000;
}

function toDate(epoch: number): Date {
  return new Date(toMs(epoch));
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  return formatElapsed(totalSec);
}
