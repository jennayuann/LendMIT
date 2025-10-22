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
[@ResourceIntent](../ResourceIntent.md)
## Implementation of concept to write tests for:
```
// src/concepts/ResourceIntent.ts

  

import { Collection, Db, MongoError } from "mongodb";

import { ID, Empty } from "@utils/types.ts";

  

// ResourceID is a generic ID type as per the concept specification.

type ResourceID = ID;

  

/**

* Interface for IntentDefinition documents stored in MongoDB.

* The `_id` field directly represents the `intentName`, ensuring its uniqueness

* and simplifying lookup operations.

*/

interface MongoIntentDefinition {

_id: string; // Corresponds to intentName

}

  

/**

* Interface for IntentEntry documents stored in MongoDB.

* Each entry associates a resource with a defined intent.

* The `_id` field is the `resource` ID itself, which enforces the invariant

* that a resource can have at most one intent entry.

*/

interface MongoIntentEntry {

_id: ResourceID; // The resource ID serves as the primary key for the intent entry.

intent: string; // The intentName, referencing an existing MongoIntentDefinition._id.

}

  

/**

* Concept: ResourceIntent

* Purpose: Associate any resource with an intent.

* Principle:

* - Intent is a simple label applied to a resource.

* - Valid intent labels are defined and managed within this concept.

* - A resource can have at most one intent label associated with it at any given time.

* State:

* - A set of `IntentDefinitions` (stored in the `ResourceIntent.intentDefinitions` collection).

* - A set of `IntentEntries` (stored in the `ResourceIntent.intentEntries` collection).

*/

export default class ResourceIntent {

private readonly intentDefinitions: Collection<MongoIntentDefinition>;

private readonly intentEntries: Collection<MongoIntentEntry>;

  

constructor(private readonly db: Db) {

// Collection names are prefixed with the concept name to ensure logical grouping

// and prevent naming collisions with other concepts' state components.

this.intentDefinitions = this.db.collection("ResourceIntent.intentDefinitions");

this.intentEntries = this.db.collection("ResourceIntent.intentEntries");

}

  

/**

* defineIntent(intentName: String): Empty

*

* **requires**:

* - No `IntentDefinition` with `intentName` exists.

* **effects**:

* - Adds `intentName` to `IntentDefinitions`.

*/

async defineIntent({ intentName }: { intentName: string }): Promise<Empty> {

// Enforce "requires" condition: No IntentDefinition with `intentName` exists.

const existing = await this.intentDefinitions.findOne({ _id: intentName });

if (existing) {

throw new Error(`ResourceIntent: defineIntent failed. Intent definition '${intentName}' already exists.`);

}

  

// Perform "effects": Adds `intentName` to `IntentDefinitions`.

try {

await this.intentDefinitions.insertOne({ _id: intentName });

} catch (e) {

// Catch potential duplicate key errors in case of a race condition

if (e instanceof MongoError && e.code === 11000) {

throw new Error(`ResourceIntent: defineIntent failed due to a concurrent definition of '${intentName}'.`);

}

throw e; // Re-throw other unexpected errors

}

return {};

}

  

/**

* undefineIntent(intentName: String): Empty

*

* **requires**:

* - An `IntentDefinition` for `intentName` exists.

* - No `IntentEntry` uses `intentName`.

* **effects**:

* - Removes `intentName` from `IntentDefinitions`.

*/

async undefineIntent({ intentName }: { intentName: string }): Promise<Empty> {

// Enforce "requires" condition 1: An IntentDefinition for `intentName` exists.

const existingDefinition = await this.intentDefinitions.findOne({ _id: intentName });

if (!existingDefinition) {

throw new Error(`ResourceIntent: undefineIntent failed. Intent definition '${intentName}' does not exist.`);

}

  

// Enforce "requires" condition 2: No `IntentEntry` uses `intentName`.

const usedByEntries = await this.intentEntries.findOne({ intent: intentName });

if (usedByEntries) {

throw new Error(`ResourceIntent: undefineIntent failed. Intent definition '${intentName}' is currently in use by resource '${usedByEntries._id}' and cannot be undefined.`);

}

  

// Perform "effects": Removes `intentName` from `IntentDefinitions`.

const result = await this.intentDefinitions.deleteOne({ _id: intentName });

if (result.deletedCount === 0) {

// This should ideally not happen if the `findOne` check above passed.

throw new Error(`ResourceIntent: undefineIntent failed unexpectedly to delete '${intentName}'.`);

}

return {};

}

  

/**

* setIntent(resource: ResourceID, intent: String): Empty

*

* **requires**:

* - `intent` must be a defined `IntentDefinition`.

* **effects**:

* - Creates or updates the `IntentEntry` for `resource` with `intent`.

*/

async setIntent({ resource, intent }: { resource: ResourceID; intent: string }): Promise<Empty> {

// Enforce "requires" condition: `intent` must be a defined `IntentDefinition`.

const existingDefinition = await this.intentDefinitions.findOne({ _id: intent });

if (!existingDefinition) {

throw new Error(`ResourceIntent: setIntent failed. Intent definition '${intent}' is not defined.`);

}

  

// Perform "effects": Creates or updates the `IntentEntry` for `resource` with `intent`.

// By using `resource` as the `_id` for `MongoIntentEntry` documents and `upsert: true`,

// we automatically satisfy the invariant "at most one IntentEntry per resource".

await this.intentEntries.updateOne(

{ _id: resource }, // Query by the resource ID (which is the _id of the entry)

{ $set: { intent: intent } }, // Set or update the intent

{ upsert: true } // Create the document if it doesn't exist

);

return {};

}

  

/**

* clearIntent(resource: ResourceID): Empty

*

* **requires**:

* - An `IntentEntry` for `resource` exists.

* **effects**:

* - Removes the `IntentEntry` for `resource`.

*/

async clearIntent({ resource }: { resource: ResourceID }): Promise<Empty> {

// Enforce "requires" condition: An `IntentEntry` for `resource` exists.

const existingEntry = await this.intentEntries.findOne({ _id: resource });

if (!existingEntry) {

throw new Error(`ResourceIntent: clearIntent failed. No intent entry found for resource '${resource}'.`);

}

  

// Perform "effects": Removes the `IntentEntry` for `resource`.

const result = await this.intentEntries.deleteOne({ _id: resource });

if (result.deletedCount === 0) {

// This case should ideally not be reached if `findOne` above succeeded.

throw new Error(`ResourceIntent: clearIntent failed unexpectedly to delete intent for resource '${resource}'.`);

}

return {};

}

  

/**

* getIntent(resource: ResourceID): { resource: ResourceID, intent: String } | Null

*

* **effects**:

* - Returns the `IntentEntry` for `resource`, or `Null` if none exists.

*/

async getIntent({ resource }: { resource: ResourceID }): Promise<{ resource: ResourceID; intent: string } | null> {

// Perform "effects": Returns the `IntentEntry` for `resource`, or `Null` if none exists.

const entry = await this.intentEntries.findOne({ _id: resource });

  

if (!entry) {

return null;

}

  

// Return value exactly as specified: { resource: ResourceID, intent: String }

return {

resource: entry._id, // `_id` of the entry is the `ResourceID` itself

intent: entry.intent,

};

}

  

/**

* listIntents(): String[]

*

* **effects**:

* - Returns all defined `intentName`s.

*/

async listIntents(): Promise<string[]> {

// Perform "effects": Returns all defined `intentName`s.

// Project only the `_id` field, which contains the `intentName`.

const definitions = await this.intentDefinitions.find({}).project<{ _id: string }>({ _id: 1 }).toArray();

return definitions.map((def) => def._id);

}

  

/**

* listResourcesByIntent(intent: String): ResourceID[]

*

* **requires**:

* - `intent` must be a defined `IntentDefinition`.

* **effects**:

* - Returns `ResourceID`s with the given `intent`.

*/

async listResourcesByIntent({ intent }: { intent: string }): Promise<ResourceID[]> {

// Enforce "requires" condition: `intent` must be a defined `IntentDefinition`.

const existingDefinition = await this.intentDefinitions.findOne({ _id: intent });

if (!existingDefinition) {

throw new Error(`ResourceIntent: listResourcesByIntent failed. Intent definition '${intent}' is not defined.`);

}

  

// Perform "effects": Returns `ResourceID`s with the given `intent`.

// Project only the `_id` field, which contains the `ResourceID`.

const entries = await this.intentEntries.find({ intent: intent }).project<{ _id: ResourceID }>({ _id: 1 }).toArray();

return entries.map((entry) => entry._id);

}

}

  

// Import the shared MongoDB connection and export an instantiated class for use throughout the application.

import { db } from "@/db/connection.ts";

export const resourceIntent = new ResourceIntent(db);
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
// src/concepts/ResourceIntent.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import ResourceIntent from "./ResourceIntent.ts"; // Note: default import
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const INTENT_A = "intentA";
const INTENT_B = "intentB";
const INTENT_C = "intentC";
const NON_EXISTENT_INTENT = "nonExistentIntent";
const EMPTY_INTENT = ""

const RESOURCE_1 = "resource1" as ID;
const RESOURCE_2 = "resource2" as ID;
const RESOURCE_3 = "resource3" as ID;
const RESOURCE_4 = "resource4" as ID;
const NON_EXISTENT_RESOURCE = "nonExistentResource" as ID;
const EMPTY_RESOURCE = "" as ID;

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCEINTENT CONCEPT");
console.log("===========================================\n");

// Helper function to clear collections
async function clearCollections(db: Deno.Kv) { // Changed from Db to Deno.Kv as per testDb return type. The provided code assumes Db.
                                              // Given the provided implementation uses `mongodb` collections, let's assume `db` is `Db` from `mongodb`.
                                              // The example `Following.test.ts` also uses `Db` from `mongodb`
    const intentDefinitions: Collection = db.collection("ResourceIntent.intentDefinitions");
    const intentEntries: Collection = db.collection("ResourceIntent.intentEntries");
    await intentDefinitions.deleteMany({});
    await intentEntries.deleteMany({});
}

// ----------------------------------------------------------------------
// DEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'defineIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: DEFINEINTENT ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");

        await t.step("✅ Happy path: Define a new intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to define intent: '${INTENT_A}'`);
            await resourceIntent.defineIntent({ intentName: INTENT_A });

            console.log(`- Verifying intent '${INTENT_A}' exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: INTENT_A });
            assertEquals(exists?._id, INTENT_A);

            const definedIntents = await resourceIntent.listIntents();
            assertEquals(definedIntents.includes(INTENT_A), true);
            console.log(`- Confirmed '${INTENT_A}' is listed.`);
        });

        await t.step("❌ Requires violation: Cannot define an already existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            console.log(`- Attempting to define intent '${INTENT_B}' again.`);
            await assertRejects(
                () => resourceIntent.defineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: defineIntent failed. Intent definition '${INTENT_B}' already exists.`,
            );

            console.log(`- Verifying intent '${INTENT_B}' count is still 1.`);
            const count = await intentDefinitionsColl.countDocuments({ _id: INTENT_B });
            assertEquals(count, 1);
        });

        await t.step("✅ Edge case: Defining intent with an empty string name", async () => {
            await clearCollections(db);
            console.log(`- Attempting to define an empty intent name.`);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });

            console.log(`- Verifying empty intent exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT });
            assertEquals(exists?._id, EMPTY_INTENT);

            const definedIntents = await resourceIntent.listIntents();
            assertEquals(definedIntents.includes(EMPTY_INTENT), true);
            console.log(`- Confirmed empty intent is listed.`);
        });

        await client.close();
        console.log("✅ Finished DEFINEINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// UNDEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'undefineIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n=============================================");
        console.log("🧪 TEST GROUP: UNDEFINEINTENT ACTIONS");
        console.log("=============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("✅ Happy path: Undefine an existing and unused intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            console.log(`- Successfully defined intent: '${INTENT_A}'`);

            console.log(`- Attempting to undefine intent: '${INTENT_A}'`);
            await resourceIntent.undefineIntent({ intentName: INTENT_A });

            console.log(`- Verifying intent '${INTENT_A}' no longer exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: INTENT_A });
            assertEquals(exists, null);

            const definedIntents = await resourceIntent.listIntents();
            assertEquals(definedIntents.includes(INTENT_A), false);
            console.log(`- Confirmed '${INTENT_A}' is not listed.`);
        });

        await t.step("❌ Requires violation: Cannot undefine a non-existent intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to undefine non-existent intent: '${NON_EXISTENT_INTENT}'`);
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            );
        });

        await t.step("❌ Requires violation: Cannot undefine an intent that is in use", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B });
            console.log(`- Defined intent '${INTENT_B}' and assigned it to '${RESOURCE_1}'.`);

            console.log(`- Attempting to undefine intent '${INTENT_B}' which is in use.`);
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_1}' and cannot be undefined.`,
            );

            console.log(`- Verifying intent '${INTENT_B}' still exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: INTENT_B });
            assertEquals(exists?._id, INTENT_B);
        });

        await t.step("✅ Edge case: Undefining with empty string name after defining it", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });
            console.log(`- Defined empty intent name.`);

            console.log(`- Attempting to undefine empty intent name.`);
            await resourceIntent.undefineIntent({ intentName: EMPTY_INTENT });

            console.log(`- Verifying empty intent no longer exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT });
            assertEquals(exists, null);
        });

        await client.close();
        console.log("✅ Finished UNDEFINEINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// SETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'setIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: SETINTENT ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("✅ Happy path: Set intent for a resource (creation)", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            console.log(`- Defined intent: '${INTENT_A}'`);

            console.log(`- Setting intent '${INTENT_A}' for resource '${RESOURCE_1}'.`);
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });

            console.log(`- Verifying intent entry for '${RESOURCE_1}' exists.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
            assertEquals(entry?._id, RESOURCE_1);
            assertEquals(entry?.intent, INTENT_A);

            const getIntentResult = await resourceIntent.getIntent({ resource: RESOURCE_1 });
            assertEquals(getIntentResult?.resource, RESOURCE_1);
            assertEquals(getIntentResult?.intent, INTENT_A);
            console.log(`- Confirmed getIntent() returns correct intent.`);
        });

        await t.step("✅ Happy path: Update intent for an existing resource", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            console.log(`- Set initial intent '${INTENT_A}' for resource '${RESOURCE_2}'.`);

            console.log(`- Updating intent for '${RESOURCE_2}' to '${INTENT_B}'.`);
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });

            console.log(`- Verifying intent entry for '${RESOURCE_2}' is updated.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_2 });
            assertEquals(entry?._id, RESOURCE_2);
            assertEquals(entry?.intent, INTENT_B);

            const getIntentResult = await resourceIntent.getIntent({ resource: RESOURCE_2 });
            assertEquals(getIntentResult?.resource, RESOURCE_2);
            assertEquals(getIntentResult?.intent, INTENT_B);
            console.log(`- Confirmed intent updated for '${RESOURCE_2}'.`);
        });

        await t.step("❌ Requires violation: Cannot set an undefined intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to set non-existent intent '${NON_EXISTENT_INTENT}' for resource '${RESOURCE_3}'.`);
            await assertRejects(
                () => resourceIntent.setIntent({ resource: RESOURCE_3, intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: setIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );

            console.log(`- Verifying no intent entry for '${RESOURCE_3}' was created.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_3 });
            assertEquals(entry, null);
        });

        await t.step("✅ Edge case: Setting intent with empty string resource ID", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            console.log(`- Defined intent: '${INTENT_A}'`);

            console.log(`- Setting intent '${INTENT_A}' for empty resource ID.`);
            await resourceIntent.setIntent({ resource: EMPTY_RESOURCE, intent: INTENT_A });

            console.log(`- Verifying intent entry for empty resource ID exists.`);
            const entry = await intentEntriesColl.findOne({ _id: EMPTY_RESOURCE });
            assertEquals(entry?._id, EMPTY_RESOURCE);
            assertEquals(entry?.intent, INTENT_A);
        });

        await t.step("✅ Idempotency: Setting the same intent multiple times has no additional effect", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            console.log(`- Defined intent: '${INTENT_C}'`);

            console.log(`- Setting intent '${INTENT_C}' for resource '${RESOURCE_4}' (first time).`);
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });
            console.log(`- Setting intent '${INTENT_C}' for resource '${RESOURCE_4}' (second time).`);
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });

            console.log(`- Verifying only one intent entry exists for '${RESOURCE_4}'.`);
            const count = await intentEntriesColl.countDocuments({ _id: RESOURCE_4 });
            assertEquals(count, 1);

            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_4 });
            assertEquals(entry?.intent, INTENT_C);
        });

        await client.close();
        console.log("✅ Finished SETINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// CLEARINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'clearIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n=============================================");
        console.log("🧪 TEST GROUP: CLEARINTENT ACTIONS");
        console.log("=============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("✅ Happy path: Clear intent for a resource", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            console.log(`- Set intent '${INTENT_A}' for resource '${RESOURCE_1}'.`);

            console.log(`- Clearing intent for resource '${RESOURCE_1}'.`);
            await resourceIntent.clearIntent({ resource: RESOURCE_1 });

            console.log(`- Verifying no intent entry for '${RESOURCE_1}' exists.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
            assertEquals(entry, null);

            const getIntentResult = await resourceIntent.getIntent({ resource: RESOURCE_1 });
            assertEquals(getIntentResult, null);
            console.log(`- Confirmed getIntent() returns null.`);
        });

        await t.step("❌ Requires violation: Cannot clear intent for a resource with no intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to clear intent for resource '${RESOURCE_2}' which has no intent set.`);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: RESOURCE_2 }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${RESOURCE_2}'.`,
            );

            console.log(`- Verifying no intent entry for '${RESOURCE_2}' was created.`);
            const count = await intentEntriesColl.countDocuments({ _id: RESOURCE_2 });
            assertEquals(count, 0);
        });

        await t.step("✅ Edge case: Clearing intent for non-existent resource ID (idempotency, should reject as per requires)", async () => {
            await clearCollections(db);
            console.log(`- Attempting to clear intent for non-existent resource '${NON_EXISTENT_RESOURCE}'.`);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            );
        });

        await client.close();
        console.log("✅ Finished CLEARINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// GETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'getIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: GETINTENT ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("✅ Happy path: Get existing intent for a resource", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            console.log(`- Set intent '${INTENT_A}' for resource '${RESOURCE_1}'.`);

            console.log(`- Getting intent for resource '${RESOURCE_1}'.`);
            const result = await resourceIntent.getIntent({ resource: RESOURCE_1 });
            assertEquals(result, { resource: RESOURCE_1, intent: INTENT_A });
            console.log(`- Confirmed intent is '${result?.intent}'.`);
        });

        await t.step("✅ Negative path: Get intent for a resource with no intent set", async () => {
            await clearCollections(db);
            console.log(`- Getting intent for resource '${RESOURCE_2}' (no intent set).`);
            const result = await resourceIntent.getIntent({ resource: RESOURCE_2 });
            assertEquals(result, null);
            console.log(`- Confirmed result is null.`);
        });

        await t.step("✅ Edge case: Get intent for a non-existent resource ID", async () => {
            await clearCollections(db);
            console.log(`- Getting intent for non-existent resource '${NON_EXISTENT_RESOURCE}'.`);
            const result = await resourceIntent.getIntent({ resource: NON_EXISTENT_RESOURCE });
            assertEquals(result, null);
            console.log(`- Confirmed result is null.`);
        });

        await t.step("✅ Edge case: Get intent after it has been cleared", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
            await resourceIntent.clearIntent({ resource: RESOURCE_3 });
            console.log(`- Set and then cleared intent for resource '${RESOURCE_3}'.`);

            console.log(`- Getting intent for resource '${RESOURCE_3}'.`);
            const result = await resourceIntent.getIntent({ resource: RESOURCE_3 });
            assertEquals(result, null);
            console.log(`- Confirmed result is null.`);
        });

        await client.close();
        console.log("✅ Finished GETINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// LISTINTENTS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'listIntents' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: LISTINTENTS ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("✅ Happy path: List multiple defined intents", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            console.log(`- Defined intents: '${INTENT_A}', '${INTENT_B}', '${INTENT_C}'.`);

            console.log(`- Listing all defined intents.`);
            const intents = await resourceIntent.listIntents();
            assertEquals(intents.sort(), [INTENT_A, INTENT_B, INTENT_C].sort());
            console.log(`- Confirmed all defined intents are listed.`);
        });

        await t.step("✅ Edge case: List when no intents are defined", async () => {
            await clearCollections(db);
            console.log(`- Listing intents when none are defined.`);
            const intents = await resourceIntent.listIntents();
            assertEquals(intents, []);
            console.log(`- Confirmed an empty array is returned.`);
        });

        await t.step("✅ State update: List after undefining an intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.undefineIntent({ intentName: INTENT_A });
            console.log(`- Defined '${INTENT_A}', '${INTENT_B}', then undefined '${INTENT_A}'.`);

            console.log(`- Listing all defined intents.`);
            const intents = await resourceIntent.listIntents();
            assertEquals(intents.sort(), [INTENT_B].sort());
            console.log(`- Confirmed '${INTENT_A}' is no longer listed.`);
        });

        await client.close();
        console.log("✅ Finished LISTINTENTS tests\n");
    },
});

