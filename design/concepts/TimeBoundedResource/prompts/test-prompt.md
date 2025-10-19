# Task: Use the following test guide and implementation of a concept to implement a comprehensive yet concise Deno test file for the given concept implementation.

# Requirements:
- The test file should be named src/concepts/{ConceptName}.test.ts (for example, src/concepts/Following.test.ts).
- Use the Deno testing framework and import:
  import { assertEquals, assertRejects } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
- Each test should:
  1. Initialize a clean database using: const [db, client] = await testDb();
  2. Create a new instance of the concept class using that db.
  3. Close the client with await client.close(); at the end of each test.

# What to Include:
1. Unit tests for every action.
   - Happy-path tests: confirm that actions work correctly when all requires are met.
   - Requires violation tests: confirm that appropriate errors are thrown when preconditions are not met.
   - Edge case tests: explore boundaries of valid inputs (e.g., empty strings, same IDs, missing optional fields, invalid JSON, etc.).
   - Idempotency checks: ensure repeated valid actions behave consistently.
   - State verification: confirm the MongoDB collection reflects correct changes after each operation.

2. Trace test (Principle verification).
   - Write one “trace” test that simulates a realistic multi-step interaction showing how the actions collectively fulfill the concept’s principle.

3. Robustness tests.
   - Add cases for edge cases, unexpected sequences, or concurrency-like scenarios.
   - Validate cleanup and data consistency after failed operations.

# Output:
- Produce one complete .ts test file for the concept (e.g., src/concepts/concept.test.ts).

# Example structure:
```
// src/concepts/Following/Following.test.ts

  

// deno-lint-ignore no-import-prefix

import { assertEquals, assertRejects } from "jsr:@std/assert";

import { testDb } from "@utils/database.ts";

import { Following } from "./Following.ts";

import { Collection } from "mongodb";

import { ID } from "@utils/types.ts";

  

// ----------------------------------------------------------------------

// Global Test Constants

// ----------------------------------------------------------------------

const userA = "userA" as ID;

const userB = "userB" as ID;

const userC = "userC" as ID;

const userD = "userD" as ID;

const nonExistentUser = "nonExistentUser" as ID;

  

console.log("\n===========================================");

console.log(" ⏰ STARTING TESTS FOR FOLLOWING CONCEPT");

console.log("===========================================\n");

  

// ----------------------------------------------------------------------

// FOLLOW ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'follow' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===========================================");

console.log("🧪 TEST GROUP: FOLLOW ACTIONS");

console.log("===========================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

const coll: Collection = db.collection("followrelationships");

await coll.deleteMany({}); // reset DB

  

await t.step("✅ Happy path: A user follows another user", async () => {

await following.follow(userA, userB);

  

const { isFollowing } = await following.isFollowing(userA, userB);

assertEquals(isFollowing, true);

  

const { followeeIDs } = await following.getFollowees(userA);

assertEquals(followeeIDs.includes(userB), true);

  

const { followerIDs } = await following.getFollowers(userB);

assertEquals(followerIDs.includes(userA), true);

  

const dbEntry = await coll.findOne({ follower: userA, followee: userB });

assertEquals(dbEntry?.follower, userA);

assertEquals(dbEntry?.followee, userB);

});

  

await t.step("✅ Requires violation: Cannot follow yourself", async () => {

await assertRejects(() => following.follow(userA, userA), Error, "Cannot follow yourself.");

});

  

await t.step("✅ Requires violation: Cannot follow someone already followed", async () => {

await following.follow(userA, userC);

await assertRejects(

() => following.follow(userA, userC),

Error,

`Follower '${userA}' is already following followee '${userC}'.`,

);

  

const count = await coll.countDocuments({ follower: userA, followee: userC });

assertEquals(count, 1);

});

  

await t.step("✅ Edge case: Following with empty string IDs", async () => {

const emptyID = "" as ID;

await following.follow(emptyID, userD);

const { isFollowing } = await following.isFollowing(emptyID, userD);

assertEquals(isFollowing, true);

  

await following.follow(userD, emptyID);

const { isFollowing: isFollowingEmptyFollowee } = await following.isFollowing(userD, emptyID);

assertEquals(isFollowingEmptyFollowee, true);

});

  

await client.close();

console.log("✅ Finished FOLLOW tests\n");

},

});

  

// ----------------------------------------------------------------------

// UNFOLLOW ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'unfollow' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n=============================================");

console.log("🧪 TEST GROUP: UNFOLLOW ACTIONS");

console.log("=============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

const coll: Collection = db.collection("followrelationships");

await coll.deleteMany({}); // reset DB

  

await t.step("✅ Happy path: A user unfollows another user", async () => {

await following.follow(userA, userB);

await following.unfollow(userA, userB);

  

const { isFollowing } = await following.isFollowing(userA, userB);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Requires violation: Cannot unfollow someone not followed", async () => {

await assertRejects(

() => following.unfollow(userA, userC),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${userC}'.`,

);

});

  

