---
timestamp: 'Sat Oct 18 2025 00:47:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_004728.bf053488.md]]'
content_id: ce9b548f2866ee3d2b80dc5c9b5020da4898ac65f8aee88bd77956240d4156fd
---

# response:

```typescript
// src/concepts/NotificationLog.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { NotificationLog } from "./NotificationLog.ts";
import { Collection, Db } from "mongodb"; // Import Db for the helper function
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants & Types
// ----------------------------------------------------------------------
const recipientA = "recipientA" as ID;
const recipientB = "recipientB" as ID;
const recipientC = "recipientC" as ID;
const recipientD = "recipientD" as ID; // Added for new robustness test
const nonExistentRecipient = "nonExistentRecipient" as ID;

// Define the internal Notification structure for direct DB checks,
// as the interface is not exported from NotificationLog.ts.
interface NotificationDoc {
  _id: ID;
  recipient: ID;
  content: string;
  sentAt: Date;
  deliveredFlag: boolean;
  dismissedAt?: Date; // optional, only exists if dismissed
}

// Helper function to set up a clean database for each test
async function withFreshDb() {
  const [db, client] = await testDb();
  const notificationLog = new NotificationLog(db);
  // Cast to Collection<NotificationDoc> to correctly type findOne results
  const coll: Collection<NotificationDoc> = db.collection("notifications");
  await coll.deleteMany({}); // Ensure clean state for the collection
  return { db, client, notificationLog, coll };
}

// ----------------------------------------------------------------------
// LOGNOTIFICATION ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "NotificationLog concept: Unit tests for 'logNotification' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: LOGNOTIFICATION ACTIONS");
    console.log("===========================================\n");

    const { client, notificationLog, coll } = await withFreshDb();

    await t.step("✅ Happy path: Log a valid notification (JSON object)", async () => {
      const content = JSON.stringify({ message: "Hello, world!", type: "welcome" });
      const result = await notificationLog.logNotification({
        recipient: recipientA,
        content,
      });

      // Assert that it's a success result
      assertEquals("notificationID" in result, true);
      const { notificationID } = result as { notificationID: ID };

      const dbEntry = await coll.findOne({ _id: notificationID });
      assertEquals(dbEntry?._id, notificationID);
      assertEquals(dbEntry?.recipient, recipientA);
      assertEquals(dbEntry?.content, content);
      assertEquals(dbEntry?.deliveredFlag, false);
      assertEquals(dbEntry?.dismissedAt, undefined);
      // Enhanced validation for sentAt
      assertEquals(dbEntry!.sentAt instanceof Date, true, "sentAt should be an instance of Date");
      assertEquals(dbEntry!.sentAt.getTime() < Date.now(), true, "sentAt should be earlier than current time");

      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA });
      assertEquals(notificationIDs.includes(notificationID), true);
    });

    await t.step("✅ Requires violation: Content is not a well-formed JSON string", async () => {
      const result = await notificationLog.logNotification({
        recipient: recipientA,
        content: "this is not json",
      });

      // Assert that it's an error result
      assertEquals("error" in result, true);
      assertEquals((result as { error: string }).error.startsWith("Invalid JSON content:"), true);

      const count = await coll.countDocuments({ recipient: recipientA, content: "this is not json" });
      assertEquals(count, 0, "No notification should be logged with invalid JSON");
    });

    await t.step("✅ Requires violation: Content is valid JSON but not an object (e.g., 'null')", async () => {
      const result = await notificationLog.logNotification({
        recipient: recipientA,
        content: "null",
      });
      assertEquals("error" in result, true);
      assertEquals((result as { error: string }).error, "Content must be a JSON object.");

      const count = await coll.countDocuments({ recipient: recipientA, content: "null" });
      assertEquals(count, 0, "No notification should be logged with null JSON content");
    });

    await t.step("✅ Requires violation: Content is valid JSON but not an object (e.g., '123')", async () => {
      const result = await notificationLog.logNotification({
        recipient: recipientA,
        content: "123",
      });
      assertEquals("error" in result, true);
      assertEquals((result as { error: string }).error, "Content must be a JSON object.");

      const count = await coll.countDocuments({ recipient: recipientA, content: "123" });
      assertEquals(count, 0, "No notification should be logged with number JSON content");
    });

    await t.step("✅ Requires violation: Content is valid JSON but not an object (e.g., '\"string\"')", async () => {
      const result = await notificationLog.logNotification({
        recipient: recipientA,
        content: JSON.stringify("plain string"),
      });
      assertEquals("error" in result, true);
      assertEquals((result as { error: string }).error, "Content must be a JSON object.");

      const count = await coll.countDocuments({ recipient: recipientA, content: JSON.stringify("plain string") });
      assertEquals(count, 0, "No notification should be logged with string JSON content");
    });

    await t.step("✅ Edge case: Empty string recipient ID", async () => {
      const emptyID = "" as ID;
      const content = JSON.stringify({ event: "empty_id_test" });
      const result = await notificationLog.logNotification({
        recipient: emptyID,
        content,
      });
      assertEquals("notificationID" in result, true);
      const { notificationID } = result as { notificationID: ID };

      const dbEntry = await coll.findOne({ _id: notificationID });
      assertEquals(dbEntry?.recipient, emptyID);
      assertEquals(dbEntry?.content, content);
      assertEquals(dbEntry?.deliveredFlag, false);
      assertEquals(dbEntry!.sentAt instanceof Date, true);
    });

    await t.step("✅ Edge case: Various valid JSON contents (empty object, nested object, arrays in values)", async () => {
      const content1 = JSON.stringify({});
      const { notificationID: id1 } = await notificationLog.logNotification({ recipient: recipientB, content: content1 }) as { notificationID: ID };
      const dbEntry1 = await coll.findOne({ _id: id1 });
      assertEquals(dbEntry1?.content, content1);
      assertEquals(dbEntry1!.sentAt instanceof Date, true);

      const content2 = JSON.stringify({ data: { key: "value", arr: [1, "two", null] } });
      const { notificationID: id2 } = await notificationLog.logNotification({ recipient: recipientB, content: content2 }) as { notificationID: ID };
      const dbEntry2 = await coll.findOne({ _id: id2 });
      assertEquals(dbEntry2?.content, content2);
      assertEquals(dbEntry2!.sentAt instanceof Date, true);
    });

    await t.step("✅ Idempotency check: Logging same content multiple times creates distinct notifications", async () => {
      const content = JSON.stringify({ message: "Repeated event" });
      const { notificationID: id1 } = await notificationLog.logNotification({ recipient: recipientC, content }) as { notificationID: ID };
      const { notificationID: id2 } = await notificationLog.logNotification({ recipient: recipientC, content }) as { notificationID: ID };

      assertEquals(id1 !== id2, true, "Notification IDs should be distinct even for identical content");
      const notifications = await coll.find({ recipient: recipientC, content }).toArray();
      assertEquals(notifications.length, 2, "Two distinct notifications should be logged");
    });

    await client.close();
    console.log("✅ Finished LOGNOTIFICATION tests\n");
  },
});

// ----------------------------------------------------------------------
// MARKASDELIVERED ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "NotificationLog concept: Unit tests for 'markAsDelivered' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: MARKASDELIVERED ACTIONS");
    console.log("===========================================\n");

    const { client, notificationLog, coll } = await withFreshDb();

    let notificationID1: ID; // for happy path
    let notificationID2: ID; // for already delivered test
    let notificationID3: ID; // for dismissed but undelivered
    const nonExistentID = "nonExistentNotification" as ID; // for testing non-existent

    await t.step("Setup for markAsDelivered tests", async () => {
      const content1 = JSON.stringify({ event: "to_deliver" });
      const { notificationID } = await notificationLog.logNotification({ recipient: recipientA, content: content1 }) as { notificationID: ID };
      notificationID1 = notificationID;

      const content2 = JSON.stringify({ event: "already_delivered" });
      const { notificationID: id2 } = await notificationLog.logNotification({ recipient: recipientA, content: content2 }) as { notificationID: ID };
      notificationID2 = id2;
      await coll.updateOne({ _id: notificationID2 }, { $set: { deliveredFlag: true } });

      const content3 = JSON.stringify({ event: "dismissed_but_undelivered" });
      const { notificationID: id3 } = await notificationLog.logNotification({ recipient: recipientA, content: content3 }) as { notificationID: ID };
      notificationID3 = id3;
      await notificationLog.dismissNotification({ notificationID: notificationID3 }); // Dismiss it first
    });

    await t.step("✅ Happy path: Mark an undelivered notification as delivered", async () => {
      await notificationLog.markAsDelivered({ notificationID: notificationID1 });
      const dbEntry = await coll.findOne({ _id: notificationID1 });
      assertEquals(dbEntry?.deliveredFlag, true);
      // Ensure deliveredFlag persists
      await assertRejects(
        () => notificationLog.markAsDelivered({ notificationID: notificationID1 }),
        Error,
        "Notification already delivered.",
        "Attempting to deliver an already delivered notification should reject.",
      );
      const dbEntryAfterSecondAttempt = await coll.findOne({ _id: notificationID1 });
      assertEquals(dbEntryAfterSecondAttempt?.deliveredFlag, true, "deliveredFlag should persist true after subsequent attempts");
    });

    await t.step("✅ Requires violation: Notification not found", async () => {
      await assertRejects(
        () => notificationLog.markAsDelivered({ notificationID: nonExistentID }),
        Error,
        "Notification not found.",
      );
    });

    await t.step("✅ Requires violation: Notification already delivered", async () => {
      await assertRejects(
        () => notificationLog.markAsDelivered({ notificationID: notificationID2 }),
        Error,
        "Notification already delivered.",
      );
      const dbEntry = await coll.findOne({ _id: notificationID2 });
      assertEquals(dbEntry?.deliveredFlag, true, "Notification's delivered flag should remain true");
    });

    await t.step("✅ Edge case: Mark a dismissed but undelivered notification as delivered", async () => {
      // This is allowed by the 'requires' (only checks deliveredFlag)
      await notificationLog.markAsDelivered({ notificationID: notificationID3 });
      const dbEntry = await coll.findOne({ _id: notificationID3 });
      assertEquals(dbEntry?.deliveredFlag, true);
      assertEquals(typeof dbEntry?.dismissedAt, "object", "DismissedAt flag should still be set");
    });

    await client.close();
    console.log("✅ Finished MARKASDELIVERED tests\n");
  },
});

// ----------------------------------------------------------------------
// DISMISSNOTIFICATION ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "NotificationLog concept: Unit tests for 'dismissNotification' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DISMISSNOTIFICATION ACTIONS");
    console.log("===========================================\n");

    const { client, notificationLog, coll } = await withFreshDb();

    let notificationID1: ID; // for happy path
    let notificationID2: ID; // for already dismissed test
    let notificationID3: ID; // for delivered but undismissed
    const nonExistentID = "nonExistentNotification" as ID; // for testing non-existent

    await t.step("Setup for dismissNotification tests", async () => {
      const content1 = JSON.stringify({ event: "to_dismiss" });
      const { notificationID } = await notificationLog.logNotification({ recipient: recipientA, content: content1 }) as { notificationID: ID };
      notificationID1 = notificationID;

      const content2 = JSON.stringify({ event: "already_dismissed" });
      const { notificationID: id2 } = await notificationLog.logNotification({ recipient: recipientA, content: content2 }) as { notificationID: ID };
      notificationID2 = id2;
      await coll.updateOne({ _id: notificationID2 }, { $set: { dismissedAt: new Date() } });

      const content3 = JSON.stringify({ event: "delivered_but_undismissed" });
      const { notificationID: id3 } = await notificationLog.logNotification({ recipient: recipientA, content: content3 }) as { notificationID: ID };
      notificationID3 = id3;
      await notificationLog.markAsDelivered({ notificationID: notificationID3 }); // Mark it as delivered first
    });

    await t.step("✅ Happy path: Dismiss an undismissed notification", async () => {
      await notificationLog.dismissNotification({ notificationID: notificationID1 });
      const dbEntry = await coll.findOne({ _id: notificationID1 });
      assertEquals(typeof dbEntry?.dismissedAt, "object", "DismissedAt should be a Date object");
      assertEquals(dbEntry!.dismissedAt instanceof Date, true, "dismissedAt should be an instance of Date");
      assertEquals(dbEntry!.sentAt instanceof Date, true, "sentAt should be an instance of Date");
      assertEquals(dbEntry!.sentAt.getTime() < dbEntry!.dismissedAt!.getTime(), true, "sentAt should be earlier than dismissedAt");
      // Ensure dismissedAt persists
      await assertRejects(
        () => notificationLog.dismissNotification({ notificationID: notificationID1 }),
        Error,
        "Notification already dismissed.",
        "Attempting to dismiss an already dismissed notification should reject.",
      );
      const dbEntryAfterSecondAttempt = await coll.findOne({ _id: notificationID1 });
      assertEquals(typeof dbEntryAfterSecondAttempt?.dismissedAt, "object", "dismissedAt should persist as a Date after subsequent attempts");
    });

    await t.step("✅ Requires violation: Notification not found", async () => {
      await assertRejects(
        () => notificationLog.dismissNotification({ notificationID: nonExistentID }),
        Error,
        "Notification not found.",
      );
    });

    await t.step("✅ Requires violation: Notification already dismissed", async () => {
      await assertRejects(
        () => notificationLog.dismissNotification({ notificationID: notificationID2 }),
        Error,
        "Notification already dismissed.",
      );
      const dbEntry = await coll.findOne({ _id: notificationID2 });
      assertEquals(typeof dbEntry?.dismissedAt, "object", "Notification's dismissedAt should remain set");
    });

    await t.step("✅ Edge case: Dismiss a delivered but undismissed notification", async () => {
      // This is allowed by the 'requires' (only checks dismissedAt)
      await notificationLog.dismissNotification({ notificationID: notificationID3 });
      const dbEntry = await coll.findOne({ _id: notificationID3 });
      assertEquals(typeof dbEntry?.dismissedAt, "object");
      assertEquals(dbEntry?.deliveredFlag, true, "DeliveredFlag should still be true");
      assertEquals(dbEntry!.sentAt.getTime() < dbEntry!.dismissedAt!.getTime(), true, "sentAt should be earlier than dismissedAt");
    });

    await client.close();
    console.log("✅ Finished DISMISSNOTIFICATION tests\n");
  },
});

// ----------------------------------------------------------------------
// CLEARDISMISSEDNOTIFICATIONS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "NotificationLog concept: Unit tests for 'clearDismissedNotifications' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: CLEARDISMISSEDNOTIFICATIONS ACTIONS");
    console.log("===========================================\n");

    const { client, notificationLog, coll } = await withFreshDb();

    let id1: ID, id2: ID, id3: ID, id4: ID;

    await t.step("Setup for clearDismissedNotifications tests", async () => {
      // recipientA: 1 undismissed, 2 dismissed (one delivered, one not)
      id1 = (await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "A1_undismissed" }) })) as { notificationID: ID }.notificationID;
      id2 = (await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "A2_dismissed_undelivered" }) })) as { notificationID: ID }.notificationID;
      id3 = (await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "A3_dismissed_delivered" }) })) as { notificationID: ID }.notificationID;
      await notificationLog.dismissNotification({ notificationID: id2 });
      await notificationLog.markAsDelivered({ notificationID: id3 });
      await notificationLog.dismissNotification({ notificationID: id3 });

      // recipientB: 1 undismissed
      id4 = (await notificationLog.logNotification({ recipient: recipientB, content: JSON.stringify({ msg: "B1_undismissed" }) })) as { notificationID: ID }.notificationID;
    });

    await t.step("✅ Happy path: Clear dismissed notifications for a recipient", async () => {
      await notificationLog.clearDismissedNotifications({ recipient: recipientA });

      const remainingNotifications = await coll.find({ recipient: recipientA }).toArray();
      const remainingIDs = remainingNotifications.map(n => n._id);

      assertEquals(remainingIDs.length, 1, "Only undismissed notification should remain for recipientA");
      assertEquals(remainingIDs.includes(id1), true, "Notification A1 should still exist");
      assertEquals(remainingIDs.includes(id2), false, "Notification A2 should be deleted");
      assertEquals(remainingIDs.includes(id3), false, "Notification A3 should be deleted");
    });

    await t.step("✅ Edge case: Clear for a recipient with no dismissed notifications", async () => {
      // recipientB only has id4, which is undismissed
      const initialCount = await coll.countDocuments({ recipient: recipientB });
      assertEquals(initialCount, 1, "RecipientB should initially have one notification");

      await notificationLog.clearDismissedNotifications({ recipient: recipientB });
      const finalCount = await coll.countDocuments({ recipient: recipientB });
      assertEquals(finalCount, 1, "RecipientB's notification count should remain unchanged as none were dismissed");
    });

    await t.step("✅ Edge case: Clear for a recipient with no notifications at all", async () => {
      const initialCount = await coll.countDocuments({ recipient: recipientC });
      assertEquals(initialCount, 0, "RecipientC should initially have no notifications");

      await notificationLog.clearDismissedNotifications({ recipient: recipientC });
      const finalCount = await coll.countDocuments({ recipient: recipientC });
      assertEquals(finalCount, 0, "RecipientC's notification count should remain zero");
    });

    await t.step("✅ Robustness: Clearing with non-existent recipient ID", async () => {
      const initialTotalCount = await coll.countDocuments({}); // Get total count before operation
      await notificationLog.clearDismissedNotifications({ recipient: nonExistentRecipient });
      const finalTotalCount = await coll.countDocuments({});
      assertEquals(initialTotalCount, finalTotalCount, "No documents should be affected by clearing for a non-existent recipient");
    });

    await t.step("✅ Idempotency: Clearing dismissed notifications twice", async () => {
      // Use a new recipient to isolate this test's setup
      const recipientForIdempotency = recipientD;
      // Ensure clean state for this specific recipient
      await coll.deleteMany({ recipient: recipientForIdempotency });

      const { notificationID: idToClear } = await notificationLog.logNotification({ recipient: recipientForIdempotency, content: JSON.stringify({ msg: "To clear twice" }) }) as { notificationID: ID };
      const { notificationID: idToKeep } = await notificationLog.logNotification({ recipient: recipientForIdempotency, content: JSON.stringify({ msg: "To keep" }) }) as { notificationID: ID };
      await notificationLog.dismissNotification({ notificationID: idToClear });

      // First clear
      await notificationLog.clearDismissedNotifications({ recipient: recipientForIdempotency });
      const firstClearResult = await coll.find({ recipient: recipientForIdempotency }).toArray();
      assertEquals(firstClearResult.map(n => n._id), [idToKeep], "After first clear, only undismissed should remain.");

      // Second clear
      await notificationLog.clearDismissedNotifications({ recipient: recipientForIdempotency });
      const secondClearResult = await coll.find({ recipient: recipientForIdempotency }).toArray();
      assertEquals(secondClearResult.map(n => n._id), [idToKeep], "After second clear, state should remain the same (idempotent).");
    });

    await client.close();
    console.log("✅ Finished CLEARDISMISSEDNOTIFICATIONS tests\n");
  },
});

// ----------------------------------------------------------------------
// GETNOTIFICATIONS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "NotificationLog concept: Unit tests for 'getNotifications' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: GETNOTIFICATIONS ACTIONS");
    console.log("===========================================\n");

    const { client, notificationLog, coll } = await withFreshDb();

    let nA1: ID, nA2: ID, nA3: ID, nA4: ID;
    let nB1: ID;

    await t.step("Setup for getNotifications tests", async () => {
      // Recipient A notifications
      nA1 = (await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "A1_undelivered_undismissed" }) })) as { notificationID: ID }.notificationID;
      nA2 = (await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "A2_delivered_undismissed" }) })) as { notificationID: ID }.notificationID;
      await notificationLog.markAsDelivered({ notificationID: nA2 });
      nA3 = (await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "A3_undelivered_dismissed" }) })) as { notificationID: ID }.notificationID;
      await notificationLog.dismissNotification({ notificationID: nA3 });
      nA4 = (await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "A4_delivered_dismissed" }) })) as { notificationID: ID }.notificationID;
      await notificationLog.markAsDelivered({ notificationID: nA4 });
      await notificationLog.dismissNotification({ notificationID: nA4 });

      // Recipient B notification
      nB1 = (await notificationLog.logNotification({ recipient: recipientB, content: JSON.stringify({ msg: "B1_undelivered_undismissed" }) })) as { notificationID: ID }.notificationID;
    });

    await t.step("✅ Happy path: Get all notifications for a recipient (no filters)", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA });
      assertEquals(notificationIDs.sort(), [nA1, nA2, nA3, nA4].sort());
    });

    await t.step("✅ Happy path: Filter by delivered: true", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA, delivered: true });
      assertEquals(notificationIDs.sort(), [nA2, nA4].sort());
    });

    await t.step("✅ Happy path: Filter by delivered: false", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA, delivered: false });
      assertEquals(notificationIDs.sort(), [nA1, nA3].sort());
    });

    await t.step("✅ Happy path: Filter by dismissed: true", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA, dismissed: true });
      assertEquals(notificationIDs.sort(), [nA3, nA4].sort());
    });

    await t.step("✅ Happy path: Filter by dismissed: false", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA, dismissed: false });
      assertEquals(notificationIDs.sort(), [nA1, nA2].sort());
    });

    await t.step("✅ Happy path: Filter by both delivered: true and dismissed: false", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA, delivered: true, dismissed: false });
      assertEquals(notificationIDs.sort(), [nA2].sort());
    });

    await t.step("✅ Happy path: Filter by both delivered: false and dismissed: true", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA, delivered: false, dismissed: true });
      assertEquals(notificationIDs.sort(), [nA3].sort());
    });

    await t.step("✅ Happy path: Filter by both delivered: true and dismissed: true", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: recipientA, delivered: true, dismissed: true });
      assertEquals(notificationIDs.sort(), [nA4].sort());
    });

    await t.step("✅ Edge case: Recipient with no matching notifications", async () => {
      const { notificationIDs: emptyFilter } = await notificationLog.getNotifications({ recipient: recipientB, delivered: true, dismissed: true });
      assertEquals(emptyFilter, [], "RecipientB has no notifications matching delivered:true, dismissed:true"); // nB1 is undelivered and undismissed
    });

    await t.step("✅ Edge case: Non-existent recipient", async () => {
      const { notificationIDs } = await notificationLog.getNotifications({ recipient: nonExistentRecipient });
      assertEquals(notificationIDs, [], "Should return an empty array for a non-existent recipient");
      const { notificationIDs: filteredNonExistent } = await notificationLog.getNotifications({ recipient: nonExistentRecipient, delivered: true, dismissed: false });
      assertEquals(filteredNonExistent, [], "Should return an empty array for a non-existent recipient even with filters");
    });

    await client.close();
    console.log("✅ Finished GETNOTIFICATIONS tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
  name: "NotificationLog concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const { client, notificationLog, coll } = await withFreshDb();

    // Initial state: no notifications for recipientA
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA })).notificationIDs, []);

    // Step 1: Log a notification for recipientA
    const content1 = JSON.stringify({ message: "Welcome!", type: "info" });
    const { notificationID: id1 } = await notificationLog.logNotification({ recipient: recipientA, content: content1 }) as { notificationID: ID };
    const dbEntry1Initial = await coll.findOne({ _id: id1 });
    assertEquals(dbEntry1Initial!.sentAt instanceof Date, true, "A1 sentAt should be a Date");
    assertEquals(dbEntry1Initial!.sentAt.getTime() < Date.now(), true, "A1 sentAt should be earlier than current time");

    assertEquals((await notificationLog.getNotifications({ recipient: recipientA })).notificationIDs, [id1], "RecipientA should have 1 notification");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: false, dismissed: false })).notificationIDs, [id1], "Notification should be undelivered and undismissed");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: true })).notificationIDs, [], "No delivered notifications yet");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, dismissed: true })).notificationIDs, [], "No dismissed notifications yet");

    // Step 2: Log another notification for a different recipient (to ensure isolation)
    const content2 = JSON.stringify({ message: "Reminder!", type: "alert" });
    const { notificationID: id2 } = await notificationLog.logNotification({ recipient: recipientB, content: content2 }) as { notificationID: ID };
    const dbEntry2Initial = await coll.findOne({ _id: id2 });
    assertEquals(dbEntry2Initial!.sentAt instanceof Date, true, "B1 sentAt should be a Date");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientB })).notificationIDs, [id2], "RecipientB should have 1 notification");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA })).notificationIDs, [id1], "RecipientA's notifications should be unchanged");

    // Step 3: Mark the first notification for recipientA as delivered
    await notificationLog.markAsDelivered({ notificationID: id1 });
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: true, dismissed: false })).notificationIDs, [id1], "Notification A1 should now be delivered and undismissed");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: false })).notificationIDs, [], "No undelivered notifications for A");

    // Step 4: Dismiss the notification for recipientB
    await notificationLog.dismissNotification({ notificationID: id2 });
    const dbEntry2Dismissed = await coll.findOne({ _id: id2 });
    assertEquals(dbEntry2Dismissed!.sentAt.getTime() < dbEntry2Dismissed!.dismissedAt!.getTime(), true, "B1 sentAt should be earlier than dismissedAt");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientB, dismissed: true, delivered: false })).notificationIDs, [id2], "Notification B1 should be dismissed and undelivered");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientB, dismissed: false })).notificationIDs, [], "No undismissed notifications for B");

    // Step 5: Dismiss the first notification for recipientA (it's already delivered)
    await notificationLog.dismissNotification({ notificationID: id1 });
    const dbEntry1Dismissed = await coll.findOne({ _id: id1 });
    assertEquals(dbEntry1Dismissed!.sentAt.getTime() < dbEntry1Dismissed!.dismissedAt!.getTime(), true, "A1 sentAt should be earlier than dismissedAt");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: true, dismissed: true })).notificationIDs, [id1], "Notification A1 should now be delivered and dismissed");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: true, dismissed: false })).notificationIDs, [], "No delivered and undismissed for A");

    // Step 6: Log another notification for recipientA, but don't deliver or dismiss
    const content3 = JSON.stringify({ message: "New event", type: "system" });
    const { notificationID: id3 } = await notificationLog.logNotification({ recipient: recipientA, content: content3 }) as { notificationID: ID };
    const dbEntry3Initial = await coll.findOne({ _id: id3 });
    assertEquals(dbEntry3Initial!.sentAt instanceof Date, true, "A3 sentAt should be a Date");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: false, dismissed: false })).notificationIDs, [id3], "Notification A3 should be undelivered and undismissed");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: true, dismissed: true })).notificationIDs, [id1], "Notification A1 remains delivered and dismissed");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA })).notificationIDs.sort(), [id1, id3].sort(), "RecipientA should have two notifications now");

    // Step 7: Clear dismissed notifications for recipientA
    await notificationLog.clearDismissedNotifications({ recipient: recipientA });
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA })).notificationIDs, [id3], "Notification A1 should be gone after clearing dismissed");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: true, dismissed: true })).notificationIDs, [], "No delivered and dismissed notifications should remain for A");
    assertEquals((await notificationLog.getNotifications({ recipient: recipientA, delivered: false, dismissed: false })).notificationIDs, [id3], "Notification A3 should be the only one remaining for A");

    // Step 8: Verify recipientB's notification is still there (not cleared by recipientA's action)
    assertEquals((await notificationLog.getNotifications({ recipient: recipientB })).notificationIDs, [id2], "RecipientB's notification should still exist");

    // Step 9: Clear dismissed notifications for recipientB
    await notificationLog.clearDismissedNotifications({ recipient: recipientB });
    assertEquals((await notificationLog.getNotifications({ recipient: recipientB })).notificationIDs, [], "RecipientB should have no notifications after clearing dismissed");

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "NotificationLog concept: Robustness and concurrency tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
    console.log("=================================================\n");

    const { client, notificationLog, coll } = await withFreshDb();

    // Scenario 1: Concurrent attempts to mark the same notification as delivered
    const content1 = JSON.stringify({ message: "Critical Alert" });
    const { notificationID: alertID } = await notificationLog.logNotification({ recipient: recipientA, content: content1 }) as { notificationID: ID };

    const deliveryAttempts = await Promise.allSettled([
      notificationLog.markAsDelivered({ notificationID: alertID }),
      notificationLog.markAsDelivered({ notificationID: alertID }),
      notificationLog.markAsDelivered({ notificationID: alertID }),
    ]);

    const fulfilledDeliveries = deliveryAttempts.filter(r => r.status === "fulfilled").length;
    const rejectedDeliveries = deliveryAttempts.filter(r => r.status === "rejected").length;

    assertEquals(fulfilledDeliveries, 1, "Only one delivery attempt should succeed due to 'requires'");
    assertEquals(rejectedDeliveries, 2, "Subsequent delivery attempts should be rejected for 'already delivered'");

    const finalAlertState = await coll.findOne({ _id: alertID });
    assertEquals(finalAlertState?.deliveredFlag, true, "Notification should ultimately be marked as delivered");
    assertEquals(finalAlertState?.dismissedAt, undefined, "Dismissal state should be unaffected by delivery attempts");

    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 2: Concurrent attempts to dismiss the same notification
    const content2 = JSON.stringify({ message: "Reminder" });
    const { notificationID: reminderID } = await notificationLog.logNotification({ recipient: recipientB, content: content2 }) as { notificationID: ID };

    const dismissalAttempts = await Promise.allSettled([
      notificationLog.dismissNotification({ notificationID: reminderID }),
      notificationLog.dismissNotification({ notificationID: reminderID }),
    ]);

    const fulfilledDismissals = dismissalAttempts.filter(r => r.status === "fulfilled").length;
    const rejectedDismissals = dismissalAttempts.filter(r => r.status === "rejected").length;

    assertEquals(fulfilledDismissals, 1, "Only one dismissal attempt should succeed due to 'requires'");
    assertEquals(rejectedDismissals, 1, "Subsequent dismissal attempts should be rejected for 'already dismissed'");

    const finalReminderState = await coll.findOne({ _id: reminderID });
    assertEquals(typeof finalReminderState?.dismissedAt, "object", "Notification should ultimately be marked as dismissed");
    assertEquals(finalReminderState?.deliveredFlag, false, "Delivery state should be unaffected by dismissal attempts");

    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 3: Interleaved operations - log, deliver, dismiss, then clear (happy path sequence)
    const { notificationID: interleavedID } = await notificationLog.logNotification({ recipient: recipientC, content: JSON.stringify({ step: 1 }) }) as { notificationID: ID };

    await notificationLog.markAsDelivered({ notificationID: interleavedID });
    let stateAfterDelivery = await coll.findOne({ _id: interleavedID });
    assertEquals(stateAfterDelivery?.deliveredFlag, true, "Interleaved: Notification should be delivered");
    assertEquals(stateAfterDelivery?.dismissedAt, undefined, "Interleaved: Notification should not be dismissed yet");

    await notificationLog.dismissNotification({ notificationID: interleavedID });
    let stateAfterDismissal = await coll.findOne({ _id: interleavedID });
    assertEquals(stateAfterDismissal?.deliveredFlag, true, "Interleaved: Notification should remain delivered");
    assertEquals(typeof stateAfterDismissal?.dismissedAt, "object", "Interleaved: Notification should be dismissed");

    await notificationLog.clearDismissedNotifications({ recipient: recipientC });
    const notificationsAfterClear = await coll.countDocuments({ _id: interleavedID });
    assertEquals(notificationsAfterClear, 0, "Interleaved: Notification should be cleared after being dismissed");

    // Scenario 4: Error handling and data consistency - operation on non-existent ID
    const fakeID = "nonExistent" as ID;
    await assertRejects(
      () => notificationLog.markAsDelivered({ notificationID: fakeID }),
      Error,
      "Notification not found.",
      "Operation on non-existent ID should correctly throw 'Notification not found'.",
    );
    const countAfterFailedOp = await coll.countDocuments({}); // Check if any accidental entries were created
    assertEquals(countAfterFailedOp, 0, "Database should remain clean/unaffected by operations on non-existent IDs.");

    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 5: Dismiss after cleared
    const { notificationID: clearedID } = await notificationLog.logNotification({ recipient: recipientA, content: JSON.stringify({ msg: "To be cleared then dismissed" }) }) as { notificationID: ID };
    await notificationLog.dismissNotification({ notificationID: clearedID });
    await notificationLog.clearDismissedNotifications({ recipient: recipientA });

    const clearedEntry = await coll.findOne({ _id: clearedID });
    assertEquals(clearedEntry, null, "Notification should be cleared from DB.");

    await assertRejects(
      () => notificationLog.dismissNotification({ notificationID: clearedID }),
      Error,
      "Notification not found.",
      "Attempting to dismiss a cleared notification should result in 'Notification not found'.",
    );

    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 6: Concurrently log multiple notifications for the same recipient
    const recipientLogs = "recipientLogs" as ID;
    const logPromises = Array.from({ length: 5 }, (_, i) =>
      notificationLog.logNotification({ recipient: recipientLogs, content: JSON.stringify({ logNum: i }) })
    );

    const logResults = await Promise.all(logPromises); // Use Promise.all here, as all should succeed
    const newNotificationIDs = logResults.map(r => (r as { notificationID: ID }).notificationID);

    assertEquals(newNotificationIDs.length, 5, "All 5 log operations should return a notificationID");
    const uniqueIDs = new Set(newNotificationIDs);
    assertEquals(uniqueIDs.size, 5, "All logged notifications should have unique IDs");

    const dbNotifications = await coll.find({ recipient: recipientLogs }).toArray();
    assertEquals(dbNotifications.length, 5, "Exactly 5 notifications should be in the database for recipientLogs");
    assertEquals(dbNotifications.every(n => newNotificationIDs.includes(n._id)), true, "All retrieved IDs match logged IDs");

    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 7: Concurrently mark/dismiss while clearing and other ops
    const recipientConcurrent = "recipientConcurrent" as ID;
    const contentCon1 = JSON.stringify({ step: "A_dismiss_and_clear_target" });
    const contentCon2 = JSON.stringify({ step: "B_deliver_target" });
    const contentCon3 = JSON.stringify({ step: "C_another_dismiss_target" });

    // Log three notifications
    const { notificationID: idA } = await notificationLog.logNotification({ recipient: recipientConcurrent, content: contentCon1 }) as { notificationID: ID };
    const { notificationID: idB } = await notificationLog.logNotification({ recipient: recipientConcurrent, content: contentCon2 }) as { notificationID: ID };
    const { notificationID: idC } = await notificationLog.logNotification({ recipient: recipientConcurrent, content: contentCon3 }) as { notificationID: ID };

    // Dismiss notification A and C
    await notificationLog.dismissNotification({ notificationID: idA });
    await notificationLog.dismissNotification({ notificationID: idC });

    // Check initial state
    assertEquals((await notificationLog.getNotifications({ recipient: recipientConcurrent, dismissed: true })).notificationIDs.sort(), [idA, idC].sort());
    assertEquals((await notificationLog.getNotifications({ recipient: recipientConcurrent, dismissed: false })).notificationIDs, [idB]);

    // Concurrent operations
    const concurrentOps = await Promise.allSettled([
      notificationLog.clearDismissedNotifications({ recipient: recipientConcurrent }), // Should remove A and C
      notificationLog.markAsDelivered({ notificationID: idA }), // Try to deliver dismissed A (should largely fail if cleared)
      notificationLog.markAsDelivered({ notificationID: idB }), // Deliver undelivered B (should succeed)
      notificationLog.dismissNotification({ notificationID: idC }), // Try to dismiss dismissed C again (should largely fail)
    ]);

    // Verify outcomes of individual promises
    const clearResult = concurrentOps[0];
    const markADeliveredResult = concurrentOps[1];
    const markBDeliveredResult = concurrentOps[2];
    const dismissCResult = concurrentOps[3];

    assertEquals(clearResult.status, "fulfilled", "Clear dismissed notifications should fulfill.");

    // For idA (dismissed, target of clear, also targeted by markAsDelivered)
    if (markADeliveredResult.status === "rejected") {
      assertEquals((markADeliveredResult as PromiseRejectedResult).reason.message, "Notification not found.", "markAsDelivered(idA) should fail if A was cleared first.");
    } else {
      assertEquals(markADeliveredResult.status, "fulfilled", "markAsDelivered(idA) could succeed if it runs before clear.");
      const stateA = await coll.findOne({ _id: idA });
      assertEquals(stateA, null, "Even if markAsDelivered(idA) fulfilled, idA should eventually be cleared.");
    }

    // For idB (undelivered, undismissed, not target of clear, targeted by markAsDelivered)
    assertEquals(markBDeliveredResult.status, "fulfilled", "markAsDelivered(idB) should fulfill.");
    const stateB = await coll.findOne({ _id: idB });
    assertEquals(stateB?.deliveredFlag, true, "idB should be marked as delivered.");
    assertEquals(stateB?.dismissedAt, undefined, "idB should not be dismissed.");

    // For idC (dismissed, target of clear, also targeted by dismissNotification)
    assertEquals(dismissCResult.status, "rejected", "dismissNotification(idC) should reject.");
    assertEquals((dismissCResult as PromiseRejectedResult).reason.message === "Notification not found." || (dismissCResult as PromiseRejectedResult).reason.message === "Notification already dismissed.", true, "idC should be either not found or already dismissed.");
    const stateC = await coll.findOne({ _id: idC });
    assertEquals(stateC, null, "idC should eventually be cleared regardless of concurrent dismiss attempt.");

    // Final state verification for recipientConcurrent
    const remainingNotifications = await notificationLog.getNotifications({ recipient: recipientConcurrent });
    assertEquals(remainingNotifications.notificationIDs, [idB], "Only notification B should remain for recipientConcurrent after clear and other ops.");
    const finalStateB = await coll.findOne({ _id: idB });
    assertEquals(finalStateB?.deliveredFlag, true, "Notification B should be delivered");
    assertEquals(finalStateB?.dismissedAt, undefined, "Notification B should not be dismissed");

    await client.close();
    console.log("✅ Finished ROBUSTNESS tests\n");
  },
});

// ----------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------
Deno.test({
  name: "✅ Final summary",
  fn() {
    console.log("\n===============================================");
    console.log("🎉 ALL TEST CASES PASSED SUCCESSFULLY 🎉");
    console.log("===============================================\n");
  },
});
```
