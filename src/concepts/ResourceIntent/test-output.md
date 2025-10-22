# Console output of tests:
```
Task test deno test --allow-env --allow-net --allow-read --allow-sys=osRelease "src/concepts/ResourceIntent/ResourceIntent.test.ts"
Check file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/ResourceIntent/ResourceIntent.test.ts
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===========================================
 ⏰ STARTING TESTS FOR RESOURCE INTENT CONCEPT
===========================================

----- pre-test output end -----
running 10 tests from ./src/concepts/ResourceIntent/ResourceIntent.test.ts
ResourceIntent: Unit tests for 'defineIntent' ...
  Happy path: Define new intent ... ok (156ms)
  Requires violation: Cannot define existing intent ... ok (144ms)
  Edge case: Define empty string intent name ... ok (124ms)
ResourceIntent: Unit tests for 'defineIntent' ... ok (958ms)
ResourceIntent: Unit tests for 'undefineIntent' ...
  Happy path: Undefine an unused intent ... ok (207ms)
  Requires violation: Cannot undefine non-existent intent ... ok (72ms)
  Requires violation: Cannot undefine intent in use ... ok (210ms)
  Edge case: Undefine empty string intent ... ok (168ms)
ResourceIntent: Unit tests for 'undefineIntent' ... ok (1s)
ResourceIntent: Unit tests for 'setIntent' ...
  Happy path: Set intent (create) ... ok (181ms)
  Happy path: Set intent (update) ... ok (246ms)
  Requires violation: Cannot set undefined intent ... ok (86ms)
  Edge case: Set intent with empty resource ID ... ok (137ms)
  Idempotency: Setting same intent multiple times ... ok (597ms)
ResourceIntent: Unit tests for 'setIntent' ... ok (1s)
ResourceIntent: Unit tests for 'clearIntent' ...
  Happy path: Clear existing intent ... ok (237ms)
  Requires violation: Cannot clear non-existent intent entry ... ok (87ms)
  Idempotency/Edge case: Clearing non-existent resource ID ... ok (55ms)
ResourceIntent: Unit tests for 'clearIntent' ... ok (936ms)
ResourceIntent: Unit tests for 'getIntent' ...
  Happy path: Get existing intent ... ok (192ms)
  Negative path: Get intent for resource with no intent ... ok (78ms)
  Edge case: Get intent for non-existent resource ID ... ok (64ms)
  State verification: Get intent after clear ... ok (192ms)
ResourceIntent: Unit tests for 'getIntent' ... ok (1s)
ResourceIntent: Unit tests for 'listIntents' ...
  Happy path: List multiple defined intents ... ok (150ms)
  Edge case: List when no intents are defined ... ok (65ms)
  State verification: List after undefining intent ... ok (193ms)
ResourceIntent: Unit tests for 'listIntents' ... ok (1s)
ResourceIntent: Unit tests for 'listResourcesByIntent' ...
  Happy path: List resources for specific intent ... ok (647ms)
  Requires violation: List by undefined intent ... ok (63ms)
  Edge case: List for intent with no associated resources ... ok (124ms)
  State verification: List after intent cleared/updated ... ok (435ms)
ResourceIntent: Unit tests for 'listResourcesByIntent' ... ok (2s)
ResourceIntent: Trace scenario (principle verification) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

Scenario: A workflow for managing resource intents, demonstrating principle fulfillment.

STEP 1: Define multiple intents (INTENT_A, INTENT_B, INTENT_C).
STEP 2: Assign intents to resources (RESOURCE_1->A, RESOURCE_2->A, RESOURCE_3->B).
Principle verification: Resources successfully associated with defined intents.
STEP 3: Update an intent for a resource (RESOURCE_2: A -> B).
Principle verification: A resource can have at most one intent label at any time (uniqueness invariant).
STEP 4: Clear an intent for a resource (RESOURCE_1).
Principle verification: Intent cleared, resource no longer associated.
STEP 5: Attempt to undefine INTENT_B (still in use). Should reject.
Principle verification: Referential integrity invariant upheld. Cannot undefine an intent that is in use.
STEP 6: Undefine INTENT_A (no longer in use).
STEP 7: Clean up all remaining resources and intents.
Final state: All intents and resource associations removed.
✅ Finished TRACE demonstration

----- output end -----
ResourceIntent: Trace scenario (principle verification) ... ok (1s)
ResourceIntent: Robustness & concurrency tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY
=================================================

Concurrency: Concurrent 'defineIntent' for the same intent.

Concurrency: Concurrent 'setIntent' for the same resource with different intents.
- Final intent for resource1 is 'intentC'. MongoDB handles last write wins.

Concurrency: Concurrent 'clearIntent' for the same resource.

Robustness: Invalid operations on non-existent data.

Robustness: State consistency after failed operations.
- Verified state consistency after failed 'undefineIntent' operation.
✅ Finished ROBUSTNESS tests

----- output end -----
ResourceIntent: Robustness & concurrency tests ... ok (1s)
✅ Final summary ...
------- output -------

====================================================================
🎉 RESOURCE INTENT CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
======================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 10 passed (26 steps) | 0 failed (12s)
```
