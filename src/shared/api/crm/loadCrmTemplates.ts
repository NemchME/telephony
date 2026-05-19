import type { CrmTemplate } from '@/entities/crm/model/crmSlice';

const CRM_SCRIPT_URL = 'https://m-dev3.vrn.ru/cc/verto.crm.js';

declare global {
  interface Window {
    phone?: {
      crm?: Record<string, { name: string; url: (phoneNum?: string) => string }>;
    };
  }
}

let loadPromise: Promise<Record<string, CrmTemplate>> | null = null;

export function loadCrmTemplates(url: string = CRM_SCRIPT_URL): Promise<Record<string, CrmTemplate>> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<Record<string, CrmTemplate>>((resolve, reject) => {
    if (!window.phone) {
      window.phone = {};
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[data-crm-loader="1"]`);
    if (existing) {
      const tryResolve = () => {
        const map = window.phone?.crm ?? {};
        const out: Record<string, CrmTemplate> = {};
        for (const [id, def] of Object.entries(map)) {
          if (def && typeof def.url === 'function') {
            out[id] = { id, name: def.name ?? id, url: def.url };
          }
        }
        resolve(out);
      };
      if (window.phone?.crm) tryResolve();
      else existing.addEventListener('load', tryResolve, { once: true });
      existing.addEventListener('error', () => reject(new Error('CRM script failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.dataset.crmLoader = '1';
    script.onload = () => {
      const map = window.phone?.crm ?? {};
      const out: Record<string, CrmTemplate> = {};
      for (const [id, def] of Object.entries(map)) {
        if (def && typeof def.url === 'function') {
          out[id] = { id, name: def.name ?? id, url: def.url };
        }
      }
      resolve(out);
    };
    script.onerror = () => reject(new Error('CRM script failed to load'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
