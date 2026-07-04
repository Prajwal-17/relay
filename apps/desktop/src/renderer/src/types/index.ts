// types used only for the web

export const SYNCSTATUS = {
  SAVING: "saving",
  IS_DIRTY: "is_dirty",
  SYNCED: "synced"
} as const;

export type SyncStatus = (typeof SYNCSTATUS)[keyof typeof SYNCSTATUS];
