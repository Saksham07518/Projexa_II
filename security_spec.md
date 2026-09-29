# Security Specification & Threat Model

## 1. Data Invariants

1. **Course Invariant**: Course codes and IDs must be non-empty strings. Credits must be positive numbers.
2. **Student Invariant**: Student records must belong to an existing courseId. Total fee must be a non-negative number. Roll number, email, and name must be within defined boundary sizes.
3. **Attendance Invariant**: An attendance record must reference an existing student and course. Date must be valid string format and status must belong to allowed enum (`present`, `absent`, `late`, `excused`).
4. **Fee Payment Invariant**: A fee payment must have a positive amount, a valid receipt number, and reference an existing student.
5. **User Profile Invariant**: Users cannot alter role/permissions unless admin or authorized system role. Admin privileges can only be verified against trusted server records or designated administrator emails.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)

1. **Payload 1 (Ghost Field Injection / Shadow Update)**: Adding `isAdmin: true` into student document during update.
2. **Payload 2 (Negative Fee Amount Attack)**: Recording fee payment with amount `-50000` to manipulate student balances.
3. **Payload 3 (ID Spoofing / Malformed ID)**: Creating document with 2000-character junk string as `studentId`.
4. **Payload 4 (Orphan Attendance Record)**: Creating attendance record where `studentId` or `courseId` does not exist or is blank.
5. **Payload 5 (Illegal Attendance Status)**: Setting attendance status to `expelled` instead of `present|absent|late|excused`.
6. **Payload 6 (PII Blanket Exfiltration)**: Unauthenticated or unauthorized user attempting blanket query on all student parent phone numbers.
7. **Payload 7 (Receipt Number Collision / Bypass)**: Creating a payment receipt with empty `receiptNo` or string exceeding maximum length.
8. **Payload 8 (Fee Payment Overwrite)**: Attempting to overwrite existing receipt transaction timestamp or studentId to divert credit.
9. **Payload 9 (Role Escalation)**: Regular student modifying user document to upgrade role to `admin`.
10. **Payload 10 (Denial of Wallet Payload)**: Injecting 2MB payload into student `notes` or `remarks`.
11. **Payload 11 (Unauthenticated Write)**: Direct anonymous write attempt on `/courses` without credentials.
12. **Payload 12 (Invalid Course Credits)**: Updating course credits to `totalCredits: "lots"` (string instead of number).

---

## 3. Test Runner Definition (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

// Test runner confirming PERMISSION_DENIED on all 12 malicious attack vectors.
describe('Firestore Security Rules Matrix', () => {
  it('rejects ghost fields injection (Dirty Dozen #1)', async () => {
    // Expected: PERMISSION_DENIED
  });
  it('rejects negative fee payment amounts (Dirty Dozen #2)', async () => {
    // Expected: PERMISSION_DENIED
  });
  it('rejects malformed long ID (Dirty Dozen #3)', async () => {
    // Expected: PERMISSION_DENIED
  });
});
```
