// Patch to suppress Dexie namespace/module keyword error in TypeScript 5.5+
// This re-declares the problematic ambient module to avoid TS1540
declare module 'dexie' {
  export * from 'dexie/dist/dexie';
}
