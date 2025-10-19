---
timestamp: 'Fri Oct 17 2025 22:44:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_224432.04c15b14.md]]'
content_id: e2a32a008bc051ff8aa80ed67b8f94911e5a1d6c2cd87b2906e15e2a49d4500a
---

# file: src/Following/FollowingConcept.test.ts

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals, assertRejects, assertArrayIncludes, assertNotEquals } from "jsr:@std/assert";

// Define the generic types as strings for testing purposes.
type Follower = string;
type Followee = string;

// --- Mock Implementation of the Following Concept ---
// This section provides a functional mock of the concept's actions using Deno.Kv.
// In a real project, these functions would be imported from `src/Following/FollowingConcept.ts`.
// This mock is necessary to make the test file runnable and to demonstrate the concept's behavior.

// Helper to construct Deno.Kv keys for follow relationships.
const getFollowRelationshipKey = (follower: Follower, followee: Followee) => ["follows", follower, followee];
const getFolloweesPrefixKey = (follower: Follower) => ["follows", follower];
const getAllFollowsPrefixKey = () => ["follows"]; // For scanning all relationships to find followers.

/**
 * Mocks the `follow` action.
 * @param db The Deno.Kv instance.
 * @param follower The ID of the follower.
 * @param followee The ID of the followee.
 * @throws Error if the relationship already exists, enforcing the 'requires' clause.
 */
const follow = async (db: Deno.Kv, follower: Follower, followee: Followee): Promise<void> => {
    const key = getFollowRelationshipKey(follower, followee);
    const existing = await db.get(key);
    if (existing.value !== null) {
        // Enforce "requires: No FollowRelationship already exists"
        throw new Error(`Follower '${follower}' already follows '${followee}'.`);
    }
    await db.set(key, {}); // The value can be empty; existence signifies the relationship.
};

/**
 * Mocks the `unfollow` action.
 * @param db The Deno.Kv instance.
 * @param follower The ID of the follower.
 * @param followee The ID of the followee.
 * @throws Error if the relationship does not exist, enforcing the 'requires' clause.
 */
const unfollow = async (db: Deno.Kv, follower: Follower, followee: Followee): Promise<void> => {
    const key = getFollowRelationshipKey(follower, followee);
    const existing = await db.get(key);
    if (existing.value === null) {
        // Enforce "requires: A FollowRelationship exists"
        throw new Error(`Follower '${follower}' is not following '${followee}'.`);
    }
    await db.delete(key);
};

/**
 * Mocks the `isFollowing` action.
 * @param db The Deno.Kv instance.
 * @param follower The ID of the follower.
 * @param followee The ID of the followee.
 * @returns True if `follower` follows `followee`, false otherwise.
 */
const isFollowing = async (db: Deno.Kv, follower: Follower, followee: Followee): Promise<boolean> => {
    const key = getFollowRelationshipKey(follower, followee);
    const entry = await db.get(key);
    return entry.value !== null;
};

/**
 * Mocks the `getFollowees` action.
 * @param db The Deno.Kv instance.
 * @param follower The ID of the follower.
 * @returns A list of `Followee` IDs that the `follower` is following.
 */
const getFollowees = async (db: Deno.Kv, follower: Follower): Promise<Followee[]> => {
    const followees: Followee[] = [];
    const iter = db.list({ prefix: getFolloweesPrefixKey(follower) });
    for await (const entry of iter) {
        // Key format: ["follows", followerId, followeeId]
        followees.push(entry.key[2] as Followee);
    }
    return followees;
};

/**
 * Mocks the `getFollowers` action.
 * Note: This implementation scans all relationships, which is not efficient for Deno.Kv.
 * A more optimized KV design would involve a reverse index (e.g., ["followed_by", followeeId, followerId]).
 * However, this mock adheres to the minimal "set of FollowRelationships" state defined in the concept.
 * @param db The Deno.Kv instance.
 * @param followee The ID of the followee.
 * @returns A list of `Follower` IDs that are following the `followee`.
 */
