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
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Following } from "@concepts/Following.ts";

Deno.test("Following concept", async () => {
  const [db, client] = await testDb();
  const following = new Following(db);

  // ✅ Happy path
  await following.follow("userA", "userB");
  const { isFollowing } = await following.isFollowing("userA", "userB");
  assertEquals(isFollowing, true);

  // Requires violation
  await assertRejects(() => following.follow("userA", "userA"), Error, "Cannot follow yourself.");

  // Edge case: unfollowing someone not followed
  await assertRejects(() => following.unfollow("userA", "userC"), Error);

  // # trace: Demonstrates the full principle
  await following.follow("userB", "userC");
  await following.unfollow("userA", "userB");
  const result = await following.getFollowers("userC");
  assertEquals(result.followerIDs.includes("userB"), true);

  await client.close();
});
```

## Guide for testing concepts:
[@testing-concepts](../../../background/testing-concepts.md)

## Concept to write tests for:
[@Following](../Following.md)

## Implementation of concept to write tests for:
```
// src/concepts/Following.ts

  

// deno-lint-ignore no-import-prefix

import { Collection, Db, MongoServerError } from "npm:mongodb";

import { ID, Empty } from "@/utils/types.ts";

import { freshID } from "@/utils/database.ts"; // Assuming freshID is provided as per guide

import { db } from "@/db/connection.ts"; // Import the pre-established MongoDB connection

  

/**

* @concept Following [Follower, Followee]

* @purpose Establish and manage a unidirectional "following" relationship between any two generic entities.

* @principle A follower can choose to initiate a following relationship with a followee, and later terminate it,

* with the relationship's existence accurately reflected in the system.

*/

  

// Generic types for this concept

type Follower = ID;

type Followee = ID;

  

/**

* Represents a unidirectional following relationship in the database.

* @state a set of FollowRelationships with

* follower Follower

* followee Followee

*/

interface FollowRelationship {

_id: ID; // Unique ID for the relationship document itself

follower: Follower;

followee: Followee;

}

  

// MongoDB collection name, plural form of the concept's state name

const COLLECTION_NAME = "followrelationships";

  

export class Following {

private followRelationships: Collection<FollowRelationship>;

  

constructor(private readonly database: Db) {

this.followRelationships = this.database.collection(COLLECTION_NAME);

this._ensureIndexes(); // Ensure necessary indexes are created on initialization

}

  

/**

* Ensures that the unique compound index for follower-followee relationships exists.

* This helps enforce the 'requires' condition for the `follow` action at the database level.

*/

private async _ensureIndexes(): Promise<void> {

try {

await this.followRelationships.createIndex(

{ follower: 1, followee: 1 },

{ unique: true, name: "follower_followee_unique" },

);

console.log(`✅ Index 'follower_followee_unique' ensured for collection '${COLLECTION_NAME}'`);

} catch (error) {

console.error(

`Failed to ensure index 'follower_followee_unique' for collection '${COLLECTION_NAME}':`,

error,

);

// Depending on the application's robustness needs, you might want to rethrow

// or handle this more gracefully, but for now, logging is sufficient.

}

}

  

/**

* Initiates a following relationship between a follower and a followee.

* @action follow (follower: Follower, followee: Followee): Empty

* @requires No `FollowRelationship` already exists where `follower` follows `followee`.

* @effects Creates a new `FollowRelationship` entry for `follower` and `followee`.

*/

async follow(follower: Follower, followee: Followee): Promise<Empty> {

if (follower === followee) {

throw new Error("Cannot follow yourself.");

}

  

try {

const newRelationship: FollowRelationship = {

_id: freshID(), // Generate a unique ID for this relationship document

follower,

followee,

};

  

await this.followRelationships.insertOne(newRelationship);

return {};

} catch (error) {

if (

error instanceof MongoServerError && error.code === 11000 // Duplicate key error

) {

throw new Error(

`Follower '${follower}' is already following followee '${followee}'.`,

);

}

throw error; // Re-throw other unexpected errors

}

}

  

/**

* Terminates an existing following relationship.

* @action unfollow (follower: Follower, followee: Followee): Empty

* @requires A `FollowRelationship` exists where `follower` follows `followee`.

* @effects Deletes the `FollowRelationship` entry for `follower` and `followee`.

*/

async unfollow(follower: Follower, followee: Followee): Promise<Empty> {

const result = await this.followRelationships.deleteOne({

follower,

followee,

});

  

if (result.deletedCount === 0) {

throw new Error(

`No existing follow relationship found between follower '${follower}' and followee '${followee}'.`,

);

}

  

return {};

}

  

/**

* Checks if a specific follower is following a specific followee.

* @action isFollowing (follower: Follower, followee: Followee): (isFollowing: Boolean)

* @effects Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.

*/

async isFollowing(

follower: Follower,

followee: Followee,

): Promise<{ isFollowing: boolean }> {

const relationship = await this.followRelationships.findOne(

{ follower, followee },

{ projection: { _id: 1 } }, // Only project _id for efficiency

);

return { isFollowing: !!relationship };

}

  

/**

* Retrieves a list of all Followee IDs that the given follower is following.

* @action getFollowees (follower: Follower): (followeeIDs: Followee[])

* @effects Returns a list of all `Followee` IDs that the `follower` is following.

*/

async getFollowees(follower: Follower): Promise<{ followeeIDs: Followee[] }> {

const followees = await this.followRelationships.find(

{ follower },

{ projection: { followee: 1, _id: 0 } }, // Project only the followee ID

).map((doc) => doc.followee)

.toArray();

  

return { followeeIDs: followees };

}

  

/**

* Retrieves a list of all Follower IDs that are following the given followee.

* @action getFollowers (followee: Followee): (followerIDs: Follower[])

* @effects Returns a list of all `Follower` IDs that are following the `followee`.

*/

async getFollowers(followee: Followee): Promise<{ followerIDs: Follower[] }> {

const followers = await this.followRelationships.find(

{ followee },

{ projection: { follower: 1, _id: 0 } }, // Project only the follower ID

).map((doc) => doc.follower)

.toArray();

  

return { followerIDs: followers };

}

}

  

