# Task: Use the following test guide and implementation of a concept to implement a comprehensive Deno test file for the given concept implementation.

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
[@NotificationLog](../NotificationLog.md)

## Implementation of concept to write tests for:
```
// src/concepts/Resource.ts

  

import { Collection, Db } from "mongodb";

// Assuming these utilities are available as per guide instructions

import { ID, Empty } from "@utils/types.ts";

import { freshID } from "@utils/database.ts";

// Import the db instance from the connection file

import { db } from "@/db/connection.ts";

  

// -----------------------------------------------------------------------------

// Type Definitions

// -----------------------------------------------------------------------------

  

/**

* Type representing a unique identifier for a Resource.

*/

export type ResourceID = ID;

  

/**

* Type representing the owner's identifier.

*/

export type Owner = ID;

  

/**

* Interface for a Resource entity as stored in the MongoDB `resources` collection.

* This includes the internal `_id` field.

*/

export interface ResourceDocument {

_id: ResourceID; // MongoDB document ID, branded as ResourceID

owner: Owner; // Owner of the resource

name: string; // Mandatory name of the resource

category?: string; // Optional category

description?: string; // Optional description

}

  

/**

* Interface for a Resource entity as returned by public methods.

* This uses `id` instead of `_id` to align with the concept specification.

*/

export interface Resource {

id: ResourceID;

owner: Owner;

name: string;

category?: string;

description?: string;

}

  

// -----------------------------------------------------------------------------

// Resource Class Implementation

// -----------------------------------------------------------------------------

  

/**

* Implements the Resource concept.

*

* purpose: Represent any generic entity that can be owned and described by a mandatory name and optional attributes.

* principle: An owner can create a resource, which is then uniquely identified and named,

* and its descriptive attributes can be retrieved or modified.

*/

export class ResourceConcept {

private resources: Collection<ResourceDocument>;

  

constructor(private readonly database: Db) {

this.resources = this.database.collection<ResourceDocument>("resources");

}

  

/**

* Creates a new `Resource` entry.

*

* @param owner The ID of the owner of the resource.

* @param name The mandatory name of the resource.

* @param category An optional category for the resource.

* @param description An optional description for the resource.

*

* @requires `name is not an empty string`.

* @effects Creates a new `Resource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`.

* Returns the `id` of the newly created resource.

*

* @returns The `id` of the newly created resource (`ResourceID`).

* @throws Error if the `name` is an empty string.

*/

async createResource(

owner: Owner,

name: string,

category?: string,

description?: string,

): Promise<ResourceID> {

// Enforce "requires" condition: `name is not an empty string`.

if (!name || name.trim() === "") {

throw new Error("Resource name cannot be empty.");

}

  

const newResource: ResourceDocument = {

_id: freshID() as ResourceID, // Generate a fresh unique ID and brand it as ResourceID

owner,

name,

// Only include category/description fields if they are explicitly provided (not undefined).

// If null is provided, it will be stored as null.

...(category !== undefined && { category }),

...(description !== undefined && { description }),

};

  

await this.resources.insertOne(newResource);

  

return newResource._id;

}

  

/**

* Updates an existing `Resource` entry.

*

* @param resourceID The `id` of the resource to update.

* @param name An optional new name for the resource. If provided and not empty, updates the name.

* @param category An optional new category for the resource. If `null`, clears the existing category.

* @param description An optional new description for the resource. If `null`, clears the existing description.

*

* @requires

* - A `Resource` entry with `id = resourceID` exists.

* - If `name` is provided (i.e., not `undefined`), `name is not an empty string`.

* @effects

* - If `name` is provided and is not an empty string, updates the `name` for the given `resourceID`.

* - If `category` is provided, updates the `category` for the given `resourceID`. If `null` is provided, it clears the existing `category`.

* - If `description` is provided, updates the `description` for the given `resourceID`. If `null` is provided, it clears the existing `description`.

*

* @returns An empty object (`Empty`).

* @throws Error if a resource with the given `resourceID` does not exist.

* @throws Error if `name` is provided but is an empty string.

*/

async updateResource(

resourceID: ResourceID,

name?: string,

category?: string | null,

description?: string | null,

): Promise<Empty> {

// Enforce "requires" condition: If `name` is provided, `name is not an empty string`.

if (name !== undefined && name.trim() === "") {

throw new Error("Resource name cannot be updated to an empty string.");

}

  

const updateOperations: { $set?: Partial<ResourceDocument>; $unset?: any } = {};

const $set: Partial<ResourceDocument> = {};

const $unset: any = {};

  

if (name !== undefined) {

$set.name = name;

}

if (category !== undefined) {

if (category === null) {

$unset.category = ""; // Value for $unset doesn't matter, only its existence

} else {

$set.category = category;

}

}

if (description !== undefined) {

if (description === null) {

$unset.description = "";

} else {

$set.description = description;

}

}

  

if (Object.keys($set).length > 0) {

updateOperations.$set = $set;

}

if (Object.keys($unset).length > 0) {

updateOperations.$unset = $unset;

}

  

// If no update operations were constructed (meaning no parameters were provided

// that would result in a database change), we still need to check if the

// resource exists to satisfy the "requires" condition. This is a no-op update.

if (Object.keys(updateOperations).length === 0) {

const exists = await this.resources.countDocuments({ _id: resourceID }, { limit: 1 });

if (exists === 0) {

throw new Error(`Resource with ID '${resourceID}' not found.`);

}

return {}; // Resource exists, but no changes were requested.

}

  

// Perform the atomic update. `matchedCount` ensures resource existence at the time of update.

const result = await this.resources.updateOne(

{ _id: resourceID },

updateOperations,

);

  

if (result.matchedCount === 0) {

// If matchedCount is 0, the resource either never existed or was deleted concurrently.

throw new Error(`Resource with ID '${resourceID}' not found.`);

}

  

return {};

}

  

/**

* Deletes a `Resource` entry.

*

* @param resourceID The `id` of the resource to delete.

*

* @requires A `Resource` entry with `id = resourceID` exists.

* @effects Deletes the `Resource` entry corresponding to `resourceID`.

*

* @returns An empty object (`Empty`).

* @throws Error if a resource with the given `resourceID` does not exist.

*/

async deleteResource(resourceID: ResourceID): Promise<Empty> {

// Enforce "requires" condition: A `Resource` entry with `id = resourceID` exists.

const result = await this.resources.deleteOne({ _id: resourceID });

  

if (result.deletedCount === 0) {

throw new Error(`Resource with ID '${resourceID}' not found.`);

}

  

return {};

}

  

/**

* Retrieves the complete `Resource` object associated with a given `resourceID`.

*

* @param resourceID The `id` of the resource to retrieve.

*

* @requires A `Resource` entry with `id = resourceID` exists.

* @effects Returns the complete `Resource` object associated with this `resourceID`.

*

* @returns The complete `Resource` object.

* @throws Error if a resource with the given `resourceID` does not exist.

*/

async getResource(resourceID: ResourceID): Promise<Resource> {

// Enforce "requires" condition: A `Resource` entry with `id = resourceID` exists.

const resourceDoc = await this.resources.findOne({ _id: resourceID });

  

if (!resourceDoc) {

throw new Error(`Resource with ID '${resourceID}' not found.`);

}

  

// Convert the internal ResourceDocument (_id) to the public Resource (id) format

const { _id, ...rest } = resourceDoc;

return { id: _id, ...rest };

}

}

  

export const resource = new ResourceConcept(db);
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
