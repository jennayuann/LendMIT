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
[@Resource](../Resource.md)

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

# response:

```typescript
// src/concepts/Resource.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ResourceConcept, ResourceID, Owner, ResourceDocument } from "./Resource.ts";
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const ownerA = "user123" as Owner;
const ownerB = "orgABC" as Owner;
const ownerC = "user789" as Owner;
const nonExistentOwner = "nonExistent" as Owner;

const resourceName1 = "My First Widget";
const resourceName2 = "Advanced Gizmo";
const resourceName3 = "Legacy Device";
const category1 = "Gadgets";
const category2 = "Electronics";
const description1 = "A revolutionary new product.";
const description2 = "Designed for high-performance applications.";
const emptyString = "";
const whitespaceString = "   ";

// A dummy ID for testing non-existent resources.
// freshID() generates a unique 24-char hex string, so this should not clash.
const nonExistentResourceID = "654321098765432109876543" as ResourceID;

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCE CONCEPT");
console.log("===========================================\n");

// ----------------------------------------------------------------------
// CREATE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'createResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: CREATE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state for this test block

    await t.step("✅ Happy path: Create resource with all optional fields", async () => {
      const resourceID = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );

      // Verify return value
      assertEquals(typeof resourceID, "string");
      assertEquals(resourceID.length, 24); // MongoDB ObjectId string length

      // Verify state in DB
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?._id, resourceID);
      assertEquals(dbEntry?.owner, ownerA);
      assertEquals(dbEntry?.name, resourceName1);
      assertEquals(dbEntry?.category, category1);
      assertEquals(dbEntry?.description, description1);
    });

    await t.step("✅ Happy path: Create resource with only mandatory fields", async () => {
      const resourceID = await resourceConcept.createResource(ownerB, resourceName2);

      // Verify return value
      assertEquals(typeof resourceID, "string");

      // Verify state in DB
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?._id, resourceID);
      assertEquals(dbEntry?.owner, ownerB);
      assertEquals(dbEntry?.name, resourceName2);
      assertEquals(dbEntry?.category, undefined); // Should not exist
      assertEquals(dbEntry?.description, undefined); // Should not exist
    });

    await t.step("✅ Requires violation: Cannot create resource with empty name", async () => {
      await assertRejects(
        () => resourceConcept.createResource(ownerA, emptyString),
        Error,
        "Resource name cannot be empty.",
      );
      // Verify no resource was created
      assertEquals(await coll.countDocuments({ owner: ownerA }), 1); // Only the first one created
    });

    await t.step("✅ Requires violation: Cannot create resource with whitespace name", async () => {
      await assertRejects(
        () => resourceConcept.createResource(ownerA, whitespaceString, category1, description1),
        Error,
        "Resource name cannot be empty.",
      );
      // Verify no resource was created
      assertEquals(await coll.countDocuments({ owner: ownerA }), 1);
    });

    await t.step("✅ Edge case: Owner ID as an empty string", async () => {
      const emptyOwner = "" as Owner;
      const resourceID = await resourceConcept.createResource(emptyOwner, resourceName3);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.owner, emptyOwner);
      assertEquals(dbEntry?.name, resourceName3);
    });

    await t.step("✅ Edge case: Duplicate names are allowed", async () => {
      const name = "Common Name";
      const id1 = await resourceConcept.createResource(ownerA, name);
      const id2 = await resourceConcept.createResource(ownerB, name);

      assertEquals(typeof id1, "string");
      assertEquals(typeof id2, "string");
      assertEquals(id1 !== id2, true); // IDs must be unique

      const entry1 = await coll.findOne({ _id: id1 });
      const entry2 = await coll.findOne({ _id: id2 });

      assertEquals(entry1?.name, name);
      assertEquals(entry2?.name, name);
      assertEquals(entry1?.owner, ownerA);
      assertEquals(entry2?.owner, ownerB);
    });

    await client.close();
    console.log("✅ Finished CREATE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// UPDATE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'updateResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: UPDATE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    let resourceID: ResourceID;

    await t.step("Setup: Create a resource for updates", async () => {
      resourceID = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName1);
      assertEquals(dbEntry?.category, category1);
      assertEquals(dbEntry?.description, description1);
    });

    await t.step("✅ Happy path: Update only the name", async () => {
      await resourceConcept.updateResource(resourceID, resourceName2);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName2);
      assertEquals(dbEntry?.category, category1); // Should remain unchanged
      assertEquals(dbEntry?.description, description1); // Should remain unchanged
    });

    await t.step("✅ Happy path: Update only the category", async () => {
      await resourceConcept.updateResource(resourceID, undefined, category2);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName2); // Should remain unchanged
      assertEquals(dbEntry?.category, category2);
      assertEquals(dbEntry?.description, description1); // Should remain unchanged
    });

    await t.step("✅ Happy path: Update only the description", async () => {
      await resourceConcept.updateResource(resourceID, undefined, undefined, description2);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName2); // Should remain unchanged
      assertEquals(dbEntry?.category, category2); // Should remain unchanged
      assertEquals(dbEntry?.description, description2);
    });

    await t.step("✅ Happy path: Update all fields", async () => {
      await resourceConcept.updateResource(
        resourceID,
        resourceName3,
        category1,
        description1,
      );
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3);
      assertEquals(dbEntry?.category, category1);
      assertEquals(dbEntry?.description, description1);
    });

    await t.step("✅ Happy path: Clear category by setting to null", async () => {
      await resourceConcept.updateResource(resourceID, undefined, null);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.category, undefined); // Should be unset
      assertEquals(dbEntry?.description, description1); // Should remain
    });

    await t.step("✅ Happy path: Clear description by setting to null", async () => {
      await resourceConcept.updateResource(resourceID, undefined, undefined, null);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.category, undefined); // Should remain unset
      assertEquals(dbEntry?.description, undefined); // Should be unset
    });

    await t.step("✅ Requires violation: Cannot update non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(nonExistentResourceID, resourceName2),
        Error,
        `Resource with ID '${nonExistentResourceID}' not found.`,
      );
      // Verify the existing resource is unchanged
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3); // Still the last updated name
    });

    await t.step("✅ Requires violation: Cannot update name to empty string", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(resourceID, emptyString),
        Error,
        "Resource name cannot be updated to an empty string.",
      );
      // Verify name is unchanged
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3);
    });

    await t.step("✅ Requires violation: Cannot update name to whitespace string", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(resourceID, whitespaceString),
        Error,
        "Resource name cannot be updated to an empty string.",
      );
      // Verify name is unchanged
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3);
    });

    await t.step("✅ Edge case: Update with unchanged values (idempotency)", async () => {
      const initialEntry = await coll.findOne({ _id: resourceID });
      await resourceConcept.updateResource(
        resourceID,
        initialEntry?.name,
        initialEntry?.category,
        initialEntry?.description,
      );
      const finalEntry = await coll.findOne({ _id: resourceID });
      assertEquals(finalEntry, initialEntry); // State should be identical
    });

    await t.step("✅ Edge case: Update with no parameters (should still validate resource existence)", async () => {
      const initialEntry = await coll.findOne({ _id: resourceID });
      await resourceConcept.updateResource(resourceID); // No parameters
      const finalEntry = await coll.findOne({ _id: resourceID });
      assertEquals(finalEntry, initialEntry); // State should be identical
    });

    await client.close();
    console.log("✅ Finished UPDATE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// DELETE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'deleteResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DELETE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    let resourceID: ResourceID;

    await t.step("Setup: Create a resource for deletion", async () => {
      resourceID = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );
      assertEquals(await coll.countDocuments({ _id: resourceID }), 1);
    });

    await t.step("✅ Happy path: Delete an existing resource", async () => {
      await resourceConcept.deleteResource(resourceID);

      // Verify resource is gone from DB
      assertEquals(await coll.countDocuments({ _id: resourceID }), 0);

      // Verify getResource now fails
      await assertRejects(
        () => resourceConcept.getResource(resourceID),
        Error,
        `Resource with ID '${resourceID}' not found.`,
      );
    });

    await t.step("✅ Requires violation: Cannot delete non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.deleteResource(nonExistentResourceID),
        Error,
        `Resource with ID '${nonExistentResourceID}' not found.`,
      );
      // Verify no other resources were affected
      assertEquals(await coll.countDocuments({}), 0); // Should still be 0 after setup and deletion
    });

    await t.step("✅ Idempotency: Attempt to delete an already deleted resource", async () => {
      // Create and delete a resource once
      const tempID = await resourceConcept.createResource(ownerB, "Temp Resource");
      await resourceConcept.deleteResource(tempID);
      assertEquals(await coll.countDocuments({ _id: tempID }), 0);

      // Attempt to delete again
      await assertRejects(
        () => resourceConcept.deleteResource(tempID),
        Error,
        `Resource with ID '${tempID}' not found.`,
      );
    });

    await client.close();
    console.log("✅ Finished DELETE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// GET RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'getResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: GET RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    let resourceIDWithAllFields: ResourceID;
    let resourceIDMandatoryOnly: ResourceID;
    let resourceIDClearedFields: ResourceID;

    await t.step("Setup: Create resources for retrieval", async () => {
      resourceIDWithAllFields = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );
      resourceIDMandatoryOnly = await resourceConcept.createResource(ownerB, resourceName2);
      resourceIDClearedFields = await resourceConcept.createResource(
        ownerC,
        resourceName3,
        category2,
        description2,
      );
      await resourceConcept.updateResource(resourceIDClearedFields, undefined, null, null); // Clear optional fields
    });

    await t.step("✅ Happy path: Retrieve resource with all fields", async () => {
      const resource = await resourceConcept.getResource(resourceIDWithAllFields);
      assertEquals(resource.id, resourceIDWithAllFields);
      assertEquals(resource.owner, ownerA);
      assertEquals(resource.name, resourceName1);
      assertEquals(resource.category, category1);
      assertEquals(resource.description, description1);
    });

    await t.step("✅ Happy path: Retrieve resource with only mandatory fields", async () => {
      const resource = await resourceConcept.getResource(resourceIDMandatoryOnly);
      assertEquals(resource.id, resourceIDMandatoryOnly);
      assertEquals(resource.owner, ownerB);
      assertEquals(resource.name, resourceName2);
      assertEquals(resource.category, undefined);
      assertEquals(resource.description, undefined);
    });

    await t.step("✅ Happy path: Retrieve resource with cleared optional fields", async () => {
      const resource = await resourceConcept.getResource(resourceIDClearedFields);
      assertEquals(resource.id, resourceIDClearedFields);
      assertEquals(resource.owner, ownerC);
      assertEquals(resource.name, resourceName3);
      assertEquals(resource.category, undefined);
      assertEquals(resource.description, undefined);
    });

    await t.step("✅ Requires violation: Retrieve non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.getResource(nonExistentResourceID),
        Error,
        `Resource with ID '${nonExistentResourceID}' not found.`,
      );
    });

    await t.step("✅ Edge case: Retrieve after deletion", async () => {
      const tempID = await resourceConcept.createResource(ownerA, "To Be Deleted");
      await resourceConcept.deleteResource(tempID);
      await assertRejects(
        () => resourceConcept.getResource(tempID),
        Error,
        `Resource with ID '${tempID}' not found.`,
      );
    });

    await t.step("✅ Idempotency: Repeatedly retrieving the same resource", async () => {
      const resource1 = await resourceConcept.getResource(resourceIDWithAllFields);
      const resource2 = await resourceConcept.getResource(resourceIDWithAllFields);
      assertEquals(resource1, resource2);
    });

    await client.close();
    console.log("✅ Finished GET RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST (Principle Verification)
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    const newOwner = "traceUser" as Owner;
    const initialName = "My Trace Resource";
    const initialCategory = "Trace Category";
    const initialDescription = "Description for trace test.";

    console.log("Trace Step 1: Create a new resource.");
    const resourceID = await resourceConcept.createResource(
      newOwner,
      initialName,
      initialCategory,
      initialDescription,
    );
    const createdResource = await resourceConcept.getResource(resourceID);
    assertEquals(createdResource.id, resourceID);
    assertEquals(createdResource.owner, newOwner);
    assertEquals(createdResource.name, initialName);
    assertEquals(createdResource.category, initialCategory);
    assertEquals(createdResource.description, initialDescription);
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 2: Update its name and clear its description.");
    const updatedName = "Updated Trace Resource Name";
    await resourceConcept.updateResource(resourceID, updatedName, undefined, null);
    const updatedResource1 = await resourceConcept.getResource(resourceID);
    assertEquals(updatedResource1.name, updatedName);
    assertEquals(updatedResource1.category, initialCategory); // Category should be unchanged
    assertEquals(updatedResource1.description, undefined); // Description should be cleared
    assertEquals(updatedResource1.owner, newOwner); // Owner cannot be changed by updateResource
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 3: Update its category and verify the state.");
    const newCategory = "New Category";
    await resourceConcept.updateResource(resourceID, undefined, newCategory);
    const updatedResource2 = await resourceConcept.getResource(resourceID);
    assertEquals(updatedResource2.name, updatedName);
    assertEquals(updatedResource2.category, newCategory);
    assertEquals(updatedResource2.description, undefined);
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 4: Attempt to update with an empty name (should fail).");
    const nameBeforeFailedUpdate = (await coll.findOne({ _id: resourceID }))?.name;
    await assertRejects(
      () => resourceConcept.updateResource(resourceID, emptyString),
      Error,
      "Resource name cannot be updated to an empty string.",
    );
    const resourceAfterFailedUpdate = await resourceConcept.getResource(resourceID);
    assertEquals(resourceAfterFailedUpdate.name, nameBeforeFailedUpdate); // Name should be unchanged
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 5: Delete the resource.");
    await resourceConcept.deleteResource(resourceID);
    assertEquals(await coll.countDocuments({}), 0);

    console.log("Trace Step 6: Verify resource is no longer retrievable.");
    await assertRejects(
      () => resourceConcept.getResource(resourceID),
      Error,
      `Resource with ID '${resourceID}' not found.`,
    );

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Robustness tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    // Scenario 1: Concurrent creation with same data (should yield unique resources)
    console.log("Robustness: Concurrent creations with identical input (different IDs expected)");
    const promise1 = resourceConcept.createResource(ownerA, resourceName1, category1);
    const promise2 = resourceConcept.createResource(ownerA, resourceName1, category1);
    const [id1, id2] = await Promise.all([promise1, promise2]);

    assertEquals(id1 !== id2, true); // IDs must be unique
    assertEquals(await coll.countDocuments({ name: resourceName1 }), 2);

    const res1 = await resourceConcept.getResource(id1);
    const res2 = await resourceConcept.getResource(id2);
    assertEquals(res1.name, resourceName1);
    assertEquals(res2.name, resourceName1);
    assertEquals(res1.owner, ownerA);
    assertEquals(res2.owner, ownerA);
    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 2: Concurrent updates to the same resource (race condition)
    console.log("Robustness: Concurrent updates to the same resource");
    const concurrentResourceID = await resourceConcept.createResource(ownerA, "Initial Name");
    await coll.deleteMany({}); // Clean for next scenario

    const resID = await resourceConcept.createResource(ownerA, "Initial Name");

    const updatePromise1 = resourceConcept.updateResource(resID, "Updated by A");
    const updatePromise2 = resourceConcept.updateResource(resID, "Updated by B");

    await Promise.allSettled([updatePromise1, updatePromise2]);

    const finalResource = await resourceConcept.getResource(resID);
    // Due to MongoDB's atomic `updateOne` and single operation per call,
    // one of the updates will "win" and the other will succeed with its value,
    // or if the updates were identical, both would effectively succeed.
    // The exact final state (A or B) depends on execution order, but the operation itself is robust.
    assertEquals([resourceName1, "Updated by A", "Updated by B"].includes(finalResource.name), true);
    assertEquals(await coll.countDocuments({}), 1);
    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 3: Attempting to delete a resource that is concurrently being deleted (one succeeds, others fail)
    console.log("Robustness: Concurrent deletion attempts");
    const resourceToDeleteID = await resourceConcept.createResource(ownerA, "Resource to Delete");

    const deletePromise1 = resourceConcept.deleteResource(resourceToDeleteID);
    const deletePromise2 = resourceConcept.deleteResource(resourceToDeleteID);
    const deletePromise3 = resourceConcept.deleteResource(resourceToDeleteID);

    const deleteResults = await Promise.allSettled([deletePromise1, deletePromise2, deletePromise3]);

    const fulfilledDeletes = deleteResults.filter(r => r.status === "fulfilled").length;
    const rejectedDeletes = deleteResults.filter(r => r.status === "rejected").length;

    assertEquals(fulfilledDeletes, 1);
    assertEquals(rejectedDeletes, 2);
    assertEquals(await coll.countDocuments({ _id: resourceToDeleteID }), 0); // Must be deleted

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
    console.log("\n======================================================================");
    console.log("🎉 RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
    console.log("========================================================================\n");
  },
});
```