// Export the instantiated class

export const following = new Following(db);
```

## utils/database.ts:
```
// This import loads the `.env` file as environment variables

// deno-lint-ignore no-import-prefix

import "jsr:@std/dotenv/load";

// deno-lint-ignore no-import-prefix

import { Db, MongoClient } from "npm:mongodb";

import { ID } from "@utils/types.ts";

// deno-lint-ignore no-import-prefix

import { generate } from "jsr:@std/uuid/unstable-v7";

  

async function initMongoClient() {

const DB_CONN = Deno.env.get("MONGODB_URL");

if (DB_CONN === undefined) {

throw new Error("Could not find environment variable: MONGODB_URL");

}

const client = new MongoClient(DB_CONN);

try {

await client.connect();

} catch (e) {

throw new Error("MongoDB connection failed: " + e);

}

return client;

}

  

async function init() {

const client = await initMongoClient();

const DB_NAME = Deno.env.get("DB_NAME");

if (DB_NAME === undefined) {

throw new Error("Could not find environment variable: DB_NAME");

}

return [client, DB_NAME] as [MongoClient, string];

}

  

async function dropAllCollections(db: Db): Promise<void> {

try {

// Get all collection names

const collections = await db.listCollections().toArray();

  

// Drop each collection

for (const collection of collections) {

await db.collection(collection.name).drop();

}

} catch (error) {

console.error("Error dropping collections:", error);

throw error;

}

}

  

/**

* MongoDB database configured by .env

* @returns {[Db, MongoClient]} initialized database and client

*/

export async function getDb() {

const [client, DB_NAME] = await init();

return [client.db(DB_NAME), client];

}

  

/**

* Test database initialization

* @returns {[Db, MongoClient]} initialized test database and client

*/

export async function testDb() {

const [client, DB_NAME] = await init();

const test_DB_NAME = `test-${DB_NAME}`;

const test_Db = client.db(test_DB_NAME);

await dropAllCollections(test_Db);

return [test_Db, client] as [Db, MongoClient];

}

  

/**

* Creates a fresh ID.

* @returns {ID} UUID v7 generic ID.

*/

export function freshID() {

return generate() as ID;

}
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
// src/concepts/Following.test.ts

import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Following } from "@concepts/Following.ts";
import { Collection } from "npm:mongodb"; // For direct DB inspection if needed

// Define test IDs
const userA = "userA";
const userB = "userB";
const userC = "userC";
const userD = "userD";
const nonExistentUser = "nonExistentUser";

Deno.test("Following concept: Unit tests for 'follow' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);
  const followRelationshipsCollection: Collection = db.collection("followrelationships");

  await t.step("✅ Happy path: A user follows another user", async () => {
    await following.follow(userA, userB);

    // Effects verification
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, true, "userA should be following userB");

    const { followeeIDs } = await following.getFollowees(userA);
    assertEquals(followeeIDs.includes(userB), true, "userA's followees should include userB");

    const { followerIDs } = await following.getFollowers(userB);
    assertEquals(followerIDs.includes(userA), true, "userB's followers should include userA");

    // State verification: directly check the database collection
    const dbEntry = await followRelationshipsCollection.findOne({
      follower: userA,
      followee: userB,
    });
    assertEquals(dbEntry?.follower, userA, "DB entry should exist with correct follower");
    assertEquals(dbEntry?.followee, userB, "DB entry should exist with correct followee");
  });

  await t.step("❌ Requires violation: Cannot follow yourself", async () => {
    await assertRejects(
      () => following.follow(userA, userA),
      Error,
      "Cannot follow yourself.",
      "Should reject when a user tries to follow themselves",
    );
  });

  await t.step(
    "❌ Requires violation: Cannot follow someone who is already followed (duplicate)",
    async () => {
      await following.follow(userA, userC); // Establish initial follow
      await assertRejects(
        () => following.follow(userA, userC),
        Error,
        `Follower '${userA}' is already following followee '${userC}'.`,
        "Should reject when trying to follow an already followed user",
      );

      // Verify state remains consistent after failed operation
      const { isFollowing } = await following.isFollowing(userA, userC);
      assertEquals(isFollowing, true, "userA should still be following userC");
      const count = await followRelationshipsCollection.countDocuments({
        follower: userA,
        followee: userC,
      });
      assertEquals(count, 1, "Only one follow relationship should exist in DB");
    },
  );

  await t.step("🧩 Edge case: Following with empty string IDs", async () => {
    const emptyID = "";
    await following.follow(emptyID, userD);
    const { isFollowing } = await following.isFollowing(emptyID, userD);
    assertEquals(isFollowing, true, "Should be able to follow with an empty string as follower ID");

    await following.follow(userD, emptyID);
    const { isFollowing: isFollowingEmptyFollowee } = await following.isFollowing(
      userD,
      emptyID,
    );
    assertEquals(
      isFollowingEmptyFollowee,
      true,
      "Should be able to follow with an empty string as followee ID",
    );
  });

  await client.close();
});

