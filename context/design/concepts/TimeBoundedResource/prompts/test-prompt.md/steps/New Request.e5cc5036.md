---
timestamp: 'Sun Oct 19 2025 00:42:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_004229.1e568c1b.md]]'
content_id: e5cc503615843a177c36c5dcf0bdc7650c92020bd26271b35dc0c1119190a272
---

# New Request: Iterate on the test suite based on the console output.

## Test suite:

```
// src/concepts/TimeBoundedResource.test.ts

  

// deno-lint-ignore no-import-prefix

import { assertEquals, assertRejects, assertNotEquals, assert } from "jsr:@std/assert";

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

console.log(" ⏰ STARTING TESTS FOR TIME BOUNDED RESOURCE CONCEPT");

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

await db.collection("timeBoundedResources").deleteMany({}); // Ensure clean state

  

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

await db.collection("timeBoundedResources").deleteMany({}); // Ensure clean state

  

const future = new Date(Date.now() + 100000); // 100 seconds from now

const now = new Date();

  

await t.step("✅ Happy path: Resource is expired (availableUntil is in the past)", async () => {

// Ensure availableFrom is strictly earlier than availableUntil

const expiredEnd = new Date(Date.now() - 1000); // 1 second ago

const expiredStart = new Date(expiredEnd.getTime() - 1000); // 2 seconds ago

await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: expiredStart, availableUntil: expiredEnd });

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

// Use a slightly adjusted 'now' to ensure currentTime >= availableUntil and availableFrom < availableUntil.

const preciseUntil = new Date(Date.now()); // Set `availableUntil` to current instant

const preciseFrom = new Date(preciseUntil.getTime() - 1); // availableFrom is 1ms before

await timeBoundedResource.defineTimeWindow({ resource: resourceD, availableFrom: preciseFrom, availableUntil: preciseUntil });

  

// `expireResource`'s `currentTime` (`new Date()`) will be >= `preciseUntil`.

await timeBoundedResource.expireResource({ resource: resourceD }); // Should succeed

  

// Verify no state change

const afterExpire = await timeBoundedResource.getTimeWindow({ resource: resourceD });

assertNotEquals(afterExpire, null);

assertEquals(afterExpire?.availableFrom?.getTime(), preciseFrom.getTime());

assertEquals(afterExpire?.availableUntil?.getTime(), preciseUntil.getTime());

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

`Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${resourceC}'. Resource is not yet expired.`, // Regex adjusted

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

// Ensure availableFrom is strictly earlier than availableUntil

const expiredEnd = new Date(Date.now() - 1000);

const expiredFrom = new Date(expiredEnd.getTime() - 1000);

await timeBoundedResource.defineTimeWindow({ resource: emptyID, availableFrom: expiredFrom, availableUntil: expiredEnd });

await timeBoundedResource.expireResource({ resource: emptyID }); // Should not throw

const retrieved = await timeBoundedResource.getTimeWindow({ resource: emptyID });

assertNotEquals(retrieved, null);

assertEquals(retrieved?.availableFrom?.getTime(), expiredFrom.getTime(), "State should be unchanged for empty ID.");

assertEquals(retrieved?.availableUntil?.getTime(), expiredEnd.getTime(), "State should be unchanged for empty ID.");

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

`Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${r1}'.`, // Regex adjusted

"R1 should not be expirable yet.",

);

  

// Try to expire r2 (indefinitely available)

await assertRejects(

() => timeBoundedResource.expireResource({ resource: r2 }),

Error,

`Validation Error: 'availableUntil' is not defined (null) for resource '${r2}'.`,

"R2 should not be expirable as it's indefinite.",

);

  

// Try to expire r3 (not yet available and not expired)

await assertRejects(

() => timeBoundedResource.expireResource({ resource: r3 }),

Error,

`Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${r3}'.`, // Regex adjusted

"R3 should not be expirable yet.",

);

});

  

await t.step("Scenario Step 3: Update R1 to be expired and then successfully expire it", async () => {

// To simulate time passage for R1 to expire, we redefine R1 with `availableUntil` in the past.

const newPastUntilR1 = new Date(Date.now() - 100); // 100ms in the past

const newPastFromR1 = new Date(newPastUntilR1.getTime() - 1000); // 1 second before newPastUntilR1

await timeBoundedResource.defineTimeWindow({ resource: r1, availableFrom: newPastFromR1, availableUntil: newPastUntilR1 });

  

await timeBoundedResource.expireResource({ resource: r1 }); // Should now succeed

  

// Verify state of R1 is unchanged after expire (as per concept)

const r1Window = await timeBoundedResource.getTimeWindow({ resource: r1 });

assertNotEquals(r1Window, null);

assertEquals(r1Window?.availableFrom?.getTime(), newPastFromR1.getTime());

assertEquals(r1Window?.availableUntil?.getTime(), newPastUntilR1.getTime());

});

  

