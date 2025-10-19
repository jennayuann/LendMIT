# Console output of tests:
```
Task test deno test --allow-env --allow-net --allow-read --allow-sys=osRelease "src/concepts/ResourceStatus/ResourceStatus.test.ts"
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===========================================
 ⏰ STARTING TESTS FOR RESOURCE STATUS CONCEPT
===========================================

----- pre-test output end -----
running 7 tests from ./src/concepts/ResourceStatus/ResourceStatus.test.ts
ResourceStatus concept: Unit tests for 'defineStatus' action ...
------- output -------

===========================================
🧪 TEST GROUP: DEFINE STATUS ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Define a new status ... ok (57ms)
  ✅ Requires violation: Cannot define an existing status ... ok (54ms)
  ✅ Edge case: Define status with an empty string name ... ok (41ms)
  ✅ State verification: Multiple statuses defined correctly ... ok (41ms)
------- output -------
✅ Finished DEFINE STATUS tests

----- output end -----
ResourceStatus concept: Unit tests for 'defineStatus' action ... ok (870ms)
ResourceStatus concept: Unit tests for 'defineTransition' action ...
------- output -------

=============================================
🧪 TEST GROUP: DEFINE TRANSITION ACTIONS
=============================================

----- output end -----
  ✅ Happy path: Define a valid transition ... ok (71ms)
  ✅ Requires violation: 'fromStatus' definition does not exist ... ok (14ms)
  ✅ Requires violation: 'toStatus' definition does not exist ... ok (28ms)
  ✅ Requires violation (Idempotency check): Transition rule already exists ... ok (113ms)
  ✅ Edge case: Define a self-transition (from A to A) ... ok (74ms)
  ✅ Edge case: Define transition involving empty string status ... ok (155ms)
  ✅ State verification: Multiple transitions defined correctly ... ok (72ms)
------- output -------
✅ Finished DEFINE TRANSITION tests

----- output end -----
ResourceStatus concept: Unit tests for 'defineTransition' action ... ok (1s)
ResourceStatus concept: Unit tests for 'createEntry' action ...
------- output -------

===============================================
🧪 TEST GROUP: CREATE ENTRY ACTIONS
===============================================

----- output end -----
  ✅ Happy path: Create a new status entry for a resource ... ok (68ms)
  ✅ Requires violation (Idempotency check): StatusEntry for resource already exists ... ok (66ms)
  ✅ Requires violation: 'initialStatus' definition does not exist ... ok (39ms)
  ✅ Edge case: Create entry with an empty string ResourceID ... ok (54ms)
  ✅ Edge case: Create entry with an empty string initial status ... ok (66ms)
------- output -------
✅ Finished CREATE ENTRY tests

----- output end -----
ResourceStatus concept: Unit tests for 'createEntry' action ... ok (1s)
ResourceStatus concept: Unit tests for 'transition' action ...
------- output -------

===============================================
🧪 TEST GROUP: TRANSITION ACTIONS
===============================================

----- output end -----
  ✅ Happy path: Transition a resource to a new valid status ... ok (151ms)
  ✅ Requires violation: StatusEntry for resource does not exist ... ok (15ms)
  ✅ Requires violation: 'targetStatus' definition does not exist ... ok (89ms)
  ✅ Requires violation: No transition rule defined from current to target status ... ok (97ms)
  ✅ Edge case: Transition to the current status (self-transition) ... ok (109ms)
  ✅ Edge case: Transition with empty ResourceID ... ok (108ms)
------- output -------
✅ Finished TRANSITION tests

----- output end -----
ResourceStatus concept: Unit tests for 'transition' action ... ok (1s)
ResourceStatus concept: Trace scenario (end-to-end behavior - principle verification) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

----- output end -----
  1. Define necessary statuses ... ok (207ms)
  2. Define a complete set of transition rules ... ok (380ms)
  3. Create resource entries with initial statuses ... ok (123ms)
  4. Perform a valid lifecycle sequence for productA ... ok (278ms)
  5. Perform an alternative lifecycle sequence for productB (with rejection) ... ok (287ms)
  6. Attempt an invalid transition and verify rejection ... ok (52ms)
------- output -------
✅ Finished TRACE demonstration

----- output end -----
ResourceStatus concept: Trace scenario (end-to-end behavior - principle verification) ... ok (1s)
ResourceStatus concept: Robustness and concurrency-like tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY
=================================================

----- output end -----
  ✅ Concurrency: Multiple attempts to define the same status ... ok (250ms)
  ✅ Concurrency: Multiple attempts to define the same transition rule ... ok (179ms)
  ✅ Concurrency: Multiple attempts to create the same resource entry ... ok (150ms)
  ✅ Robustness: Attempt to transition with an invalid status name (not defined) ... ok (264ms)
  ✅ Robustness: Invalid initial status during createEntry leaves no trace ... ok (81ms)
------- output -------
✅ Finished ROBUSTNESS tests

----- output end -----
ResourceStatus concept: Robustness and concurrency-like tests ... ok (1s)
✅ Final summary ...
------- output -------

=======================================================================
🎉 RESOURCE STATUS CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
=======================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 7 passed (33 steps) | 0 failed (8s)
```