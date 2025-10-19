# Console output of tests:
```
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

================================================
 ⏰ STARTING TESTS FOR NOTIFICATION LOG CONCEPT
=================================================

----- pre-test output end -----
running 8 tests from ./src/concepts/NotificationLog/NotificationLog.test.ts
NotificationLog concept: Unit tests for 'logNotification' action ...
------- output -------

===========================================
🧪 TEST GROUP: LOG NOTIFICATION ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Log a valid notification (JSON object) ... ok (78ms)
  ✅ Requires violation: Content is not a well-formed JSON string ... ok (14ms)
  ✅ Requires violation: Content is valid JSON but not an object (e.g., 'null') ... ok (14ms)
  ✅ Requires violation: Content is valid JSON but not an object (e.g., '123') ... ok (14ms)
  ✅ Requires violation: Content is valid JSON but not an object (e.g., '"string"') ... ok (14ms)
  ✅ Edge case: Empty string recipient ID ... ok (29ms)
  ✅ Edge case: Various valid JSON contents (empty object, nested object, arrays in values) ... ok (68ms)
  ✅ Idempotency check: Logging same content multiple times creates distinct notifications ... ok (49ms)
------- output -------
✅ Finished LOGNOTIFICATION tests

----- output end -----
NotificationLog concept: Unit tests for 'logNotification' action ... ok (633ms)
NotificationLog concept: Unit tests for 'markAsDelivered' action ...
------- output -------

===========================================
🧪 TEST GROUP: MARK AS DELIVERED ACTIONS
===========================================

----- output end -----
  Setup for markAsDelivered tests ... ok (114ms)
  ✅ Happy path: Mark an undelivered notification as delivered ... ok (82ms)
  ✅ Requires violation: Notification not found ... ok (14ms)
  ✅ Requires violation: Notification already delivered ... ok (27ms)
  ✅ Edge case: Mark a dismissed but undelivered notification as delivered ... ok (43ms)
------- output -------
✅ Finished MARKASDELIVERED tests

----- output end -----
NotificationLog concept: Unit tests for 'markAsDelivered' action ... ok (743ms)
NotificationLog concept: Unit tests for 'dismissNotification' action ...
------- output -------

===========================================
🧪 TEST GROUP: DISMISS NOTIFICATION ACTIONS
===========================================

----- output end -----
  Setup for dismissNotification tests ... ok (111ms)
  ✅ Happy path: Dismiss an undismissed notification ... ok (77ms)
  ✅ Requires violation: Notification not found ... ok (33ms)
  ✅ Requires violation: Notification already dismissed ... ok (53ms)
  ✅ Edge case: Dismiss a delivered but undismissed notification ... ok (31ms)
------- output -------
✅ Finished DISMISSNOTIFICATION tests

----- output end -----
NotificationLog concept: Unit tests for 'dismissNotification' action ... ok (714ms)
NotificationLog concept: Unit tests for 'clearDismissedNotifications' action ...
------- output -------

===========================================
🧪 TEST GROUP: CLEAR DISMISSED NOTIFICATIONS ACTIONS
===========================================

----- output end -----
  Setup for clearDismissedNotifications tests ... ok (136ms)
  ✅ Happy path: Clear dismissed notifications for a recipient ... ok (30ms)
  ✅ Edge case: Clear for a recipient with no dismissed notifications ... ok (40ms)
  ✅ Edge case: Clear for a recipient with no notifications at all ... ok (42ms)
  ✅ Robustness: Clearing with non-existent recipient ID ... ok (41ms)
  ✅ Idempotency: Clearing dismissed notifications twice ... ok (116ms)
------- output -------
✅ Finished CLEARDISMISSEDNOTIFICATIONS tests

----- output end -----
NotificationLog concept: Unit tests for 'clearDismissedNotifications' action ... ok (897ms)
NotificationLog concept: Unit tests for 'getNotifications' action ...
------- output -------

===========================================
🧪 TEST GROUP: GET NOTIFICATIONS ACTIONS
===========================================

----- output end -----
  Setup for getNotifications tests ... ok (192ms)
  ✅ Happy path: Get all notifications for a recipient (no filters) ... ok (15ms)
  ✅ Happy path: Filter by delivered: true ... ok (14ms)
  ✅ Happy path: Filter by delivered: false ... ok (14ms)
  ✅ Happy path: Filter by dismissed: true ... ok (14ms)
  ✅ Happy path: Filter by dismissed: false ... ok (14ms)
  ✅ Happy path: Filter by both delivered: true and dismissed: false ... ok (14ms)
  ✅ Happy path: Filter by both delivered: false and dismissed: true ... ok (14ms)
  ✅ Happy path: Filter by both delivered: true and dismissed: true ... ok (15ms)
  ✅ Edge case: Recipient with no matching notifications ... ok (15ms)
  ✅ Edge case: Non-existent recipient ... ok (28ms)
------- output -------
✅ Finished GETNOTIFICATIONS tests

----- output end -----
NotificationLog concept: Unit tests for 'getNotifications' action ... ok (832ms)
NotificationLog concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

✅ Finished TRACE demonstration

----- output end -----
NotificationLog concept: Trace scenario (end-to-end behavior) ... ok (1s)
NotificationLog concept: Robustness and concurrency tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY
=================================================

✅ Finished ROBUSTNESS tests

----- output end -----
NotificationLog concept: Robustness and concurrency tests ... ok (1s)
✅ Final summary ...
------- output -------

=============================================================================
🎉 NOTIFICATION LOG CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
===============================================================================

----- output end -----
✅ Final summary ... ok (0ms)

ok | 8 passed (35 steps) | 0 failed (6s)
```