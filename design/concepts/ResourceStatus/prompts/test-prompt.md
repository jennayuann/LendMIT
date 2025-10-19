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
[@ResourceStatus](../ResourceStatus.md)

## Implementation of concept to write tests for:
```
// src/concepts/ResourceStatus.ts

  

import { Collection, Db } from "mongodb";

import { db } from "@/db/connection.ts";

import { ID, Empty } from "@/utils/types.ts";

import { freshID } from "@/utils/database.ts";

  

// Declare collection prefix, use concept name

const CONCEPT_PREFIX = "ResourceStatus.";

  

/**

* ResourceID is a generic identifier for any resource type.

*/

type ResourceID = ID;

  

/**

* Represents a status definition.

* The `_id` is the unique status name.

*

* Corresponds to "a set of `StatusDefinitions` with `statusName` String"

*/

interface StatusDefinition {

_id: string; // The statusName itself

}

  

/**

* Represents a status entry for a specific resource.

* The `_id` is the `ResourceID`.

*

* Corresponds to "a set of `StatusEntries` with `resource` ResourceID, `currentStatus` String"

*/

interface StatusEntry {

_id: ResourceID; // The resource ID itself

currentStatus: string;

}

  

/**

* Represents a valid transition rule between two statuses.

* The `_id` is a generated unique identifier for the rule document.

*

* Corresponds to "a set of `TransitionRules` with `fromStatus` String, `toStatus` String"

*/

interface TransitionRule {

_id: ID; // Generated ID for the rule itself

fromStatus: string;

toStatus: string;

}

  

/**

* Implements the ResourceStatus concept.

*

* Purpose: Provide a generic and configurable mechanism to manage and track the lifecycle status of any resource type,

* enforcing application-defined transition rules between states.

*

* Principle: A resource can be marked with any defined status, and its current status can be updated

* only according to predefined, consistent transition rules. The concept allows the definition of

* custom status labels and the valid transitions between them.

*/

class ResourceStatus {

private statusDefinitions: Collection<StatusDefinition>;

private statusEntries: Collection<StatusEntry>;

private transitionRules: Collection<TransitionRule>;

  

constructor(private readonly db: Db) {

this.statusDefinitions = this.db.collection(CONCEPT_PREFIX + "statusDefinitions");

this.statusEntries = this.db.collection(CONCEPT_PREFIX + "statusEntries");

this.transitionRules = this.db.collection(CONCEPT_PREFIX + "transitionRules");

  

// Ensure unique index for transition rules to enforce uniqueness of (fromStatus, toStatus) pair.

this.transitionRules.createIndex(

{ fromStatus: 1, toStatus: 1 },

{ unique: true, background: true }

).catch((err) => console.error("Failed to create unique index for transitionRules:", err));

}

  

/**

* Defines a new status that can be used for resources.

*

* @param {Object} params - The parameters for defining a status.

* @param {string} params.statusName - The unique name of the status to define.

* @returns {Promise<Empty>} An empty object on successful definition.

* @throws {Error} If a `StatusDefinition` for `params.statusName` already exists.

*

* @action defineStatus

* @requires A `StatusDefinition` for `statusName` does not exist.

* @effects Adds `statusName` to the set of `StatusDefinitions`.

*/

async defineStatus({ statusName }: { statusName: string }): Promise<Empty> {

// Requires: A `StatusDefinition` for `statusName` does not exist.

const existingDefinition = await this.statusDefinitions.findOne({ _id: statusName });

if (existingDefinition) {

throw new Error(`StatusDefinition '${statusName}' already exists.`);

}

  

// Effects: Adds `statusName` to the set of `StatusDefinitions`.

await this.statusDefinitions.insertOne({ _id: statusName });

return {};

}

  

/**

* Defines a valid transition rule between two statuses.

*

* @param {Object} params - The parameters for defining a transition.

* @param {string} params.fromStatus - The starting status.

* @param {string} params.toStatus - The target status.

* @returns {Promise<Empty>} An empty object on successful definition.

* @throws {Error} If `params.fromStatus` or `params.toStatus` are not defined, or if the transition rule already exists.

*

* @action defineTransition

* @requires A `StatusDefinition` for `fromStatus` exists.

* @requires A `StatusDefinition` for `toStatus` exists.

* @requires A `TransitionRule` from `fromStatus` to `toStatus` does not already exist.

* @effects Adds a `TransitionRule` (from `fromStatus`, to `toStatus`) to the set of `TransitionRules`.

*/

async defineTransition({ fromStatus, toStatus }: { fromStatus: string; toStatus: string }): Promise<Empty> {

// Requires: A `StatusDefinition` for `fromStatus` exists.

const fromStatusDef = await this.statusDefinitions.findOne({ _id: fromStatus });

if (!fromStatusDef) {

throw new Error(`'fromStatus' definition '${fromStatus}' does not exist.`);

}

  

// Requires: A `StatusDefinition` for `toStatus` exists.

const toStatusDef = await this.statusDefinitions.findOne({ _id: toStatus });

if (!toStatusDef) {

throw new Error(`'toStatus' definition '${toStatus}' does not exist.`);

}

  

// Requires: A `TransitionRule` from `fromStatus` to `toStatus` does not already exist.

// The unique index handles this implicitly for insert, but an explicit check provides a clearer error message.

const existingRule = await this.transitionRules.findOne({ fromStatus, toStatus });

if (existingRule) {

throw new Error(`Transition rule from '${fromStatus}' to '${toStatus}' already exists.`);

}

  

// Effects: Adds a `TransitionRule` (from `fromStatus`, to `toStatus`) to the set of `TransitionRules`.

await this.transitionRules.insertOne({

_id: freshID(), // Generate a unique ID for the rule document

fromStatus,

toStatus,

});

return {};

}

  

/**

* Creates a new status entry for a resource with an initial status.

*

* @param {Object} params - The parameters for creating a status entry.

* @param {ResourceID} params.resource - The ID of the resource.

* @param {string} params.initialStatus - The initial status for the resource.

* @returns {Promise<Empty>} An empty object on successful creation.

* @throws {Error} If a `StatusEntry` for `params.resource` already exists, or if `params.initialStatus` is not defined.

*

* @action createEntry

* @requires A `StatusEntry` for `resource` does not exist.

* @requires A `StatusDefinition` for `initialStatus` exists.

* @effects Creates a new `StatusEntry` for `resource` and sets its `currentStatus` to `initialStatus`.

*/

async createEntry({ resource, initialStatus }: { resource: ResourceID; initialStatus: string }): Promise<Empty> {

// Requires: A `StatusEntry` for `resource` does not exist.

const existingEntry = await this.statusEntries.findOne({ _id: resource });

if (existingEntry) {

throw new Error(`StatusEntry for resource '${resource}' already exists.`);

}

  

// Requires: A `StatusDefinition` for `initialStatus` exists.

const initialStatusDef = await this.statusDefinitions.findOne({ _id: initialStatus });

if (!initialStatusDef) {

throw new Error(`'initialStatus' definition '${initialStatus}' does not exist.`);

}

  

// Effects: Creates a new `StatusEntry` for `resource` and sets its `currentStatus` to `initialStatus`.

await this.statusEntries.insertOne({

_id: resource,

currentStatus: initialStatus,

});

return {};

}

  

/**

* Transitions a resource's status to a new target status.

*

* @param {Object} params - The parameters for transitioning a status.

* @param {ResourceID} params.resource - The ID of the resource.

* @param {string} params.targetStatus - The status to transition to.

* @returns {Promise<Empty>} An empty object on successful transition.

* @throws {Error} If a `StatusEntry` for `params.resource` does not exist, `params.targetStatus` is not defined,

* or a valid `TransitionRule` from the current status to the target status does not exist.

*

* @action transition

* @requires A `StatusEntry` for `resource` exists.

* @requires A `StatusDefinition` for `targetStatus` exists.

* @requires A `TransitionRule` from `currentStatus` to `targetStatus` exists.

* @effects Updates the `currentStatus` of `resource` to `targetStatus`.

*/

async transition({ resource, targetStatus }: { resource: ResourceID; targetStatus: string }): Promise<Empty> {

// Requires: A `StatusEntry` for `resource` exists.

const entry = await this.statusEntries.findOne({ _id: resource });

if (!entry) {

throw new Error(`StatusEntry for resource '${resource}' does not exist.`);

}

  

const currentStatus = entry.currentStatus;

  

// Requires: A `StatusDefinition` for `targetStatus` exists.

const targetStatusDef = await this.statusDefinitions.findOne({ _id: targetStatus });

if (!targetStatusDef) {

throw new Error(`'targetStatus' definition '${targetStatus}' does not exist.`);

}

  

// Requires: A `TransitionRule` from `currentStatus` to `targetStatus` exists.

const transitionRule = await this.transitionRules.findOne({

fromStatus: currentStatus,

toStatus: targetStatus,

});

if (!transitionRule) {

throw new Error(`No transition rule defined from '${currentStatus}' to '${targetStatus}'.`);

}

  

// Effects: Updates the `currentStatus` of `resource` to `targetStatus`.

await this.statusEntries.updateOne(

{ _id: resource },

{ $set: { currentStatus: targetStatus } },

);

return {};

}

}

  

// Export the instantiated class

export const resourceStatus = new ResourceStatus(db);
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

The following Deno test file, `src/concepts/ResourceStatus.test.ts`, provides comprehensive and concise tests for the `ResourceStatus` concept implementation, adhering to all specified requirements and guidelines.

```typescript
// src/concepts/ResourceStatus.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ResourceStatus } from "./ResourceStatus.ts"; // Assuming ResourceStatus.ts is in the same directory
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const resourceA = "resourceA" as ID;
const resourceB = "resourceB" as ID;
const nonExistentResource = "nonExistentResource" as ID;
const emptyResourceID = "" as ID; // Edge case for resource ID

