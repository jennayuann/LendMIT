# Console output of tests:
```
Task test deno test --allow-env --allow-net --allow-read --allow-sys=osRelease "src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts"
Check file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===========================================
 ⏰ STARTING TESTS FOR TIME BOUNDED RESOURCE CONCEPT
===========================================

----- pre-test output end -----
running 6 tests from ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts
TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action ...
------- output -------

===========================================
🧪 TEST GROUP: DEFINE TIME WINDOW ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Define window with both availableFrom and availableUntil ... ok (76ms)
  ✅ Happy path: Define window with null availableFrom (should default to now) ... ok (33ms)
  ✅ Happy path: Define window with null availableUntil (should be indefinite) ... ok (33ms)
  ✅ Happy path: Define window with both availableFrom and availableUntil as null ... ok (69ms)
  ✅ Requires violation: availableFrom is equal to availableUntil ... ok (1ms)
  ✅ Requires violation: availableFrom is after availableUntil ... ok (0ms)
  ✅ Edge case: Updating an existing time window ... ok (55ms)
  ✅ Edge case: Defining a window with empty string ID ... ok (34ms)
------- output -------
✅ Finished DEFINE TIME WINDOW tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action ... ok (716ms)
TimeBoundedResource concept: Unit tests for 'getTimeWindow' action ...
------- output -------

===========================================
🧪 TEST GROUP: GET TIME WINDOW ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Retrieve an existing time window (full dates) ... ok (14ms)
  ✅ Happy path: Retrieve an existing time window (null dates) ... ok (14ms)
  ✅ Negative path: Retrieve a non-existent time window ... ok (14ms)
  ✅ Edge case: Retrieve window for empty string ID ... ok (30ms)
------- output -------
✅ Finished GET TIME WINDOW tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'getTimeWindow' action ... ok (592ms)
TimeBoundedResource concept: Unit tests for 'expireResource' action ...
------- output -------

===========================================
🧪 TEST GROUP: EXPIRE RESOURCE ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Expire an already expired resource ... ok (30ms)
  ✅ Happy path: Expire resource exactly at availableUntil time ... ok (29ms)
  ✅ Requires violation: No TimeWindow entry found ... ok (13ms)
  ✅ Requires violation: availableUntil is null (indefinite) ... ok (30ms)
  ✅ Requires violation: Current time is earlier than availableUntil ... ok (29ms)
  ✅ Edge case: Expiring with empty string ID (if window exists) ... ok (28ms)
  ✅ State verification: expireResource does not modify the stored window ... ok (56ms)
------- output -------
✅ Finished EXPIRE RESOURCE tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'expireResource' action ... ok (747ms)
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

----- output end -----
  1. Initially, no time window exists for the resource ... ok (14ms)
  2. Define a time window for the resource with future expiration ... ok (44ms)
  3. Attempt to expire the resource before its availableUntil time (should fail) ... ok (28ms)
  4. Update the time window to an already expired state ... ok (32ms)
  5. Now, successfully expire the resource (as it's past its new availableUntil) ... ok (28ms)
  6. Define a window with indefinite availability and try to expire (should fail) ... ok (43ms)
------- output -------
✅ Finished TRACE demonstration

----- output end -----
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ... ok (656ms)
TimeBoundedResource concept: Robustness tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS
=================================================

----- output end -----
  ✅ Robustness: Concurrent 'defineTimeWindow' calls for the same resource ... ok (167ms)
  ✅ Robustness: Sequence of define -> expire (fail) -> define -> expire (success) ... ok (117ms)
------- output -------
✅ Finished ROBUSTNESS tests

----- output end -----
TimeBoundedResource concept: Robustness tests ... ok (787ms)
✅ Final summary ...
------- output -------

================================================================================
🎉 TIME BOUNDED RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
================================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 6 passed (27 steps) | 0 failed (3s)
```