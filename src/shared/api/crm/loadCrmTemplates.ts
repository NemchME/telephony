import type { CrmTemplate } from '@/entities/crm/model/crmSlice';
import { CRM_TEMPLATES } from './crmTemplates';
export function loadCrmTemplates(): Promise<Record<string, CrmTemplate>> {
  return Promise.resolve(CRM_TEMPLATES);
}