const getFollowers = async (db: Deno.Kv, followee: Followee): Promise<Follower[]> => {
    const followers: Follower[] = [];
    const iter = db.list({ prefix: getAllFollowsPrefixKey() }); // Iterate all "follows" entries
    for await (const entry of iter) {
        const [_, fwer, fwee] = entry.key; // Key format: ["follows", followerId, followeeId]
        if (fwee === followee) {
            followers.push(fwer as Follower);
        }
    }
    return followers;
};
// --- End Mock Implementation ---


Deno.test("Following Concept Comprehensive Tests", async (test) => {
  let db: Deno.Kv;
  let client: Deno.Kv;

  // Setup: Initialize the database before all tests in this file.
  Deno.test.beforeAll(async () => {
    const dbTuple = await testDb();
    db = dbTuple[0]; // The Deno.Kv instance
    client = dbTuple[1]; // The client object to close (which might be the db itself for Deno.Kv)
  });

  // Teardown: Close the database client after all tests in this file.
  Deno.test.afterAll(async () => {
    await client.close();
  });

  await test.step("1. Confirming 'follow' action: requirements and effects", async () => {
    const userA: Follower = "userA";
    const userB: Followee = "userB";
    const userC: Followee = "userC";

    // Initial state check: UserA should not be following UserB.
    assertEquals(await isFollowing(db, userA, userB), false, "UserA should not initially be following UserB.");
    assertEquals(await getFollowees(db, userA), [], "UserA should have no followees initially.");
    assertEquals(await getFollowers(db, userB), [], "UserB should have no followers initially.");

    // Effects: Perform the 'follow' action.
    await follow(db, userA, userB);

    // Verify effects: UserA should now be following UserB.
    assertEquals(await isFollowing(db, userA, userB), true, "UserA should now be following UserB.");
    assertArrayIncludes(await getFollowees(db, userA), [userB], "UserA's followees list should include UserB.");
    assertArrayIncludes(await getFollowers(db, userB), [userA], "UserB's followers list should include UserA.");
    assertEquals((await getFollowees(db, userA)).length, 1, "UserA should have exactly one followee.");
    assertEquals((await getFollowers(db, userB)).length, 1, "UserB should have exactly one follower.");

    // Requirements: Test 'requires: No FollowRelationship already exists'.
    // Attempting to follow an existing relationship should reject (or silently fail if spec allowed).
    await assertRejects(
      async () => { await follow(db, userA, userB); },
      Error,
      `Follower 'userA' already follows 'userB'.`,
      "Attempting to follow an existing relationship must reject."
    );
    // Ensure state remains unchanged (no duplicate relationships created).
    assertEquals((await getFollowees(db, userA)).length, 1, "No duplicate followee entry should be created.");

    // Test following another user to verify multiple relationships.
    await follow(db, userA, userC);
    assertEquals(await isFollowing(db, userA, userC), true, "UserA should now be following UserC.");
    assertArrayIncludes(await getFollowees(db, userA), [userB, userC], "UserA's followees should include both UserB and UserC.");
    assertArrayIncludes(await getFollowers(db, userC), [userA], "UserC's followers should include UserA.");
    assertEquals((await getFollowees(db, userA)).length, 2, "UserA should have two followees.");
  });

  await test.step("2. Confirming 'unfollow' action: requirements and effects", async () => {
    const userA: Follower = "userA";
    const userB: Followee = "userB";
    const userD: Followee = "userD"; // A user that userA is not following.

    // Pre-condition: Ensure userA follows userB.
    // (This also serves as a check if the DB was cleared correctly between steps/tests.)
    await follow(db, userA, userB);
    assertEquals(await isFollowing(db, userA, userB), true, "Pre-condition: UserA must be following UserB.");

    // Effects: Perform the 'unfollow' action.
    await unfollow(db, userA, userB);

    // Verify effects: UserA should no longer be following UserB.
    assertEquals(await isFollowing(db, userA, userB), false, "UserA should no longer be following UserB after unfollow.");
    assertNotEquals((await getFollowees(db, userA)).includes(userB), true, "UserA's followees should not include UserB.");
    assertNotEquals((await getFollowers(db, userB)).includes(userA), true, "UserB's followers should not include UserA.");
    assertEquals((await getFollowees(db, userA)).length, 0, "UserA should have zero followees after unfollowing.");
    assertEquals((await getFollowers(db, userB)).length, 0, "UserB should have zero followers after UserA unfollows.");

    // Requirements: Test 'requires: A FollowRelationship exists'.
    // Attempting to unfollow a non-existent relationship should reject.
    await assertRejects(
      async () => { await unfollow(db, userA, userD); }, // UserA never followed UserD.
      Error,
      `Follower 'userA' is not following 'userD'.`,
      "Attempting to unfollow a non-existent relationship must reject."
    );
    // Ensure state remains unchanged (no new relationships deleted).
    assertEquals(await isFollowing(db, userA, userD), false, "State should remain: UserA not following UserD.");
  });

  await test.step("3. Confirming 'isFollowing' action effects", async () => {
    const userX: Follower = "userX";
    const userY: Followee = "userY";
    const userZ: Followee = "userZ";

    // Initial state: No relationships.
    assertEquals(await isFollowing(db, userX, userY), false, "Initially, UserX should not be following UserY.");
    assertEquals(await isFollowing(db, userX, userZ), false, "Initially, UserX should not be following UserZ.");

    // Establish a relationship.
    await follow(db, userX, userY);

    // Verify 'isFollowing' returns true for the existing relationship.
    assertEquals(await isFollowing(db, userX, userY), true, "isFollowing should return true after a successful 'follow'.");

    // Verify 'isFollowing' returns false for a non-existent relationship.
    assertEquals(await isFollowing(db, userX, userZ), false, "isFollowing should return false for a non-existent relationship.");

    // Remove the relationship.
    await unfollow(db, userX, userY);

    // Verify 'isFollowing' returns false after unfollowing.
    assertEquals(await isFollowing(db, userX, userY), false, "isFollowing should return false after a successful 'unfollow'.");
  });

  await test.step("4. Confirming 'getFollowees' action effects", async () => {
    const userP: Follower = "userP";
    const userQ: Followee = "userQ";
    const userR: Followee = "userR";
    const userS: Followee = "userS";
    const userT: Follower = "userT"; // Another independent follower.

    // Initial state: UserP and UserT follow no one.
    assertEquals(await getFollowees(db, userP), [], "UserP should have no followees initially.");
    assertEquals(await getFollowees(db, userT), [], "UserT should have no followees initially.");

    // UserP follows UserQ.
    await follow(db, userP, userQ);
    assertArrayIncludes(await getFollowees(db, userP), [userQ], "UserP's followees should include UserQ.");
    assertEquals((await getFollowees(db, userP)).length, 1, "UserP should have one followee.");

    // UserP follows UserR.
    await follow(db, userP, userR);
    const pFollowees = await getFollowees(db, userP);
    assertArrayIncludes(pFollowees, [userQ, userR], "UserP's followees should include UserQ and UserR.");
    assertEquals(pFollowees.length, 2, "UserP should have two followees.");

    // UserP unfollows UserQ.
    await unfollow(db, userP, userQ);
    const pFolloweesAfterUnfollow = await getFollowees(db, userP);
    assertArrayIncludes(pFolloweesAfterUnfollow, [userR], "UserP's followees should now only include UserR.");
    assertEquals(pFolloweesAfterUnfollow.length, 1, "UserP should have one followee after unfollowing UserQ.");
    assertEquals(pFolloweesAfterUnfollow.includes(userQ), false, "UserP's followees should not include UserQ.");

    // Ensure 'getFollowees' for an unrelated user (UserT) remains correct.
    assertEquals(await getFollowees(db, userT), [], "UserT should still have no followees.");
  });

  await test.step("5. Confirming 'getFollowers' action effects", async () => {
    const userM: Follower = "userM";
    const userN: Follower = "userN";
    const userO: Followee = "userO";
    const userP: Followee = "userP"; // Another independent followee.

    // Initial state: UserO and UserP have no followers.
    assertEquals(await getFollowers(db, userO), [], "UserO should have no followers initially.");
    assertEquals(await getFollowers(db, userP), [], "UserP should have no followers initially.");

    // UserM follows UserO.
    await follow(db, userM, userO);
    assertArrayIncludes(await getFollowers(db, userO), [userM], "UserO's followers should include UserM.");
    assertEquals((await getFollowers(db, userO)).length, 1, "UserO should have one follower.");

    // UserN also follows UserO.
    await follow(db, userN, userO);
    const oFollowers = await getFollowers(db, userO);
    assertArrayIncludes(oFollowers, [userM, userN], "UserO's followers should include UserM and UserN.");
    assertEquals(oFollowers.length, 2, "UserO should have two followers.");

    // UserM unfollows UserO.
    await unfollow(db, userM, userO);
    const oFollowersAfterUnfollow = await getFollowers(db, userO);
    assertArrayIncludes(oFollowersAfterUnfollow, [userN], "UserO's followers should now only include UserN.");
    assertEquals(oFollowersAfterUnfollow.length, 1, "UserO should have one follower after UserM unfollows.");
    assertEquals(oFollowersAfterUnfollow.includes(userM), false, "UserO's followers should not include UserM.");

    // Ensure 'getFollowers' for an unrelated followee (UserP) remains correct.
    assertEquals(await getFollowers(db, userP), [], "UserP should still have no followers.");
  });

  await test.step("6. Principle: Demonstrate a full trace of following and unfollowing", async () => {
    // This step demonstrates the core principle: "A follower can choose to initiate a following
    // relationship with a followee, and later terminate it, with the relationship's existence
    // accurately reflected in the system."

    const alice: Follower = "alice";
    const bob: Followee = "bob";
    const charlie: Follower = "charlie"; // Another user to test independence.

    // 1. Initial State: Alice is not following Bob.
    assertEquals(await isFollowing(db, alice, bob), false, "Alice should not be following Bob initially.");
    assertEquals(await getFollowees(db, alice), [], "Alice should have no followees initially.");
    assertEquals(await getFollowers(db, bob), [], "Bob should have no followers initially.");

    // 2. Action: Alice initiates following Bob.
    await follow(db, alice, bob);

    // 3. Verify Follow: Relationship is established and reflected.
    assertEquals(await isFollowing(db, alice, bob), true, "Alice should now be following Bob.");
    assertArrayIncludes(await getFollowees(db, alice), [bob], "Alice's followees should include Bob.");
    assertArrayIncludes(await getFollowers(db, bob), [alice], "Bob's followers should include Alice.");
    assertEquals((await getFollowees(db, alice)).length, 1);
    assertEquals((await getFollowers(db, bob)).length, 1);

    // 4. Action (additional): Charlie also follows Bob to show multiple followers.
    await follow(db, charlie, bob);
    assertEquals(await isFollowing(db, charlie, bob), true, "Charlie should now be following Bob.");
    assertArrayIncludes(await getFollowees(db, charlie), [bob], "Charlie's followees should include Bob.");
    const bobFollowersAfterCharlie = await getFollowers(db, bob);
    assertArrayIncludes(bobFollowersAfterCharlie, [alice, charlie], "Bob's followers should include Alice and Charlie.");
    assertEquals(bobFollowersAfterCharlie.length, 2);

    // 5. Action: Alice terminates the relationship with Bob.
    await unfollow(db, alice, bob);

    // 6. Verify Unfollow: Relationship is terminated and reflected.
    assertEquals(await isFollowing(db, alice, bob), false, "Alice should no longer be following Bob.");
    assertEquals((await getFollowees(db, alice)).includes(bob), false, "Alice's followees should no longer include Bob.");
    assertEquals((await getFollowees(db, alice)).length, 0, "Alice should have no followees left.");

    // Verify Bob's followers now only include Charlie (Alice is gone).
    const bobFollowersAfterAliceUnfollows = await getFollowers(db, bob);
    assertArrayIncludes(bobFollowersAfterAliceUnfollows, [charlie], "Bob's followers should now only include Charlie.");
    assertEquals(bobFollowersAfterAliceUnfollows.length, 1);
    assertEquals(bobFollowersAfterAliceUnfollows.includes(alice), false, "Bob's followers should not include Alice.");

    // Verify Charlie's relationship with Bob is unaffected.
    assertEquals(await isFollowing(db, charlie, bob), true, "Charlie should still be following Bob.");
    assertArrayIncludes(await getFollowees(db, charlie), [bob], "Charlie's followees should still include Bob.");
  });
});
```

***
