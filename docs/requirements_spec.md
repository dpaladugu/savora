# Savora Personal Finance App  
**Requirement Specification v1.2 – UPDATED March 2026**  
**Original Spec:** v1.1 (26 July 2025)  
**Scope:** Multi-user family financial engine, offline-first (IndexedDB/Dexie), India-centric, zero cloud dependency.

---

## Implementation Status Legend
- ✅ **Live** — fully implemented and tested
- 🟡 **Beta** — implemented, minor polish pending
- 🔴 **Pending** — not yet built
- ~~Removed~~ — removed from scope

---

## 1. Purpose & Philosophy
- **Single-device, offline-first** – all data in IndexedDB via Dexie. ✅
- **India defaults** – INR only, Indian tax rules, Indian instruments. ✅
- **Expert-grade recommendations** – CFA-aligned rules running locally. 🟡
- **Privacy-first** – passphrase-masked UI, RBAC roles. ✅
- **Multi-user RBAC** – ADMIN / SPOUSE / BROTHER / GUEST passphrase roles. ✅

---

## 2. Global Settings (Singleton) ✅ Live
| Field | Type | Default | Status |
|---|---|---|---|
| taxRegime | enum('Old' \| 'New') | 'New' | ✅ |
| autoLockMinutes | number | 5 | ✅ (1–10 min slider) |
| birthdayBudget | number | 0 | 🔴 |
| birthdayAlertDays | number | 7 | 🔴 |
| emergencyContacts | Contact[] | [] | 🔴 |
| incomeTaxReturnJson | string? | null | 🔴 |
| telegramBotToken | string? | null | 🔴 |
| dependents | Dependent[] | [] | 🔴 |
| salaryCreditDay | number | 15 | 🔴 |
| annualBonus | number? | null | 🔴 |
| medicalInflationRate | number | 10.0 | 🔴 |
| educationInflation | number | 7.0 | 🔴 |
| vehicleInflation | number | 5.0 | 🔴 |
| maintenanceInflation | number | 6.0 | 🔴 |
| privacyMask | boolean | true | ✅ |
| revealSecret | string? | null | ✅ (passphrase RBAC) |
| failedPinAttempts | number | 0 | ~~Removed~~ (no self-destruct) |
| maxFailedAttempts | number | 10 | ~~Removed~~ |
| darkMode | boolean | false | ✅ |
| timeZone | string | "Asia/Kolkata" | ✅ |
| theme | enum | 'auto' | ✅ |

---

## 3. Universal Transaction – Txn ✅ Live (core fields)
Full schema implemented. Pending: `paymentMix`, `isSplit`, `splitWith`, `gstPaid`, `cashbackAmount`.

---

## 4. Goal ✅ Live
Basic goal CRUD live. Auto-goal creation engine 🔴 pending (§24).

---

## 5. Credit Card ✅ Live
Full card manager + statements + flow tracker implemented.

---

## 6. Vehicle ✅ Live
FZS oil OVERDUE alert, Fuelio CSV import, insurance expiry badges. Fleet seeded (FZS, Shine, CBR250R).
Pending: `depreciationRate`, `ncbPercent` auto-calc.

---

## 7. RentalProperty ✅ Live
Guntur 6 shops + Gorantla 4 units seeded. 5-step waterfall allocation live.

---

## 8. Tenant ✅ Live
Tenant CRUD linked to properties.

---

## 9. Gold (Physical) 🟡 Beta
Basic holdings tracker live. Pending: MCX price feed, gold loan linkage.

---

## 10. Investment (All-in-One) ✅ Live
Portfolio tracker with MaskedAmount (SPOUSE/GUEST see 🔒). Pending: SIP bump nudge, XIRR calc.

---

## 11. Insurance 🔴 Pending — Next in build queue
Full CRUD: policies, premiums, renewal alerts (30d), nominee, family member, gap analysis.

---

## 12. Loan ✅ Live
Loan CRUD with MaskedAmount. Pending: amortisation schedule (AmortRow[]), prepayment ROI calc.

---

## 13. Brother-Repayment Tracker 🔴 Pending
Repayment ledger linked to Education-Brother loan. Outstanding balance + progress bar.

---