Deno.test("Following concept: Unit tests for 'unfollow' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);
  const followRelationshipsCollection: Collection = db.collection("followrelationships");

  await t.step("✅ Happy path: A user unfollows another user", async () => {
    await following.follow(userA, userB); // Establish follow first
    await following.unfollow(userA, userB);

    // Effects verification
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, false, "userA should no longer be following userB");

    const { followeeIDs } = await following.getFollowees(userA);
    assertEquals(
      followeeIDs.includes(userB),
      false,
      "userA's followees should not include userB",
    );

    const { followerIDs } = await following.getFollowers(userB);
    assertEquals(
      followerIDs.includes(userA),
      false,
      "userB's followers should not include userA",
    );

    // State verification: directly check the database collection
    const dbEntry = await followRelationshipsCollection.findOne({
      follower: userA,
      followee: userB,
    });
    assertEquals(dbEntry, null, "DB entry for A-B follow should not exist");
  });

  await t.step(
    "❌ Requires violation: Cannot unfollow someone who is not followed",
    async () => {
      // userA is not following userC
      await assertRejects(
        () => following.unfollow(userA, userC),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${userC}'.`,
        "Should reject when trying to unfollow a non-existent relationship",
      );

      // Verify state remains consistent after failed operation
      const count = await followRelationshipsCollection.countDocuments({});
      assertEquals(count, 0, "No relationships should have been created or deleted");
    },
  );

  await t.step(
    "🧩 Edge case: Unfollowing a user that was never followed (idempotency check)",
    async () => {
      // Attempt to unfollow userA from userB, where no initial follow occurred.
      // This is the same as the "Requires violation" above, confirming consistent behavior.
      await assertRejects(
        () => following.unfollow(userA, userB),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${userB}'.`,
        "Should consistently reject unfollowing a non-existent relationship",
      );
    },
  );

  await t.step(
    "Robustness: Unfollowing with non-existent IDs should reject correctly",
    async () => {
      await assertRejects(
        () => following.unfollow(nonExistentUser, userA),
        Error,
        `No existing follow relationship found between follower '${nonExistentUser}' and followee '${userA}'.`,
        "Should reject if follower does not exist in any relationship",
      );
      await assertRejects(
        () => following.unfollow(userA, nonExistentUser),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${nonExistentUser}'.`,
        "Should reject if followee does not exist in any relationship",
      );
    },
  );

  await client.close();
});

Deno.test("Following concept: Unit tests for 'isFollowing' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("✅ Happy path: Check true for an existing follow relationship", async () => {
    await following.follow(userA, userB);
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, true, "isFollowing should return true for an active follow");
  });

  await t.step("Negative path: Check false for a non-existent follow relationship", async () => {
    const { isFollowing } = await following.isFollowing(userA, userC);
    assertEquals(isFollowing, false, "isFollowing should return false for a non-existent follow");
  });

  await t.step("Edge case: Check false after unfollowing", async () => {
    await following.follow(userA, userD);
    await following.unfollow(userA, userD);
    const { isFollowing } = await following.isFollowing(userA, userD);
    assertEquals(isFollowing, false, "isFollowing should return false after unfollowing");
  });

  await t.step("Edge case: Check false for self-follow attempt", async () => {
    // Even though `follow` prevents self-follow, `isFollowing` should correctly report false
    const { isFollowing } = await following.isFollowing(userA, userA);
    assertEquals(isFollowing, false, "isFollowing should be false for a self-follow check");
  });

  await t.step("Edge case: Check with non-existent users", async () => {
    const { isFollowing: nonExistentFollower } = await following.isFollowing(
      nonExistentUser,
      userB,
    );
    assertEquals(
      nonExistentFollower,
      false,
      "isFollowing should be false if follower does not exist",
    );
    const { isFollowing: nonExistentFollowee } = await following.isFollowing(
      userA,
      nonExistentUser,
    );
    assertEquals(
      nonExistentFollowee,
      false,
      "isFollowing should be false if followee does not exist",
    );
  });

  await client.close();
});

