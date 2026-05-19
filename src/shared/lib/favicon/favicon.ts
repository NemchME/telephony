export type FaviconKind = 'avail' | 'away' | 'direct' | 'dnd' | 'unavail';

const FILE_BY_KIND: Record<FaviconKind, string> = {
  avail: '/favicons/favicon.ico',
  away: '/favicons/favicon_away.ico',
  direct: '/favicons/favicon_direct.ico',
  dnd: '/favicons/favicon_dnd.ico',
  unavail: '/favicons/favicon_unavail.ico',
};

function pickKindFromStatus(compoundStatus: string | null | undefined): FaviconKind {
  if (!compoundStatus) return 'avail';
  const avail = compoundStatus.split('_')[0] ?? compoundStatus;
  if (avail === 'direct') return 'direct';
  if (avail === 'dnd') return 'dnd';
  if (avail === 'away') return 'away';
  return 'avail';
}

export function setFaviconForStatus(
  compoundStatus: string | null | undefined,
  opts: { offline?: boolean } = {},
) {
  const kind: FaviconKind = opts.offline ? 'unavail' : pickKindFromStatus(compoundStatus);
  const href = FILE_BY_KIND[kind];

  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/x-icon';
  if (link.getAttribute('href') !== href) {
    link.href = href;
  }
}