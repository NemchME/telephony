import type { CrmTemplate } from '@/entities/crm/model/crmSlice';


const isHttps = () => typeof location !== 'undefined' && location.protocol === 'https:';

export const CRM_TEMPLATES: Record<string, CrmTemplate> = {
  monitoring: {
    id: 'monitoring',
    name: 'Мониторинг',
    url: (phoneNum) => {
      const base = isHttps() ? 'https://monitoring.vrn.ru/' : 'http://monitoring.vrn.ru/';
      return phoneNum
        ? `${base}call.do?iframe&caller=${encodeURIComponent(phoneNum)}`
        : `${base}?iframe`;
    },
  },

  concs: {
    id: 'concs',
    name: 'Биллинг',
    url: (phoneNum) => {
      const base = isHttps()
        ? 'https://billing.vrn.ru:9988/concs/'
        : 'http://billing.vrn.ru:9977/concs/';
      return phoneNum
        ? `${base}index.jsp?view=clients&autophone=${encodeURIComponent(phoneNum)}`
        : base;
    },
  },

  crm: {
    id: 'crm',
    name: 'Система регистрации',
    url: (phoneNum) => {
      const base = 'https://crm.vrn.ru/';
      return phoneNum
        ? `${base}caller?phone=${encodeURIComponent(phoneNum)}&app=true`
        : base;
    },
  },

  test1: {
    id: 'test1',
    name: 'TEST 1 CRM',
    url: (phoneNum) => {
      const base = isHttps()
        ? 'https://icalert-3.vrn.ru/crm/test1'
        : 'http://icalert-3.vrn.ru/crm/test1';
      return phoneNum ? `${base}?caller=${encodeURIComponent(phoneNum)}` : base;
    },
  },

  test2: {
    id: 'test2',
    name: 'TEST 2 CRM',
    url: (phoneNum) => {
      const base = isHttps()
        ? 'https://icalert-3.vrn.ru/crm/test2'
        : 'http://icalert-3.vrn.ru/crm/test2';
      return phoneNum ? `${base}?caller=${encodeURIComponent(phoneNum)}` : base;
    },
  },
};
