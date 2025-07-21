```markdown
# Savora v1.0 – Detailed Specification  
**Single-user, offline-first, India-centric wealth & wellness tracker**  
**Last updated: 2024-07-21  (frozen for v1.0)**

────────────────────────────────────────
1. SCOPE & PHILOSOPHY
────────────────────────────────────────
- **Offline first** – IndexedDB via Dexie, optional Syncthing LAN-only sync.  
- **Progressive disclosure** – every module starts OFF, enabled in Settings.  
- **Zero cloud cost** – no paid APIs, no 24×7 servers.  
- **India defaults** – INR, Indian tax year, CII index, Indian MF/insurance norms.  
- **Cross-platform** – same code → PWA + Tauri (Win/Mac/Linux) + Capacitor APK (Android).

────────────────────────────────────────
2. DATA MODEL (Dexie v3)
────────────────────────────────────────
interface Txn {
  id: string;                 // uuid
  date: Date;
  amount: number;             // +income, -expense
  currency: string;           // default 'INR'
  category: string;           // see enum list
  note?: string;
  tags?: string[];            // free-form e.g. 'Father', 'Child'
  goalId?: string;
  receipt?: string;           // base64 or file URI
  creditCardId?: string;
  tenantId?: string;
  propertyId?: string;
  paymentMix?: PaymentSplit[];
}

interface PaymentSplit {
  mode: 'CreditCard' | 'Wallet' | 'RewardPoints' | 'Cash' | 'UPI';
  amount: number;
  creditCardId?: string;
  walletId?: string;
}

interface Wallet {
  id: string; name: string; balance: number; expiry?: Date; sourceCard?: string;
}

interface CreditCard {
  id: string; issuer: string; last4: string; network: string;
  type: 'LTF' | 'Spend-Waiver' | 'Milestone';
  annualFee: number; spendThreshold?: number; rewardMilestone?: number;
  cycleStart: number; stmtDay: number; dueDay: number;
}

interface Loan {
  id: string; lender: string; principal: number; disbursalDate: Date;
  tenureMonths: number; roi: number; emi: number; firstEmiDate: Date;
  outstanding?: number; type: 'Personal' | 'Home' | 'Plot';
  closureDate?: Date; closedByLoanIds?: string[]; amortization?: AmortizationRow[];
}

interface AmortizationRow {
  date: Date; emi: number; principal: number; interest: number; outstanding: number;
}

interface Goal {
  id: string; name: string; horizon: 'micro'|'short'|'medium'|'long';
  targetAmount: number; targetDate: Date; linkedTxns: string[]; autoSip?: boolean;
}

interface Policy {
  id: string; type: 'Term'|'Health'|'Motor'|'Other'; provider: string;
  sumInsured: number; premium: number; dueDay: number; startDate: Date;
  nomineeName?: string; nomineeRelation?: string; docs?: string[];
}

interface Vehicle {
  id: string; owner: string; regNo: string; make: string; model: string;
  type: 'Bike'|'Car'|'Scooter'; purchaseDate: Date; insuranceExpiry: Date;
  premium: number; location: string; odo?: number; fastagBalance?: number;
  pucExpiry?: Date; serviceLogs: ServiceLog[];
}

interface ServiceLog {
  date: Date; odo: number; centre: string; items: LineItem[]; total: number;
}

interface RentalProperty {
  id: string; address: string; owner: string; type: string;
  squareYards: number; maxTenants: number; monthlyRent: number;
  dueDay: number; escalationPercent?: number; escalationMonths?: number;
}

interface Tenant {
  id: string; propertyId: string; tenantName: string; roomNo?: string;
  monthlyRent: number; depositPaid: number; depositRefund?: number;
  startDate: Date; endDate?: Date; depositTxns: string[];
}

interface ACDEntry {
  id: string; propertyId: string; tenantId: string; billOwner: string;
  date: Date; amount: number; rentDeduction: number; billMonth: string;
}

interface CapitalGain {
  assetId: string; purchaseDate: Date; purchasePrice: number;
  purchaseIndex: number; saleDate?: Date; salePrice?: number;
  saleIndex?: number; xirr?: number;
}

interface Subscription {
  id: string; vendor: string; plan: string; cost: number;
  cycle: 'monthly'|'yearly'; nextDebit: Date; cancelUrl?: string; receiptFile?: string;
}

interface RepairLog {
  id: string; propertyId: string; date: Date; description: string;
  cost: number; type: 'Repair'|'Improvement'; contractor?: string; receipt?: string;
}

interface HealthProfile {
  id: string; name: string; dob: Date; bloodGroup?: string;
  allergies?: string[]; chronicConditions?: string[];
}

interface HealthCheckup {
  id: string; profileId: string; date: Date; type: 'Annual'|'Ad-hoc';
  doctor?: string; lab: string; reportFile?: string;
  parameters: HealthParameter[];
}

interface HealthParameter {
  name: string; value: number; unit: string; flag?: 'Normal'|'Borderline'|'High';
}

interface Medicine {
  id: string; profileId: string; name: string; dosage: string;
  startDate: Date; endDate?: Date; refillQty: number; refillAlertDays: number;
  prescribedBy?: string;
}

interface HandLoan {
  id: string; lender: string; borrower: string; principal: number;
  clearedDate?: Date; note?: string;
}
```

────────────────────────────────────────
3. BUILD & RELEASE
────────────────────────────────────────
- **Dev**  
  ```bash
  npm run dev          # Vite web
  npm run tauri:dev    # Desktop
  npm run android      # Capacitor APK
  ```
- **Release**  
  ```bash
  git tag v1.0
  npm run build && npm run release
  ```
  GitHub Actions matrix builds APK + Tauri binaries.

────────────────────────────────────────
4. SYNC & BACKUP
────────────────────────────────────────
- Offline encrypted JSON export  
- Syncthing folder: `~/Documents/SavoraSync` (LAN-only)

────────────────────────────────────────
5. ROAD-MAP
────────────────────────────────────────
- v1.0 – **lock & release**  
- v1.1 – empty stubs (locker, will, crypto, SMS parser)

────────────────────────────────────────
6. FINAL GO/NO-GO
────────────────────────────────────────