Deno.test("Following concept: Unit tests for 'getFollowees' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("✅ Happy path: Get multiple followees for a user", async () => {
    await following.follow(userA, userB);
    await following.follow(userA, userC);
    const { followeeIDs } = await following.getFollowees(userA);
    assertEquals(
      followeeIDs.sort(),
      [userB, userC].sort(),
      "Should return all followees for userA",
    );
  });

  await t.step("Edge case: Get followees for a user with no followees", async () => {
    const { followeeIDs } = await following.getFollowees(userD);
    assertEquals(followeeIDs, [], "Should return an empty array for a user with no followees");
  });

  await t.step("Edge case: Get followees for a non-existent user", async () => {
    const { followeeIDs } = await following.getFollowees(nonExistentUser);
    assertEquals(followeeIDs, [], "Should return an empty array for a non-existent user");
  });

  await t.step("State verification: After unfollowing, list should update", async () => {
    await following.follow(userB, userA);
    await following.follow(userB, userC);
    await following.unfollow(userB, userA);
    const { followeeIDs } = await following.getFollowees(userB);
    assertEquals(followeeIDs, [userC], "List should update after unfollowing");
  });

  await client.close();
});

Deno.test("Following concept: Unit tests for 'getFollowers' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("✅ Happy path: Get multiple followers for a user", async () => {
    await following.follow(userA, userC);
    await following.follow(userB, userC);
    const { followerIDs } = await following.getFollowers(userC);
    assertEquals(
      followerIDs.sort(),
      [userA, userB].sort(),
      "Should return all followers for userC",
    );
  });

  await t.step("Edge case: Get followers for a user with no followers", async () => {
    const { followerIDs } = await following.getFollowers(userD);
    assertEquals(followerIDs, [], "Should return an empty array for a user with no followers");
  });

  await t.step("Edge case: Get followers for a non-existent user", async () => {
    const { followerIDs } = await following.getFollowers(nonExistentUser);
    assertEquals(followerIDs, [], "Should return an empty array for a non-existent user");
  });

  await t.step("State verification: After unfollowing, list should update", async () => {
    await following.follow(userA, userD);
    await following.follow(userB, userD);
    await following.unfollow(userA, userD);
    const { followerIDs } = await following.getFollowers(userD);
    assertEquals(followerIDs, [userB], "List should update after unfollowing");
  });

  await client.close();
});

Deno.test("Following concept: # trace: Demonstrates the full principle", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("Initial state: No one is following anyone", async () => {
    assertEquals((await following.getFollowees(userA)).followeeIDs, []);
    assertEquals((await following.getFollowers(userB)).followerIDs, []);
  });

  await t.step("UserA follows UserB and UserC", async () => {
    await following.follow(userA, userB);
    await following.follow(userA, userC);

    assertEquals((await following.isFollowing(userA, userB)).isFollowing, true);
    assertEquals((await following.isFollowing(userA, userC)).isFollowing, true);
    assertEquals((await following.getFollowees(userA)).followeeIDs.sort(), [userB, userC].sort());
    assertEquals((await following.getFollowers(userB)).followerIDs, [userA]);
    assertEquals((await following.getFollowers(userC)).followerIDs, [userA]);
  });

  await t.step("UserD follows UserB", async () => {
    await following.follow(userD, userB);

    assertEquals((await following.isFollowing(userD, userB)).isFollowing, true);
    assertEquals((await following.getFollowees(userD)).followeeIDs, [userB]);
    assertEquals((await following.getFollowers(userB)).followerIDs.sort(), [userA, userD].sort());
  });

  await t.step("UserA unfollows UserB", async () => {
    await following.unfollow(userA, userB);

    assertEquals((await following.isFollowing(userA, userB)).isFollowing, false);
    assertEquals((await following.getFollowees(userA)).followeeIDs, [userC]); // UserC still followed
    assertEquals((await following.getFollowers(userB)).followerIDs, [userD]); // UserD still follows B
  });

  await t.step("UserD unfollows UserB", async () => {
    await following.unfollow(userD, userB);

    assertEquals((await following.isFollowing(userD, userB)).isFollowing, false);
    assertEquals((await following.getFollowees(userD)).followeeIDs, []);
    assertEquals((await following.getFollowers(userB)).followerIDs, []); // No one follows B now
  });

  await t.step("Final state: Only UserA still follows UserC", async () => {
    assertEquals((await following.getFollowees(userA)).followeeIDs, [userC]);
    assertEquals((await following.getFollowers(userC)).followerIDs, [userA]);
    assertEquals((await following.getFollowers(userB)).followerIDs, []);
    assertEquals((await following.getFollowees(userB)).followeeIDs, []);
  });

  await client.close();
});

