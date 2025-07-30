```markdown
# Savora Personal Finance App  
**Requirement Specification v1.0 – LOCKED & FINAL**  
**Effective Date:** 26 July 2025  
**Scope:** Single-user, offline-first (IndexedDB), India-centric, zero cloud dependency.

---

## 1. Purpose & Philosophy
- **Single-user, single device** – no multi-tenant, no cloud sync.  
- **Offline-first** – all data in IndexedDB via Dexie.  
- **India defaults** – INR only, Indian tax rules, Indian instruments.  
- **Expert-grade recommendations** – CFA-aligned rules running **locally**.

---

## 2. Global Settings (Singleton)
| Field | Type | Default |
|---|---|---|
| taxRegime | enum | 'New' |
| autoLockMinutes | number | 5 |
| birthdayBudget | number | 0 |
| birthdayAlertDays | number | 7 |
| emergencyContacts | Contact[] | [] |

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
| receiptUri | string? | cloud link only (no local blob) |
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

---

## 4. Goal
| Field | Type |
|---|---|
| id | string |
| name | string |
| type | enum | 'Micro' \| 'Small' \| 'Short' \| 'Medium' \| 'Long' |
| targetAmount | number |
| targetDate | Date |
| currentAmount | number | auto-sum via Txn.goalId |
| notes | string |

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

```ts
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
```

---

## 7. RentalProperty
| Field | Type |
|---|---|
| id | string |
| address | string |
| owner | enum | 'Me' \| 'Mother' \| 'Grandmother' |
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
| currentMcxPrice | number? | manual entry |

---

## 10. Investment (All-in-One)
| Field | Type |
|---|---|
| id | string |
| type | enum | 'MF-Growth' \| 'MF-Dividend' \| 'SIP' \| 'PPF' \| 'EPF' \| 'NPS-T1' \| 'NPS-T2' \| 'Gold-Coin' \| 'Gold-ETF' \| 'SGB' \| 'FD' \| 'RD' \| 'Stocks' \| 'Others' |
| name | string |
| folioNo | string? |
| currentNav | number | manual |
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
| interestRate | number? | SGB half-yearly |
| interestCreditDate | Date? |

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

---

## 12. Loan
| Field | Type |
|---|---|
| id | string |
| type | enum | 'Personal' \| 'Personal-Brother' \| 'Education-Brother' |
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

```ts
interface AmortRow {
  month: number;
  emi: number;
  principalPart: number;
  interestPart: number;
  balance: number;
}
```

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

```ts
interface Prescription {
  date: Date;
  doctor: string;
  medicines: string[];
  amount: number;
}
```

---

## 16. Family Bank Account
| Field | Type |
|---|---|
| id | string |
| owner | enum | 'Mother' \| 'Grandmother' |
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
| toPerson | enum |
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
| status | enum |

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
- **Age-based glide path**  
  ≤ 35 → 70 % Equity, 20 % Debt, 10 % Gold  
  36-50 → 60 / 30 / 10  
  > 50 → 40 / 50 / 10  
- **Rebalance alert** if any bucket drifts > 5 %.  
- **SIP bump** on salary↑ > 15 % YoY.  
- **ELSS** skipped (user uses Kuvera).

### 20.2 Insurance
- Gap-cover: term < 10× income, health < 5× income.  
- CI & PA nudges at age ≥ 25.  
- Renewal 30-day early push.  
- Nominee & will prompts at age ≥ 30.

### 20.3 Loan
- EMI/income > 40 % → “Debt stress”.  
- Pre-payment ROI saved > ₹10 k → “Foreclose”.  
- Brother loan tracking with repayment ledger.

### 20.4 Expense & Subscription
- Subscription cost↑ > 10 % → “Review”.  
- Cash-flow forecast next 30 days vs income.  
- Split-bill unsettled > 7 days → reminder.

### 20.5 Tax (New Regime)
- 80CCD(1B) ₹50 k alert if NPS-T1 < limit.  
- SGB short-term gain warning if sold < 8 yrs.

---

## 21. Security & UX
- PIN / biometric lock.  
- Auto-lock 1–10 min slider.  
- Encrypted export (AES-256 + passphrase).  
- Cloud-link receipts (`receiptUri`).  
- Lazy-load heavy arrays.

---

## 22. Data Limits
| Item | Max |
|---|---|
| Receipt file cloud link | ≤ 25 MB external |
| DB rows per table | 10 000 (auto FIFO prune) |
| Fuel / service log per vehicle | 500 (lazy load) |

---

**Status: LOCKED & READY FOR IMPLEMENTATION**