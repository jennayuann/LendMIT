# Console output of tests:
```
===========================================
 ⏰ STARTING TESTS FOR TIME BOUNDED RESOURCE CONCEPT
===========================================

----- pre-test output end -----
running 7 tests from ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts
TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action ...
------- output -------

===========================================
🧪 TEST GROUP: DEFINE TIME WINDOW ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Define window with both availableFrom and availableUntil ... ok (76ms)
  ✅ Happy path: Define window with null availableFrom (should default to now) ... ok (34ms)
  ✅ Happy path: Define window with null availableUntil (should be indefinite) ... ok (34ms)
  ✅ Happy path: Define window with both availableFrom and availableUntil as null ... ok (36ms)
  ✅ Requires violation: availableFrom is equal to availableUntil ... ok (1ms)
  ✅ Requires violation: availableFrom is after availableUntil ... ok (0ms)
  ✅ Edge case: Updating an existing time window ... ok (52ms)
  ✅ Edge case: Defining a window with empty string ID ... ok (34ms)
------- output -------
✅ Finished DEFINE TIME WINDOW tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action ... ok (715ms)
TimeBoundedResource concept: Unit tests for 'getTimeWindow' action ...
------- output -------

===========================================
🧪 TEST GROUP: GET TIME WINDOW ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Retrieve an existing time window (full dates) ... ok (15ms)
  ✅ Happy path: Retrieve an existing time window (null dates) ... ok (14ms)
  ✅ Negative path: Retrieve a non-existent time window ... ok (15ms)
  ✅ Edge case: Retrieve window for empty string ID ... ok (31ms)
------- output -------
✅ Finished GET TIME WINDOW tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'getTimeWindow' action ... ok (614ms)
TimeBoundedResource concept: Unit tests for 'expireResource' action ...
------- output -------

===========================================
🧪 TEST GROUP: EXPIRE RESOURCE ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Expire an already expired resource ... ok (32ms)
  ✅ Happy path: Expire resource exactly at availableUntil time ... ok (33ms)
  ✅ Requires violation: No TimeWindow entry found ... ok (15ms)
  ✅ Requires violation: availableUntil is null (indefinite) ... ok (32ms)
  ✅ Requires violation: Current time is earlier than availableUntil ... ok (35ms)
  ✅ Edge case: Expiring with empty string ID (if window exists) ... ok (32ms)
  ✅ State verification: expireResource does not modify the stored window ... ok (60ms)
------- output -------
✅ Finished EXPIRE RESOURCE tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'expireResource' action ... ok (741ms)
TimeBoundedResource concept: Unit tests for 'deleteTimeWindow' action ...
------- output -------

===========================================
🧪 TEST GROUP: DELETE TIME WINDOW ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Delete an existing time window ... ok (86ms)
  ✅ Negative path: Delete non-existent time window ... ok (21ms)
------- output -------
✅ Finished DELETE TIME WINDOW tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'deleteTimeWindow' action ... ok (620ms)
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

----- output end -----
  1. Initially, no time window exists for the resource ... ok (16ms)
  2. Define a time window for the resource with future expiration ... ok (49ms)
  3. Attempt to expire the resource before its availableUntil time (should fail) ... ok (32ms)
  4. Update the time window to an already expired state ... ok (35ms)
  5. Now, successfully expire the resource (as it's past its new availableUntil) ... ok (33ms)
  6. Define a window with indefinite availability and try to expire (should fail) ... ok (51ms)
------- output -------
✅ Finished TRACE demonstration

----- output end -----
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ... ok (709ms)
TimeBoundedResource concept: Robustness tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS
=================================================

----- output end -----
  ✅ Robustness: Concurrent 'defineTimeWindow' calls for the same resource ... ok (253ms)
  ✅ Robustness: Sequence of define -> expire (fail) -> define -> expire (success) ... ok (141ms)
------- output -------
✅ Finished ROBUSTNESS tests

----- output end -----
TimeBoundedResource concept: Robustness tests ... ok (859ms)
✅ Final summary ...
------- output -------

================================================================================
🎉 TIME BOUNDED RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
================================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 7 passed (29 steps) | 0 failed (4s)
```