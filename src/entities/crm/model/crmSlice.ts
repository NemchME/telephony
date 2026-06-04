import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type CrmTemplate = {
  id: string;
  name: string;
  url: (phoneNum?: string) => string;
};

export type CrmState = {
  available: { id: string; name: string }[];
  lastIncomingNumber: string | null;
  activateTick: number;
};

const initialState: CrmState = {
  available: [],
  lastIncomingNumber: null,
  activateTick: 0,
};

export const crmSlice = createSlice({
  name: 'crm',
  initialState,
  reducers: {
    setAvailable(state, action: PayloadAction<{ id: string; name: string }[]>) {
      state.available = action.payload;
    },
    setLastIncomingNumber(state, action: PayloadAction<string | null>) {
      state.lastIncomingNumber = action.payload;
    },
    requestCrmActivation(state) {
      state.activateTick += 1;
    },
  },
});

export const crmActions = crmSlice.actions;
export const crmReducer = crmSlice.reducer;

let crmTemplateRegistry: Record<string, CrmTemplate> = {};

export function setCrmTemplates(map: Record<string, CrmTemplate>) {
  crmTemplateRegistry = map;
}

export function getCrmTemplate(id: string): CrmTemplate | undefined {
  return crmTemplateRegistry[id];
}

export function getAllCrmTemplateIds(): string[] {
  return Object.keys(crmTemplateRegistry);
}
