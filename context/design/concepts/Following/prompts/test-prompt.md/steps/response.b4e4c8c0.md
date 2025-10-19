---
timestamp: 'Fri Oct 17 2025 22:56:19 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_225619.1349a72d.md]]'
content_id: b4e4c8c0dfc3fd154d5a2bd0a4e58e0485a091a3cc45da2daf6715946a5e687f
---

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
