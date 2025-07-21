# Savora v1.0 – Living Specification
**Last updated: 2024-07-21**

### 1. Purpose
Single-user, offline-first, India-centric wealth & wellness tracker.

### 2. Core Modules (all toggleable)
- Cash-flow, assets, liabilities, loans, IOUs  
- Insurance, vehicles, rentals, tenants, ACD, deposits  
- Itemised bills, wallets, reward points, GST, tax docs  
- Health profiles, check-ups, medicine tracker, refill alerts  
- Capital-gains indexation & XIRR  
- Offline sync via Syncthing LAN-only

### 3. Data Model (Dexie v3)
See `src/lib/db.ts`

### 4. Build Targets
- PWA (web)
- Tauri desktop (Win/Mac/Linux)
- Capacitor APK (Android)

### 5. Road-map
- v1.0 – lock scope & release  
- v1.1 – optional stubs (locker, will, crypto, SMS parser)