await t.step("Scenario Step 4: Update R2 to have an expiration (in the past), then expire it", async () => {

// Update r2 from indefinite to having an expiration in the past

const newPastUntilR2 = new Date(Date.now() - 50); // 50ms in the past

const newPastFromR2 = new Date(newPastUntilR2.getTime() - 1000); // 1 second before newPastUntilR2

await timeBoundedResource.defineTimeWindow({ resource: r2, availableFrom: newPastFromR2, availableUntil: newPastUntilR2 });

  

await timeBoundedResource.expireResource({ resource: r2 }); // Should now succeed

  

// Verify state of R2 is unchanged after expire

const r2Window = await timeBoundedResource.getTimeWindow({ resource: r2 });

assertNotEquals(r2Window, null);

assertEquals(r2Window?.availableFrom?.getTime(), newPastFromR2.getTime());

assertEquals(r2Window?.availableUntil?.getTime(), newPastUntilR2.getTime());

});

  

await t.step("Scenario Step 5: Check non-expired R3 state (should remain unchanged and unexpirable yet)", async () => {

// R3 should still not be expirable as its 'availableUntil' is in the future.

await assertRejects(

() => timeBoundedResource.expireResource({ resource: r3 }),

Error,

`Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${r3}'.`, // Regex adjusted

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

// reflecting the state of the last successful write. The "last" write is non-deterministic

// in a truly concurrent scenario, so we check if it's one of the possibilities.

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

// The final state can be either future1 or future2 due to concurrency.

assert(

finalWindow?.availableUntil?.getTime() === future1.getTime() ||

finalWindow?.availableUntil?.getTime() === future2.getTime(),

"The final state's availableUntil should be one of the concurrently set values (future1 or future2)."

);

});

  

await t.step("✅ Robustness: Repeated 'expireResource' calls on an expired resource", async () => {

// Ensure availableFrom is strictly earlier than availableUntil

const expiredEnd = new Date(Date.now() - 1000);

const expiredFrom = new Date(expiredEnd.getTime() - 1000);

await timeBoundedResource.defineTimeWindow({ resource: rB, availableFrom: expiredFrom, availableUntil: expiredEnd });

  

// Call expireResource multiple times (simulating retries or concurrent checks)

const results = await Promise.allSettled([

timeBoundedResource.expireResource({ resource: rB }),

timeBoundedResource.expireResource({ resource: rB }),

timeBoundedResource.expireResource({ resource: rB }),

]);

  

assertEquals(results.every(r => r.status === "fulfilled"), true, "All repeated expireResource calls should succeed.");

const window = await timeBoundedResource.getTimeWindow({ resource: rB });

assertNotEquals(window, null);

assertEquals(window?.availableFrom?.getTime(), expiredFrom.getTime(), "State should remain unchanged after multiple expirations.");

assertEquals(window?.availableUntil?.getTime(), expiredEnd.getTime(), "State should remain unchanged after multiple expirations.");

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

`Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource '${rC}'. Resource is not yet expired.`, // Regex adjusted

"Expiring prematurely should be rejected.",

);

  

// Verify state consistency: The window should still exist and be valid after rejected expire.

const window = await timeBoundedResource.getTimeWindow({ resource: rC });

assertNotEquals(window, null, "Document for rC should still exist and be valid.");

assertEquals(window?.availableFrom?.getTime() !== undefined, true, "availableFrom should be a date.");

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

console.log("\n=============================================================================");

console.log("🎉 TIME BOUNDED RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");

console.log("==============================================================================\n");

},

});
```

## Console output:

```
Task test deno test --allow-env --allow-net --allow-read --allow-sys=osRelease "src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts"
Check file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts
------- pre-test output -------
✅ Connected to MongoDB database: LendMIT-DB

===========================================
 ⏰ STARTING TESTS FOR TIME BOUNDED RESOURCE CONCEPT
===========================================

----- pre-test output end -----
running 6 tests from ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts
TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action ...
------- output -------

===========================================
🧪 TEST GROUP: DEFINE TIME WINDOW ACTIONS
===========================================

