// src/concepts/Following/Following.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Following, FOLLOW_RELATIONSHIPS_COLLECTION } from "./Following.ts";
import { Collection } from "mongodb";
import type { Db } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const userA = "userA" as ID;
const userB = "userB" as ID;
const userC = "userC" as ID;
const userD = "userD" as ID;
const nonExistentUser = "nonExistentUser" as ID;

const LEGACY_COLLECTION_NAME: string = "followrelationships";

const resetFollowingCollections = async (db: Db) => {
  await db.collection(FOLLOW_RELATIONSHIPS_COLLECTION).deleteMany({});
  if (LEGACY_COLLECTION_NAME !== FOLLOW_RELATIONSHIPS_COLLECTION) {
    await db.collection(LEGACY_COLLECTION_NAME).deleteMany({});
  }
};

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
    const coll: Collection = db.collection(FOLLOW_RELATIONSHIPS_COLLECTION);
    await resetFollowingCollections(db);

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
      await assertRejects(
        () => following.follow(userA, userA),
        Error,
        "Cannot follow yourself."
      );
    });

    await t.step(
      "✅ Requires violation: Cannot follow someone already followed",
      async () => {
        await following.follow(userA, userC);
        await assertRejects(
          () => following.follow(userA, userC),
          Error,
          `Follower '${userA}' is already following followee '${userC}'.`
        );

        const count = await coll.countDocuments({
          follower: userA,
          followee: userC,
        });
        assertEquals(count, 1);
      }
    );

    await t.step("✅ Edge case: Following with empty string IDs", async () => {
      const emptyID = "" as ID;
      await following.follow(emptyID, userD);
      const { isFollowing } = await following.isFollowing(emptyID, userD);
      assertEquals(isFollowing, true);

      await following.follow(userD, emptyID);
      const { isFollowing: isFollowingEmptyFollowee } =
        await following.isFollowing(userD, emptyID);
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
    await resetFollowingCollections(db);

    await t.step("✅ Happy path: A user unfollows another user", async () => {
      await following.follow(userA, userB);
      await following.unfollow(userA, userB);

      const { isFollowing } = await following.isFollowing(userA, userB);
      assertEquals(isFollowing, false);
    });

    await t.step(
      "✅ Requires violation: Cannot unfollow someone not followed",
      async () => {
        await assertRejects(
          () => following.unfollow(userA, userC),
          Error,
          `No existing follow relationship found between follower '${userA}' and followee '${userC}'.`
        );
      }
    );

    await t.step(
      "✅ Edge case: Unfollowing non-existent relationships (idempotency)",
      async () => {
        await assertRejects(
          () => following.unfollow(userA, userB),
          Error,
          `No existing follow relationship found between follower '${userA}' and followee '${userB}'.`
        );
      }
    );

    await t.step(
      "✅ Robustness: Unfollowing with non-existent IDs",
      async () => {
        await assertRejects(
          () => following.unfollow(nonExistentUser, userA),
          Error,
          `No existing follow relationship found between follower '${nonExistentUser}' and followee '${userA}'.`
        );

        await assertRejects(
          () => following.unfollow(userA, nonExistentUser),
          Error,
          `No existing follow relationship found between follower '${userA}' and followee '${nonExistentUser}'.`
        );
      }
    );

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
    await resetFollowingCollections(db);

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
      const { isFollowing: nonExistFollower } = await following.isFollowing(
        nonExistentUser,
        userB
      );
      assertEquals(nonExistFollower, false);

      const { isFollowing: nonExistFollowee } = await following.isFollowing(
        userA,
        nonExistentUser
      );
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
    await resetFollowingCollections(db);

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
    await resetFollowingCollections(db);

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
    await resetFollowingCollections(db);

    assertEquals((await following.getFollowees(userA)).followeeIDs, []);
    assertEquals((await following.getFollowers(userB)).followerIDs, []);

    await following.follow(userA, userB);
    await following.follow(userA, userC);
    await following.follow(userD, userB);

    assertEquals(
      (await following.getFollowees(userA)).followeeIDs.sort(),
      [userB, userC].sort()
    );
    assertEquals(
      (await following.getFollowers(userB)).followerIDs.sort(),
      [userA, userD].sort()
    );

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
    const coll: Collection = db.collection(FOLLOW_RELATIONSHIPS_COLLECTION);
    await resetFollowingCollections(db);

    const results = await Promise.allSettled([
      following.follow(userA, userB),
      following.follow(userA, userB),
    ]);
    const fulfilledCount = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const rejectedCount = results.filter((r) => r.status === "rejected").length;
    assertEquals(fulfilledCount, 1);
    assertEquals(rejectedCount, 1);

    const count = await coll.countDocuments({
      follower: userA,
      followee: userB,
    });
    assertEquals(count, 1);

    await resetFollowingCollections(db);

    await following.follow(userA, userC);
    await following.follow(userB, userD);
    await following.follow(userC, userA);

    await assertRejects(
      () => following.follow(userA, userC),
      Error,
      `Follower '${userA}' is already following followee '${userC}'.`
    );
    await assertRejects(
      () => following.unfollow(userA, userD),
      Error,
      `No existing follow relationship found between follower '${userA}' and followee '${userD}'.`
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
    console.log(
      "\n===================================================================="
    );
    console.log(
      "🎉 FOLLOWING CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉"
    );
    console.log(
      "======================================================================\n"
    );
  },
});
