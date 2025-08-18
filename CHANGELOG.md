
# Changelog

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
