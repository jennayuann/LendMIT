---
timestamp: 'Sat Oct 18 2025 00:44:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_004447.082c751f.md]]'
content_id: d4242e08440ad4b7c55f174ec62f364668a5ce7e05c11b2c6258f7b755cf9b27
---

# Improvement Requirements:

1. **Remove redundancy**
   * Remove the locally redeclared `NotificationInDb` interface.
   * Use the existing `Notification` type from NotificationLog.ts if exported, or use `Collection<any>` for DB checks.

2. **Refactor setup boilerplate**
   * Add a helper function, e.g.:
     ```ts
     async function withFreshDb() {
       const [db, client] = await testDb();
       const notificationLog = new NotificationLog(db);
       const coll = db.collection("notifications");
       await coll.deleteMany({});
       return { db, client, notificationLog, coll };
     }
     ```
     Use this helper in each test group to reduce repetition.

3. **Enhance validation depth**
   * When checking timestamps, assert:
     * `sentAt < dismissedAt` when both exist.
     * `sentAt` exists and is earlier than the current time.
   * When marking as delivered or dismissed, confirm these fields persist in DB (never revert to false or undefined).

4. **Add new robustness edge cases**
   * Attempt to dismiss a notification after it was cleared (expect "not found").
   * Attempt to clear dismissed notifications twice (should be idempotent).
   * Concurrently log multiple notifications for the same recipient and verify all insert successfully without duplicates.
   * Attempt to mark or dismiss concurrently while another operation clears.

5. **Do not reduce test coverage**
   * All existing tests should remain intact unless replaced by equivalent or stronger assertions.