Deno.test("Following concept: Robustness tests", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);
  const followRelationshipsCollection: Collection = db.collection("followrelationships");

  await t.step("Concurrency-like scenario: Multiple simultaneous follow attempts (one should fail)", async () => {
    // These two operations will likely hit the unique index constraint.
    const results = await Promise.allSettled([
      following.follow(userA, userB),
      following.follow(userA, userB), // This one should fail due to unique index
    ]);

    // Expect one fulfilled and one rejected
    assertEquals(results[0].status, "fulfilled", "First follow attempt should succeed");
    assertEquals(results[1].status, "rejected", "Second (duplicate) follow attempt should reject");
    if (results[1].status === "rejected") {
      assertEquals(
        results[1].reason.message,
        `Follower '${userA}' is already following followee '${userB}'.`,
        "Rejected reason message should be correct",
      );
    }

    // Verify state: only one relationship should exist
    const count = await followRelationshipsCollection.countDocuments({
      follower: userA,
      followee: userB,
    });
    assertEquals(count, 1, "Only one follow relationship should exist in the DB");
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, true, "UserA should be following UserB");
  });

  await t.step("Concurrency-like scenario: Multiple simultaneous unfollow attempts (one should fail)", async () => {
    await following.follow(userC, userD); // Establish the relationship first

    const results = await Promise.allSettled([
      following.unfollow(userC, userD),
      following.unfollow(userC, userD), // This one should fail because the relationship is gone
    ]);

    // Expect one fulfilled and one rejected
    assertEquals(results[0].status, "fulfilled", "First unfollow attempt should succeed");
    assertEquals(results[1].status, "rejected", "Second unfollow attempt should reject");
    if (results[1].status === "rejected") {
      assertEquals(
        results[1].reason.message,
        `No existing follow relationship found between follower '${userC}' and followee '${userD}'.`,
        "Rejected reason message should be correct",
      );
    }

    // Verify state: no relationships should exist
    const count = await followRelationshipsCollection.countDocuments({
      follower: userC,
      followee: userD,
    });
    assertEquals(count, 0, "No follow relationship should exist in the DB");
    const { isFollowing } = await following.isFollowing(userC, userD);
    assertEquals(isFollowing, false, "UserC should not be following UserD");
  });

  await t.step("Data consistency after failed operations: Ensure no side effects", async () => {
    await following.follow(userA, userC); // A follows C
    await following.follow(userB, userD); // B follows D

    // Attempt a failed follow (userA already follows userC)
    await assertRejects(
      () => following.follow(userA, userC),
      Error,
      `Follower '${userA}' is already following followee '${userC}'.`,
    );

    // Attempt a failed unfollow (userA does not follow userD)
    await assertRejects(
      () => following.unfollow(userA, userD),
      Error,
      `No existing follow relationship found between follower '${userA}' and followee '${userD}'.`,
    );

    // Verify other relationships are undisturbed
    assertEquals((await following.isFollowing(userA, userC)).isFollowing, true, "A->C should still exist");
    assertEquals((await following.isFollowing(userB, userD)).isFollowing, true, "B->D should still exist");
    assertEquals((await following.isFollowing(userA, userD)).isFollowing, false, "A->D should not exist");
    assertEquals((await following.getFollowees(userA)).followeeIDs, [userC], "A's followees should be correct");
    assertEquals((await following.getFollowers(userD)).followerIDs, [userB], "D's followers should be correct");
  });

  await client.close();
});
```

# New task:
Iterate on your response above now that I added database.ts and types.ts
# response:

```typescript
// src/concepts/Following.test.ts

import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Following } from "@concepts/Following.ts";
import { Collection } from "npm:mongodb"; // For direct DB inspection if needed

// Define test IDs using string literals compatible with the branded ID type
const userA = "userA";
const userB = "userB";
const userC = "userC";
const userD = "userD";
const nonExistentUser = "nonExistentUser"; // Represents an ID that has not been used in the DB