## 14. Subscription (Recurring Bills) 🟡 Beta
Basic subscription tracker live.

---

## 15. Health ✅ Live
Mother & Grandma: prescriptions, vitals (BP/HR/Temp/SpO₂), medical records. Pending: vaccinations table, BMI calc, family history field.

---

## 16. Family Bank Account 🔴 Pending
Mother/Grandma account CRUD (bank, account number, balance type).

---

## 17. Family Transfer 🔴 Pending
Transfer ledger with fromAccountId, toPerson, purpose, mode.

---

## 18. Emergency Fund ✅ Live
12-month target + Medical Sub-Bucket (₹1L default). Quick-add buttons. Status badge (Under-Target/OnTrack/Achieved).

---

## 19. Audit Log 🔴 Pending
Every create/update/delete recorded with oldValues/newValues/deviceId.

---

## 20. Expert Recommendation Rules (CFA-level) 🟡 Beta
CFA Recommendations dashboard live. Pending rules:
- Age-based glide path auto-rebalance alert 🔴
- SIP bump on salary ↑ >15% YoY 🔴
- Insurance gap (term < 10× income, health < 5× income) 🔴
- Advance tax reminders (15-Jun/Sep/Dec/Mar) 🔴
- 80CCD(1B) ₹50k alert if NPS-T1 < limit 🔴
- Child education PV goal (§20.6) 🔴

---

## 21. Security & UX
| Feature | Status |
|---|---|
| Passphrase-based RBAC (ADMIN/SPOUSE/BROTHER/GUEST) | ✅ Live |
| Auto-lock idle timer (1–10 min, clears session) | ✅ Live |
| Encrypted export AES-256 + passphrase | ✅ Live |
| QR-code backup generation | ✅ Live |
| QR-scan camera restore | 🔴 Pending |
| Dark-mode toggle | ✅ Live |
| Privacy mask (amounts blurred by default) | ✅ Live |
| ~~Self-destruct after 10 failed attempts~~ | ~~Removed from scope~~ |

---

## 22. Data Limits ✅
- DB rows per table: 10,000 (auto FIFO prune logic in place)
- Fuel/service log per vehicle: 500 (lazy load)

---

## 23. Personal-Telegram Capture 🔴 Pending
`/add <amount> <category>` → PendingTxn. Placeholder component exists.

---

## 24. Goals-Nudge Engine 🔴 Pending

### 24.1 Auto-Goal Creation Rules (14 of 14 pending)
Vehicle insurance, tyre replacement, child education, senior medical corpus, NPS/PPF annual, property/water tax, festival corpus, etc.

### 24.2 Funding Priority Stack
1. Emergency Fund (12 months)
2. Insurance & statutory dues
3. Kid-UG & Retirement
4. Discretionary

### 24.3 Monthly Nudges 🔴 Pending
Deficit sweep, top-up SIP, insurance 30-day early.

---

## 25. LLM Prompt Engine & Privacy Guard 🔴 Pending
Anonymous JSON prompt builder (no PII). LLM settings form exists in Settings. Templates pending.

---

## 26. Backup & Restore ✅ Live (partial)
- AES-256 encrypted JSON export ✅
- QR code generation ✅
- File-upload restore ✅
- QR-scan camera restore 🔴

---

## 27. Estate & Digital Assets 🔴 Pending
Will rows + DigitalAsset table. Auto-nudge if age ≥ 30 and no Will rows.

---

## 28. SpendingLimit 🔴 Pending — In build queue
Per-category monthly cap, 80% alert toast, settings screen.

---

## 29. PWA & Cross-Device Experience 🔴 Pending
Service worker, offline banner, Add-to-Home-Screen prompt.

---

## 30. Build Order (Current Sprint)
1. ✅ Auto-lock idle timer — **done**
2. 🔴 Insurance full CRUD
3. 🔴 Family Banking (accounts + transfers)
4. 🔴 Brother Repayment Tracker
5. 🔴 Spending Limits
6. 🔴 Will & Estate
7. 🔴 Auto-Goal + Nudge Engine
8. 🔴 Tax Engine (advance tax reminders)
9. 🔴 PWA + Service Worker

---

## Status
**v1.2-march-2026 – ACTIVELY IN DEVELOPMENT**
