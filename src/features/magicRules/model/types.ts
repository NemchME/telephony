export type MagicRules = {
  exclusiveGroups?: string[][];
  forbiddenStatusesByTag?: Record<string, string[]>;
};

export const EMPTY_MAGIC_RULES: MagicRules = {};
