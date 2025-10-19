---
timestamp: 'Fri Oct 17 2025 22:54:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_225421.ca42f9bc.md]]'
content_id: d79bffdf0adb91d3bbae34755f443050ca1136792cb6ea8d5d2a02136ac7e089
---

# response:

```typescript
// src/concepts/Following.test.ts

import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Following } from "./Following.ts"; // Adjust path if your project structure differs
import { ID } from "@/utils/types.ts";

// Helper function to generate unique IDs for testing purposes.
// This ensures test entities don't clash across different test runs or scenarios.
function createTestId(prefix: string): ID {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

Deno.test("Following Concept Tests", async (test) => {
  let follower1: ID;
  let follower2: ID;
  let followee1: ID;
  let followee2: ID;

  // Re-generate unique IDs before each top-level test step to ensure isolation
  test.beforeEach(() => {
    follower1 = createTestId("follower-A");
    follower2 = createTestId("follower-B");
    followee1 = createTestId("followee-X");
    followee2 = createTestId("followee-Y");
  });

  await test.step("Unit Tests for 'follow' action", async (t) => {
    // 1. Initialize a clean database for this test step
    const [db, client] = await testDb();
    // 2. Create a new instance of the concept class using the test db
    const followingConcept = new Following(db);

    await t.step("Happy-path: should successfully create a follow relationship", async () => {
      const result = await followingConcept.follow(follower1, followee1);
      assertEquals(result, {}, "Follow action should return an empty object on success");

      // State verification
      const { isFollowing } = await followingConcept.isFollowing(follower1, followee1);
      assertEquals(isFollowing, true, "isFollowing should confirm the relationship");

      const { followeeIDs } = await followingConcept.getFollowees(follower1);
      assertEquals(followeeIDs, [followee1], "getFollowees should list the newly followed entity");

      const { followerIDs } = await followingConcept.getFollowers(followee1);
      assertEquals(followerIDs, [follower1], "getFollowers should list the new follower");
    });

    await t.step("Requires violation: should reject if follower tries to follow themselves", async () => {
      await assertRejects(
        () => followingConcept.follow(follower1, follower1),
        Error,
        "Cannot follow yourself.",
        "Should throw an error when a follower attempts to follow their own ID"
      );
    });

    await t.step("Requires violation: should reject if relationship already exists", async () => {
      await followingConcept.follow(follower1, followee1); // Establish initial relationship successfully

      await assertRejects(
        () => followingConcept.follow(follower1, followee1),
        Error,
        `Follower '${follower1}' is already following followee '${followee1}'.`,
        "Should throw an error when attempting to create a duplicate follow relationship"
      );

      // State verification: ensure no additional relationship was created
      const { followeeIDs } = await followingConcept.getFollowees(follower1);
      assertEquals(followeeIDs.length, 1, "Only one relationship should exist after a failed duplicate follow");
    });

    await t.step("Edge case: Should handle multiple distinct follows correctly", async () => {
      await followingConcept.follow(follower1, followee1);
      await followingConcept.follow(follower1, followee2);
      await followingConcept.follow(follower2, followee1);

      // State verification for follower1's followees
      const { followeeIDs: f1_followees } = await followingConcept.getFollowees(follower1);
      assertEquals(f1_followees.sort(), [followee1, followee2].sort(), "Follower1 should correctly list both followees");

      // State verification for followee1's followers
      const { followerIDs: fe1_followers } = await followingConcept.getFollowers(followee1);
      assertEquals(fe1_followers.sort(), [follower1, follower2].sort(), "Followee1 should correctly list both followers");
    });

    await t.step("Idempotency check: Repeated *valid* actions should not interfere", async () => {
      // Follower1 follows Followee1
      await followingConcept.follow(follower1, followee1);
      const { isFollowing: isF1_FE1 } = await followingConcept.isFollowing(follower1, followee1);
      assertEquals(isF1_FE1, true, "F1 should be following FE1");

      // Follower2 follows Followee2 (completely separate valid action)
      await followingConcept.follow(follower2, followee2);
      const { isFollowing: isF2_FE2 } = await followingConcept.isFollowing(follower2, followee2);
      assertEquals(isF2_FE2, true, "F2 should be following FE2");

      // Original relationship should still be valid
      const { isFollowing: isF1_FE1_again } = await followingConcept.isFollowing(follower1, followee1);
      assertEquals(isF1_FE1_again, true, "F1 should still be following FE1 after other actions");
    });

    // 3. Close the client at the end of the test step
    await client.close();
  });

  await test.step("Unit Tests for 'unfollow' action", async (t) => {
    const [db, client] = await testDb();
    const followingConcept = new Following(db);

    await t.step("Happy-path: should successfully delete an existing follow relationship", async () => {
      await followingConcept.follow(follower1, followee1); // Establish relationship first
      assertEquals((await followingConcept.isFollowing(follower1, followee1)).isFollowing, true, "Relationship must exist before unfollow");

      const result = await followingConcept.unfollow(follower1, followee1);
      assertEquals(result, {}, "Unfollow action should return an empty object on success");

      // State verification
      const { isFollowing: postUnfollow } = await followingConcept.isFollowing(follower1, followee1);
      assertEquals(postUnfollow, false, "isFollowing should confirm relationship no longer exists");

      const { followeeIDs } = await followingConcept.getFollowees(follower1);
      assertEquals(followeeIDs, [], "getFollowees should return an empty list for the follower");

      const { followerIDs } = await followingConcept.getFollowers(followee1);
      assertEquals(followerIDs, [], "getFollowers should return an empty list for the followee");
    });

    await t.step("Requires violation: should reject if no relationship exists to unfollow", async () => {
      await assertRejects(
        () => followingConcept.unfollow(follower1, followee1),
        Error,
        `No existing follow relationship found between follower '${follower1}' and followee '${followee1}'.`,
        "Should throw an error when attempting to unfollow a non-existent relationship"
      );

      // State verification: ensure no accidental relationship was created
      const { isFollowing } = await followingConcept.isFollowing(follower1, followee1);
      assertEquals(isFollowing, false, "No relationship should exist after failed unfollow attempt");
    });

    await t.step("Edge case: unfollowing a combination of IDs that never existed", async () => {
      const nonExistentFollower = createTestId("nonexistent-f");
      const nonExistentFollowee = createTestId("nonexistent-fe");
      await assertRejects(
        () => followingConcept.unfollow(nonExistentFollower, nonExistentFollowee),
        Error,
        "No existing follow relationship found", // Check for part of the error message
        "Should reject for completely non-existent IDs in unfollow"
      );
    });

    await t.step("Idempotency check: Repeated 'unfollow' for the same relationship", async () => {
      await followingConcept.follow(follower1, followee1); // Establish relationship
      await followingConcept.unfollow(follower1, followee1); // First unfollow should succeed

      await assertRejects(
        () => followingConcept.unfollow(follower1, followee1), // Second unfollow should fail
        Error,
        `No existing follow relationship found between follower '${follower1}' and followee '${followee1}'.`,
        "Subsequent unfollow attempts for the same relationship should fail"
      );
    });

    await client.close();
  });

  await test.step("Unit Tests for 'isFollowing' action", async (t) => {
    const [db, client] = await testDb();
    const followingConcept = new Following(db);

    await t.step("Happy-path: should return true for an existing relationship", async () => {
      await followingConcept.follow(follower1, followee1);
      const { isFollowing } = await followingConcept.isFollowing(follower1, followee1);
      assertEquals(isFollowing, true, "Should return true for an actively followed relationship");
    });

    await t.step("Happy-path: should return false for a non-existing relationship", async () => {
      const { isFollowing } = await followingConcept.isFollowing(follower1, followee1);
      assertEquals(isFollowing, false, "Should return false for a relationship that has never been established");
    });

    await t.step("Edge case: should return false for partially existing IDs (e.g., follower exists, followee doesn't match)", async () => {
      await followingConcept.follow(follower1, followee1); // Establish follower1 -> followee1
      const { isFollowing } = await followingConcept.isFollowing(follower1, createTestId("non-existent-followee"));
      assertEquals(isFollowing, false, "Should return false if only one of the IDs matches an existing relationship part");
    });

    await t.step("Edge case: should return false for completely non-existent IDs", async () => {
      const { isFollowing } = await followingConcept.isFollowing(
        createTestId("non-existent-f"),
        createTestId("non-existent-fe")
      );
      assertEquals(isFollowing, false, "Should return false for a relationship between two completely non-existent IDs");
    });

    await client.close();
  });

  await test.step("Unit Tests for 'getFollowees' action", async (t) => {
    const [db, client] = await testDb();
    const followingConcept = new Following(db);

    await t.step("Happy-path: should return all followees for a given follower", async () => {
      await followingConcept.follow(follower1, followee1);
      await followingConcept.follow(follower1, followee2);
      await followingConcept.follow(follower2, followee1); // This relationship should not affect follower1's followees

      const { followeeIDs } = await followingConcept.getFollowees(follower1);
      assertEquals(followeeIDs.sort(), [followee1, followee2].sort(), "Should return a sorted list of all entities followed by follower1");
    });

    await t.step("Happy-path: should return an empty array if follower has no followees", async () => {
      const { followeeIDs } = await followingConcept.getFollowees(follower1);
      assertEquals(followeeIDs, [], "Should return an empty array for a follower that follows nobody");
    });

    await t.step("Edge case: should return an empty array for a non-existent follower", async () => {
      const { followeeIDs } = await followingConcept.getFollowees(createTestId("non-existent-follower"));
      assertEquals(followeeIDs, [], "Should return an empty array for a follower ID that does not exist in any relationship");
    });

    await client.close();
  });

  await test.step("Unit Tests for 'getFollowers' action", async (t) => {
    const [db, client] = await testDb();
    const followingConcept = new Following(db);

    await t.step("Happy-path: should return all followers for a given followee", async () => {
      await followingConcept.follow(follower1, followee1);
      await followingConcept.follow(follower2, followee1);
      await followingConcept.follow(follower1, followee2); // This relationship should not affect followee1's followers

      const { followerIDs } = await followingConcept.getFollowers(followee1);
      assertEquals(followerIDs.sort(), [follower1, follower2].sort(), "Should return a sorted list of all entities following followee1");
    });

    await t.step("Happy-path: should return an empty array if followee has no followers", async () => {
      const { followerIDs } = await followingConcept.getFollowers(followee1);
      assertEquals(followerIDs, [], "Should return an empty array for a followee that has no followers");
    });

    await t.step("Edge case: should return an empty array for a non-existent followee", async () => {
      const { followerIDs } = await followingConcept.getFollowers(createTestId("non-existent-followee"));
      assertEquals(followerIDs, [], "Should return an empty array for a followee ID that does not exist in any relationship");
    });

    await client.close();
  });

  await test.step("Trace Test: Principle Verification", async (t) => {
    // This test simulates a realistic multi-step interaction to confirm the concept's principle.
    const [db, client] = await testDb();
    const followingConcept = new Following(db);

    const userA = createTestId("user-A-principle");
    const userB = createTestId("user-B-principle");
    const userC = createTestId("user-C-principle");

    await t.step("Initial state: No relationships should exist", async () => {
      assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, false, "Initially, A should not follow B");
      assertEquals((await followingConcept.isFollowing(userA, userC)).isFollowing, false, "Initially, A should not follow C");
      assertEquals((await followingConcept.getFollowees(userA)).followeeIDs, [], "A should have no followees initially");
      assertEquals((await followingConcept.getFollowers(userB)).followerIDs, [], "B should have no followers initially");
    });

    await t.step("Action 1: User A follows User B", async () => {
      await followingConcept.follow(userA, userB);
      assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, true, "Verification: A should now be following B");
      assertEquals((await followingConcept.getFollowees(userA)).followeeIDs, [userB], "Verification: A's followees list should include B");
      assertEquals((await followingConcept.getFollowers(userB)).followerIDs, [userA], "Verification: B's followers list should include A");
      assertEquals((await followingConcept.isFollowing(userA, userC)).isFollowing, false, "Verification: A should still not be following C");
    });

    await t.step("Action 2: User A follows User C", async () => {
      await followingConcept.follow(userA, userC);
      assertEquals((await followingConcept.isFollowing(userA, userC)).isFollowing, true, "Verification: A should now be following C");
      assertEquals((await followingConcept.getFollowees(userA)).followeeIDs.sort(), [userB, userC].sort(), "Verification: A's followees should now include B and C");
      assertEquals((await followingConcept.getFollowers(userC)).followerIDs, [userA], "Verification: C's followers should now include A");
      assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, true, "Verification: A should still be following B");
    });

    await t.step("Intermediate check: User B verifies their followers", async () => {
      const { followerIDs } = await followingConcept.getFollowers(userB);
      assertEquals(followerIDs, [userA], "User B should correctly identify A as their sole follower");
    });

    await t.step("Action 3: User A unfollows User B", async () => {
      await followingConcept.unfollow(userA, userB);
      assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, false, "Verification: A should no longer be following B");
      assertEquals((await followingConcept.getFollowees(userA)).followeeIDs, [userC], "Verification: A's followees should now only include C");
      assertEquals((await followingConcept.getFollowers(userB)).followerIDs, [], "Verification: B should now have no followers");
      assertEquals((await followingConcept.isFollowing(userA, userC)).isFollowing, true, "Verification: A should still be following C");
    });

    await t.step("Final check: User A verifies their followees again", async () => {
      const { followeeIDs } = await followingConcept.getFollowees(userA);
      assertEquals(followeeIDs, [userC], "A's followees list should correctly reflect only C");
    });

    await t.step("Principle confirmation: Attempt to unfollow B again should fail as relationship is terminated", async () => {
      await assertRejects(
        () => followingConcept.unfollow(userA, userB),
        Error,
        `No existing follow relationship found between follower '${userA}' and followee '${userB}'.`,
        "Attempting to unfollow B again should result in a requires violation"
      );
    });

    await client.close();
  });

  await test.step("Robustness Tests", async (t) => {
    const [db, client] = await testDb();
    const followingConcept = new Following(db);

    await t.step("Rapid follow and unfollow sequence: ensuring state consistency", async () => {
      const f_id = createTestId("r-follower");
      const fe_id = createTestId("r-followee");

      // Step 1: Follow
      await followingConcept.follow(f_id, fe_id);
      assertEquals((await followingConcept.isFollowing(f_id, fe_id)).isFollowing, true, "Should be following immediately after follow");

      // Step 2: Unfollow immediately
      await followingConcept.unfollow(f_id, fe_id);
      assertEquals((await followingConcept.isFollowing(f_id, fe_id)).isFollowing, false, "Should not be following immediately after unfollow");

      // Step 3: Attempt to unfollow again (should fail gracefully)
      await assertRejects(
        () => followingConcept.unfollow(f_id, fe_id),
        Error,
        "No existing follow relationship found",
        "Second unfollow should fail cleanly due to missing relationship"
      );

      // Step 4: Attempt to follow again (should succeed, re-establishing the relationship)
      await followingConcept.follow(f_id, fe_id);
      assertEquals((await followingConcept.isFollowing(f_id, fe_id)).isFollowing, true, "Should be able to re-establish the relationship");
    });

    await t.step("Data consistency after failed 'follow' operation (duplicate key)", async () => {
      await followingConcept.follow(follower1, followee1); // First successful follow

      // Attempt to follow again (this should trigger a MongoServerError with code 11000 and be caught)
      await assertRejects(
        () => followingConcept.follow(follower1, followee1),
        Error,
        `Follower '${follower1}' is already following followee '${followee1}'.`,
        "Duplicate follow attempt should be rejected with the specific error message"
      );

      // Verify that no extra relationship was added or the existing one was altered
      const { followeeIDs } = await followingConcept.getFollowees(follower1);
      assertEquals(followeeIDs, [followee1], "Only one relationship should exist after a failed duplicate follow attempt");
      const { followerIDs } = await followingConcept.getFollowers(followee1);
      assertEquals(followerIDs, [follower1], "Only one relationship should exist after a failed duplicate follow attempt");
    });
    
    await t.step("Unexpected sequence: Attempt to unfollow someone not followed by the specified follower", async () => {
        const userA = createTestId("robust-user-A");
        const userB = createTestId("robust-user-B");
        const userC = createTestId("robust-user-C");

        // Establish some relationships: A follows C, B follows C. A and B do NOT follow each other.
        await followingConcept.follow(userA, userC);
        await followingConcept.follow(userB, userC);
        
        // User A tries to unfollow User B (an invalid operation as A never followed B)
        await assertRejects(
            () => followingConcept.unfollow(userA, userB),
            Error,
            `No existing follow relationship found between follower '${userA}' and followee '${userB}'.`,
            "Unfollowing a non-existent relationship for a specific follower should fail"
        );

        // State verification: Ensure existing relationships are untouched after the failed operation
        assertEquals((await followingConcept.isFollowing(userA, userC)).isFollowing, true, "A should still be following C");
        assertEquals((await followingConcept.isFollowing(userB, userC)).isFollowing, true, "B should still be following C");
        assertEquals((await followingConcept.isFollowing(userA, userB)).isFollowing, false, "A should still not be following B");
    });

    await client.close();
  });
});
```