await t.step("✅ Edge case: Unfollowing non-existent relationships (idempotency)", async () => {

await assertRejects(

() => following.unfollow(userA, userB),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${userB}'.`,

);

});

  

await t.step("✅ Robustness: Unfollowing with non-existent IDs", async () => {

await assertRejects(

() => following.unfollow(nonExistentUser, userA),

Error,

`No existing follow relationship found between follower '${nonExistentUser}' and followee '${userA}'.`,

);

  

await assertRejects(

() => following.unfollow(userA, nonExistentUser),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${nonExistentUser}'.`,

);

});

  

await client.close();

console.log("✅ Finished UNFOLLOW tests\n");

},

});

  

// ----------------------------------------------------------------------

// IS FOLLOWING ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'isFollowing' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: IS FOLLOWING CHECKS");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

await t.step("✅ Happy path", async () => {

await following.follow(userA, userB);

const { isFollowing } = await following.isFollowing(userA, userB);

assertEquals(isFollowing, true);

});

  

await t.step("✅ Negative path: Non-existent relationship", async () => {

const { isFollowing } = await following.isFollowing(userA, userC);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Edge case: False after unfollowing", async () => {

await following.follow(userA, userD);

await following.unfollow(userA, userD);

const { isFollowing } = await following.isFollowing(userA, userD);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Edge case: Self-follow should be false", async () => {

const { isFollowing } = await following.isFollowing(userA, userA);

assertEquals(isFollowing, false);

});

  

await t.step("✅ Edge case: Non-existent users", async () => {

const { isFollowing: nonExistFollower } = await following.isFollowing(nonExistentUser, userB);

assertEquals(nonExistFollower, false);

  

const { isFollowing: nonExistFollowee } = await following.isFollowing(userA, nonExistentUser);

assertEquals(nonExistFollowee, false);

});

  

await client.close();

console.log("✅ Finished ISFOLLOWING tests\n");

},

});

  

// ----------------------------------------------------------------------

// GET FOLLOWEES ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'getFollowees' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: GET FOLLOWEES ACTIONS");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

await t.step("✅ Happy path: Multiple followees", async () => {

await following.follow(userA, userB);

await following.follow(userA, userC);

  

const { followeeIDs } = await following.getFollowees(userA);

assertEquals(followeeIDs.sort(), [userB, userC].sort());

});

  

await t.step("✅ Edge case: User with no followees", async () => {

const { followeeIDs } = await following.getFollowees(userD);

assertEquals(followeeIDs, []);

});

  

await t.step("✅ Edge case: Non-existent user", async () => {

const { followeeIDs } = await following.getFollowees(nonExistentUser);

assertEquals(followeeIDs, []);

});

  

await t.step("✅ State update after unfollowing", async () => {

await following.follow(userB, userA);

await following.follow(userB, userC);

await following.unfollow(userB, userA);

  

const { followeeIDs } = await following.getFollowees(userB);

assertEquals(followeeIDs, [userC]);

});

  

await client.close();

console.log("✅ Finished GETFOLLOWEES tests\n");

},

});

  

// ----------------------------------------------------------------------

// GET FOLLOWERS ACTION TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Unit tests for 'getFollowers' action",

sanitizeOps: false,

sanitizeResources: false,

async fn(t) {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: GET FOLLOWERS ACTIONS");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

await t.step("✅ Happy path: Multiple followers", async () => {

await following.follow(userA, userC);

await following.follow(userB, userC);

  

const { followerIDs } = await following.getFollowers(userC);

assertEquals(followerIDs.sort(), [userA, userB].sort());

});

  

await t.step("✅ Edge case: User with no followers", async () => {

const { followerIDs } = await following.getFollowers(userD);

assertEquals(followerIDs, []);

});

  

await t.step("✅ Edge case: Non-existent user", async () => {

const { followerIDs } = await following.getFollowers(nonExistentUser);

assertEquals(followerIDs, []);

});

  

await t.step("✅ State update after unfollowing", async () => {

await following.follow(userA, userD);

await following.follow(userB, userD);

await following.unfollow(userA, userD);

  

const { followerIDs } = await following.getFollowers(userD);

assertEquals(followerIDs, [userB]);

});

  

await client.close();

console.log("✅ Finished GETFOLLOWERS tests\n");

},

});

  

// ----------------------------------------------------------------------

// TRACE / FULL BEHAVIOR TEST

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Trace scenario (end-to-end behavior)",

sanitizeOps: false,

sanitizeResources: false,

