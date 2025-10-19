---
timestamp: 'Sat Oct 18 2025 00:45:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_004535.e1c0391a.md]]'
content_id: e1a96f969d6130658084ea333dd560910924e9972f2a8d5cd29795ac8589fca3
---

# Improvement Requirements:

1. **Remove redundancy**
   * Remove the locally redeclared `NotificationInDb` interface.
   * Use the existing `Notification` type from NotificationLog.ts if exported. If not, import it.

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