const statusDraft = "Draft";
const statusPending = "Pending";
const statusApproved = "Approved";
const statusRejected = "Rejected";
const statusPublished = "Published";
const nonExistentStatus = "NonExistentStatus";
const emptyStatus = ""; // Edge case for status name

// Collection names derived from the implementation
const STATUS_DEFINITIONS_COLLECTION = "ResourceStatus.statusDefinitions";
const STATUS_ENTRIES_COLLECTION = "ResourceStatus.statusEntries";
const TRANSITION_RULES_COLLECTION = "ResourceStatus.transitionRules";

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCESTATUS CONCEPT");
console.log("===========================================\n");

// ----------------------------------------------------------------------
// DEFINE STATUS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'defineStatus' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DEFINE STATUS ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group

    await t.step("✅ Happy path: Define a new status", async () => {
      await resourceStatus.defineStatus({ statusName: statusDraft });

      const dbEntry = await statusDefsColl.findOne({ _id: statusDraft });
      assertEquals(dbEntry?._id, statusDraft);
    });

    await t.step("✅ Requires violation: Cannot define an existing status", async () => {
      await resourceStatus.defineStatus({ statusName: statusPending }); // Define once
      await assertRejects(
        () => resourceStatus.defineStatus({ statusName: statusPending }),
        Error,
        `StatusDefinition '${statusPending}' already exists.`,
      );

      const count = await statusDefsColl.countDocuments({ _id: statusPending });
      assertEquals(count, 1); // Should still only have one entry
    });

    await t.step("✅ Edge case: Define status with an empty string name", async () => {
      await resourceStatus.defineStatus({ statusName: emptyStatus });

      const dbEntry = await statusDefsColl.findOne({ _id: emptyStatus });
      assertEquals(dbEntry?._id, emptyStatus);
    });

    await t.step("✅ State verification: Multiple statuses defined correctly", async () => {
      await resourceStatus.defineStatus({ statusName: statusApproved });
      const count = await statusDefsColl.countDocuments({});
      assertEquals(count, 4); // Draft, Pending, emptyStatus, Approved
    });

    await client.close();
    console.log("✅ Finished DEFINE STATUS tests\n");
  },
});

