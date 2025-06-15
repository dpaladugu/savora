
# Firebase Composite Indexes Required

To optimize query performance and avoid Firestore errors, add the following composite indexes in the Firebase Console:

## How to Add Indexes
1. Go to Firebase Console → Firestore Database → Indexes tab
2. Click "Create Index"
3. Add the fields as specified below

## Required Indexes

### Expenses Collection
```
Collection: expenses
Fields: 
  - userId (Ascending)
  - date (Descending)
```

```
Collection: expenses  
Fields:
  - userId (Ascending)
  - category (Ascending) 
  - date (Descending)
```

### Investments Collection
```
Collection: investments
Fields:
  - userId (Ascending)
  - date (Descending)
```

```
Collection: investments
Fields:
  - userId (Ascending)
  - type (Ascending)
  - date (Descending)
```

## Notes
- These indexes enable efficient querying and sorting
- The current code uses fallback methods to avoid index errors
- Once indexes are created, you can use the optimized query methods in FirestoreService
- Index creation may take several minutes for large datasets
