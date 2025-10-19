# Console output of tests:
```
Task test deno test --allow-env --allow-net --allow-read --allow-sys=osRelease "src/concepts/UserProfile/UserProfile.test.ts"
Check file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/UserProfile/UserProfile.test.ts
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===========================================
 ⏰ STARTING TESTS FOR USERPROFILE CONCEPT
===========================================

----- pre-test output end -----
running 7 tests from ./src/concepts/UserProfile/UserProfile.test.ts
UserProfile concept: Unit tests for 'createProfile' action ...
------- output -------

===========================================
🧪 TEST GROUP: CREATE PROFILE ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Create a profile with all fields ... ok (86ms)
  ✅ Happy path: Create a profile with only required fields ... ok (59ms)
  ✅ Requires violation: Cannot create profile for an existing user ... ok (28ms)
  ✅ Edge case: Create profile with empty string ID ... ok (44ms)
  ✅ Edge case: Create profile with empty string for names/bio/thumbnail ... ok (44ms)
------- output -------
✅ Finished CREATE PROFILE tests

----- output end -----
UserProfile concept: Unit tests for 'createProfile' action ... ok (731ms)
UserProfile concept: Unit tests for 'updateProfile' action ...
------- output -------

=============================================
🧪 TEST GROUP: UPDATE PROFILE ACTIONS
=============================================

----- output end -----
  ✅ Happy path: Update only firstName ... ok (43ms)
  ✅ Happy path: Update bio and thumbnail ... ok (40ms)
  ✅ Edge case: Clear bio by setting it to null ... ok (46ms)
  ✅ Edge case: Update with empty string values ... ok (40ms)
  ✅ Idempotency: Update a field to its current value ... ok (51ms)
  ✅ Requires violation: Cannot update a non-existent profile ... ok (13ms)
  ✅ Edge case: Update profile with empty string ID ... ok (68ms)
------- output -------
✅ Finished UPDATE PROFILE tests

----- output end -----
UserProfile concept: Unit tests for 'updateProfile' action ... ok (833ms)
UserProfile concept: Unit tests for 'deleteProfile' action ...
------- output -------

===============================================
🧪 TEST GROUP: DELETE PROFILE ACTIONS
===============================================

----- output end -----
  ✅ Happy path: Delete an existing profile ... ok (58ms)
  ✅ Requires violation: Cannot delete a non-existent profile ... ok (13ms)
  ✅ Idempotency: Attempt to delete an already deleted profile ... ok (14ms)
  ✅ Edge case: Delete profile with empty string ID ... ok (72ms)
------- output -------
✅ Finished DELETE PROFILE tests

----- output end -----
UserProfile concept: Unit tests for 'deleteProfile' action ... ok (656ms)
UserProfile concept: Unit tests for 'getProfile' action ...
------- output -------

===============================================
🧪 TEST GROUP: GET PROFILE ACTIONS
===============================================

----- output end -----
  ✅ Happy path: Retrieve a full profile ... ok (67ms)
  ✅ Happy path: Retrieve a profile with null optional fields ... ok (43ms)
  ✅ Requires violation: Cannot retrieve a non-existent profile ... ok (14ms)
  ✅ Edge case: Retrieve profile with empty string ID ... ok (43ms)
  ✅ Edge case: Retrieve profile with empty string values ... ok (43ms)
------- output -------
✅ Finished GET PROFILE tests

----- output end -----
UserProfile concept: Unit tests for 'getProfile' action ... ok (689ms)
UserProfile concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

✅ Finished TRACE demonstration

----- output end -----
UserProfile concept: Trace scenario (end-to-end behavior) ... ok (708ms)
UserProfile concept: Robustness and concurrency tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY
=================================================

  - Concurrent createProfile attempts for same user:
    => Verified single profile creation.
  - Concurrent updateProfile attempts for same user with different fields:
    => Verified all concurrent updates applied correctly.
  - Delete and immediate retrieve attempt:
    => Verified immediate deletion and non-existence.
✅ Finished ROBUSTNESS tests

----- output end -----
UserProfile concept: Robustness and concurrency tests ... ok (930ms)
✅ Final summary ...
------- output -------

======================================================================
🎉 USERPROFILE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
========================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 7 passed (21 steps) | 0 failed (4s)
```