// ----------------------------------------------------------------------
// DEFINE TRANSITION ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'defineTransition' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=============================================");
    console.log("🧪 TEST GROUP: DEFINE TRANSITION ACTIONS");
    console.log("=============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    // Pre-define statuses for transition tests
    await resourceStatus.defineStatus({ statusName: statusDraft });
    await resourceStatus.defineStatus({ statusName: statusPending });
    await resourceStatus.defineStatus({ statusName: statusApproved });
    await resourceStatus.defineStatus({ statusName: statusRejected });
    await resourceStatus.defineStatus({ statusName: emptyStatus }); // For edge cases

    await t.step("✅ Happy path: Define a valid transition", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });

      const dbEntry = await transitionRulesColl.findOne({ fromStatus: statusDraft, toStatus: statusPending });
      assertEquals(dbEntry?.fromStatus, statusDraft);
      assertEquals(dbEntry?.toStatus, statusPending);
    });

    await t.step("✅ Requires violation: 'fromStatus' definition does not exist", async () => {
      await assertRejects(
        () => resourceStatus.defineTransition({ fromStatus: nonExistentStatus, toStatus: statusPending }),
        Error,
        `'fromStatus' definition '${nonExistentStatus}' does not exist.`,
      );
    });

    await t.step("✅ Requires violation: 'toStatus' definition does not exist", async () => {
      await assertRejects(
        () => resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: nonExistentStatus }),
        Error,
        `'toStatus' definition '${nonExistentStatus}' does not exist.`,
      );
    });

    await t.step("✅ Requires violation (Idempotency check): Transition rule already exists", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved });
      await assertRejects(
        () => resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved }),
        Error,
        `Transition rule from '${statusPending}' to '${statusApproved}' already exists.`,
      );

      const count = await transitionRulesColl.countDocuments({ fromStatus: statusPending, toStatus: statusApproved });
      assertEquals(count, 1); // Should still only have one rule
    });

    await t.step("✅ Edge case: Define a self-transition (from A to A)", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusApproved });
      const dbEntry = await transitionRulesColl.findOne({ fromStatus: statusApproved, toStatus: statusApproved });
      assertEquals(dbEntry?.fromStatus, statusApproved);
      assertEquals(dbEntry?.toStatus, statusApproved);
    });

    await t.step("✅ Edge case: Define transition involving empty string status", async () => {
      await resourceStatus.defineTransition({ fromStatus: emptyStatus, toStatus: statusDraft });
      const dbEntry1 = await transitionRulesColl.findOne({ fromStatus: emptyStatus, toStatus: statusDraft });
      assertEquals(dbEntry1?.fromStatus, emptyStatus);
      assertEquals(dbEntry1?.toStatus, statusDraft);

      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: emptyStatus });
      const dbEntry2 = await transitionRulesColl.findOne({ fromStatus: statusDraft, toStatus: emptyStatus });
      assertEquals(dbEntry2?.fromStatus, statusDraft);
      assertEquals(dbEntry2?.toStatus, emptyStatus);
    });

    await t.step("✅ State verification: Multiple transitions defined correctly", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusRejected });
      const count = await transitionRulesColl.countDocuments({});
      assertEquals(count, 5); // Draft->Pending, Pending->Approved, Approved->Approved, empty->Draft, Draft->empty, Approved->Rejected
    });

    await client.close();
    console.log("✅ Finished DEFINE TRANSITION tests\n");
  },
});