Deno.test("Following concept: Unit tests for 'follow' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);
  const followRelationshipsCollection: Collection = db.collection("followrelationships");

  await t.step("✅ Happy path: A user follows another user", async () => {
    await following.follow(userA, userB);

    // Effects verification
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, true, "userA should be following userB");

    const { followeeIDs } = await following.getFollowees(userA);
    assertEquals(followeeIDs.includes(userB), true, "userA's followees should include userB");

    const { followerIDs } = await following.getFollowers(userB);
    assertEquals(followerIDs.includes(userA), true, "userB's followers should include userA");

    // State verification: directly check the database collection
    const dbEntry = await followRelationshipsCollection.findOne({
      follower: userA,
      followee: userB,
    });
    assertEquals(dbEntry?.follower, userA, "DB entry should exist with correct follower");
    assertEquals(dbEntry?.followee, userB, "DB entry should exist with correct followee");
  });

  await t.step("❌ Requires violation: Cannot follow yourself", async () => {
    await assertRejects(
      () => following.follow(userA, userA),
      Error,
      "Cannot follow yourself.",
      "Should reject when a user tries to follow themselves",
    );
  });

  await t.step(
    "❌ Requires violation: Cannot follow someone who is already followed (duplicate)",
    async () => {
      await following.follow(userA, userC); // Establish initial follow
      await assertRejects(
        () => following.follow(userA, userC),
        Error,
        `Follower '${userA}' is already following followee '${userC}'.`,
        "Should reject when trying to follow an already followed user",
      );

      // Verify state remains consistent after failed operation (only one entry)
      const { isFollowing } = await following.isFollowing(userA, userC);
      assertEquals(isFollowing, true, "userA should still be following userC");
      const count = await followRelationshipsCollection.countDocuments({
        follower: userA,
        followee: userC,
      });
      assertEquals(count, 1, "Only one follow relationship should exist in DB");
    },
  );

  await t.step("🧩 Edge case: Following with empty string IDs", async () => {
    const emptyID = ""; // Valid for ID type (branded string)
    await following.follow(emptyID, userD);
    const { isFollowing } = await following.isFollowing(emptyID, userD);
    assertEquals(isFollowing, true, "Should be able to follow with an empty string as follower ID");

    await following.follow(userD, emptyID);
    const { isFollowing: isFollowingEmptyFollowee } = await following.isFollowing(
      userD,
      emptyID,
    );
    assertEquals(
      isFollowingEmptyFollowee,
      true,
      "Should be able to follow with an empty string as followee ID",
    );
  });

  await client.close();
});

Deno.test("Following concept: Unit tests for 'unfollow' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);
  const followRelationshipsCollection: Collection = db.collection("followrelationships");

  await t.step("✅ Happy path: A user unfollows another user", async () => {
    await following.follow(userA, userB); // Establish follow first
    await following.unfollow(userA, userB);

    // Effects verification
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, false, "userA should no longer be following userB");

    const { followeeIDs } = await following.getFollowees(userA);
    assertEquals(
      followeeIDs.includes(userB),
      false,
      "userA's followees should not include userB",
    );

    const { followerIDs } = await following.getFollowers(userB);
    assertEquals(
      followerIDs.includes(userA),
      false,
      "userB's followers should not include userA",
    );

    // State verification: directly check the database collection
    const dbEntry = await followRelationshipsCollection.findOne({
      follower: userA,
      followee: userB,
    });
    assertEquals(dbEntry, null, "DB entry for A-B follow should not exist");
  });

  await t.step(
    "❌ Requires violation: Cannot unfollow someone who is not followed",
    async () => {
      // userA is not following userC
      await assertRejects(
        () => following.unfollow(userA, userC),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${userC}'.`,
        "Should reject when trying to unfollow a non-existent relationship",
      );

      // Verify state remains consistent after failed operation (no relationships created)
      const count = await followRelationshipsCollection.countDocuments({});
      assertEquals(count, 0, "No relationships should have been created or deleted");
    },
  );

  await t.step(
    "🧩 Edge case: Unfollowing a user that was never followed (idempotency check)",
    async () => {
      // Attempt to unfollow userA from userB, where no initial follow occurred.
      // This is effectively the same as the "Requires violation" above, confirming consistent behavior.
      await assertRejects(
        () => following.unfollow(userA, userB),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${userB}'.`,
        "Should consistently reject unfollowing a non-existent relationship",
      );
    },
  );

  await t.step(
    "Robustness: Unfollowing with non-existent IDs should reject correctly",
    async () => {
      await assertRejects(
        () => following.unfollow(nonExistentUser, userA),
        Error,
        `No existing follow relationship found between follower '${nonExistentUser}' and followee '${userA}'.`,
        "Should reject if follower does not exist in any relationship",
      );
      await assertRejects(
        () => following.unfollow(userA, nonExistentUser),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${nonExistentUser}'.`,
        "Should reject if followee does not exist in any relationship",
      );
    },
  );

  await client.close();
});

Deno.test("Following concept: Unit tests for 'isFollowing' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("✅ Happy path: Check true for an existing follow relationship", async () => {
    await following.follow(userA, userB);
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, true, "isFollowing should return true for an active follow");
  });

  await t.step("Negative path: Check false for a non-existent follow relationship", async () => {
    const { isFollowing } = await following.isFollowing(userA, userC);
    assertEquals(isFollowing, false, "isFollowing should return false for a non-existent follow");
  });

  await t.step("Edge case: Check false after unfollowing", async () => {
    await following.follow(userA, userD);
    await following.unfollow(userA, userD);
    const { isFollowing } = await following.isFollowing(userA, userD);
    assertEquals(isFollowing, false, "isFollowing should return false after unfollowing");
  });

  await t.step("Edge case: Check false for self-follow attempt", async () => {
    // Even though `follow` prevents self-follow, `isFollowing` should correctly report false
    const { isFollowing } = await following.isFollowing(userA, userA);
    assertEquals(isFollowing, false, "isFollowing should be false for a self-follow check");
  });

  await t.step("Edge case: Check with non-existent users", async () => {
    const { isFollowing: nonExistentFollower } = await following.isFollowing(
      nonExistentUser,
      userB,
    );
    assertEquals(
      nonExistentFollower,
      false,
      "isFollowing should be false if follower does not exist",
    );
    const { isFollowing: nonExistentFollowee } = await following.isFollowing(
      userA,
      nonExistentUser,
    );
    assertEquals(
      nonExistentFollowee,
      false,
      "isFollowing should be false if followee does not exist",
    );
  });

  await client.close();
});