// ----------------------------------------------------------------------
// LISTRESOURCESBYINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'listResourcesByIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===================================================");
        console.log("🧪 TEST GROUP: LISTRESOURCESBYINTENT ACTIONS");
        console.log("===================================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("✅ Happy path: List resources for a specific intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_A });
            console.log(`- Set intents: '${RESOURCE_1}'->'${INTENT_A}', '${RESOURCE_2}'->'${INTENT_B}', '${RESOURCE_3}'->'${INTENT_A}'.`);

            console.log(`- Listing resources by intent '${INTENT_A}'.`);
            const resources = await resourceIntent.listResourcesByIntent({ intent: INTENT_A });
            assertEquals(resources.sort(), [RESOURCE_1, RESOURCE_3].sort());
            console.log(`- Confirmed resources for '${INTENT_A}' are listed correctly.`);

            console.log(`- Listing resources by intent '${INTENT_B}'.`);
            const resourcesB = await resourceIntent.listResourcesByIntent({ intent: INTENT_B });
            assertEquals(resourcesB.sort(), [RESOURCE_2].sort());
            console.log(`- Confirmed resources for '${INTENT_B}' are listed correctly.`);
        });

        await t.step("❌ Requires violation: Cannot list resources by an undefined intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to list resources by non-existent intent: '${NON_EXISTENT_INTENT}'.`);
            await assertRejects(
                () => resourceIntent.listResourcesByIntent({ intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: listResourcesByIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );
        });

        await t.step("✅ Edge case: List resources for an intent with no associated resources", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            console.log(`- Defined intent: '${INTENT_C}' (no resources assigned).`);

            console.log(`- Listing resources by intent '${INTENT_C}'.`);
            const resources = await resourceIntent.listResourcesByIntent({ intent: INTENT_C });
            assertEquals(resources, []);
            console.log(`- Confirmed an empty array is returned.`);
        });

        await t.step("✅ State update: List after a resource's intent is cleared or updated", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
            console.log(`- Initial state: '${RESOURCE_1}'->'${INTENT_A}', '${RESOURCE_2}'->'${INTENT_A}', '${RESOURCE_3}'->'${INTENT_B}'.`);

            await resourceIntent.clearIntent({ resource: RESOURCE_1 });
            console.log(`- Cleared intent for '${RESOURCE_1}'.`);
            const resourcesAfterClear = await resourceIntent.listResourcesByIntent({ intent: INTENT_A });
            assertEquals(resourcesAfterClear, [RESOURCE_2]);

            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            console.log(`- Updated intent for '${RESOURCE_2}' to '${INTENT_B}'.`);
            const resourcesAfterUpdateA = await resourceIntent.listResourcesByIntent({ intent: INTENT_A });
            assertEquals(resourcesAfterUpdateA, []);
            const resourcesAfterUpdateB = await resourceIntent.listResourcesByIntent({ intent: INTENT_B });
            assertEquals(resourcesAfterUpdateB.sort(), [RESOURCE_2, RESOURCE_3].sort());
            console.log(`- Confirmed lists reflect state changes.`);
        });

        await client.close();
        console.log("✅ Finished LISTRESOURCESBYINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Trace scenario (end-to-end behavior)",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        console.log("\n===============================================");
        console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
        console.log("===============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        await clearCollections(db);

        console.log("Scenario: A workflow for managing resource intents.");

        console.log("\nSTEP 1: Define initial intents.");
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        await resourceIntent.defineIntent({ intentName: INTENT_C });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort());
        console.log(`- Defined intents: ${[INTENT_A, INTENT_B, INTENT_C].join(", ")}`);

        console.log("\nSTEP 2: Assign intents to resources.");
        await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_1 }))?.intent, INTENT_A);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_A);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_3 }))?.intent, INTENT_B);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1, RESOURCE_2].sort());
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_3].sort());
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_C }), []);
        console.log(`- ${RESOURCE_1} & ${RESOURCE_2} -> ${INTENT_A}`);
        console.log(`- ${RESOURCE_3} -> ${INTENT_B}`);

        console.log("\nSTEP 3: Update an intent for a resource.");
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_B);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1].sort());
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_2, RESOURCE_3].sort());
        console.log(`- Updated ${RESOURCE_2} -> ${INTENT_B}.`);
        console.log(`- Principle Check: ${RESOURCE_2} now only has one intent, and it's defined.`);

        console.log("\nSTEP 4: Clear an intent for a resource.");
        await resourceIntent.clearIntent({ resource: RESOURCE_1 });
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), null);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), []);
        console.log(`- Cleared intent for ${RESOURCE_1}.`);
        console.log(`- Principle Check: ${RESOURCE_1} no longer has an intent.`);

        console.log("\nSTEP 5: Attempt to undefine an intent that is in use (should fail).");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_2}' and cannot be undefined.`,
        );
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort());
        console.log(`- Confirmed cannot undefine '${INTENT_B}' while ${RESOURCE_2} uses it.`);
        console.log(`- Principle Check: Referential integrity maintained for 'IntentEntries'.`);

        console.log("\nSTEP 6: Undefine an unused intent.");
        await resourceIntent.undefineIntent({ intentName: INTENT_A });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_B, INTENT_C].sort());
        console.log(`- Undefined '${INTENT_A}' successfully.`);

        console.log("\nSTEP 7: Undefine all other intents after clearing usage.");
        await resourceIntent.clearIntent({ resource: RESOURCE_2 });
        await resourceIntent.clearIntent({ resource: RESOURCE_3 });
        await resourceIntent.undefineIntent({ intentName: INTENT_B });
        await resourceIntent.undefineIntent({ intentName: INTENT_C });
        assertEquals(await resourceIntent.listIntents(), []);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), []); // INTENT_A is already undefined
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_B }), []);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_C }), []);
        console.log(`- All intents and resource associations cleared.`);
        console.log(`- Final state reflects principle: no intents defined, no resources associated.`);

        await client.close();
        console.log("✅ Finished TRACE demonstration\n");
    },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Robustness and concurrency tests",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        console.log("\n=================================================");
        console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
        console.log("=================================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");
        await clearCollections(db);

        console.log("\nConcurrency: Attempting to define the same intent concurrently.");
        const defineResults = await Promise.allSettled([
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
        ]);

        const fulfilledDefines = defineResults.filter(r => r.status === "fulfilled").length;
        const rejectedDefines = defineResults.filter(r => r.status === "rejected").length;

        assertEquals(fulfilledDefines, 1, "Only one concurrent defineIntent should succeed.");
        assertEquals(rejectedDefines, 2, "Concurrent defineIntent attempts should be rejected.");
        const intentCount = await intentDefinitionsColl.countDocuments({ _id: INTENT_A });
        assertEquals(intentCount, 1, "Only one intent should exist in the database.");
        console.log(`- Define intent '${INTENT_A}' concurrently: 1 success, 2 rejects.`);

        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        console.log("\nConcurrency: Attempting to set different intents for the same resource concurrently.");
        const setResults = await Promise.allSettled([
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A }),
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B }),
        ]);

        // MongoDB's updateOne with upsert handles this by performing the update/insert atomically.
        // The last write "wins" or they result in the same state eventually.
        // We expect one successful outcome and the final state to be one of them.
        const entry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
        assertEquals(entry?._id, RESOURCE_1);
        assertEquals([INTENT_A, INTENT_B].includes(entry?.intent as string), true, "Resource should have one of the intents.");
        const entryCount = await intentEntriesColl.countDocuments({ _id: RESOURCE_1 });
        assertEquals(entryCount, 1, "Only one intent entry for the resource.");
        console.log(`- Set intents for '${RESOURCE_1}' concurrently: Final intent is '${entry?.intent}'. (MongoDB handles last write wins for upsert).`);


        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
        console.log("\nConcurrency: Attempting to clear the same intent concurrently.");
        const clearResults = await Promise.allSettled([
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
        ]);
        const fulfilledClears = clearResults.filter(r => r.status === "fulfilled").length;
        const rejectedClears = clearResults.filter(r => r.status === "rejected").length;
        assertEquals(fulfilledClears, 1, "Only one concurrent clearIntent should succeed.");
        assertEquals(rejectedClears, 1, "Subsequent clearIntent for non-existent entry should reject.");
        const finalEntry = await intentEntriesColl.findOne({ _id: RESOURCE_2 });
        assertEquals(finalEntry, null, "Intent should be cleared from the database.");
        console.log(`- Clear intent for '${RESOURCE_2}' concurrently: 1 success, 1 reject.`);

        console.log("\nRobustness: Invalid operations on non-existent data.");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            "Should reject undefining a non-existent intent.",
        );
        await assertRejects(
            () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
            Error,
            `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            "Should reject clearing intent for a non-existent resource.",
        );
        console.log(`- Confirmed rejections for invalid operations on non-existent data.`);


        console.log("\nRobustness: Cleanup and data consistency after failed operations.");
        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
        // Attempt an invalid operation: undefine INTENT_A while RESOURCE_1 uses it
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_A }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_A}' is currently in use by resource '${RESOURCE_1}' and cannot be undefined.`,
            "Attempt to undefine in-use intent should fail.",
        );
        // Verify state is unchanged
        assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), true, "INTENT_A should still be defined.");
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_1 }))?.intent, INTENT_A, "RESOURCE_1 should still have INTENT_A.");
        console.log(`- Verified state consistency after failed 'undefineIntent' operation.`);

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
        console.log("🎉 RESOURCEINTENT CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
        console.log("======================================================================\n");
    },
});

