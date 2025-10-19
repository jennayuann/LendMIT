---
timestamp: 'Fri Oct 17 2025 22:49:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_224925.b02449d6.md]]'
content_id: ab39c4fad28779f63d3f3cce19fd99891b6adeae21b8fb1aef92491125326bb9
---

# response:

```typescript
// src/concepts/Following.test.ts

import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts"; // Assuming this path is correct based on the guide
import { Following } from "./Following.ts"; // Path relative to the test file
import { ID } from "@/utils/types.ts"; // Import ID for type clarity

/**
 * # file: src/concepts/Following.test.ts
 *
 * This test file implements comprehensive tests for the `Following` concept.
 * It covers the 'requires' and 'effects' of each action, and demonstrates
 * how the 'principle' is fulfilled through a trace of interactions.
 */
Deno.test("Following Concept", async (test) => {
  // Define consistent IDs for testing purposes to ensure predictability.
  const userA: ID = "userA_id";
  const userB: ID = "userB_id";
  const userC: ID = "userC_id";
  const userD: ID = "userD_id";
  const nonExistentUser: ID = "non_existent_user_id";

  // Declare variables for the database client and concept instance
  // to be initialized within each test step as per the requirements.
  let db: Awaited<ReturnType<typeof testDb>>[0];
  let client: Awaited<ReturnType<typeof testDb>>[1];
  let followingConcept: Following;

  /**
   * # trace: Demonstrates the full trace of actions to fulfill the principle.
   * A follower can choose to initiate a following relationship with a followee,
   * and later terminate it, with the relationship's existence accurately reflected in the system.
   */
  await test.step("Principle: Follower can initiate and terminate relationships, reflected in state", async () => {
    // 1. Initialize a clean database for this test step.
    [db, client] = await testDb();
    // 2. Create a new instance of the concept class using the clean database.
    followingConcept = new Following(db);

    console.log(`\n--- Trace for Principle: '${test.name}' ---`);

    // Initial state check: UserA should not be following UserB.
    console.log(`[Trace] Initial check: Is ${userA} following ${userB}?`);
    assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, false, "userA should not be following userB initially");
    assertEquals((await followingConcept.getFollowees(userA)).followeeIDs.length, 0, "userA should have no followees initially");
    assertEquals((await followingConcept.getFollowers(userB)).followerIDs.length, 0, "userB should have no followers initially");

    // Action 1: userA follows userB
    console.log(`[Trace] Action: ${userA} follows ${userB}`);
    await followingConcept.follow(userA, userB);

    // Effect 1: Verify relationship is established.
    console.log(`[Trace] Effect: Verify ${userA} is following ${userB} and lists match.`);
    assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, true, "userA should now be following userB");
    assertEquals((await followingConcept.getFollowees(userA)).followeeIDs, [userB], "userA's followees should include userB");
    assertEquals((await followingConcept.getFollowers(userB)).followerIDs, [userA], "userB's followers should include userA");

    // Action 2: userC also follows userB (demonstrates multiple followers for one followee)
    console.log(`[Trace] Action: ${userC} follows ${userB}`);
    await followingConcept.follow(userC, userB);

    // Effect 2: Verify both A and C are following B.
    console.log(`[Trace] Effect: Verify ${userC} is following ${userB} and ${userB}'s followers are updated.`);
    assertEquals((await followingConcept.isFollowing(userC, userB)).isFollowing, true, "userC should now be following userB");
    const bFollowersAfterCFollows = (await followingConcept.getFollowers(userB)).followerIDs;
    assertEquals(bFollowersAfterCFollows.length, 2, "userB should have two followers");
    assertEquals(bFollowersAfterCFollows.includes(userA), true, "userB's followers should include userA");
    assertEquals(bFollowersAfterCFollows.includes(userC), true, "userB's followers should include userC");

    // Action 3: userA unfollows userB
    console.log(`[Trace] Action: ${userA} unfollows ${userB}`);
    await followingConcept.unfollow(userA, userB);

    // Effect 3: Verify relationship between A and B is terminated, C still follows B.
    console.log(`[Trace] Effect: Verify ${userA} no longer follows ${userB}, and ${userB}'s followers are updated.`);
    assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, false, "userA should no longer be following userB");
    assertEquals((await followingConcept.getFollowees(userA)).followeeIDs.length, 0, "userA should have no followees after unfollow");
    const bFollowersAfterAUnfollows = (await followingConcept.getFollowers(userB)).followerIDs;
    assertEquals(bFollowersAfterAUnfollows.length, 1, "userB should have one follower after userA unfollows");
    assertEquals(bFollowersAfterAUnfollows, [userC], "userB's followers should only include userC");

    // 3. Close the client for this test step.
    await client.close();
    console.log(`--- End Trace for Principle: '${test.name}' ---\n`);
  });

  await test.step("Action: follow (follower: Follower, followee: Followee)", async () => {
    [db, client] = await testDb();
    followingConcept = new Following(db);

    await test.step("Succeeds and effects: Creates a new relationship", async () => {
      await followingConcept.follow(userA, userB);
      const { isFollowing } = await followingConcept.isFollowing(userA, userB);
      assertEquals(isFollowing, true, "Relationship should exist after successful follow.");
      assertEquals((await followingConcept.getFollowees(userA)).followeeIDs, [userB], "Followees list should include the new followee.");
    });

    await test.step("Requires: Rejects if relationship already exists", async () => {
      await followingConcept.follow(userA, userB); // Establish relationship first
      await assertRejects(
        () => followingConcept.follow(userA, userB),
        Error,
        `Follower '${userA}' is already following followee '${userB}'.`,
        "Should reject when trying to follow an existing relationship.",
      );
    });

    await test.step("Requires: Rejects if follower attempts to follow themselves", async () => {
      await assertRejects(
        () => followingConcept.follow(userA, userA),
        Error,
        "Cannot follow yourself.",
        "Should reject when a user tries to follow themselves.",
      );
    });

    await client.close();
  });

  await test.step("Action: unfollow (follower: Follower, followee: Followee)", async () => {
    [db, client] = await testDb();
    followingConcept = new Following(db);

    await test.step("Succeeds and effects: Deletes an existing relationship", async () => {
      await followingConcept.follow(userA, userB); // Establish relationship first
      await followingConcept.unfollow(userA, userB);
      const { isFollowing } = await followingConcept.isFollowing(userA, userB);
      assertEquals(isFollowing, false, "Relationship should not exist after successful unfollow.");
      assertEquals((await followingConcept.getFollowees(userA)).followeeIDs.length, 0, "Followees list should be empty after unfollow.");
    });

    await test.step("Requires: Rejects if relationship does not exist", async () => {
      await assertRejects(
        () => followingConcept.unfollow(userA, userB),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${userB}'.`,
        "Should reject when trying to unfollow a non-existent relationship.",
      );
    });

    await client.close();
  });

  await test.step("Action: isFollowing (follower: Follower, followee: Followee)", async () => {
    [db, client] = await testDb();
    followingConcept = new Following(db);

    await test.step("Effects: Returns true for an existing relationship", async () => {
      await followingConcept.follow(userA, userB);
      const { isFollowing } = await followingConcept.isFollowing(userA, userB);
      assertEquals(isFollowing, true, "Should return true for an active following relationship.");
    });

    await test.step("Effects: Returns false for a non-existent relationship", async () => {
      const { isFollowing } = await followingConcept.isFollowing(userA, userB);
      assertEquals(isFollowing, false, "Should return false for a relationship that was never established.");
    });

    await test.step("Effects: Returns false for a relationship that was unfollowed", async () => {
      await followingConcept.follow(userA, userB);
      await followingConcept.unfollow(userA, userB);
      const { isFollowing } = await followingConcept.isFollowing(userA, userB);
      assertEquals(isFollowing, false, "Should return false after a relationship has been unfollowed.");
    });

    await test.step("Effects: Returns false for partially matching relationships (e.g., A follows C, but check A follows B)", async () => {
      await followingConcept.follow(userA, userC); // A follows C
      const { isFollowing } = await followingConcept.isFollowing(userA, userB); // Check if A follows B
      assertEquals(isFollowing, false, "Should return false if one ID matches but the other does not form an existing pair.");
    });

    await client.close();
  });

  await test.step("Action: getFollowees (follower: Follower)", async () => {
    [db, client] = await testDb();
    followingConcept = new Following(db);

    await test.step("Effects: Returns an empty array if follower has no followees", async () => {
      const { followeeIDs } = await followingConcept.getFollowees(userA);
      assertEquals(followeeIDs, [], "Should return an empty array if the follower follows nobody.");
    });

    await test.step("Effects: Returns correct list of followees for a follower", async () => {
      await followingConcept.follow(userA, userB);
      await followingConcept.follow(userA, userC);
      await followingConcept.follow(userA, userD); // UserA follows B, C, D

      const { followeeIDs } = await followingConcept.getFollowees(userA);
      // Sort for consistent comparison, as the order from the database might not be guaranteed
      assertEquals(followeeIDs.sort(), [userB, userC, userD].sort(), "Should return all followee IDs for userA.");
    });

    await test.step("Effects: Returns empty array if follower unfollows all", async () => {
      await followingConcept.follow(userA, userB);
      await followingConcept.unfollow(userA, userB);
      const { followeeIDs } = await followingConcept.getFollowees(userA);
      assertEquals(followeeIDs, [], "Should return an empty array after unfollowing all followees.");
    });

    await test.step("Effects: Returns empty array for a non-existent follower", async () => {
      const { followeeIDs } = await followingConcept.getFollowees(nonExistentUser);
      assertEquals(followeeIDs, [], "Should return an empty array for a user that doesn't exist or has never followed anyone.");
    });

    await client.close();
  });

  await test.step("Action: getFollowers (followee: Followee)", async () => {
    [db, client] = await testDb();
    followingConcept = new Following(db);

    await test.step("Effects: Returns an empty array if followee has no followers", async () => {
      const { followerIDs } = await followingConcept.getFollowers(userB);
      assertEquals(followerIDs, [], "Should return an empty array if the followee has no followers.");
    });

    await test.step("Effects: Returns correct list of followers for a followee", async () => {
      await followingConcept.follow(userA, userB);
      await followingConcept.follow(userC, userB);
      await followingConcept.follow(userD, userB); // UserA, UserC, UserD follow UserB

      const { followerIDs } = await followingConcept.getFollowers(userB);
      // Sort for consistent comparison
      assertEquals(followerIDs.sort(), [userA, userC, userD].sort(), "Should return all follower IDs for userB.");
    });

    await test.step("Effects: Returns empty array if followee loses all followers", async () => {
      await followingConcept.follow(userA, userB);
      await followingConcept.unfollow(userA, userB);
      const { followerIDs } = await followingConcept.getFollowers(userB);
      // After UserA unfollows UserB, UserB still has UserC and UserD as followers.
      // We are testing if ALL followers are lost, so this test should be refined:
      // Let's ensure UserB has no other followers before this check.
      // Re-initialize for clarity for this specific sub-test:
      await client.close(); // Close previous client
      [db, client] = await testDb(); // Get a fresh DB
      followingConcept = new Following(db); // New concept instance

      await followingConcept.follow(userA, userB);
      await followingConcept.unfollow(userA, userB);
      const { followerIDs: postUnfollowFollowerIDs } = await followingConcept.getFollowers(userB);
      assertEquals(postUnfollowFollowerIDs, [], "Should return an empty array if the last follower unfollows.");
    });

    await test.step("Effects: Returns empty array for a non-existent followee", async () => {
      const { followerIDs } = await followingConcept.getFollowers(nonExistentUser);
      assertEquals(followerIDs, [], "Should return an empty array for a user that doesn't exist or has never been followed.");
    });

    await client.close();
  });
});
```