Deno.test("Following concept: Unit tests for 'getFollowees' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("✅ Happy path: Get multiple followees for a user", async () => {
    await following.follow(userA, userB);
    await following.follow(userA, userC);
    const { followeeIDs } = await following.getFollowees(userA);
    // Sort for consistent comparison
    assertEquals(
      followeeIDs.sort(),
      [userB, userC].sort(),
      "Should return all followees for userA",
    );
  });

  await t.step("Edge case: Get followees for a user with no followees", async () => {
    const { followeeIDs } = await following.getFollowees(userD);
    assertEquals(followeeIDs, [], "Should return an empty array for a user with no followees");
  });

  await t.step("Edge case: Get followees for a non-existent user", async () => {
    const { followeeIDs } = await following.getFollowees(nonExistentUser);
    assertEquals(followeeIDs, [], "Should return an empty array for a non-existent user");
  });

  await t.step("State verification: After unfollowing, list should update", async () => {
    await following.follow(userB, userA);
    await following.follow(userB, userC);
    await following.unfollow(userB, userA);
    const { followeeIDs } = await following.getFollowees(userB);
    assertEquals(followeeIDs, [userC], "List should update after unfollowing");
  });

  await client.close();
});

Deno.test("Following concept: Unit tests for 'getFollowers' action", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("✅ Happy path: Get multiple followers for a user", async () => {
    await following.follow(userA, userC);
    await following.follow(userB, userC);
    const { followerIDs } = await following.getFollowers(userC);
    // Sort for consistent comparison
    assertEquals(
      followerIDs.sort(),
      [userA, userB].sort(),
      "Should return all followers for userC",
    );
  });

  await t.step("Edge case: Get followers for a user with no followers", async () => {
    const { followerIDs } = await following.getFollowers(userD);
    assertEquals(followerIDs, [], "Should return an empty array for a user with no followers");
  });

  await t.step("Edge case: Get followers for a non-existent user", async () => {
    const { followerIDs } = await following.getFollowers(nonExistentUser);
    assertEquals(followerIDs, [], "Should return an empty array for a non-existent user");
  });

  await t.step("State verification: After unfollowing, list should update", async () => {
    await following.follow(userA, userD);
    await following.follow(userB, userD);
    await following.unfollow(userA, userD);
    const { followerIDs } = await following.getFollowers(userD);
    assertEquals(followerIDs, [userB], "List should update after unfollowing");
  });

  await client.close();
});

Deno.test("Following concept: # trace: Demonstrates the full principle", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);

  await t.step("Initial state: No one is following anyone", async () => {
    assertEquals((await following.getFollowees(userA)).followeeIDs, []);
    assertEquals((await following.getFollowers(userB)).followerIDs, []);
  });

  await t.step("UserA initiates following relationships with UserB and UserC", async () => {
    await following.follow(userA, userB);
    await following.follow(userA, userC);

    assertEquals((await following.isFollowing(userA, userB)).isFollowing, true, "UserA should now follow UserB");
    assertEquals((await following.isFollowing(userA, userC)).isFollowing, true, "UserA should now follow UserC");
    assertEquals((await following.getFollowees(userA)).followeeIDs.sort(), [userB, userC].sort(), "UserA's followees list is correct");
    assertEquals((await following.getFollowers(userB)).followerIDs, [userA], "UserB's followers list is correct");
    assertEquals((await following.getFollowers(userC)).followerIDs, [userA], "UserC's followers list is correct");
  });

  await t.step("UserD also follows UserB, demonstrating multiple followers for one followee", async () => {
    await following.follow(userD, userB);

    assertEquals((await following.isFollowing(userD, userB)).isFollowing, true, "UserD should now follow UserB");
    assertEquals((await following.getFollowees(userD)).followeeIDs, [userB], "UserD's followees list is correct");
    assertEquals((await following.getFollowers(userB)).followerIDs.sort(), [userA, userD].sort(), "UserB's followers list is updated");
  });

  await t.step("UserA terminates following relationship with UserB", async () => {
    await following.unfollow(userA, userB);

    assertEquals((await following.isFollowing(userA, userB)).isFollowing, false, "UserA should no longer follow UserB");
    assertEquals((await following.getFollowees(userA)).followeeIDs, [userC], "UserA's followees list updated (UserC still followed)");
    assertEquals((await following.getFollowers(userB)).followerIDs, [userD], "UserB's followers list updated (UserD still follows B)");
  });

  await t.step("UserD also terminates following relationship with UserB", async () => {
    await following.unfollow(userD, userB);

    assertEquals((await following.isFollowing(userD, userB)).isFollowing, false, "UserD should no longer follow UserB");
    assertEquals((await following.getFollowees(userD)).followeeIDs, [], "UserD's followees list is now empty");
    assertEquals((await following.getFollowers(userB)).followerIDs, [], "UserB has no followers left");
  });

  await t.step("Final state: Verify only remaining relationships", async () => {
    assertEquals((await following.getFollowees(userA)).followeeIDs, [userC], "UserA should only follow UserC");
    assertEquals((await following.getFollowers(userC)).followerIDs, [userA], "UserC should only be followed by UserA");
    assertEquals((await following.getFollowers(userB)).followerIDs, [], "UserB should have no followers");
    assertEquals((await following.getFollowees(userB)).followeeIDs, [], "UserB should not be following anyone");
    assertEquals((await following.getFollowees(userD)).followeeIDs, [], "UserD should not be following anyone");
  });

  await client.close();
});

