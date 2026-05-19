import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { getCrmTemplate } from '@/entities/crm/model/crmSlice';

export function CrmPanel() {
  const available = useAppSelector((s) => s.crm.available);
  const lastIncomingNumber = useAppSelector((s) => s.crm.lastIncomingNumber);

  const [activeId, setActiveId] = useState<string | null>(available[0]?.id ?? null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastAppliedNumberRef = useRef<string | null>(null);
  const lastAppliedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (available.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !available.find((c) => c.id === activeId)) {
      setActiveId(available[0]!.id);
    }
  }, [available, activeId]);

  const template = useMemo(() => (activeId ? getCrmTemplate(activeId) : undefined), [activeId]);

  useEffect(() => {
    if (!template || !iframeRef.current) return;

    const isFirstLoadForCrm = lastAppliedIdRef.current !== template.id;

    if (isFirstLoadForCrm) {
      try {
        const src = template.url(undefined);
        iframeRef.current.src = src;
        lastAppliedIdRef.current = template.id;
        lastAppliedNumberRef.current = null;
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[CRM] template.url (init) failed', err);
      }
      return;
    }
    if (!lastIncomingNumber) return;
    if (import.meta.env.PROD && lastIncomingNumber.length < 7) return;
    if (lastAppliedNumberRef.current === lastIncomingNumber) return;

    try {
      const src = template.url(lastIncomingNumber);
      iframeRef.current.src = src;
      lastAppliedNumberRef.current = lastIncomingNumber;
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[CRM] template.url failed', err);
    }
  }, [template, lastIncomingNumber]);

  if (available.length === 0) {
    return <div style={{ padding: 16, color: '#888' }}>Нет доступных CRM</div>;
  }

  return (
    <div className="crm-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {available.length > 1 && (
        <div className="crm-panel__tabs" style={{ display: 'flex', gap: 4, padding: 6, borderBottom: '1px solid var(--color-border, #ddd)' }}>
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
      <div style={{ flex: 1, minHeight: 0 }}>
        <iframe
          ref={iframeRef}
          title={template?.name ?? 'CRM'}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    </div>
  );
}