// ----------------------------------------------------------------------
// CREATE ENTRY ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'createEntry' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: CREATE ENTRY ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group

    // Pre-define statuses for entry creation tests
    await resourceStatus.defineStatus({ statusName: statusDraft });
    await resourceStatus.defineStatus({ statusName: statusApproved });
    await resourceStatus.defineStatus({ statusName: emptyStatus });

    await t.step("✅ Happy path: Create a new status entry for a resource", async () => {
      await resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft });

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA });
      assertEquals(dbEntry?._id, resourceA);
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await t.step("✅ Requires violation (Idempotency check): StatusEntry for resource already exists", async () => {
      await resourceStatus.createEntry({ resource: resourceB, initialStatus: statusDraft }); // Create once
      await assertRejects(
        () => resourceStatus.createEntry({ resource: resourceB, initialStatus: statusDraft }),
        Error,
        `StatusEntry for resource '${resourceB}' already exists.`,
      );

      const count = await statusEntriesColl.countDocuments({ _id: resourceB });
      assertEquals(count, 1);
    });

    await t.step("✅ Requires violation: 'initialStatus' definition does not exist", async () => {
      await assertRejects(
        () => resourceStatus.createEntry({ resource: nonExistentResource, initialStatus: nonExistentStatus }),
        Error,
        `'initialStatus' definition '${nonExistentStatus}' does not exist.`,
      );
      // State verification: No entry should have been created
      assertEquals(await statusEntriesColl.countDocuments({ _id: nonExistentResource }), 0);
    });

    await t.step("✅ Edge case: Create entry with an empty string ResourceID", async () => {
      await resourceStatus.createEntry({ resource: emptyResourceID, initialStatus: statusApproved });

      const dbEntry = await statusEntriesColl.findOne({ _id: emptyResourceID });
      assertEquals(dbEntry?._id, emptyResourceID);
      assertEquals(dbEntry?.currentStatus, statusApproved);
    });

    await t.step("✅ Edge case: Create entry with an empty string initial status", async () => {
      await resourceStatus.createEntry({ resource: resourceA + "1" as ID, initialStatus: emptyStatus });

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA + "1" });
      assertEquals(dbEntry?._id, resourceA + "1");
      assertEquals(dbEntry?.currentStatus, emptyStatus);
    });

    await client.close();
    console.log("✅ Finished CREATE ENTRY tests\n");
  },
});

