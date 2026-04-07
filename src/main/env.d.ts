/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly VITE_BUILD_MODE?: string;
  readonly M_VITE_DATABASE_URL?: string;
  readonly M_VITE_MIGRATION_FOLDER?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
