/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Apps Script Web App URL that appends signups to the sheet. */
  readonly VITE_SHEET_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
