// types used only for the web

export const SYNCSTATUS = {
  SAVING: "saving",
  IS_DIRTY: "is_dirty",
  SYNCED: "synced"
} as const;

export type SyncStatus = (typeof SYNCSTATUS)[keyof typeof SYNCSTATUS];

export const CUSTOMER_DETAIL_TAB = {
  OVERVIEW: "overview",
  ACCOUNTING: "accounting",
  SALES: "sales",
  ESTIMATES: "estimates",
  ACTIVITY: "activity",
  ABOUT: "about",
  SETTINGS: "settings"
} as const;

export type CustomerDetailTab = (typeof CUSTOMER_DETAIL_TAB)[keyof typeof CUSTOMER_DETAIL_TAB];

export const TXN_TABLE_ALIGN = {
  LEFT: "left",
  RIGHT: "right",
  CENTER: "center"
} as const;

export type TxnTableAlign = (typeof TXN_TABLE_ALIGN)[keyof typeof TXN_TABLE_ALIGN];

export type TxnTableColMeta = {
  align?: TxnTableAlign;
  width?: string;
};
