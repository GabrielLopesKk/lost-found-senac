# Withdrawal validation repair

## Bug review fixes
- [x] Account loading shows an error with retry instead of loading forever.
- [x] Saved lost reports, profiles and reception actions never show as failed when only the refresh/suggestions fail.
- [x] Photo fallback no longer clears the chosen category.
- [x] All lists (search, reception, my reports/items/claims) read every page instead of stopping at 500/1000.
- [x] Reproduce and repair code normalization and database validation.
- [x] Show every result, block duplicate submissions, and refresh related views.
- [x] Test valid, malformed, missing, invalidated, expired, used, concurrent, and failure scenarios; remove test records.
- [x] Preserve the confirmed policy: codes remain valid until used or replaced; no automatic time limit.

## Rule and coverage
A withdrawal must be recorded once, only for an approved request with a usable code and an object awaiting collection; every attempt must show its result and refresh related views.

- Read and exercised account code generation/replacement, reception validation, admin object status, and account completed-withdrawal readback.
- Read reception approval/revocation, account found-object list, homepage totals, public search, item details, shared status display, and their data functions. They follow the rule through database status reads and refreshed SWR keys.
- Read database issuance, validation, approval, rejection, personal claims, and public statistics functions. Repaired issuance and validation; retained approval/rejection behavior and all settled records.
- No withdrawal background job exists in the inspected code paths.
- 14 regression tests passed; real signed-in UI/database scenarios passed, including concurrency, network failure, and narrow-screen display.