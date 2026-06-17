import type { RootState } from '@/app/store/store';
import { EMPTY_MAGIC_RULES, type MagicRules } from './types';


export function selectMagicRules(s: RootState): MagicRules {
  const user = s.session.user as (typeof s.session.user & { magicRules?: MagicRules }) | null;
  return user?.magicRules ?? EMPTY_MAGIC_RULES;
}