async fn() {

console.log("\n===============================================");

console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");

console.log("===============================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

await db.collection("followrelationships").deleteMany({}); // reset DB

  

assertEquals((await following.getFollowees(userA)).followeeIDs, []);

assertEquals((await following.getFollowers(userB)).followerIDs, []);

  

await following.follow(userA, userB);

await following.follow(userA, userC);

await following.follow(userD, userB);

  

assertEquals((await following.getFollowees(userA)).followeeIDs.sort(), [userB, userC].sort());

assertEquals((await following.getFollowers(userB)).followerIDs.sort(), [userA, userD].sort());

  

await following.unfollow(userA, userB);

await following.unfollow(userD, userB);

  

assertEquals((await following.getFollowers(userB)).followerIDs, []);

assertEquals((await following.getFollowees(userA)).followeeIDs, [userC]);

  

await client.close();

console.log("✅ Finished TRACE demonstration\n");

},

});

  

// ----------------------------------------------------------------------

// ROBUSTNESS / CONCURRENCY TESTS

// ----------------------------------------------------------------------

Deno.test({

name: "Following concept: Robustness and concurrency tests",

sanitizeOps: false,

sanitizeResources: false,

async fn() {

console.log("\n=================================================");

console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");

console.log("=================================================\n");

  

const [db, client] = await testDb();

const following = new Following(db);

const coll: Collection = db.collection("followrelationships");

await coll.deleteMany({}); // reset DB

  

const results = await Promise.allSettled([

following.follow(userA, userB),

following.follow(userA, userB),

]);

const fulfilledCount = results.filter(r => r.status === "fulfilled").length;

const rejectedCount = results.filter(r => r.status === "rejected").length;

assertEquals(fulfilledCount, 1);

assertEquals(rejectedCount, 1);

  

const count = await coll.countDocuments({ follower: userA, followee: userB });

assertEquals(count, 1);

  

await coll.deleteMany({}); // reset db before next scenario

  

await following.follow(userA, userC);

await following.follow(userB, userD);

await following.follow(userC, userA);

  

await assertRejects(

() => following.follow(userA, userC),

Error,

`Follower '${userA}' is already following followee '${userC}'.`,

);

await assertRejects(

() => following.unfollow(userA, userD),

Error,

`No existing follow relationship found between follower '${userA}' and followee '${userD}'.`,

);

  

assertEquals((await following.getFollowees(userA)).followeeIDs, [userC]);

assertEquals((await following.getFollowers(userD)).followerIDs, [userB]);

assertEquals((await following.getFollowees(userB)).followeeIDs, [userD]);

  

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

console.log("🎉 FOLLOWING CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");

console.log("======================================================================\n");

},

});
```

## Guide for testing concepts:
[@testing-concepts](../../../background/testing-concepts.md)

## Concept to write tests for:
[@TimeBoundedResource](../TimeBoundedResource.md)

## Implementation of concept to write tests for:
```
// src/concepts/TimeBoundedResource.ts

  

import { Collection, Db } from "mongodb";

import { db } from "@/db/connection.ts";

import { ID, Empty } from "@utils/types.ts";

  

// MongoDB collection name for this concept

const COLLECTION_NAME = "timeBoundedResources";

  

// Type alias for ResourceID, based on the generic ID type

type ResourceID = ID;

  

/**

* @concept TimeBoundedResource

* @purpose Manage time-based availability and expiration windows for any generic resource.

* @principle This concept defines and tracks availability windows for resources with

* optional start and end times, corresponding to starting now and available

* indefinitely respectively. It can report a resource's current window and

* signals when a resource's availability has ended.

*

* @state

* A set of `TimeWindow` entries, each consisting of:

* `resource`: ResourceID

* `availableFrom`: DateTime? (null implies available starting now)

* `availableUntil`: DateTime? (null implies indefinitely available into the future)

*/

interface TimeWindow {

_id: ResourceID; // The resource ID serves as the primary key for the time window document

resource: ResourceID; // Explicitly store resource ID as per state description

availableFrom: Date | null;

availableUntil: Date | null;

}

  

