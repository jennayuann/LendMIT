# Console output of tests:
```
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===============================================
 ⏰ STARTING TESTS FOR USER AUTHENTICATION CONCEPT
===============================================

----- pre-test output end -----
running 13 tests from ./src/concepts/UserAuthentication/UserAuthentication.test.ts
UserAuthentication concept: Unit tests for 'registerUser' action ...
------- output -------

===========================================
🧪 TEST GROUP: REGISTER USER ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Register a new user ... ok (89ms)
  ✅ Requires violation: Register with an existing email ... ok (77ms)
  ✅ Edge case: Register with empty email or password ... ok (111ms)
------- output -------
✅ Finished REGISTER USER tests

----- output end -----
UserAuthentication concept: Unit tests for 'registerUser' action ... ok (745ms)
UserAuthentication concept: Unit tests for 'sendVerificationCode' action ...
------- output -------

===========================================
🧪 TEST GROUP: SEND VERIFICATION CODE ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Send code to unverified user ... ok (156ms)
  ✅ Requires violation: User account not found or email mismatch ... ok (77ms)
  ✅ Requires violation: User status is not UNVERIFIED ... ok (303ms)
  ✅ Requires violation: Unexpired verification code already exists ... ok (157ms)
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
  ✅ Happy path: Verify with correct code ... ok (251ms)
  ✅ Requires violation: Incorrect code ... ok (181ms)
  ✅ Requires violation: Expired code ... ok (209ms)
  ✅ Requires violation: User status is not UNVERIFIED ... ok (411ms)
  ✅ Edge case: Verify code multiple times (idempotency for first successful call) ... ok (280ms)
  ✅ Edge case: Non-existent user trying to verify ... ok (17ms)
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
  ✅ Happy path: Login with correct credentials for a VERIFIED user ... ok (288ms)
  ✅ Requires violation: Invalid email ... ok (20ms)
  ✅ Requires violation: Invalid password ... ok (276ms)
  ✅ Requires violation: UNVERIFIED account ... ok (83ms)
  ✅ Requires violation: DEACTIVATED account ... ok (294ms)
  ✅ Edge case: Login with empty email/password ... ok (806ms)
------- output -------
✅ Finished LOGIN tests

----- output end -----
UserAuthentication concept: Unit tests for 'login' action ... ok (2s)
UserAuthentication concept: Unit tests for 'changePassword' action ...
------- output -------

===========================================
🧪 TEST GROUP: CHANGE PASSWORD ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Change password for a VERIFIED user ... ok (309ms)
  ✅ Requires violation: User account not found ... ok (17ms)
  ✅ Requires violation: Account status is not VERIFIED ... ok (313ms)
  ✅ Edge case: Change to empty password ... ok (267ms)
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
  ✅ Happy path: Activate a DEACTIVATED user ... ok (345ms)
  ✅ Requires violation: User account not found ... ok (16ms)
  ✅ Requires violation: Account status is not DEACTIVATED ... ok (274ms)
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
  ✅ Happy path: Deactivate a VERIFIED user ... ok (264ms)
  ✅ Happy path: Deactivate an UNVERIFIED user ... ok (106ms)
  ✅ Requires violation: User account not found ... ok (14ms)
  ✅ Requires violation: Account status is already DEACTIVATED ... ok (240ms)
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
  ✅ Happy path: Revoke existing verification codes ... ok (289ms)
  ✅ Requires violation: No verification codes exist for user ... ok (93ms)
------- output -------
✅ Finished REVOKE VERIFICATION tests

----- output end -----
UserAuthentication concept: Unit tests for 'revokeVerification' action ... ok (885ms)
UserAuthentication concept: Unit tests for 'cleanExpiredCodes' action ...
------- output -------

===========================================
🧪 TEST GROUP: CLEAN EXPIRED CODES ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Clean expired codes ... ok (127ms)
  ✅ Edge case: No expired codes to clean ... ok (91ms)
  ✅ Edge case: No codes at all ... ok (58ms)
------- output -------
✅ Finished CLEAN EXPIRED CODES tests

----- output end -----
UserAuthentication concept: Unit tests for 'cleanExpiredCodes' action ... ok (743ms)
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
UserAuthentication concept: Unit tests for 'getEmail' action ...
------- output -------

===========================================
🧪 TEST GROUP: GET EMAIL ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Returns the email for a valid user ... ok (62ms)
  ✅ Requires violation: Unknown user throws ... ok (14ms)
------- output -------
✅ Finished GET EMAIL tests

----- output end -----
UserAuthentication concept: Unit tests for 'getEmail' action ... ok (515ms)
✅ Final summary ...
------- output -------

========================================================================
🎉 USER AUTHENTICATION CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
========================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 13 passed (37 steps) | 0 failed (14s)
```