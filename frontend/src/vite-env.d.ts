/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

declare function ym(id: number, method: string, ...args: unknown[]): void;


interface ImportMeta {
  readonly env: ImportMetaEnv;
}