export class TimeBoundedResource {

private collection: Collection<TimeWindow>;

  

constructor(private readonly db: Db) {

this.collection = this.db.collection<TimeWindow>(COLLECTION_NAME);

}

  

/**

* Defines or updates a time window for a given resource.

*

* @action defineTimeWindow

* @param {object} params - The parameters for defining the time window.

* @param {ResourceID} params.resource - The ID of the resource.

* @param {Date | null} params.availableFrom - The start date/time for availability.

* If null, the resource is available starting now.

* @param {Date | null} params.availableUntil - The end date/time for availability.

* If null, the resource is available indefinitely.

* @returns {Promise<Empty>} An empty object indicating success.

*

* @requires If both `availableFrom` and `availableUntil` are provided (non-null),

* then `availableFrom` must be strictly earlier than `availableUntil`.

*

* @effects Creates a new `TimeWindow` entry for the given `resource` or updates an existing one

* with the specified availability bounds. If `availableFrom` is not provided (null),

* then it's set to the current time. If `availableUntil` is not provided (null),

* then it's stored as null to indicate indefinite availability.

*/

async defineTimeWindow(

{ resource, availableFrom, availableUntil }: {

resource: ResourceID;

availableFrom: Date | null;

availableUntil: Date | null;

},

): Promise<Empty> {

// Requires: If both availableFrom and availableUntil are provided (non-null),

// then availableFrom must be strictly earlier than availableUntil.

if (availableFrom instanceof Date && availableUntil instanceof Date) {

if (availableFrom.getTime() >= availableUntil.getTime()) {

throw new Error(

"Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",

);

}

}

  

const now = new Date();

// If availableFrom is null in the input, it means "starting now". Store the actual current time.

const finalAvailableFrom = availableFrom === null ? now : availableFrom;

// If availableUntil is null in the input, it means "indefinitely". Store null.

const finalAvailableUntil = availableUntil;

  

const filter = { _id: resource };

const update = {

$set: {

resource: resource,

availableFrom: finalAvailableFrom,

availableUntil: finalAvailableUntil,

},

};

const options = { upsert: true }; // Create a new document if one does not exist

  

await this.collection.updateOne(filter, update, options);

  

return {};

}

  

/**

* Retrieves the time window for a specified resource.

*

* @action getTimeWindow

* @param {object} params - The parameters for getting the time window.

* @param {ResourceID} params.resource - The ID of the resource.

* @returns {Promise<TimeWindow | null>} The `TimeWindow` entry for the resource,

* or `null` if no time window is defined for it.

*

* @effects Returns the `TimeWindow` entry for the specified `resource`, containing its

* `resource` ID, `availableFrom`, and `availableUntil` times.

* Returns `null` if no time window is defined for the resource.

*/

async getTimeWindow(

{ resource }: { resource: ResourceID },

): Promise<TimeWindow | null> {

// MongoDB returns Date objects directly from the BSON Date type, which fits the `Date | null` interface.

// The `_id` will also be present in the returned document, conforming to the `TimeWindow` interface.

const timeWindow = await this.collection.findOne({ _id: resource });

return timeWindow;

}

  

/**

* Signals that a resource's time-bound availability has ended. This action serves

* as an event notification and does not alter the state within this concept.

*

* @action expireResource

* @param {object} params - The parameters for expiring the resource.

* @param {ResourceID} params.resource - The ID of the resource.

* @returns {Promise<Empty>} An empty object indicating the successful signaling of expiration.

*

* @requires A `TimeWindow` entry must exist for the specified `resource`.

* @requires The `availableUntil` for that `resource` must be defined (non-null).

* @requires The `currentTime` (the moment this action is triggered) must be greater than

* or equal to the `availableUntil` value for the `resource`.

*

* @effects This action explicitly changes no state within this concept. Its occurrence

* signals to other concepts (via synchronization) that the resource's time-bound

* availability (as defined by its `availableUntil` property) has ended.

*/

async expireResource({ resource }: { resource: ResourceID }): Promise<Empty> {

const timeWindow = await this.collection.findOne({ _id: resource });

const currentTime = new Date();

  

// Requires: A TimeWindow entry exists for resource.

if (!timeWindow) {

throw new Error(

`Validation Error: No TimeWindow entry found for resource '${resource}'.`,

);

}

  

// Requires: The availableUntil for that resource is defined (non-null).

if (timeWindow.availableUntil === null) {

throw new Error(

`Validation Error: 'availableUntil' is not defined (null) for resource '${resource}'. ` +

"Cannot expire an indefinitely available resource through this action.",

);

}

  

// Requires: The currentTime is greater than or equal to the availableUntil value.

if (currentTime.getTime() < timeWindow.availableUntil.getTime()) {

throw new Error(

`Validation Error: Current time (${currentTime.toISOString()}) is earlier than ` +

`'availableUntil' (${timeWindow.availableUntil.toISOString()}) for resource '${resource}'. ` +

"Resource is not yet expired.",

);

}

  

// Effects: This action explicitly changes no state within this concept.

// Its sole purpose is to serve as an event notification.

  

return {};

}

}

  

// Export an instantiated class

export const timeBoundedResource = new TimeBoundedResource(db);
```

## utils/types.ts:
```
declare const Brand: unique symbol;

  

/**

* Generic ID: effectively a string,

* but uses type branding.

*/

export type ID = string & { [Brand]: true };

  

/**

* Empty record type: enforces no entries.

*/