// ----------------------------------------------------------------------
// TRANSITION ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'transition' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRANSITION ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    // Pre-define statuses and transitions for tests
    await resourceStatus.defineStatus({ statusName: statusDraft });
    await resourceStatus.defineStatus({ statusName: statusPending });
    await resourceStatus.defineStatus({ statusName: statusApproved });
    await resourceStatus.defineStatus({ statusName: statusRejected });
    await resourceStatus.defineStatus({ statusName: statusPublished });
    await resourceStatus.defineStatus({ statusName: emptyStatus });

    await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });
    await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved });
    await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusRejected });
    await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusPublished });
    await resourceStatus.defineTransition({ fromStatus: statusPublished, toStatus: statusPublished }); // Self-transition
    await resourceStatus.defineTransition({ fromStatus: emptyStatus, toStatus: statusDraft }); // For edge case

    await t.step("✅ Happy path: Transition a resource to a new valid status", async () => {
      await resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft });
      await resourceStatus.transition({ resource: resourceA, targetStatus: statusPending });

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA });
      assertEquals(dbEntry?.currentStatus, statusPending);
    });

    await t.step("✅ Requires violation: StatusEntry for resource does not exist", async () => {
      await assertRejects(
        () => resourceStatus.transition({ resource: nonExistentResource, targetStatus: statusPending }),
        Error,
        `StatusEntry for resource '${nonExistentResource}' does not exist.`,
      );
    });

    await t.step("✅ Requires violation: 'targetStatus' definition does not exist", async () => {
      await resourceStatus.createEntry({ resource: resourceB, initialStatus: statusDraft });
      await assertRejects(
        () => resourceStatus.transition({ resource: resourceB, targetStatus: nonExistentStatus }),
        Error,
        `'targetStatus' definition '${nonExistentStatus}' does not exist.`,
      );
      // State verification: Ensure status did not change
      const dbEntry = await statusEntriesColl.findOne({ _id: resourceB });
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await t.step("✅ Requires violation: No transition rule defined from current to target status", async () => {
      // Current is Draft, cannot transition directly to Approved
      await resourceStatus.createEntry({ resource: resourceA + "2" as ID, initialStatus: statusDraft });
      await assertRejects(
        () => resourceStatus.transition({ resource: resourceA + "2" as ID, targetStatus: statusApproved }),
        Error,
        `No transition rule defined from '${statusDraft}' to '${statusApproved}'.`,
      );
      // State verification: Ensure status did not change
      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA + "2" });
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await t.step("✅ Edge case: Transition to the current status (self-transition)", async () => {
      await resourceStatus.createEntry({ resource: resourceA + "3" as ID, initialStatus: statusPublished });
      await resourceStatus.transition({ resource: resourceA + "3" as ID, targetStatus: statusPublished }); // Rule from Published to Published exists

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA + "3" });
      assertEquals(dbEntry?.currentStatus, statusPublished);
    });

    await t.step("✅ Edge case: Transition with empty ResourceID", async () => {
      await resourceStatus.createEntry({ resource: emptyResourceID, initialStatus: emptyStatus });
      await resourceStatus.transition({ resource: emptyResourceID, targetStatus: statusDraft }); // Rule from '' to 'Draft' exists

      const dbEntry = await statusEntriesColl.findOne({ _id: emptyResourceID });
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await client.close();
    console.log("✅ Finished TRANSITION tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST (Principle verification)
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Trace scenario (end-to-end behavior - principle verification)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    const productA = "productA" as ID;
    const productB = "productB" as ID;

    // 1. Define statuses
    await t.step("1. Define necessary statuses", async () => {
      await resourceStatus.defineStatus({ statusName: statusDraft });
      await resourceStatus.defineStatus({ statusName: statusPending });
      await resourceStatus.defineStatus({ statusName: statusApproved });
      await resourceStatus.defineStatus({ statusName: statusRejected });
      await resourceStatus.defineStatus({ statusName: statusPublished });
      await resourceStatus.defineStatus({ statusName: "Archived" }); // Another status

      assertEquals(await statusDefsColl.countDocuments({}), 6, "Expected 6 status definitions.");
    });

    // 2. Define transition rules
    await t.step("2. Define a complete set of transition rules", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });
      await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved });
      await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusRejected });
      await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusPublished });
      await resourceStatus.defineTransition({ fromStatus: statusRejected, toStatus: statusDraft }); // Can re-draft rejected
      await resourceStatus.defineTransition({ fromStatus: statusPublished, toStatus: "Archived" }); // Archive published items
      await resourceStatus.defineTransition({ fromStatus: "Archived", toStatus: "Archived" }); // Can stay archived

      assertEquals(await transitionRulesColl.countDocuments({}), 7, "Expected 7 transition rules.");
    });

    // 3. Create resource entries with initial statuses
    await t.step("3. Create resource entries with initial statuses", async () => {
      await resourceStatus.createEntry({ resource: productA, initialStatus: statusDraft });
      await resourceStatus.createEntry({ resource: productB, initialStatus: statusDraft });

      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusDraft, "ProductA initial status should be Draft.");
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusDraft, "ProductB initial status should be Draft.");
    });

    // 4. Perform a sequence of valid transitions for productA
    await t.step("4. Perform a valid lifecycle sequence for productA", async () => {
      await resourceStatus.transition({ resource: productA, targetStatus: statusPending });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusPending, "ProductA status should be Pending.");

      await resourceStatus.transition({ resource: productA, targetStatus: statusApproved });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusApproved, "ProductA status should be Approved.");

      await resourceStatus.transition({ resource: productA, targetStatus: statusPublished });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusPublished, "ProductA status should be Published.");

      await resourceStatus.transition({ resource: productA, targetStatus: "Archived" });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, "Archived", "ProductA status should be Archived.");
    });

    // 5. Perform an alternative sequence for productB, including a rejection
    await t.step("5. Perform an alternative lifecycle sequence for productB (with rejection)", async () => {
      await resourceStatus.transition({ resource: productB, targetStatus: statusPending });
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusPending, "ProductB status should be Pending.");

      await resourceStatus.transition({ resource: productB, targetStatus: statusRejected });
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusRejected, "ProductB status should be Rejected.");

      await resourceStatus.transition({ resource: productB, targetStatus: statusDraft }); // Redraft
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusDraft, "ProductB status should be Draft after re-draft.");

      await resourceStatus.transition({ resource: productB, targetStatus: statusPending }); // Back to pending
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusPending, "ProductB status should be Pending again.");
    });

    // 6. Attempt an invalid transition
    await t.step("6. Attempt an invalid transition and verify rejection", async () => {
      // From Pending to Published directly should fail as no rule exists
      await assertRejects(
        () => resourceStatus.transition({ resource: productB, targetStatus: statusPublished }),
        Error,
        `No transition rule defined from '${statusPending}' to '${statusPublished}'.`,
        "Expected rejection for invalid transition.",
      );
      // Status should remain unchanged
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusPending, "ProductB status should remain Pending after failed transition.");
    });

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Robustness and concurrency-like tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    await t.step("✅ Concurrency: Multiple attempts to define the same status", async () => {
      const results = await Promise.allSettled([
        resourceStatus.defineStatus({ statusName: statusDraft }),
        resourceStatus.defineStatus({ statusName: statusDraft }), // Duplicate
        resourceStatus.defineStatus({ statusName: statusPending }),
      ]);

      const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
      const rejectedCount = results.filter(r => r.status === "rejected").length;

      // One for Draft, one for Pending, one rejection for duplicate Draft
      assertEquals(fulfilledCount, 2, "Expected two fulfilled operations (two unique statuses).");
      assertEquals(rejectedCount, 1, "Expected one rejected operation (duplicate status).");

      assertEquals(await statusDefsColl.countDocuments({}), 2, "Expected only 2 status definitions in DB.");
      assertEquals(await statusDefsColl.countDocuments({ _id: statusDraft }), 1, "Draft status defined once.");
      assertEquals(await statusDefsColl.countDocuments({ _id: statusPending }), 1, "Pending status defined once.");
    });

    await t.step("✅ Concurrency: Multiple attempts to define the same transition rule", async () => {
      await statusDefsColl.deleteMany({}); // Clear for this step
      await transitionRulesColl.deleteMany({}); // Clear for this step

      await resourceStatus.defineStatus({ statusName: statusDraft });
      await resourceStatus.defineStatus({ statusName: statusPending });

      const results = await Promise.allSettled([
        resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending }),
        resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending }), // Duplicate
      ]);

      const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
      const rejectedCount = results.filter(r => r.status === "rejected").length;

      assertEquals(fulfilledCount, 1, "Expected one fulfilled operation (one unique transition rule).");
      assertEquals(rejectedCount, 1, "Expected one rejected operation (duplicate transition rule).");
      assertEquals(await transitionRulesColl.countDocuments({ fromStatus: statusDraft, toStatus: statusPending }), 1, "Transition rule defined once.");
    });

    await t.step("✅ Concurrency: Multiple attempts to create the same resource entry", async () => {
      await statusDefsColl.deleteMany({});
      await statusEntriesColl.deleteMany({});

      await resourceStatus.defineStatus({ statusName: statusDraft });

      const results = await Promise.allSettled([
        resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft }),
        resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft }), // Duplicate
      ]);

      const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
      const rejectedCount = results.filter(r => r.status === "rejected").length;

      assertEquals(fulfilledCount, 1, "Expected one fulfilled operation (one unique resource entry).");
      assertEquals(rejectedCount, 1, "Expected one rejected operation (duplicate resource entry).");
      assertEquals(await statusEntriesColl.countDocuments({ _id: resourceA }), 1, "Resource entry created once.");
    });

    await t.step("✅ Robustness: Attempt to transition with an invalid status name (not defined)", async () => {
      await statusDefsColl.deleteMany({});
      await statusEntriesColl.deleteMany({});
      await transitionRulesColl.deleteMany({});

      await resourceStatus.defineStatus({ statusName: statusDraft });
      await resourceStatus.defineStatus({ statusName: statusPending });
      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });
      await resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft });

      await assertRejects(
        () => resourceStatus.transition({ resource: resourceA, targetStatus: "CompletelyUndefined" }),
        Error,
        `'targetStatus' definition 'CompletelyUndefined' does not exist.`,
        "Expected rejection for undefined target status.",
      );
      // Verify state is unchanged
      const entry = await statusEntriesColl.findOne({ _id: resourceA });
      assertEquals(entry?.currentStatus, statusDraft, "Resource status should not change after invalid target status.");
    });

    await t.step("✅ Robustness: Invalid initial status during createEntry leaves no trace", async () => {
      await statusDefsColl.deleteMany({});
      await statusEntriesColl.deleteMany({});

      await assertRejects(
        () => resourceStatus.createEntry({ resource: resourceB, initialStatus: nonExistentStatus }),
        Error,
        `'initialStatus' definition '${nonExistentStatus}' does not exist.`,
        "Expected rejection for non-existent initial status.",
      );
      // No entry should have been created
      assertEquals(await statusEntriesColl.countDocuments({ _id: resourceB }), 0, "No resource entry should be created after invalid initial status.");
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
    console.log("\n=======================================================================");
    console.log("🎉 RESOURCESTATUS CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
    console.log("=======================================================================\n");
  },
});
```