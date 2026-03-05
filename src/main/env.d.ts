/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly VITE_BUILD_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