----- output end -----
  ✅ Happy path: Define with specific availableFrom and availableUntil ... ok (84ms)
  ✅ Happy path: Define with availableFrom (null -> now) and specific availableUntil ... ok (36ms)
  ✅ Happy path: Define with specific availableFrom and indefinite availableUntil (null) ... ok (35ms)
  ✅ Happy path: Define with both availableFrom and availableUntil as null (now & indefinite) ... ok (35ms)
  ✅ Requires violation: availableFrom must be strictly earlier than availableUntil ... ok (38ms)
  ✅ Edge case: Updating an existing time window (idempotency) ... ok (71ms)
  ✅ Edge case: Defining with empty string ResourceID ... ok (35ms)
------- output -------
✅ Finished DEFINE TIME WINDOW tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'defineTimeWindow' action ... ok (852ms)
TimeBoundedResource concept: Unit tests for 'getTimeWindow' action ...
------- output -------

===============================================
🧪 TEST GROUP: GET TIME WINDOW ACTIONS
===============================================

----- output end -----
  ✅ Happy path: Retrieve an existing time window ... ok (44ms)
  ✅ Negative path: Retrieve a non-existent time window ... ok (14ms)
  ✅ Edge case: Retrieve window with availableFrom as null (now) ... ok (29ms)
  ✅ Edge case: Retrieve window with availableUntil as null (indefinite) ... ok (31ms)
  ✅ Edge case: Retrieve window for empty string ResourceID ... ok (41ms)
------- output -------
✅ Finished GET TIME WINDOW tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'getTimeWindow' action ... ok (656ms)
TimeBoundedResource concept: Unit tests for 'expireResource' action ...
------- output -------

===============================================
🧪 TEST GROUP: EXPIRE RESOURCE ACTIONS
===============================================

----- output end -----
  ✅ Happy path: Resource is expired (availableUntil is in the past) ... ok (71ms)
  ✅ Happy path: Resource is expired (availableUntil is exactly current time) ... ok (44ms)
  ✅ Requires violation: No TimeWindow entry found for resource ... ok (15ms)
  ✅ Requires violation: availableUntil is null (indefinite) ... ok (52ms)
  ✅ Requires violation: Current time is earlier than availableUntil (not yet expired) ... FAILED (33ms)
  ✅ Edge case: Expiring with empty string ResourceID (not defined) ... ok (14ms)
  ✅ Edge case: Expiring with empty string ResourceID (defined and expired) ... ok (43ms)
------- output -------
✅ Finished EXPIRE RESOURCE tests

----- output end -----
TimeBoundedResource concept: Unit tests for 'expireResource' action ... FAILED (due to 1 failed step) (799ms)
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ...
------- output -------

===============================================
🧪 TEST GROUP: TRACE DEMONSTRATION
===============================================

----- output end -----
  Scenario Step 1: Define initial time windows ... ok (103ms)
  Scenario Step 2: Attempt to expire resources prematurely or incorrectly ... FAILED (14ms)
  Scenario Step 3: Update R1 to be expired and then successfully expire it ... ok (45ms)
  Scenario Step 4: Update R2 to have an expiration (in the past), then expire it ... ok (43ms)
  Scenario Step 5: Check non-expired R3 state (should remain unchanged and unexpirable yet) ... FAILED (14ms)
------- output -------
✅ Finished TRACE demonstration

----- output end -----
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ... FAILED (due to 2 failed steps) (652ms)
TimeBoundedResource concept: Robustness and concurrency-like tests ...
------- output -------

=================================================
🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY
=================================================

----- output end -----
  ✅ Robustness: Concurrent 'defineTimeWindow' calls for the same resource ... ok (210ms)
  ✅ Robustness: Repeated 'expireResource' calls on an expired resource ... ok (48ms)
  ✅ Robustness: Interleaving define and expire with invalid states ... FAILED (49ms)
------- output -------
✅ Finished ROBUSTNESS tests

----- output end -----
TimeBoundedResource concept: Robustness and concurrency-like tests ... FAILED (due to 1 failed step) (750ms)
✅ Final summary ...
------- output -------

====================================================================
🎉 TIME BOUNDED RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉
======================================================================

----- output end -----
✅ Final summary ... ok (0ms)

 ERRORS 

