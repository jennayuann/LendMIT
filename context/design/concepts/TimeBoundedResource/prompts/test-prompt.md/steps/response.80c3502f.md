---
timestamp: 'Sun Oct 19 2025 00:19:19 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_001919.ec710b5b.md]]'
content_id: 80c3502f30f0f150816dbe9add48c3586a5e231a045137ad27e558c0190e5a51
---

# response:

```typescript
// src/concepts/TimeBoundedResource.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { TimeBoundedResource } from "./TimeBoundedResource.ts";
import { Collection, Db } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const resourceA = "resourceA" as ID;
const resourceB = "resourceB" as ID;
const resourceC = "resourceC" as ID;
const resourceD = "resourceD" as ID;
const nonExistentResource = "nonExistentResource" as ID;
const emptyID = "" as ID; // Edge case for resource ID

// Helper to get the TimeBoundedResource collection
function getCollection(db: Db): Collection<any> {
  return db.collection("timeBoundedResources");
}

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR TIMEBOUNDEDRESOURCE CONCEPT");
console.log("===========================================\n");

// ----------------------------------------------------------------------
// DEFINE TIME WINDOW ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DEFINE TIME WINDOW ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll = getCollection(db);
    await coll.deleteMany({}); // Ensure clean state for this Deno.test block

    await t.step("✅ Happy path: Define with specific availableFrom and availableUntil", async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: now, availableUntil: future });

      // Verify using getTimeWindow
      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceA });
      assertNotEquals(retrieved, null, "Should retrieve the defined time window.");
      assertEquals(retrieved?.resource, resourceA, "Resource ID should match.");
      assertEquals(retrieved?.availableFrom?.getTime(), now.getTime(), "availableFrom should be correctly set.");
      assertEquals(retrieved?.availableUntil?.getTime(), future.getTime(), "availableUntil should be correctly set.");

      // Verify direct from MongoDB collection
      const dbEntry = await coll.findOne({ _id: resourceA });
      assertNotEquals(dbEntry, null, "Document should exist in the database.");
      assertEquals(dbEntry?.availableFrom?.getTime(), now.getTime(), "DB availableFrom should match.");
      assertEquals(dbEntry?.availableUntil?.getTime(), future.getTime(), "DB availableUntil should match.");
    });

    await t.step("✅ Happy path: Define with availableFrom (null -> now) and specific availableUntil", async () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

      // Capture 'now' around the call to assert against internal 'now'
      const beforeCall = new Date();
      await timeBoundedResource.defineTimeWindow({ resource: resourceB, availableFrom: null, availableUntil: future });
      const afterCall = new Date();

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceB });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, resourceB);
      assertNotEquals(retrieved?.availableFrom, null, "availableFrom should be set to a Date when null is provided.");
      // Ensure availableFrom is within the call timeframe
      assertEquals(retrieved!.availableFrom!.getTime() >= beforeCall.getTime(), true, "availableFrom should be after or at beforeCall time.");
      assertEquals(retrieved!.availableFrom!.getTime() <= afterCall.getTime(), true, "availableFrom should be before or at afterCall time.");
      assertEquals(retrieved?.availableUntil?.getTime(), future.getTime());
    });

    await t.step("✅ Happy path: Define with specific availableFrom and indefinite availableUntil (null)", async () => {
      const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      await timeBoundedResource.defineTimeWindow({ resource: resourceC, availableFrom: past, availableUntil: null });

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceC });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, resourceC);
      assertEquals(retrieved?.availableFrom?.getTime(), past.getTime());
      assertEquals(retrieved?.availableUntil, null, "availableUntil should remain null for indefinite availability.");
    });

    await t.step("✅ Happy path: Define with both availableFrom and availableUntil as null (now & indefinite)", async () => {
      const beforeCall = new Date();
      await timeBoundedResource.defineTimeWindow({ resource: resourceD, availableFrom: null, availableUntil: null });
      const afterCall = new Date();

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceD });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, resourceD);
      assertNotEquals(retrieved?.availableFrom, null, "availableFrom should be set to a Date.");
      assertEquals(retrieved!.availableFrom!.getTime() >= beforeCall.getTime(), true);
      assertEquals(retrieved!.availableFrom!.getTime() <= afterCall.getTime(), true);
      assertEquals(retrieved?.availableUntil, null, "availableUntil should remain null.");
    });

    await t.step("✅ Requires violation: availableFrom must be strictly earlier than availableUntil", async () => {
      const timeA = new Date();
      const timeB = new Date(timeA.getTime() - 1000); // B is before A

      await assertRejects(
        () => timeBoundedResource.defineTimeWindow({ resource: "tempResource1" as ID, availableFrom: timeA, availableUntil: timeB }),
        Error,
        "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
        "Should reject when availableFrom is after availableUntil.",
      );
      assertEquals(await coll.countDocuments({ _id: "tempResource1" }), 0, "No document should be created if validation fails.");

      await assertRejects(
        () => timeBoundedResource.defineTimeWindow({ resource: "tempResource2" as ID, availableFrom: timeA, availableUntil: timeA }),
        Error,
        "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
        "Should reject when availableFrom is equal to availableUntil.",
      );
      assertEquals(await coll.countDocuments({ _id: "tempResource2" }), 0, "No document should be created if validation fails.");
    });

    await t.step("✅ Edge case: Updating an existing time window (idempotency)", async () => {
      const initialFrom = new Date(Date.now() - 100000);
      const initialUntil = new Date(Date.now() + 100000);
      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: initialFrom, availableUntil: initialUntil }); // Re-use resourceA, updates it

      const updatedFrom = new Date(Date.now() - 50000);
      const updatedUntil = new Date(Date.now() + 200000);
      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: updatedFrom, availableUntil: updatedUntil });

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceA });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, resourceA);
      assertEquals(retrieved?.availableFrom?.getTime(), updatedFrom.getTime(), "availableFrom should be updated.");
      assertEquals(retrieved?.availableUntil?.getTime(), updatedUntil.getTime(), "availableUntil should be updated.");

      const count = await coll.countDocuments({ _id: resourceA });
      assertEquals(count, 1, "Only one document should exist for resourceA after update.");
    });

    await t.step("✅ Edge case: Defining with empty string ResourceID", async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

      await timeBoundedResource.defineTimeWindow({ resource: emptyID, availableFrom: now, availableUntil: future });

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: emptyID });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, emptyID);
      assertEquals(retrieved?.availableFrom?.getTime(), now.getTime());
      assertEquals(retrieved?.availableUntil?.getTime(), future.getTime());
    });

    await client.close();
    console.log("✅ Finished DEFINE TIME WINDOW tests\n");
  },
});

// ----------------------------------------------------------------------
// GET TIME WINDOW ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Unit tests for 'getTimeWindow' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: GET TIME WINDOW ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll = getCollection(db);
    await coll.deleteMany({}); // Ensure clean state

    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    await t.step("✅ Happy path: Retrieve an existing time window", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: now, availableUntil: future });

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceA });
      assertNotEquals(retrieved, null, "Should retrieve the defined time window.");
      assertEquals(retrieved?.resource, resourceA);
      assertEquals(retrieved?.availableFrom?.getTime(), now.getTime());
      assertEquals(retrieved?.availableUntil?.getTime(), future.getTime());
    });

    await t.step("✅ Negative path: Retrieve a non-existent time window", async () => {
      const retrieved = await timeBoundedResource.getTimeWindow({ resource: nonExistentResource });
      assertEquals(retrieved, null, "Should return null for a non-existent resource.");
    });

    await t.step("✅ Edge case: Retrieve window with availableFrom as null (now)", async () => {
      const beforeDefine = new Date();
      await timeBoundedResource.defineTimeWindow({ resource: resourceB, availableFrom: null, availableUntil: future });
      const afterDefine = new Date();

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceB });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, resourceB);
      assertNotEquals(retrieved?.availableFrom, null, "availableFrom should be a concrete Date object.");
      assertEquals(retrieved!.availableFrom!.getTime() >= beforeDefine.getTime(), true);
      assertEquals(retrieved!.availableFrom!.getTime() <= afterDefine.getTime(), true);
      assertEquals(retrieved?.availableUntil?.getTime(), future.getTime());
    });

    await t.step("✅ Edge case: Retrieve window with availableUntil as null (indefinite)", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: resourceC, availableFrom: now, availableUntil: null });

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: resourceC });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, resourceC);
      assertEquals(retrieved?.availableFrom?.getTime(), now.getTime());
      assertEquals(retrieved?.availableUntil, null, "availableUntil should be null for indefinite.");
    });

    await t.step("✅ Edge case: Retrieve window for empty string ResourceID", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: emptyID, availableFrom: now, availableUntil: future });

      const retrieved = await timeBoundedResource.getTimeWindow({ resource: emptyID });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.resource, emptyID);
    });

    await client.close();
    console.log("✅ Finished GET TIME WINDOW tests\n");
  },
});

// ----------------------------------------------------------------------
// EXPIRE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Unit tests for 'expireResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: EXPIRE RESOURCE ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll = getCollection(db);
    await coll.deleteMany({}); // Ensure clean state

    const past = new Date(Date.now() - 1000); // 1 second ago
    const future = new Date(Date.now() + 100000); // 100 seconds from now
    const now = new Date();

    await t.step("✅ Happy path: Resource is expired (availableUntil is in the past)", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: past, availableUntil: past });
      const beforeExpire = await timeBoundedResource.getTimeWindow({ resource: resourceA });

      await timeBoundedResource.expireResource({ resource: resourceA }); // Should succeed

      // Verify no state change
      const afterExpire = await timeBoundedResource.getTimeWindow({ resource: resourceA });
      assertNotEquals(afterExpire, null, "Window should still exist after expiration.");
      assertEquals(afterExpire?.resource, beforeExpire?.resource, "Resource ID should not change.");
      assertEquals(afterExpire?.availableFrom?.getTime(), beforeExpire?.availableFrom?.getTime(), "availableFrom should not change.");
      assertEquals(afterExpire?.availableUntil?.getTime(), beforeExpire?.availableUntil?.getTime(), "availableUntil should not change.");
    });

    await t.step("✅ Happy path: Resource is expired (availableUntil is exactly current time)", async () => {
      // Define a resource whose availableUntil is exactly 'now' for this test.
      // Use a slightly adjusted 'now' to ensure currentTime >= availableUntil.
      const precisePast = new Date(Date.now()); // Set `availableUntil` to current instant
      await timeBoundedResource.defineTimeWindow({ resource: resourceD, availableFrom: precisePast, availableUntil: precisePast });

      // `expireResource`'s `currentTime` (`new Date()`) will be >= `precisePast`.
      await timeBoundedResource.expireResource({ resource: resourceD }); // Should succeed

      // Verify no state change
      const afterExpire = await timeBoundedResource.getTimeWindow({ resource: resourceD });
      assertNotEquals(afterExpire, null);
      assertEquals(afterExpire?.availableUntil?.getTime(), precisePast.getTime());
    });

    await t.step("✅ Requires violation: No TimeWindow entry found for resource", async () => {
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: nonExistentResource }),
        Error,
        `Validation Error: No TimeWindow entry found for resource '${nonExistentResource}'.`,
        "Should reject if resource has no defined time window.",
      );
    });

    await t.step("✅ Requires violation: availableUntil is null (indefinite)", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: resourceB, availableFrom: now, availableUntil: null });

      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: resourceB }),
        Error,
        `Validation Error: 'availableUntil' is not defined (null) for resource '${resourceB}'. Cannot expire an indefinitely available resource through this action.`,
        "Should reject if resource is indefinitely available.",
      );
    });

    await t.step("✅ Requires violation: Current time is earlier than availableUntil (not yet expired)", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: resourceC, availableFrom: now, availableUntil: future });

      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: resourceC }),
        Error,
        new RegExp(`Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${resourceC}'. Resource is not yet expired.`),
        "Should reject if resource is not yet expired.",
      );
    });

    await t.step("✅ Edge case: Expiring with empty string ResourceID (not defined)", async () => {
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: emptyID }),
        Error,
        `Validation Error: No TimeWindow entry found for resource '${emptyID}'.`,
        "Should reject for empty string ID if no window is defined.",
      );
    });

    await t.step("✅ Edge case: Expiring with empty string ResourceID (defined and expired)", async () => {
      const expiredTime = new Date(Date.now() - 1000);
      await timeBoundedResource.defineTimeWindow({ resource: emptyID, availableFrom: expiredTime, availableUntil: expiredTime });
      await timeBoundedResource.expireResource({ resource: emptyID }); // Should not throw
      const retrieved = await timeBoundedResource.getTimeWindow({ resource: emptyID });
      assertNotEquals(retrieved, null);
      assertEquals(retrieved?.availableUntil?.getTime(), expiredTime.getTime(), "State should be unchanged for empty ID.");
    });

    await client.close();
    console.log("✅ Finished EXPIRE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    await db.collection("timeBoundedResources").deleteMany({}); // Ensure clean state

    const r1 = "traceResource1" as ID;
    const r2 = "traceResource2" as ID;
    const r3 = "traceResource3" as ID;

    // Define times
    const past = new Date(Date.now() - 50000); // 50 seconds ago
    const futureSoon = new Date(Date.now() + 10000); // 10 seconds from now
    const futureLater = new Date(Date.now() + 60000); // 1 minute from now

    await t.step("Scenario Step 1: Define initial time windows", async () => {
      // Resource 1: Available from now, expires in futureSoon
      await timeBoundedResource.defineTimeWindow({ resource: r1, availableFrom: null, availableUntil: futureSoon });
      // Resource 2: Available from past, indefinitely available
      await timeBoundedResource.defineTimeWindow({ resource: r2, availableFrom: past, availableUntil: null });
      // Resource 3: Not yet available (starts in futureSoon), expires in futureLater
      await timeBoundedResource.defineTimeWindow({ resource: r3, availableFrom: futureSoon, availableUntil: futureLater });

      // Verify initial state
      let r1Window = await timeBoundedResource.getTimeWindow({ resource: r1 });
      assertNotEquals(r1Window, null);
      assertNotEquals(r1Window?.availableFrom, null); // should be set to 'now'
      assertEquals(r1Window?.availableUntil?.getTime(), futureSoon.getTime());

      let r2Window = await timeBoundedResource.getTimeWindow({ resource: r2 });
      assertNotEquals(r2Window, null);
      assertEquals(r2Window?.availableFrom?.getTime(), past.getTime());
      assertEquals(r2Window?.availableUntil, null);

      let r3Window = await timeBoundedResource.getTimeWindow({ resource: r3 });
      assertNotEquals(r3Window, null);
      assertEquals(r3Window?.availableFrom?.getTime(), futureSoon.getTime());
      assertEquals(r3Window?.availableUntil?.getTime(), futureLater.getTime());
    });

    await t.step("Scenario Step 2: Attempt to expire resources prematurely or incorrectly", async () => {
      // Try to expire r1 (not yet expired)
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: r1 }),
        Error,
        new RegExp(`Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${r1}'.`),
        "R1 should not be expirable yet.",
      );

      // Try to expire r2 (indefinitely available)
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: r2 }),
        Error,
        `'availableUntil' is not defined (null) for resource '${r2}'.`,
        "R2 should not be expirable as it's indefinite.",
      );

      // Try to expire r3 (not yet available and not expired)
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: r3 }),
        Error,
        new RegExp(`Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${r3}'.`),
        "R3 should not be expirable yet.",
      );
    });

    await t.step("Scenario Step 3: Update R1 to be expired and then successfully expire it", async () => {
      // To simulate time passage for R1 to expire, we redefine R1 with `availableUntil` in the past.
      const newPastUntilR1 = new Date(Date.now() - 100); // 100ms in the past
      await timeBoundedResource.defineTimeWindow({ resource: r1, availableFrom: past, availableUntil: newPastUntilR1 });

      await timeBoundedResource.expireResource({ resource: r1 }); // Should now succeed

      // Verify state of R1 is unchanged after expire (as per concept)
      const r1Window = await timeBoundedResource.getTimeWindow({ resource: r1 });
      assertNotEquals(r1Window, null);
      assertEquals(r1Window?.availableFrom?.getTime(), past.getTime());
      assertEquals(r1Window?.availableUntil?.getTime(), newPastUntilR1.getTime());
    });

    await t.step("Scenario Step 4: Update R2 to have an expiration (in the past), then expire it", async () => {
      // Update r2 from indefinite to having an expiration in the past
      const newPastUntilR2 = new Date(Date.now() - 50); // 50ms in the past
      await timeBoundedResource.defineTimeWindow({ resource: r2, availableFrom: past, availableUntil: newPastUntilR2 });

      await timeBoundedResource.expireResource({ resource: r2 }); // Should now succeed

      // Verify state of R2 is unchanged after expire
      const r2Window = await timeBoundedResource.getTimeWindow({ resource: r2 });
      assertNotEquals(r2Window, null);
      assertEquals(r2Window?.availableFrom?.getTime(), past.getTime());
      assertEquals(r2Window?.availableUntil?.getTime(), newPastUntilR2.getTime());
    });

    await t.step("Scenario Step 5: Check non-expired R3 state (should remain unchanged and unexpirable yet)", async () => {
      // R3 should still not be expirable as its 'availableUntil' is in the future.
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: r3 }),
        Error,
        new RegExp(`Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${r3}'.`),
        "R3 should still not be expirable.",
      );

      const r3Window = await timeBoundedResource.getTimeWindow({ resource: r3 });
      assertNotEquals(r3Window, null);
      assertEquals(r3Window?.availableFrom?.getTime(), futureSoon.getTime());
      assertEquals(r3Window?.availableUntil?.getTime(), futureLater.getTime());
    });

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Robustness and concurrency-like tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll = getCollection(db);
    await coll.deleteMany({}); // Ensure clean state

    const rA = "robustResourceA" as ID;
    const rB = "robustResourceB" as ID;
    const rC = "robustResourceC" as ID;

    await t.step("✅ Robustness: Concurrent 'defineTimeWindow' calls for the same resource", async () => {
      const now = new Date();
      const future1 = new Date(now.getTime() + 10000); // 10s from now
      const future2 = new Date(now.getTime() + 20000); // 20s from now

      // Simulate concurrent calls to define different windows for the same resource.
      // MongoDB's updateOne with upsert will handle this, resulting in a single document
      // reflecting the state of the last successful write.
      const results = await Promise.allSettled([
        timeBoundedResource.defineTimeWindow({ resource: rA, availableFrom: now, availableUntil: future1 }),
        timeBoundedResource.defineTimeWindow({ resource: rA, availableFrom: now, availableUntil: future2 }),
        timeBoundedResource.defineTimeWindow({ resource: rA, availableFrom: now, availableUntil: future1 }),
      ]);

      assertEquals(results.every(r => r.status === "fulfilled"), true, "All defineTimeWindow calls should fulfill.");

      const count = await coll.countDocuments({ _id: rA });
      assertEquals(count, 1, "Only one document should exist for rA.");

      const finalWindow = await timeBoundedResource.getTimeWindow({ resource: rA });
      assertNotEquals(finalWindow, null);
      // Due to the non-deterministic nature of Promise.allSettled order, the final state
      // could be `future1` or `future2`. In practice, the last write wins. We assert it's one of them.
      // For this test, we expect the very last definition attempt to be the final state.
      assertEquals(finalWindow?.availableUntil?.getTime(), future1.getTime(), "The last define call should determine the final state.");
    });

    await t.step("✅ Robustness: Repeated 'expireResource' calls on an expired resource", async () => {
      const past = new Date(Date.now() - 1000);
      await timeBoundedResource.defineTimeWindow({ resource: rB, availableFrom: past, availableUntil: past });

      // Call expireResource multiple times (simulating retries or concurrent checks)
      const results = await Promise.allSettled([
        timeBoundedResource.expireResource({ resource: rB }),
        timeBoundedResource.expireResource({ resource: rB }),
        timeBoundedResource.expireResource({ resource: rB }),
      ]);

      assertEquals(results.every(r => r.status === "fulfilled"), true, "All repeated expireResource calls should succeed.");
      const window = await timeBoundedResource.getTimeWindow({ resource: rB });
      assertNotEquals(window, null);
      assertEquals(window?.availableUntil?.getTime(), past.getTime(), "State should remain unchanged after multiple expirations.");
    });

    await t.step("✅ Robustness: Interleaving define and expire with invalid states", async () => {
      const future = new Date(Date.now() + 10000); // 10s in the future

      // 1. Define an invalid window (availableFrom > availableUntil) - should be rejected.
      await assertRejects(
        () => timeBoundedResource.defineTimeWindow({ resource: rC, availableFrom: future, availableUntil: new Date() }),
        Error,
        "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
        "Defining an invalid window should be rejected.",
      );
      // Ensure no entry was created
      assertEquals(await timeBoundedResource.getTimeWindow({ resource: rC }), null, "No document should exist for rC after failed definition.");

      // 2. Define a valid window.
      await timeBoundedResource.defineTimeWindow({ resource: rC, availableFrom: new Date(), availableUntil: future });

      // 3. Try to expire it prematurely - should be rejected.
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: rC }),
        Error,
        new RegExp(`Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${rC}'.`),
        "Expiring prematurely should be rejected.",
      );

      // Verify state consistency: The window should still exist and be valid after rejected expire.
      const window = await timeBoundedResource.getTimeWindow({ resource: rC });
      assertNotEquals(window, null, "Document for rC should still exist and be valid.");
      assertEquals(window?.availableUntil?.getTime(), future.getTime(), "availableUntil should remain unchanged.");
    });

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
    console.log("\n====================================================================");
    console.log("🎉 TIMEBOUNDEDRESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
    console.log("======================================================================\n");
  },
});
```
