---
timestamp: 'Fri Oct 17 2025 23:09:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_230921.39c8b860.md]]'
content_id: f1418caa94d81cc9ac34e5d8bc4967468027c05d31e6f124a94b72b3384c827d
---

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
