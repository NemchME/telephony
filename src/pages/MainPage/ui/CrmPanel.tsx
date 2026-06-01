import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { getCrmTemplate } from '@/entities/crm/model/crmSlice';

export function CrmPanel() {
  const available = useAppSelector((s) => s.crm.available);
  const lastIncomingNumber = useAppSelector((s) => s.crm.lastIncomingNumber);

  const [activeId, setActiveId] = useState<string | null>(available[0]?.id ?? null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const lastAppliedNumberRef = useRef<string | null>(null);
  const initializedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (available.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !available.find((c) => c.id === activeId)) {
      setActiveId(available[0]!.id);
    }
  }, [available, activeId]);

  useEffect(() => {
    for (const c of available) {
      const el = iframeRefs.current[c.id];
      if (!el) continue;
      if (initializedRef.current.has(c.id)) continue;
      const tpl = getCrmTemplate(c.id);
      if (!tpl) continue;
      try {
        el.src = tpl.url(undefined);
        initializedRef.current.add(c.id);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[CRM] init failed', c.id, err);
      }
    }
  }, [available]);

  useEffect(() => {
    if (available.length === 0) return;
    if (!lastIncomingNumber) return;
    const phoneNum: string = lastIncomingNumber;
    if (lastAppliedNumberRef.current === phoneNum) return;

    for (const c of available) {
      const el = iframeRefs.current[c.id];
      if (!el) continue;
      const tpl = getCrmTemplate(c.id);
      if (!tpl) continue;
      try {
        el.src = tpl.url(phoneNum);
        initializedRef.current.add(c.id);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[CRM] update failed', c.id, err);
      }
    }
    if (available[0]) setActiveId(available[0].id);
    lastAppliedNumberRef.current = phoneNum;
  }, [lastIncomingNumber, available]);

  if (available.length === 0) {
    return <div style={{ padding: 16, color: '#888' }}>Нет доступных CRM</div>;
  }

  return (
    <div className="crm-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {available.length > 1 && (
        <div
          className="crm-panel__tabs"
          style={{
            display: 'flex',
            gap: 4,
            padding: 6,
            borderBottom: '1px solid var(--color-border, #ddd)',
          }}
        >
          {available.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                padding: '4px 10px',
                background: activeId === c.id ? 'var(--bg-tab-active, #fff)' : 'var(--bg-tab-inactive, #eee)',
                border: '1px solid var(--color-border, #ccc)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {available.map((c) => (
          <iframe
            key={c.id}
            ref={(el) => { iframeRefs.current[c.id] = el; }}
            title={c.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              display: activeId === c.id ? 'block' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
