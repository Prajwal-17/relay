/// <reference types="electron-vite/node" />

declare module "@repo/eslint-config/react-internal";

interface ImportMetaEnv {
  readonly M_VITE_DATABASE_URL?: string;
  readonly M_VITE_MIGRATION_FOLDER?: string;
  readonly M_VITE_USER_DATA_DIR?: string;
  readonly M_VITE_API_PORT?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
