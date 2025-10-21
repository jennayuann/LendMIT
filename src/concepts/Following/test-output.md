# Console output of tests

```
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===========================================
 ⏰ STARTING TESTS FOR FOLLOWING CONCEPT
===========================================

----- pre-test output end -----
running 8 tests from ./src/concepts/Following/Following.test.ts
Following concept: Unit tests for 'follow' action ...
------- output -------

===========================================
🧪 TEST GROUP: FOLLOW ACTIONS
===========================================

✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
----- output end -----
  ✅ Happy path: A user follows another user ... ok (71ms)
  ✅ Requires violation: Cannot follow yourself ... ok (1ms)
  ✅ Requires violation: Cannot follow someone already followed ... ok (42ms)
  ✅ Edge case: Following with empty string IDs ... ok (54ms)
------- output -------
✅ Finished FOLLOW tests

----- output end -----
Following concept: Unit tests for 'follow' action ... ok (733ms)
Following concept: Unit tests for 'unfollow' action ...
------- output -------

=============================================
🧪 TEST GROUP: UNFOLLOW ACTIONS
=============================================

✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
----- output end -----
  ✅ Happy path: A user unfollows another user ... ok (50ms)
  ✅ Requires violation: Cannot unfollow someone not followed ... ok (15ms)
  ✅ Edge case: Unfollowing non-existent relationships (idempotency) ... ok (15ms)
  ✅ Robustness: Unfollowing with non-existent IDs ... ok (40ms)
------- output -------
✅ Finished UNFOLLOW tests

----- output end -----
Following concept: Unit tests for 'unfollow' action ... ok (698ms)
Following concept: Unit tests for 'isFollowing' action ...
------- output -------

===============================================
🧪 TEST GROUP: IS FOLLOWING CHECKS
===============================================

✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
----- output end -----
  ✅ Happy path ... ok (31ms)
  ✅ Negative path: Non-existent relationship ... ok (13ms)
  ✅ Edge case: False after unfollowing ... ok (44ms)
  ✅ Edge case: Self-follow should be false ... ok (13ms)
  ✅ Edge case: Non-existent users ... ok (26ms)
------- output -------
✅ Finished ISFOLLOWING tests

----- output end -----
Following concept: Unit tests for 'isFollowing' action ... ok (729ms)
Following concept: Unit tests for 'getFollowees' action ...
------- output -------

===============================================
🧪 TEST GROUP: GET FOLLOWEES ACTIONS
===============================================

✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
----- output end -----
  ✅ Happy path: Multiple followees ... ok (47ms)
  ✅ Edge case: User with no followees ... ok (14ms)
  ✅ Edge case: Non-existent user ... ok (13ms)
  ✅ State update after unfollowing ... ok (59ms)
------- output -------
✅ Finished GETFOLLOWEES tests

----- output end -----
Following concept: Unit tests for 'getFollowees' action ... ok (750ms)
Following concept: Unit tests for 'getFollowers' action ...
------- output -------

===============================================
🧪 TEST GROUP: GET FOLLOWERS ACTIONS
===============================================

✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
----- output end -----
  ✅ Happy path: Multiple followers ... ok (48ms)
  ✅ Edge case: User with no followers ... ok (14ms)
  ✅ Edge case: Non-existent user ... ok (14ms)
  ✅ State update after unfollowing ... ok (59ms)
------- output -------
✅ Finished GETFOLLOWERS tests

----- output end -----
Following concept: Unit tests for 'getFollowers' action ... ok (708ms)
Following concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
✅ Finished TRACE demonstration

----- output end -----
Following concept: Trace scenario (end-to-end behavior) ... ok (813ms)
Following concept: Robustness and concurrency tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY
=================================================

✅ Index 'follower_followee_unique' ensured for collection 'followrelationships'
✅ Finished ROBUSTNESS tests

----- output end -----
Following concept: Robustness and concurrency tests ... ok (798ms)
✅ Final summary ...
------- output -------

====================================================================
🎉 FOLLOWING CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
======================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 8 passed (21 steps) | 0 failed (5s)
```