Deno.test("Following concept: Robustness tests", async (t) => {
  const [db, client] = await testDb();
  const following = new Following(db);
  const followRelationshipsCollection: Collection = db.collection("followrelationships");

  await t.step("Concurrency-like scenario: Multiple simultaneous follow attempts (one should fail due to unique index)", async () => {
    // These two operations will likely hit the unique index constraint.
    const results = await Promise.allSettled([
      following.follow(userA, userB),
      following.follow(userA, userB), // This one should fail due to unique index
    ]);

    // Expect one fulfilled and one rejected
    assertEquals(results[0].status, "fulfilled", "First follow attempt should succeed");
    assertEquals(results[1].status, "rejected", "Second (duplicate) follow attempt should reject");
    if (results[1].status === "rejected") {
      assertEquals(
        results[1].reason.message,
        `Follower '${userA}' is already following followee '${userB}'.`,
        "Rejected reason message should be correct for duplicate follow",
      );
    }

    // Verify state: only one relationship should exist in the database
    const count = await followRelationshipsCollection.countDocuments({
      follower: userA,
      followee: userB,
    });
    assertEquals(count, 1, "Only one follow relationship should exist in the DB after concurrent attempts");
    const { isFollowing } = await following.isFollowing(userA, userB);
    assertEquals(isFollowing, true, "UserA should be following UserB");
  });

  await t.step("Concurrency-like scenario: Multiple simultaneous unfollow attempts (one should fail)", async () => {
    await following.follow(userC, userD); // Establish the relationship first

    const results = await Promise.allSettled([
      following.unfollow(userC, userD),
      following.unfollow(userC, userD), // This one should fail because the relationship is removed by the first
    ]);

    // Expect one fulfilled and one rejected
    assertEquals(results[0].status, "fulfilled", "First unfollow attempt should succeed");
    assertEquals(results[1].status, "rejected", "Second unfollow attempt should reject");
    if (results[1].status === "rejected") {
      assertEquals(
        results[1].reason.message,
        `No existing follow relationship found between follower '${userC}' and followee '${userD}'.`,
        "Rejected reason message should be correct for unfollowing a non-existent relationship",
      );
    }

    // Verify state: no relationships should exist
    const count = await followRelationshipsCollection.countDocuments({
      follower: userC,
      followee: userD,
    });
    assertEquals(count, 0, "No follow relationship should exist in the DB after concurrent unfollows");
    const { isFollowing } = await following.isFollowing(userC, userD);
    assertEquals(isFollowing, false, "UserC should not be following UserD");
  });

  await t.step("Data consistency after failed operations: Ensure no unintended side effects", async () => {
    // Establish some initial state
    await following.follow(userA, userC); // A follows C
    await following.follow(userB, userD); // B follows D
    await following.follow(userC, userA); // C follows A

    // Attempt a failed follow (userA already follows userC)
    await assertRejects(
      () => following.follow(userA, userC),
      Error,
      `Follower '${userA}' is already following followee '${userC}'.`,
      "Duplicate follow should reject cleanly",
    );

    // Attempt a failed unfollow (userA does not follow userD)
    await assertRejects(
      () => following.unfollow(userA, userD),
      Error,
      `No existing follow relationship found between follower '${userA}' and followee '${userD}'.`,
      "Unfollow non-existent should reject cleanly",
    );

    // Verify all existing relationships are undisturbed
    assertEquals((await following.isFollowing(userA, userC)).isFollowing, true, "A->C relationship should still exist");
    assertEquals((await following.isFollowing(userB, userD)).isFollowing, true, "B->D relationship should still exist");
    assertEquals((await following.isFollowing(userC, userA)).isFollowing, true, "C->A relationship should still exist");

    // Verify non-existent relationships remain non-existent
    assertEquals((await following.isFollowing(userA, userD)).isFollowing, false, "A->D relationship should still not exist");

    // Verify list queries remain accurate
    assertEquals((await following.getFollowees(userA)).followeeIDs, [userC], "A's followees should be correct");
    assertEquals((await following.getFollowers(userD)).followerIDs, [userB], "D's followers should be correct");
    assertEquals((await following.getFollowees(userB)).followeeIDs, [userD], "B's followees should be correct");
  });

  await client.close();
});
```