
# Changelog

## [March 2026] — Multi-User Family Financial Engine

### Added
- [RBAC] Passphrase-based role system: ADMIN / SPOUSE (Himabindu) / BROTHER (US) with `RevealValuesDialog`
- [RBAC] Session stored in `sessionStorage` (tab-scoped, auto-expires 4–8h) via `src/store/rbacStore.ts`
- [RBAC] Role-aware `GlobalHeader` with "Reveal Values" button and session lock
- [Rentals] Gorantla (Nagaralu) Page: 4 rooms, Dwacra ₹5k deduction, Grandma Care Fund surplus flow
- [Rentals] Guntur Waterfall Page: 6 shops with live status, priority bucket waterfall (Premium Recovery → Sinking Fund → Household → Grandma Net → ICICI Prepayment)
- [Vehicles] FZS Oil Watchdog: orange warning at 1,000 km, red OVERDUE at 1,500 km, progress bar
- [Vehicles] Fuelio CSV Sync dialog for FZS, Shine, CBR250R
- [Vehicles] Mahindra Xylo filtered out (sold)
- [Brother] Global Liability dashboard: InCred ₹23,21,156 @ 14.2% pre-populated
- [Brother] USD Hand Loans + Car Loans sandbox with USD↔INR converter (fixed ₹83)
- [Brother] Net Global Impact summary panel
- [MoreScreen] New modules: Vehicle Fleet Watchdog, Guntur/Gorantla Rentals, Brother's Global Liability
- [MoreScreen] Role-based module filtering (BROTHER-only modules hidden from SPOUSE/ADMIN)

### Fixed
- [Types] `EnhancedAutoGoalEngine` — all Goal literals replaced with `createGoal()` factory
- [Types] `ExpenseService` — added `createdAt`/`updatedAt` to Txn inserts
- [Types] `CreditCardModule` — added missing `name`, `limit`, `dueDate`, `createdAt`, `updatedAt`
- [Types] `SubscriptionTracker` — removed conflicting local `Subscription` interface, imports from service
- [Types] `SubscriptionService` — exported `Subscription` type
- [Types] `dataPreloaderService` — all sample data aligned with full type contracts
- [Types] `AuthenticationService` — replaced `db.appSettings` with `db.globalSettings`
- [Types] `CreditCardService.test.ts` — test fixtures updated to match `CreditCard` interface
- [Types] `InvestmentService.getInvestments()` — now returns `Investment[]` directly; legacy method preserved
- [Types] `Investment` interface — added `familyMember`, `taxBenefit`, `frequency`, and other extended fields

## [Fixed] Data model drift: reconciled CreditCard, RentalProperty, Health, Goal, Txn, Tenant
- Established `src/types/financial.ts` as single source of truth for all financial data types
- Fixed missing fields in CreditCard: issuer, bankName, creditLimit, annualFee, rewardPointsBalance, cycleStart, dueDate
- Fixed missing fields in RentalProperty: owner, type, squareYards, dueDay, escalationPercent
- Fixed missing fields in Health: refillAlertDays, allergySeverity, emergencyContact, nextCheckupDate, prescriptions
- Fixed missing fields in Txn: currency
- Fixed missing fields in Goal: name
- Fixed missing fields in Tenant: propertyId
- Standardized all field names to camelCase (createdAt, updatedAt, currentAmount, targetAmount)
- Fixed type mismatches: dueDate is consistently string (ISO format), not Date
- Updated all services and components to use correct type definitions
- Removed duplicate type definitions from database layer

## [Preserved] Dashboard, More Menu, Smart Tips, Subscription UI
- Maintained existing stable UI components without modification
- Preserved intentional design patterns and user experience
- Added Subscription Management module with consistent styling