TimeBoundedResource concept: Unit tests for 'expireResource' action ... ✅ Requires violation: Current time is earlier than availableUntil (not yet expired) => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:312:13
error: AssertionError: Expected error message to include "Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource 'resourceC'. Resource is not yet expired.", but got "Validation Error: Current time (2025-10-19T04:31:59.445Z) is earlier than 'availableUntil' (2025-10-19T04:33:39.230Z) for resource 'resourceC'. Resource is not yet expired.": Should reject if resource is not yet expired.
    throw new AssertionError(msg);
          ^
    at assertIsError (https://jsr.io/@std/assert/1.0.15/is_error.ts:63:11)
    at assertRejects (https://jsr.io/@std/assert/1.0.15/rejects.ts:107:7)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:315:7
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async Object.outerWrapped [as fn] (ext:cli/40_test.js:124:14)
    at async TestContext.step (ext:cli/40_test.js:511:22)
    at async fn (file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:312:5)

TimeBoundedResource concept: Trace scenario (end-to-end behavior) ... Scenario Step 2: Attempt to expire resources prematurely or incorrectly => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:399:13
error: AssertionError: Expected error message to include "Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource 'traceResource1'.", but got "Validation Error: Current time (2025-10-19T04:32:00.055Z) is earlier than 'availableUntil' (2025-10-19T04:32:09.938Z) for resource 'traceResource1'. Resource is not yet expired.": R1 should not be expirable yet.
    throw new AssertionError(msg);
          ^
    at assertIsError (https://jsr.io/@std/assert/1.0.15/is_error.ts:63:11)
    at assertRejects (https://jsr.io/@std/assert/1.0.15/rejects.ts:107:7)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:401:7
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async Object.outerWrapped [as fn] (ext:cli/40_test.js:124:14)
    at async TestContext.step (ext:cli/40_test.js:511:22)
    at async fn (file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:399:5)

TimeBoundedResource concept: Trace scenario (end-to-end behavior) ... Scenario Step 5: Check non-expired R3 state (should remain unchanged and unexpirable yet) => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:455:13
error: AssertionError: Expected error message to include "Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource 'traceResource3'.", but got "Validation Error: Current time (2025-10-19T04:32:00.157Z) is earlier than 'availableUntil' (2025-10-19T04:32:59.938Z) for resource 'traceResource3'. Resource is not yet expired.": R3 should still not be expirable.
    throw new AssertionError(msg);
          ^
    at assertIsError (https://jsr.io/@std/assert/1.0.15/is_error.ts:63:11)
    at assertRejects (https://jsr.io/@std/assert/1.0.15/rejects.ts:107:7)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:457:7
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async Object.outerWrapped [as fn] (ext:cli/40_test.js:124:14)
    at async TestContext.step (ext:cli/40_test.js:511:22)
    at async fn (file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:455:5)

TimeBoundedResource concept: Robustness and concurrency-like tests ... ✅ Robustness: Interleaving define and expire with invalid states => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:546:13
error: AssertionError: Expected error message to include "Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(.*\\) for resource 'robustResourceC'. Resource is not yet expired.", but got "Validation Error: Current time (2025-10-19T04:32:00.906Z) is earlier than 'availableUntil' (2025-10-19T04:32:10.857Z) for resource 'robustResourceC'. Resource is not yet expired.": Expiring prematurely should be rejected.
    throw new AssertionError(msg);
          ^
    at assertIsError (https://jsr.io/@std/assert/1.0.15/is_error.ts:63:11)
    at assertRejects (https://jsr.io/@std/assert/1.0.15/rejects.ts:107:7)
    at eventLoopTick (ext:core/01_core.js:179:7)
    at async file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:563:7
    at async innerWrapped (ext:cli/40_test.js:181:5)
    at async exitSanitizer (ext:cli/40_test.js:97:27)
    at async Object.outerWrapped [as fn] (ext:cli/40_test.js:124:14)
    at async TestContext.step (ext:cli/40_test.js:511:22)
    at async fn (file:///Users/jennayuan/Desktop/MIT/6.1040/LendMIT/src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:546:5)

 FAILURES 

TimeBoundedResource concept: Unit tests for 'expireResource' action ... ✅ Requires violation: Current time is earlier than availableUntil (not yet expired) => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:312:13
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ... Scenario Step 2: Attempt to expire resources prematurely or incorrectly => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:399:13
TimeBoundedResource concept: Trace scenario (end-to-end behavior) ... Scenario Step 5: Check non-expired R3 state (should remain unchanged and unexpirable yet) => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:455:13
TimeBoundedResource concept: Robustness and concurrency-like tests ... ✅ Robustness: Interleaving define and expire with invalid states => ./src/concepts/TimeBoundedResource/TimeBoundedResource.test.ts:546:13

FAILED | 3 passed (23 steps) | 3 failed (4 steps) (3s)

error: Test failed
```
