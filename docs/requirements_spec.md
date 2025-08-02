```markdown
# Savora Personal Finance App  
**Requirement Specification v1.1 – FINAL & LIFE-OPTIMIZED**  
**Effective Date:** 26 July 2025  
**Scope:** Single-user, offline-first (IndexedDB), India-centric, zero cloud dependency.

---

## 1. Purpose & Philosophy
- **Single-user, single device** – no multi-tenant, no cloud sync.  
- **Offline-first** – all data in IndexedDB via Dexie.  
- **India defaults** – INR only, Indian tax rules, Indian instruments.  
- **Expert-grade recommendations** – CFA-aligned rules running **locally**.
- **Life-ready** – automates not just money, but **health, estate, and family events**.
- **Privacy-first** – zero PII in prompts, masked UI, self-destruct on brute-force.

---

## 2. Global Settings (Singleton)
| Field | Type | Default | Notes |
|---|---|---|---|
| taxRegime | enum('Old' \| 'New') | 'New' | locked to New regime |
| autoLockMinutes | number | 5 | 1–10 min slider |
| birthdayBudget | number | 0 | gift-giving cap |
| birthdayAlertDays | number | 7 | days-before reminder |
| emergencyContacts | Contact[] | [] | emergency-only |
| incomeTaxReturnJson | string? | null | encrypted ITR blob |
| telegramBotToken | string? | null | personal bot token |
| dependents | Dependent[] | [] | household roster |
| salaryCreditDay | number | 15 | auto-cash-flow |
| annualBonus | number? | null | for bonus-sweep rule |
| medicalInflationRate | number | 10.0 | India private-pay |
| educationInflation | number | 7.0 | child-education PV |
| vehicleInflation | number | 5.0 | repair / upgrade PV |
| maintenanceInflation | number | 6.0 | property upkeep PV |
| privacyMask | boolean | true | mask amounts by default |
| revealSecret | string? | null | Argon2id-protected unmask |
| failedPinAttempts | number | 0 | wipe after 10 |
| maxFailedAttempts | number | 10 | hard limit |
| darkMode | boolean | false | device-wide toggle |
| timeZone | string | "Asia/Kolkata" | stored once on first run |
| isTest | boolean | false | disable real nudges in dev mode |
| theme | enum('light' \| 'dark' \| 'auto') | 'auto' | respects system preference |
| deviceThemes | Record<string, 'light'\|'dark'\|'auto'>? | {} | per-device theme binding |

ts
interface Dependent {
  id: string;
  relation: 'Spouse' | 'Child' | 'Mother' | 'Grandmother' | 'Brother';
  name: string;
  dob: Date;
  gender: 'M' | 'F';
  chronic: boolean;
  schoolFeesAnnual?: number;
  isNominee: boolean;
}


---

## 3. Universal Transaction – Txn
| Field | Type | Rule |
|---|---|---|
| id | string | uuid |
| date | Date | device local |
| amount | number | > 0 |
| currency | string | hard-coded "INR" |
| category | string | built-in + custom |
| note | string | ≤ 500 chars |
| tags | string[] | max 5 |
| goalId | string? | FK → Goal |
| receiptUri | string? | cloud link only |
| cardId | string? | FK → CreditCard |
| vehicleId | string? | FK → Vehicle |
| tenantId | string? | FK → Tenant |
| propertyId | string? | FK → RentalProperty |
| rentMonth | string? | "YYYY-MM" |
| isPartialRent | boolean | false |
| paymentMix | PaymentSplit[] | sum = amount |
| cashbackAmount | number? | ≥ 0 |
| isSplit | boolean | false |
| splitWith | SplitItem[] | [{person, amount, settled}] |
| gstPaid | number? | 0 | for GST credit utilisation |

ts
interface PaymentSplit {
  mode: 'Cash' | 'Card' | 'UPI' | 'Bank';
  amount: number;
  refId?: string;
}

interface SplitItem {
  person: string;
  amount: number;
  settled: boolean;
}


---

## 4. Goal
| Field | Type | Notes |
|---|---|---|
| id | string | uuid |
| name | string | display name |
| slug | string | auto: `kid-ug-18`, `nps-t1-80ccdb` |
| type | enum('Micro' \| 'Small' \| 'Short' \| 'Medium' \| 'Long') | |
| targetAmount | number | |
| targetDate | Date | |
| currentAmount | number | auto-sum via Txn.goalId |
| notes | string | ≤ 500 chars |

---

## 5. Credit Card
| Field | Type |
|---|---|
| id | string |
| issuer | string |
| bankName | string |
| last4 | string |
| network | enum |
| cardVariant | string |
| productVariant | string |
| annualFee | number |
| annualFeeGst | number | auto = annualFee × 0.18 |
| creditLimit | number |
| creditLimitShared | boolean |
| fuelSurchargeWaiver | boolean |
| rewardPointsBalance | number |
| cycleStart | 1-31 |
| stmtDay | 1-31 |
| dueDay | 1-31 |
| fxTxnFee | number | 0 |
| emiConversion | boolean | false |

---

## 6. Vehicle
| Field | Type |
|---|---|
| id | string |
| owner | string |
| regNo | string |
| make, model | string |
| type | enum |
| purchaseDate | Date |
| insuranceExpiry | Date |
| pucExpiry | Date |
| odometer | number |
| fuelEfficiency | number | computed |
| fuelLogs | FuelFill[] |
| serviceLogs | ServiceEntry[] |
| claims | Claim[] |
| treadDepthMM | number | 0 |
| depreciationRate | number? |
| ncbPercent | number? | auto-calc from claims |

ts
interface FuelFill {
  date: Date;
  litres: number;
  odometer: number;
  isFullTank: boolean;
  cost: number;
}

interface ServiceEntry {
  date: Date;
  odometer: number;
  description: string;
  cost: number;
  nextServiceDate?: Date;
  items: ServiceItem[];
}

interface ServiceItem {
  category: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

interface Claim {
  date: Date;
  amount: number;
  description: string;
}


---

## 7. RentalProperty
| Field | Type |
|---|---|
| id | string |
| address | string |
| owner | enum('Me' \| 'Mother' \| 'Grandmother') |
| type | enum |
| squareYards | number |
| latitude, longitude | number? |
| monthlyRent | number |
| dueDay | 1-31 |
| escalationPercent | number |
| escalationDate | Date |
| lateFeeRate | number |
| noticePeriodDays | number |
| depositRefundPending | boolean |
| propertyTaxAnnual | number |
| propertyTaxDueDay | 1-31 |
| waterTaxAnnual | number |
| waterTaxDueDay | 1-31 |
| maintenanceReserve | number/year |

---

## 8. Tenant
| Field | Type |
|---|---|
| id | string |
| propertyId | string |
| tenantName | string |
| roomNo | string? |
| monthlyRent | number |
| depositPaid | number |
| joinDate | Date |
| endDate | Date? |
| depositRefundPending | boolean |
| tenantContact | string |

---

## 9. Gold (Physical)
| Field | Type |
|---|---|
| id | string |
| form | enum |
| description | string |
| grossWeight, netWeight, stoneWeight | grams |
| purity | enum |
| purchasePrice, makingCharge, gstPaid, hallmarkCharge | INR |
| karatPrice | number |
| purchaseDate | Date |
| merchant | string |
| storageLocation | string |
| storageCost | number/year |
| familyMember | string |
| insurancePolicyId | string? |
| receiptUri | string? |
| saleDate, salePrice, profit | auto-calc |
| goldLoanId | string? |
| loanInterestRate | number? |
| currentMcxPrice | number? |

---

## 10. Investment (All-in-One)
| Field | Type |
|---|---|
| id | string |
| type | enum('MF-Growth' \| 'MF-Dividend' \| 'SIP' \| 'PPF' \| 'EPF' \| 'NPS-T1' \| 'NPS-T2' \| 'Gold-Coin' \| 'Gold-ETF' \| 'SGB' \| 'FD' \| 'RD' \| 'Stocks' \| 'Others' \| 'Gift-Card-Float') |
| name | string |
| folioNo | string? |
| currentNav | number |
| units | number |
| investedValue | number |
| currentValue | number |
| startDate | Date |
| maturityDate | Date? |
| sipAmount | number? |
| sipDay | 1-31? |
| frequency | enum |
| goalId | string? |
| lockInYears | number? |
| taxBenefit | boolean |
| familyMember | string |
| notes | string |
| interestRate | number? |
| interestCreditDate | Date? |
| dividendReceived | number? |
| indexCostInflation | number? | for capital gains |

---

## 11. Insurance (Unified)
| Field | Type |
|---|---|
| id | string |
| type | enum |
| provider | string |
| policyNo | string |
| sumInsured | number |
| premium | number/year |
| dueDay | 1-31 |
| startDate, endDate | Date |
| nomineeName, nomineeDOB, nomineeRelation | string |
| familyMember | string |
| personalTermCover, personalHealthCover | number? |
| employerTermCover, employerHealthCover | number? |
| notes | string |
| personalLiabilityCover | number? |

---

## 12. Loan
| Field | Type |
|---|---|
| id | string |
| type | enum('Personal' \| 'Personal-Brother' \| 'Education-Brother') |
| borrower | 'Me' \| 'Brother' |
| principal | number |
| roi | number |
| tenureMonths | number |
| emi | number |
| outstanding | number |
| startDate | Date |
| amortisationSchedule | AmortRow[] |
| isActive | boolean |
| prepaymentPenalty | number? |
| moratoriumMonths | number? |
| loanInsurance | string? |
| guarantorName | string? |

ts
interface AmortRow {
  month: number;
  emi: number;
  principalPart: number;
  interestPart: number;
  balance: number;
}


---

## 13. Brother-Repayment Tracker
| Field | Type |
|---|---|
| id | string |
| loanId | string | FK → Loan (Education-Brother only) |
| amount | number |
| date | Date |
| mode | enum |
| note | string |

---

## 14. Subscription (Recurring Bills)
| Field | Type |
|---|---|
| id | string |
| name | string |
| amount | number |
| cycle | enum |
| startDate | Date |
| nextDue | Date |
| reminderDays | number |
| isActive | boolean |

---

## 15. Health
| Field | Type |
|---|---|
| id | string |
| refillAlertDays | number |
| allergySeverity | enum? |
| emergencyContact | string? |
| nextCheckupDate | Date? |
| doctorNotes | string? |
| medicalHistory | string? |
| prescriptions | Prescription[] |
| heightCm | number? |
| weightKg | number? |
| bmi | number? |
| familyHistory | string[] |
| lifeExpectancy | number? |
| vaccinations | Vaccination[] |

ts
interface Prescription {
  date: Date;
  doctor: string;
  medicines: string[];
  amount: number;
}

interface Vaccination {
  name: string;
  dueDate: Date;
  administeredDate?: Date;
  reminderDays: number;
  notes: string;
}

vitals: Vital[]

interface Vital {
  date: Date;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  spO2?: number;
  hba1c?: number;
  tsh?: number;
  t3?: number;
  t4?: number;
  vitaminD?: number;
  vitaminB12?: number;
  creatinine?: number;
}


---

## 16. Family Bank Account
| Field | Type |
|---|---|
| id | string |
| owner | enum('Mother' \| 'Grandmother') |
| bankName | string |
| accountNo | string |
| type | enum |
| currentBalance | number |

---

## 17. Family Transfer
| Field | Type |
|---|---|
| id | string |
| fromAccountId | string |
| toPerson | enum('Mother' \| 'Grandmother' \| 'Brother') |
| amount | number |
| date | Date |
| purpose | string |
| mode | enum |

---

## 18. Emergency Fund
| Field | Type |
|---|---|
| id | string |
| targetMonths | number |
| targetAmount | number |
| currentAmount | number |
| lastReviewDate | Date |
| status | enum('OnTrack' \| 'Behind' \| 'Achieved') |
| medicalSubBucket | number | ₹200,000 |
| medicalSubBucketUsed | number | 0 |

---

## 19. Audit Log
| Field | Type |
|---|---|
| id | string |
| entity | string |
| entityId | string |
| action | string |
| oldValues | JSON? |
| newValues | JSON? |
| timestamp | Date |
| deviceId | string |

---

## 20. Expert Recommendation Rules (CFA-level)

### 20.1 Investment & Asset Allocation
- Age-based glide path  
  ≤ 35 → 70% Equity, 20% Debt, 10% Gold  
  36–50 → 60% / 30% / 10%  
  > 50 → 40% / 50% / 10%  
- Rebalance alert if any bucket drifts > 5%.  
- SIP bump on salary ↑ > 15% YoY or on birthday (inflation-linked).  
- ELSS skipped (user uses Kuvera).

### 20.2 Insurance
- Gap-cover: term < 10× income, health < 5× income.  
- CI & PA nudges at age ≥ 25.  
- Renewal 30-day early push.  
- Nominee & will prompts at age ≥ 30.

### 20.3 Loan
- EMI/income > 40% → “Debt stress”.  
- Pre-payment ROI saved > ₹10k → “Foreclose”.  
- Brother loan tracking with repayment ledger.

### 20.4 Expense & Subscription
- Subscription cost ↑ > 10% → “Review”.  
- Cash-flow forecast next 30 days vs income.  
- Split-bill unsettled > 7 days → reminder.

### 20.5 Tax (New Regime)
- 80CCD(1B) ₹50k alert if NPS-T1 < limit.  
- SGB short-term gain warning if sold < 8 yrs.  
- Advance tax reminders: 7 days before 15-Jun/Sep/Dec/Mar if liability > ₹10k.

### 20.6 Child (girl) education goal
- Skip SSY; fund via incremental equity SIP (N50+NN50+PPFAS) using PV(₹30L, 7% inflation, 17 yr) target, glide-path equity 100%→50%→0%.

---

## 21. Security & UX
- PIN / biometric lock.  
- Auto-lock 1–10 min slider.  
- Encrypted export (AES-256 + passphrase).  
- Cloud-link receipts (`receiptUri`).  
- Lazy-load heavy arrays.  
- Self-destruct on brute-force (wipe DB after 10 failed PIN attempts).  
- Dark-mode toggle (respects `theme` and `deviceThemes`).  
- Privacy mask with session-based reveal (`revealSecret` hashed with Argon2id).

---

## 22. Data Limits
| Item | Max |
|---|---|
| Receipt file cloud link | ≤ 25 MB external |
| DB rows per table | 10,000 (auto FIFO prune) |
| Fuel / service log per vehicle | 500 (lazy load) |

---

## 23. Personal-Telegram Capture (Single-User Only)
- Private Telegram bot identified by `GlobalSettings.telegramBotToken`.  
- Accepts text: `/add <amount> <category> [#tag …]` or voice → STT.  
- Writes into **PendingTxn** table (same schema as Txn minus `id`).  
- Sync-on-Wi-Fi only, no cloud persistence > 24 h.  
- Bot token is single-user; no rate-limit required.

---

## 24. Goals-Nudge Engine (Personal, CFA-grade)

### 24.1 Auto-Goal Creation Rules
| Trigger | Derived Goal | Target & Date | Logic |
|---|---|---|---|
| Health-Insurance premium detected | "Health-Insurance 3-yr" | last premium × 1.05³, +1095d | Auto-create once |
| Term-Insurance premium detected | "Term-Insurance Renewal" | last premium × 1.03, +365d | update if open |
| Vehicle Insurance record | "Vehicle-Insurance <regNo>" | last premium × 1.03, expiry −30d | one per vehicle |
| Vehicle Service cost > ₹5k last 12m | "Vehicle-Repairs Buffer <regNo>" | 3-yr median repair spend, 1yr from today | re-compute annually |
| Child DOB in Dependents | "Kid-UG@18" | PV(₹25L, educationInflation, 18-age), child_dob + 18yr | single, locked |
| Mother & Grandmother > 60y | "Senior-Citizen Medical-Corpus" | 3-yr median spend × 5, 1yr from today | re-compute yearly |
| NPS-T1 annual cap | "NPS-T1 80CCD(1B)" | ₹50k, 31-Mar each FY | auto-sweep surplus |
| PPF annual deposit | "PPF Annual" | ₹1.5L, 05-Apr each FY | auto-sweep surplus |
| Property Tax annual | "Property-Tax-<address>" | propertyTaxAnnual × 1.05, dueDay −30d | auto-create once |
| Water Tax annual | "Water-Tax-<address>" | waterTaxAnnual × 1.03, dueDay −30d | auto-create once |
| Family mobile pack (7 numbers) | "Family-Mobile-Pack-All" | 7 × cheapest 84-day pack, due −7d | sweep from rent |
| Friend credit-card repayments outstanding | "Friend-Repay-Buffer" | outstanding amount, due +7d | cash/NPS-T2 G-sec |
| Child DOB = 0y | "Baby-Vaccine-Pack" | ₹15k, child_dob + 2y | auto-create |
| Odometer ≥ 40,000 km | "Tyre-Replacement-<regNo>" | median tyre cost × 1.05 | trigger goal |
| Child DOB = 5y | "School-Admission@5" | PV(₹2L, 8%, 5yr), child_dob + 5y | auto-fund |
| Annual festival spend | "Festival-Corpus" | 3-yr median spend, 30-Sep | auto-save |

### 24.2 Funding Priority Stack
1. Emergency Fund (12 months)  
2. Insurance & statutory dues (Health, Term, Property, Water, Vehicle)  
3. Kid-UG & Retirement – equity-heavy buckets  
4. Discretionary / Luxury – optional  

### 24.3 Monthly Nudges
- **Deficit sweep**: if Emergency < 100% and surplus > ₹5k → sweep to Emergency.  
- **Top-up SIP**: if long-term goal < 80% on track → increase SIP by min(₹2k, 5% surplus).  
- **Insurance 30-day early**: push 30d before; auto-create FD if idle cash ≥ 110% of goal.

---

## 25. LLM Prompt Engine & Privacy Guard

### 25.1 LLMPrompt Table (Offline, Anonymous)
| Field | Type |
|---|---|
| id | string |
| promptType | enum('AssetReview' \| 'GoalReview' \| 'TaxReview' \| 'HealthReview' \| 'VehicleReview' \| 'RentalReview' \| 'EmergencyReview') |
| promptText | string | auto-generated JSON (no PII) |
| createdDate | Date |
| usedDate | Date? |

> Sample: `{ "type": "AssetReview", "equity":45, "debt":35, "cash":20, "age":33, "goal": "Kid-UG@18", "drift":6, "rec": "swap 2.1k N50→NPS-T2 G-sec" }`

### 25.2 Privacy Guard
- All monetary fields masked by default (`privacyMask = true`).  
- Tap "👁️ Reveal" → enter `revealSecret` → session-only unmask (expires on background/5min idle).  
- Secret hashed with Argon2id; never leaves device.

---

## 26. Backup & Restore
- **QR export** – AES-256 + passphrase → single QR code with Reed-Solomon 10% error correction.  
- **Import** – scan QR → decrypt → merge into IndexedDB.  
- **Version guard**: warns if `specVersion` > current app version or `deviceId` differs.  
- **Self-destruct**: DB wiped after 10 failed PIN attempts.

---

## 27. Estate & Digital Assets

### 27.1 Will
| Field | Type |
|---|---|
| id | string |
| assetId | string | FK → any asset table |
| beneficiary | string |
| percentage | number | 0–100 |
| createdDate | Date |
| lastUpdated | Date |

> Auto-nudge: if user age ≥ 30 and no Will rows → “Create / update will”.

### 27.2 DigitalAsset
| Field | Type |
|---|---|
| id | string |
| type | enum('Crypto' \| 'Demat PDF' \| 'FD Receipt' \| 'App Passphrase' \| 'Telegram Token' \| 'Others') |
| location | string |
| nominee | string |
| accessInstructions | string |
| lastUpdated | Date |

---

## 28. SpendingLimit
| Field | Type |
|---|---|
| id | string |
| category | string | e.g., "Dining", "Shopping" |
| monthlyCap | number |
| currentSpend | number | auto-sum from Txn.category |
| alertAt | number | default 80% |

> Auto-nudge when `currentSpend ≥ alertAt`.

---

## 29. PWA & Cross-Device Experience
- **Web App Manifest**: `name`, `short_name`, `icons` (192x192, 512x512), `theme_color`, `display: standalone`.  
- **Service Worker**: Cache app shell, JS, CSS. All data is IndexedDB.  
- **Install Prompt**: Show "Add to Home Screen" on Android/iOS.  
- **Offline UX**: Show "You're offline. All data is local." if network fails.  
- **Sync Warning**: Toast: "Data is device-specific. Backup via QR to restore on another device."

---

## 30. Status
**v1.1-final-life-optimized – LOCKED & READY FOR IMPLEMENTATION**

> This spec is **final, complete, and implementation-ready**.  
> Upload to GitHub and begin development.