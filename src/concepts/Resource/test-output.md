# Console output of tests:
```
Task test deno test --allow-env --allow-net --allow-read --allow-sys=osRelease "src/concepts/Resource/Resource.test.ts"
Check file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/Resource/Resource.test.ts
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===========================================
 ⏰ STARTING TESTS FOR RESOURCE CONCEPT
===========================================

----- pre-test output end -----
running 7 tests from ./src/concepts/Resource/Resource.test.ts
Resource concept: Unit tests for 'createResource' action ...
------- output -------

===========================================
🧪 TEST GROUP: CREATE RESOURCE ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Create resource with all optional fields ... ok (55ms)
  ✅ Happy path: Create resource with only mandatory fields ... ok (28ms)
  ✅ Requires violation: Cannot create resource with empty name ... ok (14ms)
  ✅ Requires violation: Cannot create resource with whitespace name ... ok (14ms)
  ✅ Edge case: Owner ID as an empty string ... ok (28ms)
  ✅ Edge case: Duplicate names are allowed ... ok (56ms)
------- output -------
✅ Finished CREATE RESOURCE tests

----- output end -----
Resource concept: Unit tests for 'createResource' action ... ok (596ms)
Resource concept: Unit tests for 'updateResource' action ...
------- output -------

===========================================
🧪 TEST GROUP: UPDATE RESOURCE ACTIONS
===========================================

----- output end -----
  Setup: Create a resource for updates ... ok (44ms)
  ✅ Happy path: Update only the name ... ok (31ms)
  ✅ Happy path: Update only the category ... ok (30ms)
  ✅ Happy path: Update only the description ... ok (29ms)
  ✅ Happy path: Update all fields ... ok (28ms)
  ✅ Happy path: Clear category by setting to null ... ok (30ms)
  ✅ Happy path: Clear description by setting to null ... ok (28ms)
  ✅ Requires violation: Cannot update non-existent resource ... ok (38ms)
  ✅ Requires violation: Cannot update name to empty string ... ok (14ms)
  ✅ Requires violation: Cannot update name to whitespace string ... ok (12ms)
  ✅ Edge case: Update with unchanged values (idempotency) ... ok (38ms)
  ✅ Edge case: Update with no parameters (should still validate resource existence) ... ok (38ms)
------- output -------
✅ Finished UPDATE RESOURCE tests

----- output end -----
Resource concept: Unit tests for 'updateResource' action ... ok (869ms)
Resource concept: Unit tests for 'deleteResource' action ...
------- output -------

===========================================
🧪 TEST GROUP: DELETE RESOURCE ACTIONS
===========================================

----- output end -----
  Setup: Create a resource for deletion ... ok (44ms)
  ✅ Happy path: Delete an existing resource ... ok (44ms)
  ✅ Requires violation: Cannot delete non-existent resource ... ok (27ms)
  ✅ Idempotency: Attempt to delete an already deleted resource ... ok (60ms)
------- output -------
✅ Finished DELETE RESOURCE tests

----- output end -----
Resource concept: Unit tests for 'deleteResource' action ... ok (591ms)
Resource concept: Unit tests for 'getResource' action ...
------- output -------

===========================================
🧪 TEST GROUP: GET RESOURCE ACTIONS
===========================================

----- output end -----
  Setup: Create resources for retrieval ... ok (76ms)
  ✅ Happy path: Retrieve resource with all fields ... ok (14ms)
  ✅ Happy path: Retrieve resource with only mandatory fields ... ok (14ms)
  ✅ Happy path: Retrieve resource with cleared optional fields ... ok (13ms)
  ✅ Requires violation: Retrieve non-existent resource ... ok (14ms)
  ✅ Edge case: Retrieve after deletion ... ok (45ms)
  ✅ Idempotency: Repeatedly retrieving the same resource ... ok (26ms)
------- output -------
✅ Finished GET RESOURCE tests

----- output end -----
Resource concept: Unit tests for 'getResource' action ... ok (665ms)
Resource concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

Trace Step 1: Create a new resource.
Trace Step 2: Update its name and clear its description.
Trace Step 3: Update its category and verify the state.
Trace Step 4: Attempt to update with an empty name (should fail).
Trace Step 5: Delete the resource.
Trace Step 6: Verify resource is no longer retrievable.
✅ Finished TRACE demonstration

----- output end -----
Resource concept: Trace scenario (end-to-end behavior) ... ok (642ms)
Resource concept: Robustness tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS
=================================================

Robustness: Concurrent creations with identical input (different IDs expected)
Robustness: Concurrent updates to the same resource
Robustness: Concurrent deletion attempts
✅ Finished ROBUSTNESS tests

----- output end -----
Resource concept: Robustness tests ... ok (1s)
✅ Final summary ...
------- output -------

======================================================================
🎉 RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
========================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 7 passed (29 steps) | 0 failed (4s)
```