```

# New response: iterate on the response above.
- Make the test suite more concise.
# response:

```typescript
// src/concepts/ResourceIntent.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import ResourceIntent from "./ResourceIntent.ts";
import { Collection, Db } from "mongodb"; // Import Db type
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const INTENT_A = "intentA";
const INTENT_B = "intentB";
const INTENT_C = "intentC";
const INTENT_D = "intentD"; // Added for more distinct test cases
const NON_EXISTENT_INTENT = "nonExistentIntent";
const EMPTY_INTENT = "";

const RESOURCE_1 = "resource1" as ID;
const RESOURCE_2 = "resource2" as ID;
const RESOURCE_3 = "resource3" as ID;
const RESOURCE_4 = "resource4" as ID;
const NON_EXISTENT_RESOURCE = "nonExistentResource" as ID;
const EMPTY_RESOURCE = "" as ID;

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCEINTENT CONCEPT");
console.log("===========================================\n");

// Helper function to clear collections for test step isolation
async function clearCollections(db: Db) {
    const intentDefinitions: Collection = db.collection("ResourceIntent.intentDefinitions");
    const intentEntries: Collection = db.collection("ResourceIntent.intentEntries");
    await intentDefinitions.deleteMany({});
    await intentEntries.deleteMany({});
}

// ----------------------------------------------------------------------
// DEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'defineIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");

        await t.step("Happy path: Define new intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            assertEquals(await intentDefinitionsColl.findOne({ _id: INTENT_A }), { _id: INTENT_A });
            assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), true);
        });

        await t.step("Requires violation: Cannot define existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await assertRejects(
                () => resourceIntent.defineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: defineIntent failed. Intent definition '${INTENT_B}' already exists.`,
            );
            assertEquals(await intentDefinitionsColl.countDocuments({ _id: INTENT_B }), 1);
        });

        await t.step("Edge case: Define empty string intent name", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });
            assertEquals(await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT }), { _id: EMPTY_INTENT });
            assertEquals((await resourceIntent.listIntents()).includes(EMPTY_INTENT), true);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// UNDEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'undefineIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("Happy path: Undefine an unused intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.undefineIntent({ intentName: INTENT_A });
            assertEquals(await intentDefinitionsColl.findOne({ _id: INTENT_A }), null);
            assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), false);
        });

        await t.step("Requires violation: Cannot undefine non-existent intent", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            );
        });

        await t.step("Requires violation: Cannot undefine intent in use", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B });
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_1}' and cannot be undefined.`,
            );
            assertEquals(await intentDefinitionsColl.findOne({ _id: INTENT_B }), { _id: INTENT_B });
        });

        await t.step("Edge case: Undefine empty string intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });
            await resourceIntent.undefineIntent({ intentName: EMPTY_INTENT });
            assertEquals(await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT }), null);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// SETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'setIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("Happy path: Set intent (create)", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_1 }), { _id: RESOURCE_1, intent: INTENT_A });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), { resource: RESOURCE_1, intent: INTENT_A });
        });

        await t.step("Happy path: Set intent (update)", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_2 }), { _id: RESOURCE_2, intent: INTENT_B });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_2 }), { resource: RESOURCE_2, intent: INTENT_B });
        });

        await t.step("Requires violation: Cannot set undefined intent", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.setIntent({ resource: RESOURCE_3, intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: setIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );
            assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_3 }), 0);
        });

        await t.step("Edge case: Set intent with empty resource ID", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: EMPTY_RESOURCE, intent: INTENT_A });
            assertEquals(await intentEntriesColl.findOne({ _id: EMPTY_RESOURCE }), { _id: EMPTY_RESOURCE, intent: INTENT_A });
        });

        await t.step("Idempotency: Setting same intent multiple times", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });
            assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_4 }), 1);
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_4 }), { _id: RESOURCE_4, intent: INTENT_C });
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// CLEARINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'clearIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("Happy path: Clear existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.clearIntent({ resource: RESOURCE_1 });
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_1 }), null);
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), null);
        });

        await t.step("Requires violation: Cannot clear non-existent intent entry", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: RESOURCE_2 }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${RESOURCE_2}'.`,
            );
            assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_2 }), 0);
        });

        await t.step("Idempotency/Edge case: Clearing non-existent resource ID", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            );
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// GETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'getIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("Happy path: Get existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), { resource: RESOURCE_1, intent: INTENT_A });
        });

        await t.step("Negative path: Get intent for resource with no intent", async () => {
            await clearCollections(db);
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_2 }), null);
        });

        await t.step("Edge case: Get intent for non-existent resource ID", async () => {
            await clearCollections(db);
            assertEquals(await resourceIntent.getIntent({ resource: NON_EXISTENT_RESOURCE }), null);
        });

        await t.step("State verification: Get intent after clear", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
            await resourceIntent.clearIntent({ resource: RESOURCE_3 });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_3 }), null);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// LISTINTENTS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'listIntents'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("Happy path: List multiple defined intents", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B].sort());
        });

        await t.step("Edge case: List when no intents are defined", async () => {
            await clearCollections(db);
            assertEquals(await resourceIntent.listIntents(), []);
        });

        await t.step("State verification: List after undefining intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.undefineIntent({ intentName: INTENT_A });
            assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_B].sort());
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// LISTRESOURCESBYINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'listResourcesByIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("Happy path: List resources for specific intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_A });
            assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1, RESOURCE_3].sort());
            assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_2].sort());
        });

        await t.step("Requires violation: List by undefined intent", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.listResourcesByIntent({ intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: listResourcesByIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );
        });

        await t.step("Edge case: List for intent with no associated resources", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_C }), []);
        });

        await t.step("State verification: List after intent cleared/updated", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            await resourceIntent.clearIntent({ resource: RESOURCE_1 });
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), [RESOURCE_2]);
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), []);
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_B }), [RESOURCE_2]);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Trace scenario (principle verification)",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        console.log("\n===============================================");
        console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
        console.log("===============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        await clearCollections(db); // Ensure clean slate for trace

        console.log("Scenario: A workflow for managing resource intents, demonstrating principle fulfillment.");

        console.log("\nSTEP 1: Define multiple intents (INTENT_A, INTENT_B, INTENT_C).");
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        await resourceIntent.defineIntent({ intentName: INTENT_C });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort(), "All intents should be defined.");

        console.log("STEP 2: Assign intents to resources (RESOURCE_1->A, RESOURCE_2->A, RESOURCE_3->B).");
        await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_1 }))?.intent, INTENT_A, `${RESOURCE_1} has ${INTENT_A}`);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_A, `${RESOURCE_2} has ${INTENT_A}`);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_3 }))?.intent, INTENT_B, `${RESOURCE_3} has ${INTENT_B}`);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1, RESOURCE_2].sort(), `Resources for ${INTENT_A} are ${RESOURCE_1}, ${RESOURCE_2}`);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_3].sort(), `Resources for ${INTENT_B} is ${RESOURCE_3}`);
        console.log("Principle verification: Resources successfully associated with defined intents.");

        console.log("STEP 3: Update an intent for a resource (RESOURCE_2: A -> B).");
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_B, `${RESOURCE_2} updated to ${INTENT_B}`);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), [RESOURCE_1], `${RESOURCE_1} is only resource for ${INTENT_A}`);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_2, RESOURCE_3].sort(), `${RESOURCE_2}, ${RESOURCE_3} now for ${INTENT_B}`);
        console.log("Principle verification: A resource can have at most one intent label at any time (uniqueness invariant).");

        console.log("STEP 4: Clear an intent for a resource (RESOURCE_1).");
        await resourceIntent.clearIntent({ resource: RESOURCE_1 });
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), null, `${RESOURCE_1} intent cleared.`);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), [], `No resources for ${INTENT_A} now.`);
        console.log("Principle verification: Intent cleared, resource no longer associated.");

        console.log("STEP 5: Attempt to undefine INTENT_B (still in use). Should reject.");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_2}' and cannot be undefined.`,
        );
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort(), `${INTENT_B} still defined.`);
        console.log("Principle verification: Referential integrity invariant upheld. Cannot undefine an intent that is in use.");

        console.log("STEP 6: Undefine INTENT_A (no longer in use).");
        await resourceIntent.undefineIntent({ intentName: INTENT_A });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_B, INTENT_C].sort(), `${INTENT_A} successfully undefined.`);

        console.log("STEP 7: Clean up all remaining resources and intents.");
        await resourceIntent.clearIntent({ resource: RESOURCE_2 });
        await resourceIntent.clearIntent({ resource: RESOURCE_3 });
        await resourceIntent.undefineIntent({ intentName: INTENT_B });
        await resourceIntent.undefineIntent({ intentName: INTENT_C });
        assertEquals(await resourceIntent.listIntents(), [], "All intents undefined.");
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_2 }), null);
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_3 }), null);
        console.log("Final state: All intents and resource associations removed.");

        await client.close();
        console.log("✅ Finished TRACE demonstration\n");
    },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Robustness & concurrency tests",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        console.log("\n=================================================");
        console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
        console.log("=================================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");
        await clearCollections(db); // Ensure clean slate for robustness tests

        console.log("Concurrency: Concurrent 'defineIntent' for the same intent.");
        const defineResults = await Promise.allSettled([
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
        ]);
        assertEquals(defineResults.filter(r => r.status === "fulfilled").length, 1, "Only one defineIntent should succeed.");
        assertEquals(defineResults.filter(r => r.status === "rejected").length, 2, "Concurrent attempts should be rejected.");
        assertEquals(await intentDefinitionsColl.countDocuments({ _id: INTENT_A }), 1, "Only one intent should exist.");

        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        await resourceIntent.defineIntent({ intentName: INTENT_C });
        console.log("\nConcurrency: Concurrent 'setIntent' for the same resource with different intents.");
        const setResults = await Promise.allSettled([
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B }),
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_C }),
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B }), // Add another for B
        ]);
        const finalEntry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
        assertEquals(finalEntry?._id, RESOURCE_1);
        assertEquals([INTENT_B, INTENT_C].includes(finalEntry?.intent as string), true, "Resource should have one of the last-written intents (B or C).");
        assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_1 }), 1, "Only one intent entry should exist due to upsert behavior.");
        console.log(`- Final intent for ${RESOURCE_1} is '${finalEntry?.intent}'. MongoDB handles last write wins.`);

        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_D });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_D });
        console.log("\nConcurrency: Concurrent 'clearIntent' for the same resource.");
        const clearResults = await Promise.allSettled([
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
        ]);
        assertEquals(clearResults.filter(r => r.status === "fulfilled").length, 1, "Only one clearIntent should succeed.");
        assertEquals(clearResults.filter(r => r.status === "rejected").length, 1, "Subsequent clearIntent for non-existent entry should reject.");
        assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_2 }), null, "Intent should be cleared from DB.");

        console.log("\nRobustness: Invalid operations on non-existent data.");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
            Error, `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            "Should reject undefining a non-existent intent.",
        );
        await assertRejects(
            () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
            Error, `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            "Should reject clearing intent for a non-existent resource.",
        );

        console.log("\nRobustness: State consistency after failed operations.");
        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_A });
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_A }),
            Error, `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_A}' is currently in use by resource '${RESOURCE_3}' and cannot be undefined.`,
            "Attempt to undefine in-use intent should fail.",
        );
        assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), true, "INTENT_A should still be defined.");
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_3 }))?.intent, INTENT_A, "RESOURCE_3 should still have INTENT_A.");
        console.log(`- Verified state consistency after failed 'undefineIntent' operation.`);

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
        console.log("🎉 RESOURCEINTENT CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
        console.log("======================================================================\n");
    },
});
```