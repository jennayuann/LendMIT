# Console output of tests:
```
Task test deno test --allow-env --allow-net --allow-read --allow-sys=osRelease "src/concepts/UserAuthentication/UserAuthentication.test.ts"
Check file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/UserAuthentication/UserAuthentication.test.ts
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===============================================
 ⏰ STARTING TESTS FOR USER AUTHENTICATION CONCEPT
===============================================

----- pre-test output end -----
running 12 tests from ./src/concepts/UserAuthentication/UserAuthentication.test.ts
UserAuthentication concept: Unit tests for 'registerUser' action ...
------- output -------

===========================================
🧪 TEST GROUP: REGISTER USER ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Register a new user ... ok (80ms)
  ✅ Requires violation: Register with an existing email ... ok (74ms)
  ✅ Edge case: Register with empty email or password ... ok (104ms)
------- output -------
✅ Finished REGISTER USER tests

----- output end -----
UserAuthentication concept: Unit tests for 'registerUser' action ... ok (736ms)
UserAuthentication concept: Unit tests for 'sendVerificationCode' action ...
------- output -------

===========================================
🧪 TEST GROUP: SEND VERIFICATION CODE ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Send code to unverified user ... ok (155ms)
  ✅ Requires violation: User account not found or email mismatch ... ok (59ms)
  ✅ Requires violation: User status is not UNVERIFIED ... ok (283ms)
  ✅ Requires violation: Unexpired verification code already exists ... ok (152ms)
------- output -------
✅ Finished SEND VERIFICATION CODE tests

----- output end -----
UserAuthentication concept: Unit tests for 'sendVerificationCode' action ... ok (1s)
UserAuthentication concept: Unit tests for 'verifyCode' action ...
------- output -------

===========================================
🧪 TEST GROUP: VERIFY CODE ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Verify with correct code ... ok (261ms)
  ✅ Requires violation: Incorrect code ... ok (174ms)
  ✅ Requires violation: Expired code ... ok (204ms)
  ✅ Requires violation: User status is not UNVERIFIED ... ok (432ms)
  ✅ Edge case: Verify code multiple times (idempotency for first successful call) ... ok (267ms)
  ✅ Edge case: Non-existent user trying to verify ... ok (16ms)
------- output -------
✅ Finished VERIFY CODE tests

----- output end -----
UserAuthentication concept: Unit tests for 'verifyCode' action ... ok (1s)
UserAuthentication concept: Unit tests for 'login' action ...
------- output -------

===========================================
🧪 TEST GROUP: LOGIN ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Login with correct credentials for a VERIFIED user ... ok (235ms)
  ✅ Requires violation: Invalid email ... ok (15ms)
  ✅ Requires violation: Invalid password ... ok (203ms)
  ✅ Requires violation: UNVERIFIED account ... ok (66ms)
  ✅ Requires violation: DEACTIVATED account ... ok (233ms)
  ✅ Edge case: Login with empty email/password ... ok (616ms)
------- output -------
✅ Finished LOGIN tests

----- output end -----
UserAuthentication concept: Unit tests for 'login' action ... ok (1s)
UserAuthentication concept: Unit tests for 'changePassword' action ...
------- output -------

===========================================
🧪 TEST GROUP: CHANGE PASSWORD ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Change password for a VERIFIED user ... ok (280ms)
  ✅ Requires violation: User account not found ... ok (15ms)
  ✅ Requires violation: Account status is not VERIFIED ... ok (264ms)
  ✅ Edge case: Change to empty password ... ok (233ms)
------- output -------
✅ Finished CHANGE PASSWORD tests

----- output end -----
UserAuthentication concept: Unit tests for 'changePassword' action ... ok (1s)
UserAuthentication concept: Unit tests for 'activateUser' action ...
------- output -------

===========================================
🧪 TEST GROUP: ACTIVATE USER ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Activate a DEACTIVATED user ... ok (310ms)
  ✅ Requires violation: User account not found ... ok (16ms)
  ✅ Requires violation: Account status is not DEACTIVATED ... ok (249ms)
------- output -------
✅ Finished ACTIVATE USER tests

----- output end -----
UserAuthentication concept: Unit tests for 'activateUser' action ... ok (1s)
UserAuthentication concept: Unit tests for 'deactivateUser' action ...
------- output -------

===========================================
🧪 TEST GROUP: DEACTIVATE USER ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Deactivate a VERIFIED user ... ok (269ms)
  ✅ Happy path: Deactivate an UNVERIFIED user ... ok (105ms)
  ✅ Requires violation: User account not found ... ok (15ms)
  ✅ Requires violation: Account status is already DEACTIVATED ... ok (225ms)
------- output -------
✅ Finished DEACTIVATE USER tests

----- output end -----
UserAuthentication concept: Unit tests for 'deactivateUser' action ... ok (1s)
UserAuthentication concept: Unit tests for 'revokeVerification' action ...
------- output -------

===========================================
🧪 TEST GROUP: REVOKE VERIFICATION ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Revoke existing verification codes ... ok (243ms)
  ✅ Requires violation: No verification codes exist for user ... ok (71ms)
------- output -------
✅ Finished REVOKE VERIFICATION tests

----- output end -----
UserAuthentication concept: Unit tests for 'revokeVerification' action ... ok (668ms)
UserAuthentication concept: Unit tests for 'cleanExpiredCodes' action ...
------- output -------

===========================================
🧪 TEST GROUP: CLEAN EXPIRED CODES ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Clean expired codes ... ok (144ms)
  ✅ Edge case: No expired codes to clean ... ok (97ms)
  ✅ Edge case: No codes at all ... ok (85ms)
------- output -------
✅ Finished CLEAN EXPIRED CODES tests

----- output end -----
UserAuthentication concept: Unit tests for 'cleanExpiredCodes' action ... ok (799ms)
UserAuthentication concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

Trace: UserA registers...
Trace: UserA tries to login (UNVERIFIED)...
Trace: UserA sends verification code...
Trace: UserA verifies code...
Trace: UserA logs in (VERIFIED)...
Trace: UserA changes password...
Trace: UserA tries to login with OLD password...
Trace: UserA logs in with NEW password...
Trace: UserA deactivates account...
Trace: UserA tries to login (DEACTIVATED)...
Trace: UserA activates account...
Trace: UserA tries to login (re-UNVERIFIED)...
Trace: UserA sends verification code again...
Trace: UserA verifies code again...
Trace: UserA logs in (re-VERIFIED)...
Trace: Test system cleanExpiredCodes action...
✅ Finished TRACE demonstration

----- output end -----
UserAuthentication concept: Trace scenario (end-to-end behavior) ... ok (1s)
UserAuthentication concept: Robustness and concurrency tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY
=================================================

Robustness: Concurrent registration attempts...
Robustness: Concurrent sendVerificationCode attempts...
Robustness: Verify code after external deletion...
Robustness: Chaining operations with invalid inputs...
✅ Finished ROBUSTNESS tests

----- output end -----
UserAuthentication concept: Robustness and concurrency tests ... ok (1s)
✅ Final summary ...
------- output -------

========================================================================
🎉 USER AUTHENTICATION CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
========================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 12 passed (35 steps) | 0 failed (12s)
```