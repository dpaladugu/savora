// Ambient declaration override to fix Dexie's `declare module` instead of `declare namespace`
// TypeScript 5.5+ raises TS1540 on `declare module Dexie {}` inside an ES module.
// This file shadows the problematic ambient and re-declares it as a namespace.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export {};