export type Empty = Record<PropertyKey, never>;
```


# response:

```typescript
// src/concepts/TimeBoundedResource.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { TimeBoundedResource } from "./TimeBoundedResource.ts";
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const resourceA = "resourceA" as ID;
const resourceB = "resourceB" as ID;
const resourceC = "resourceC" as ID;
const nonExistentResource = "nonExistentResource" as ID;
const emptyResourceID = "" as ID; // Edge case for empty string ID

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR TIMEBOUNDEDRESOURCE CONCEPT");
console.log("===========================================\n");

// Helper function to get current time plus/minus milliseconds
const addMs = (date: Date, ms: number) => new Date(date.getTime() + ms);

// Helper function to create a date in the past
const createPastDate = (offsetMs: number) => new Date(Date.now() - offsetMs);

// Helper function to create a date in the future
const createFutureDate = (offsetMs: number) => new Date(Date.now() + offsetMs);

// Define a common collection type for clarity, matching the internal TimeWindow interface
interface TimeWindowDoc {
  _id: ID;
  resource: ID;
  availableFrom: Date | null;
  availableUntil: Date | null;
}

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
    const coll: Collection<TimeWindowDoc> = db.collection("timeBoundedResources");
    await coll.deleteMany({}); // Ensure clean state for this test block

    await t.step("✅ Happy path: Define window with both availableFrom and availableUntil", async () => {
      const availableFrom = createPastDate(10000); // 10 seconds ago
      const availableUntil = createFutureDate(10000); // 10 seconds from now

      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom, availableUntil });

      const storedWindow = await coll.findOne({ _id: resourceA });
      assertEquals(storedWindow?.resource, resourceA);
      assertEquals(storedWindow?.availableFrom?.getTime(), availableFrom.getTime());
      assertEquals(storedWindow?.availableUntil?.getTime(), availableUntil.getTime());

      const retrievedWindow = await timeBoundedResource.getTimeWindow({ resource: resourceA });
      assertEquals(retrievedWindow?.availableFrom?.getTime(), availableFrom.getTime());
      assertEquals(retrievedWindow?.availableUntil?.getTime(), availableUntil.getTime());
    });

    await t.step("✅ Happy path: Define window with null availableFrom (should default to now)", async () => {
      const availableUntil = createFutureDate(10000);
      const startTime = new Date(); // Capture approximate start time

      await timeBoundedResource.defineTimeWindow({ resource: resourceB, availableFrom: null, availableUntil });

      const storedWindow = await coll.findOne({ _id: resourceB });
      assertEquals(storedWindow?.resource, resourceB);
      // availableFrom should be close to startTime
      assertEquals(storedWindow?.availableFrom instanceof Date, true);
      assertEquals(storedWindow?.availableFrom!.getTime() >= startTime.getTime() - 1000, true); // Allow 1 sec variance
      assertEquals(storedWindow?.availableFrom!.getTime() <= new Date().getTime() + 1000, true); // Allow 1 sec variance
      assertEquals(storedWindow?.availableUntil?.getTime(), availableUntil.getTime());
    });

    await t.step("✅ Happy path: Define window with null availableUntil (should be indefinite)", async () => {
      const availableFrom = createPastDate(5000);

      await timeBoundedResource.defineTimeWindow({ resource: resourceC, availableFrom, availableUntil: null });

      const storedWindow = await coll.findOne({ _id: resourceC });
      assertEquals(storedWindow?.resource, resourceC);
      assertEquals(storedWindow?.availableFrom?.getTime(), availableFrom.getTime());
      assertEquals(storedWindow?.availableUntil, null);
    });

    await t.step("✅ Happy path: Define window with both availableFrom and availableUntil as null", async () => {
      const startTime = new Date(); // Capture approximate start time
      await timeBoundedResource.defineTimeWindow({ resource: "resourceD" as ID, availableFrom: null, availableUntil: null });

      const storedWindow = await coll.findOne({ _id: "resourceD" as ID });
      assertEquals(storedWindow?.resource, "resourceD" as ID);
      assertEquals(storedWindow?.availableFrom instanceof Date, true);
      assertEquals(storedWindow?.availableFrom!.getTime() >= startTime.getTime() - 1000, true); // Allow 1 sec variance
      assertEquals(storedWindow?.availableFrom!.getTime() <= new Date().getTime() + 1000, true); // Allow 1 sec variance
      assertEquals(storedWindow?.availableUntil, null);
    });

    await t.step("✅ Requires violation: availableFrom is equal to availableUntil", async () => {
      const commonTime = new Date();
      await assertRejects(
        () => timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: commonTime, availableUntil: commonTime }),
        Error,
        "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
      );
    });

    await t.step("✅ Requires violation: availableFrom is after availableUntil", async () => {
      const availableFrom = createFutureDate(10000);
      const availableUntil = createPastDate(10000);
      await assertRejects(
        () => timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom, availableUntil }),
        Error,
        "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
      );
    });

    await t.step("✅ Edge case: Updating an existing time window", async () => {
      const originalFrom = createPastDate(20000);
      const originalUntil = createFutureDate(20000);
      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: originalFrom, availableUntil: originalUntil });

      const newFrom = createPastDate(5000);
      const newUntil = createFutureDate(5000);
      await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: newFrom, availableUntil: newUntil });

      const storedWindow = await coll.findOne({ _id: resourceA });
      assertEquals(storedWindow?.availableFrom?.getTime(), newFrom.getTime());
      assertEquals(storedWindow?.availableUntil?.getTime(), newUntil.getTime());
    });

    await t.step("✅ Edge case: Defining a window with empty string ID", async () => {
      const availableFrom = createPastDate(1000);
      const availableUntil = createFutureDate(1000);
      await timeBoundedResource.defineTimeWindow({ resource: emptyResourceID, availableFrom, availableUntil });

      const storedWindow = await coll.findOne({ _id: emptyResourceID });
      assertEquals(storedWindow?.resource, emptyResourceID);
      assertEquals(storedWindow?.availableFrom?.getTime(), availableFrom.getTime());
      assertEquals(storedWindow?.availableUntil?.getTime(), availableUntil.getTime());
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
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: GET TIME WINDOW ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection("timeBoundedResources");
    await coll.deleteMany({}); // Ensure clean state for this test block

    const availableFrom = createPastDate(10000);
    const availableUntil = createFutureDate(10000);
    await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom, availableUntil });
    await timeBoundedResource.defineTimeWindow({ resource: resourceB, availableFrom: null, availableUntil: null }); // default to now, indefinite

    await t.step("✅ Happy path: Retrieve an existing time window (full dates)", async () => {
      const window = await timeBoundedResource.getTimeWindow({ resource: resourceA });
      assertEquals(window?.resource, resourceA);
      assertEquals(window?.availableFrom?.getTime(), availableFrom.getTime());
      assertEquals(window?.availableUntil?.getTime(), availableUntil.getTime());
    });

    await t.step("✅ Happy path: Retrieve an existing time window (null dates)", async () => {
      const window = await timeBoundedResource.getTimeWindow({ resource: resourceB });
      assertEquals(window?.resource, resourceB);
      assertEquals(window?.availableFrom instanceof Date, true); // Should have defaulted to now
      assertEquals(window?.availableUntil, null); // Should be null
    });

    await t.step("✅ Negative path: Retrieve a non-existent time window", async () => {
      const window = await timeBoundedResource.getTimeWindow({ resource: nonExistentResource });
      assertEquals(window, null);
    });

    await t.step("✅ Edge case: Retrieve window for empty string ID", async () => {
      const emptyIDAvailableFrom = createPastDate(5000);
      const emptyIDAvailableUntil = createFutureDate(5000);
      await timeBoundedResource.defineTimeWindow({ resource: emptyResourceID, availableFrom: emptyIDAvailableFrom, availableUntil: emptyIDAvailableUntil });

      const window = await timeBoundedResource.getTimeWindow({ resource: emptyResourceID });
      assertEquals(window?.resource, emptyResourceID);
      assertEquals(window?.availableFrom?.getTime(), emptyIDAvailableFrom.getTime());
      assertEquals(window?.availableUntil?.getTime(), emptyIDAvailableUntil.getTime());
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
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: EXPIRE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection("timeBoundedResources");
    await coll.deleteMany({}); // Ensure clean state for this test block

    // Setup a resource that is already expired
    const expiredFrom = createPastDate(20000);
    const expiredUntil = createPastDate(10000);
    await timeBoundedResource.defineTimeWindow({ resource: resourceA, availableFrom: expiredFrom, availableUntil: expiredUntil });

    await t.step("✅ Happy path: Expire an already expired resource", async () => {
      await timeBoundedResource.expireResource({ resource: resourceA });
      // The action should complete without error
      const storedWindow = await coll.findOne({ _id: resourceA });
      assertEquals(storedWindow?.availableFrom?.getTime(), expiredFrom.getTime());
      assertEquals(storedWindow?.availableUntil?.getTime(), expiredUntil.getTime());
    });

    await t.step("✅ Happy path: Expire resource exactly at availableUntil time", async () => {
      const now = new Date();
      await timeBoundedResource.defineTimeWindow({ resource: resourceB, availableFrom: addMs(now, -1000), availableUntil: now });
      await timeBoundedResource.expireResource({ resource: resourceB });
      // Should pass without error
    });

    await t.step("✅ Requires violation: No TimeWindow entry found", async () => {
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: nonExistentResource }),
        Error,
        `Validation Error: No TimeWindow entry found for resource '${nonExistentResource}'.`,
      );
    });

    await t.step("✅ Requires violation: availableUntil is null (indefinite)", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: resourceC, availableFrom: createPastDate(1000), availableUntil: null });
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: resourceC }),
        Error,
        `Validation Error: 'availableUntil' is not defined (null) for resource '${resourceC}'. Cannot expire an indefinitely available resource through this action.`,
      );
    });

    await t.step("✅ Requires violation: Current time is earlier than availableUntil", async () => {
      const futureUntil = createFutureDate(10000);
      await timeBoundedResource.defineTimeWindow({ resource: "resourceD" as ID, availableFrom: createPastDate(1000), availableUntil: futureUntil });
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: "resourceD" as ID }),
        Error,
        new RegExp(`Validation Error: Current time \\(.*\\) is earlier than 'availableUntil' \\(${futureUntil.toISOString()}\\) for resource 'resourceD'. Resource is not yet expired.`),
      );
    });

    await t.step("✅ Edge case: Expiring with empty string ID (if window exists)", async () => {
      const expiredFromEmpty = createPastDate(20000);
      const expiredUntilEmpty = createPastDate(10000);
      await timeBoundedResource.defineTimeWindow({ resource: emptyResourceID, availableFrom: expiredFromEmpty, availableUntil: expiredUntilEmpty });

      await timeBoundedResource.expireResource({ resource: emptyResourceID });
      // Should pass without error
    });

    await t.step("✅ State verification: expireResource does not modify the stored window", async () => {
      const originalFrom = createPastDate(20000);
      const originalUntil = createPastDate(10000);
      await timeBoundedResource.defineTimeWindow({ resource: "resourceE" as ID, availableFrom: originalFrom, availableUntil: originalUntil });

      const beforeExpiration = await coll.findOne({ _id: "resourceE" as ID });
      await timeBoundedResource.expireResource({ resource: "resourceE" as ID });
      const afterExpiration = await coll.findOne({ _id: "resourceE" as ID });

      assertEquals(beforeExpiration?.availableFrom?.getTime(), afterExpiration?.availableFrom?.getTime());
      assertEquals(beforeExpiration?.availableUntil?.getTime(), afterExpiration?.availableUntil?.getTime());
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
    const coll: Collection<TimeWindowDoc> = db.collection("timeBoundedResources");
    await coll.deleteMany({}); // Ensure clean state for this test block

    const testResource = "traceResource" as ID;
    const past = new Date(Date.now() - 60000); // 1 minute ago
    const future = new Date(Date.now() + 60000); // 1 minute from now

    await t.step("1. Initially, no time window exists for the resource", async () => {
      const initialWindow = await timeBoundedResource.getTimeWindow({ resource: testResource });
      assertEquals(initialWindow, null);
    });

    await t.step("2. Define a time window for the resource with future expiration", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: testResource, availableFrom: past, availableUntil: future });
      const definedWindow = await timeBoundedResource.getTimeWindow({ resource: testResource });
      assertEquals(definedWindow?.resource, testResource);
      assertEquals(definedWindow?.availableFrom?.getTime(), past.getTime());
      assertEquals(definedWindow?.availableUntil?.getTime(), future.getTime());
    });

    await t.step("3. Attempt to expire the resource before its availableUntil time (should fail)", async () => {
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: testResource }),
        Error,
        new RegExp(`Current time \\(.*\\) is earlier than 'availableUntil' \\(${future.toISOString()}\\) for resource '${testResource}'. Resource is not yet expired.`),
      );
      // Verify state hasn't changed
      const windowAfterFailedExpire = await timeBoundedResource.getTimeWindow({ resource: testResource });
      assertEquals(windowAfterFailedExpire?.availableFrom?.getTime(), past.getTime());
      assertEquals(windowAfterFailedExpire?.availableUntil?.getTime(), future.getTime());
    });

    await t.step("4. Update the time window to an already expired state", async () => {
      const newPast = new Date(Date.now() - 120000); // 2 minutes ago
      const newExpiredUntil = new Date(Date.now() - 30000); // 30 seconds ago
      await timeBoundedResource.defineTimeWindow({ resource: testResource, availableFrom: newPast, availableUntil: newExpiredUntil });
      const updatedWindow = await timeBoundedResource.getTimeWindow({ resource: testResource });
      assertEquals(updatedWindow?.availableFrom?.getTime(), newPast.getTime());
      assertEquals(updatedWindow?.availableUntil?.getTime(), newExpiredUntil.getTime());
    });

    await t.step("5. Now, successfully expire the resource (as it's past its new availableUntil)", async () => {
      await timeBoundedResource.expireResource({ resource: testResource });
      // No error expected
      // Verify state still unchanged after successful expire (as per concept)
      const windowAfterSuccessfulExpire = await timeBoundedResource.getTimeWindow({ resource: testResource });
      const newPast = new Date(Date.now() - 120000);
      const newExpiredUntil = new Date(Date.now() - 30000);
      assertEquals(windowAfterSuccessfulExpire?.availableFrom?.getTime(), newPast.getTime());
      assertEquals(windowAfterSuccessfulExpire?.availableUntil?.getTime(), newExpiredUntil.getTime());
    });

    await t.step("6. Define a window with indefinite availability and try to expire (should fail)", async () => {
      await timeBoundedResource.defineTimeWindow({ resource: testResource, availableFrom: past, availableUntil: null });
      const indefiniteWindow = await timeBoundedResource.getTimeWindow({ resource: testResource });
      assertEquals(indefiniteWindow?.availableFrom?.getTime(), past.getTime());
      assertEquals(indefiniteWindow?.availableUntil, null);

      await assertRejects(
        () => timeBoundedResource.expireResource({ resource: testResource }),
        Error,
        `Validation Error: 'availableUntil' is not defined (null) for resource '${testResource}'. Cannot expire an indefinitely available resource through this action.`,
      );
    });

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "TimeBoundedResource concept: Robustness tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const timeBoundedResource = new TimeBoundedResource(db);
    const coll: Collection<TimeWindowDoc> = db.collection("timeBoundedResources");
    await coll.deleteMany({}); // Ensure clean state for this test block

    await t.step("✅ Robustness: Concurrent 'defineTimeWindow' calls for the same resource", async () => {
      const now = new Date();
      const availableFrom1 = addMs(now, -1000);
      const availableUntil1 = addMs(now, 10000); // 10s from now

      const availableFrom2 = addMs(now, -2000);
      const availableUntil2 = addMs(now, 20000); // 20s from now

      const resource = "concurrentResource" as ID;

      // Both calls will attempt to define/update the same resource.
      // Due to upsert:true, only one document will exist, its state determined by the last successful write.
      // This test specifically checks that it doesn't error out, but converges to a single state.
      await Promise.allSettled([
        timeBoundedResource.defineTimeWindow({ resource, availableFrom: availableFrom1, availableUntil: availableUntil1 }),
        timeBoundedResource.defineTimeWindow({ resource, availableFrom: availableFrom2, availableUntil: availableUntil2 }),
        timeBoundedResource.defineTimeWindow({ resource, availableFrom: availableFrom1, availableUntil: availableUntil1 }), // Another identical one
      ]);

      const count = await coll.countDocuments({ _id: resource });
      assertEquals(count, 1, "Should only have one document for the resource due to upsert");

      const storedWindow = await coll.findOne({ _id: resource });
      // The final state will be one of the provided definitions, depending on execution order.
      assertEquals(storedWindow?.resource, resource);
      // Check that it's one of the valid states (either the first or second set of dates)
      const isState1 = storedWindow?.availableFrom?.getTime() === availableFrom1.getTime() && storedWindow?.availableUntil?.getTime() === availableUntil1.getTime();
      const isState2 = storedWindow?.availableFrom?.getTime() === availableFrom2.getTime() && storedWindow?.availableUntil?.getTime() === availableUntil2.getTime();
      assertEquals(isState1 || isState2, true, "Final state should match one of the concurrent updates");
    });

    await t.step("✅ Robustness: Sequence of define -> expire (fail) -> define -> expire (success)", async () => {
      const resource = "sequentialResource" as ID;
      const now = new Date();
      const future1 = addMs(now, 5000); // 5 seconds from now
      const past = addMs(now, -5000); // 5 seconds ago

      // 1. Define with future expiration
      await timeBoundedResource.defineTimeWindow({ resource, availableFrom: past, availableUntil: future1 });
      let window = await timeBoundedResource.getTimeWindow({ resource });
      assertEquals(window?.availableUntil?.getTime(), future1.getTime());

      // 2. Attempt to expire (should fail)
      await assertRejects(
        () => timeBoundedResource.expireResource({ resource }),
        Error,
        new RegExp(`Current time \\(.*\\) is earlier than 'availableUntil' \\(${future1.toISOString()}\\) for resource '${resource}'.`),
      );
      window = await timeBoundedResource.getTimeWindow({ resource }); // State should be unchanged
      assertEquals(window?.availableUntil?.getTime(), future1.getTime());

      // 3. Define again with an expiration in the past (effectively expired)
      const expiredPast = addMs(now, -100); // Very recent past
      await timeBoundedResource.defineTimeWindow({ resource, availableFrom: past, availableUntil: expiredPast });
      window = await timeBoundedResource.getTimeWindow({ resource });
      assertEquals(window?.availableUntil?.getTime(), expiredPast.getTime());

      // 4. Attempt to expire (should succeed)
      await timeBoundedResource.expireResource({ resource });
      // No error expected
      window = await timeBoundedResource.getTimeWindow({ resource }); // State should still be unchanged (expiredPast)
      assertEquals(window?.availableUntil?.getTime(), expiredPast.getTime());
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