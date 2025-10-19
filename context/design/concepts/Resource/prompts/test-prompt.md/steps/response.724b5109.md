---
timestamp: 'Sat Oct 18 2025 23:13:21 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_231321.a5feb9fe.md]]'
content_id: 724b510947b60777c250e00a9a688293c361175544474e6018e41d832486065d
---

# response:

```typescript
// src/concepts/Ranking.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Ranking } from "./Ranking.ts"; // Assuming Ranking.ts is in the same directory
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts"; // Assuming ID type is defined in @utils/types.ts

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const user1 = "user1" as ID;
const user2 = "user2" as ID;
const user3 = "user3" as ID;
const user4 = "user4" as ID; // For more complex scenarios

const itemA = "itemA" as ID;
const itemB = "itemB" as ID;
const itemC = "itemC" as ID;
const itemD = "itemD" as ID; // For more complex scenarios

const nonExistentUser = "nonExistentUser" as ID;
const nonExistentItem = "nonExistentItem" as ID;

const rankingCollectionName = "rankings"; // The collection name used by the Ranking concept

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RANKING CONCEPT");
console.log("===========================================\n");

// ----------------------------------------------------------------------
// RANK ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Ranking concept: Unit tests for 'rank' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: RANK ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const ranking = new Ranking(db);
    const coll: Collection = db.collection(rankingCollectionName);
    await coll.deleteMany({}); // reset DB for a clean slate

    await t.step("✅ Happy path: A user ranks an item successfully", async () => {
      await ranking.rank(user1, itemA, 4);

      // State verification
      const dbEntry = await coll.findOne({ userID: user1, itemID: itemA });
      assertEquals(dbEntry?.userID, user1);
      assertEquals(dbEntry?.itemID, itemA);
      assertEquals(dbEntry?.score, 4);
      assertEquals(typeof dbEntry?.timestamp, "object"); // Check if timestamp exists and is a Date object

      const { score } = await ranking.getUserRank(user1, itemA);
      assertEquals(score, 4);

      const { averageScore, totalRankings } = await ranking.getAverageScore(itemA);
      assertEquals(averageScore, 4);
      assertEquals(totalRankings, 1);
    });

    await t.step("✅ Requires violation: Cannot rank the same item twice", async () => {
      await ranking.rank(user1, itemB, 3); // First rank
      await assertRejects(
        () => ranking.rank(user1, itemB, 5), // Attempt to rank again
        Error,
        `User '${user1}' has already ranked item '${itemB}'. Use updateRank to change.`,
      );

      // State verification: ensure only one entry exists
      const count = await coll.countDocuments({ userID: user1, itemID: itemB });
      assertEquals(count, 1);
      const dbEntry = await coll.findOne({ userID: user1, itemID: itemB });
      assertEquals(dbEntry?.score, 3); // Score should remain the initial one
    });

    await t.step("✅ Requires violation: Score out of valid range (too low)", async () => {
      await assertRejects(
        () => ranking.rank(user2, itemA, 0),
        Error,
        "Score must be between 1 and 5.",
      );
      const count = await coll.countDocuments({ userID: user2, itemID: itemA });
      assertEquals(count, 0);
    });

    await t.step("✅ Requires violation: Score out of valid range (too high)", async () => {
      await assertRejects(
        () => ranking.rank(user2, itemA, 6),
        Error,
        "Score must be between 1 and 5.",
      );
      const count = await coll.countDocuments({ userID: user2, itemID: itemA });
      assertEquals(count, 0);
    });

    await t.step("✅ Requires violation: Empty user ID", async () => {
      const emptyID = "" as ID;
      await assertRejects(
        () => ranking.rank(emptyID, itemC, 5),
        Error,
        "User ID and Item ID cannot be empty.",
      );
    });

    await t.step("✅ Requires violation: Empty item ID", async () => {
      const emptyID = "" as ID;
      await assertRejects(
        () => ranking.rank(user3, emptyID, 5),
        Error,
        "User ID and Item ID cannot be empty.",
      );
    });

    await t.step("✅ Edge case: Different users can rank the same item", async () => {
      await ranking.rank(user3, itemC, 5);
      await ranking.rank(user4, itemC, 1);

      const { averageScore, totalRankings } = await ranking.getAverageScore(itemC);
      assertEquals(averageScore, 3); // (5+1)/2
      assertEquals(totalRankings, 2);

      const count = await coll.countDocuments({ itemID: itemC });
      assertEquals(count, 2);
    });

    await client.close();
    console.log("✅ Finished RANK tests\n");
  },
});

// ----------------------------------------------------------------------
// UPDATE RANK ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Ranking concept: Unit tests for 'updateRank' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=============================================");
    console.log("🧪 TEST GROUP: UPDATE RANK ACTIONS");
    console.log("=============================================\n");

    const [db, client] = await testDb();
    const ranking = new Ranking(db);
    const coll: Collection = db.collection(rankingCollectionName);
    await coll.deleteMany({}); // reset DB

    await t.step("✅ Happy path: A user updates an existing rank", async () => {
      await ranking.rank(user1, itemA, 3);
      const initialTimestamp = (await coll.findOne({ userID: user1, itemID: itemA }))?.timestamp;
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure timestamp changes

      await ranking.updateRank(user1, itemA, 5);

      // State verification
      const dbEntry = await coll.findOne({ userID: user1, itemID: itemA });
      assertEquals(dbEntry?.score, 5);
      assertEquals(dbEntry?.timestamp! > initialTimestamp!, true); // Timestamp should be updated

      const { score } = await ranking.getUserRank(user1, itemA);
      assertEquals(score, 5);

      const { averageScore, totalRankings } = await ranking.getAverageScore(itemA);
      assertEquals(averageScore, 5);
      assertEquals(totalRankings, 1);
    });

    await t.step("✅ Requires violation: Cannot update a non-existent rank", async () => {
      await assertRejects(
        () => ranking.updateRank(user2, itemA, 4),
        Error,
        `Ranking by user '${user2}' for item '${itemA}' not found.`,
      );
      const count = await coll.countDocuments({ userID: user2, itemID: itemA });
      assertEquals(count, 0);
    });

    await t.step("✅ Requires violation: New score out of valid range", async () => {
      await ranking.rank(user1, itemB, 2);
      await assertRejects(
        () => ranking.updateRank(user1, itemB, 0),
        Error,
        "New score must be between 1 and 5.",
      );
      // State verification: score should not have changed
      const dbEntry = await coll.findOne({ userID: user1, itemID: itemB });
      assertEquals(dbEntry?.score, 2);
    });

    await t.step("✅ Edge case: Updating with empty string IDs", async () => {
      const emptyID = "" as ID;
      // Should not be possible to update a non-existent rank
      await assertRejects(
        () => ranking.updateRank(emptyID, itemC, 3),
        Error,
        `Ranking by user '${emptyID}' for item '${itemC}' not found.`,
      );
      await assertRejects(
        () => ranking.updateRank(user3, emptyID, 3),
        Error,
        `Ranking by user '${user3}' for item '${emptyID}' not found.`,
      );
    });

    await t.step("✅ Idempotency: Updating with the same score should succeed but not change data", async () => {
      await ranking.rank(user2, itemB, 3);
      const initialTimestamp = (await coll.findOne({ userID: user2, itemID: itemB }))?.timestamp;

      await ranking.updateRank(user2, itemB, 3); // Update with same score

      const dbEntry = await coll.findOne({ userID: user2, itemID: itemB });
      assertEquals(dbEntry?.score, 3);
      // Depending on implementation, timestamp might update even if score is same.
      // For this test, we assume timestamp *could* update on any update call.
      // If we wanted to strictly check for no change, we'd need to compare the whole object.
      // For now, checking score is enough for idempotency of state.
    });

    await client.close();
    console.log("✅ Finished UPDATE RANK tests\n");
  },
});

// ----------------------------------------------------------------------
// REMOVE RANK ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Ranking concept: Unit tests for 'removeRank' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=============================================");
    console.log("🧪 TEST GROUP: REMOVE RANK ACTIONS");
    console.log("=============================================\n");

    const [db, client] = await testDb();
    const ranking = new Ranking(db);
    const coll: Collection = db.collection(rankingCollectionName);
    await coll.deleteMany({}); // reset DB

    await t.step("✅ Happy path: A user removes an existing rank", async () => {
      await ranking.rank(user1, itemA, 4);
      await ranking.removeRank(user1, itemA);

      // State verification
      const dbEntry = await coll.findOne({ userID: user1, itemID: itemA });
      assertEquals(dbEntry, null);

      const { score } = await ranking.getUserRank(user1, itemA);
      assertEquals(score, null);

      const { averageScore, totalRankings } = await ranking.getAverageScore(itemA);
      assertEquals(averageScore, null);
      assertEquals(totalRankings, 0);
    });

    await t.step("✅ Requires violation: Cannot remove a non-existent rank", async () => {
      await assertRejects(
        () => ranking.removeRank(user2, itemA),
        Error,
        `Ranking by user '${user2}' for item '${itemA}' not found.`,
      );
      const count = await coll.countDocuments({ userID: user2, itemID: itemA });
      assertEquals(count, 0);
    });

    await t.step("✅ Edge case: Removing with non-existent IDs (idempotency)", async () => {
      await assertRejects(
        () => ranking.removeRank(nonExistentUser, itemA),
        Error,
        `Ranking by user '${nonExistentUser}' for item '${itemA}' not found.`,
      );
      await assertRejects(
        () => ranking.removeRank(user1, nonExistentItem),
        Error,
        `Ranking by user '${user1}' for item '${nonExistentItem}' not found.`,
      );
    });

    await t.step("✅ Edge case: Removing with empty string IDs", async () => {
      const emptyID = "" as ID;
      await assertRejects(
        () => ranking.removeRank(emptyID, itemC),
        Error,
        "User ID and Item ID cannot be empty.",
      );
      await assertRejects(
        () => ranking.removeRank(user3, emptyID),
        Error,
        "User ID and Item ID cannot be empty.",
      );
    });

    await client.close();
    console.log("✅ Finished REMOVE RANK tests\n");
  },
});

// ----------------------------------------------------------------------
// GET AVERAGE SCORE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Ranking concept: Unit tests for 'getAverageScore' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: GET AVERAGE SCORE ACTIONS");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const ranking = new Ranking(db);
    const coll: Collection = db.collection(rankingCollectionName);
    await coll.deleteMany({}); // reset DB

    await t.step("✅ Happy path: Multiple rankings for an item", async () => {
      await ranking.rank(user1, itemA, 5);
      await ranking.rank(user2, itemA, 3);
      await ranking.rank(user3, itemA, 4);

      const { itemID, averageScore, totalRankings } = await ranking.getAverageScore(itemA);
      assertEquals(itemID, itemA);
      assertEquals(averageScore, 4); // (5+3+4)/3 = 12/3 = 4
      assertEquals(totalRankings, 3);
    });

    await t.step("✅ Edge case: No rankings for an item", async () => {
      const { itemID, averageScore, totalRankings } = await ranking.getAverageScore(itemB);
      assertEquals(itemID, itemB);
      assertEquals(averageScore, null);
      assertEquals(totalRankings, 0);
    });

    await t.step("✅ Edge case: Non-existent item", async () => {
      const { itemID, averageScore, totalRankings } = await ranking.getAverageScore(nonExistentItem);
      assertEquals(itemID, nonExistentItem);
      assertEquals(averageScore, null);
      assertEquals(totalRankings, 0);
    });

    await t.step("✅ State update: Average score after update/removal", async () => {
      await ranking.rank(user1, itemC, 1);
      await ranking.rank(user2, itemC, 5);
      assertEquals((await ranking.getAverageScore(itemC)).averageScore, 3); // (1+5)/2

      await ranking.updateRank(user1, itemC, 3);
      assertEquals((await ranking.getAverageScore(itemC)).averageScore, 4); // (3+5)/2

      await ranking.removeRank(user2, itemC);
      assertEquals((await ranking.getAverageScore(itemC)).averageScore, 3); // (3)/1
      assertEquals((await ranking.getAverageScore(itemC)).totalRankings, 1);
    });

    await t.step("✅ Requires violation: Empty item ID", async () => {
      const emptyID = "" as ID;
      await assertRejects(
        () => ranking.getAverageScore(emptyID),
        Error,
        "Item ID cannot be empty.",
      );
    });

    await client.close();
    console.log("✅ Finished GET AVERAGE SCORE tests\n");
  },
});

// ----------------------------------------------------------------------
// GET USER RANK ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Ranking concept: Unit tests for 'getUserRank' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: GET USER RANK ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const ranking = new Ranking(db);
    const coll: Collection = db.collection(rankingCollectionName);
    await coll.deleteMany({}); // reset DB

    await t.step("✅ Happy path: User has ranked the item", async () => {
      await ranking.rank(user1, itemA, 4);
      const { userID, itemID, score } = await ranking.getUserRank(user1, itemA);
      assertEquals(userID, user1);
      assertEquals(itemID, itemA);
      assertEquals(score, 4);
    });

    await t.step("✅ Negative path: User has not ranked the item", async () => {
      const { userID, itemID, score } = await ranking.getUserRank(user2, itemA);
      assertEquals(userID, user2);
      assertEquals(itemID, itemA);
      assertEquals(score, null);
    });

    await t.step("✅ Edge case: Non-existent user/item IDs", async () => {
      const { score: score1 } = await ranking.getUserRank(nonExistentUser, itemB);
      assertEquals(score1, null);

      const { score: score2 } = await ranking.getUserRank(user1, nonExistentItem);
      assertEquals(score2, null);
    });

    await t.step("✅ State update: Rank after update/removal", async () => {
      await ranking.rank(user1, itemC, 2);
      assertEquals((await ranking.getUserRank(user1, itemC)).score, 2);

      await ranking.updateRank(user1, itemC, 5);
      assertEquals((await ranking.getUserRank(user1, itemC)).score, 5);

      await ranking.removeRank(user1, itemC);
      assertEquals((await ranking.getUserRank(user1, itemC)).score, null);
    });

    await t.step("✅ Requires violation: Empty user ID", async () => {
      const emptyID = "" as ID;
      await assertRejects(
        () => ranking.getUserRank(emptyID, itemD),
        Error,
        "User ID and Item ID cannot be empty.",
      );
    });

    await t.step("✅ Requires violation: Empty item ID", async () => {
      const emptyID = "" as ID;
      await assertRejects(
        () => ranking.getUserRank(user4, emptyID),
        Error,
        "User ID and Item ID cannot be empty.",
      );
    });

    await client.close();
    console.log("✅ Finished GET USER RANK tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
  name: "Ranking concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const ranking = new Ranking(db);
    await db.collection(rankingCollectionName).deleteMany({}); // reset DB

    // Initial state
    assertEquals((await ranking.getUserRank(user1, itemA)).score, null);
    assertEquals((await ranking.getAverageScore(itemA)).averageScore, null);
    assertEquals((await ranking.getAverageScore(itemA)).totalRankings, 0);

    // Step 1: User1 ranks itemA
    await ranking.rank(user1, itemA, 5);
    assertEquals((await ranking.getUserRank(user1, itemA)).score, 5);
    assertEquals((await ranking.getAverageScore(itemA)).averageScore, 5);
    assertEquals((await ranking.getAverageScore(itemA)).totalRankings, 1);

    // Step 2: User2 ranks itemA
    await ranking.rank(user2, itemA, 3);
    assertEquals((await ranking.getUserRank(user2, itemA)).score, 3);
    assertEquals((await ranking.getAverageScore(itemA)).averageScore, 4); // (5+3)/2
    assertEquals((await ranking.getAverageScore(itemA)).totalRankings, 2);

    // Step 3: User1 ranks itemB
    await ranking.rank(user1, itemB, 4);
    assertEquals((await ranking.getUserRank(user1, itemB)).score, 4);
    assertEquals((await ranking.getAverageScore(itemB)).averageScore, 4);
    assertEquals((await ranking.getAverageScore(itemB)).totalRankings, 1);

    // Step 4: User1 updates rank for itemA
    await ranking.updateRank(user1, itemA, 1);
    assertEquals((await ranking.getUserRank(user1, itemA)).score, 1);
    assertEquals((await ranking.getAverageScore(itemA)).averageScore, 2); // (1+3)/2
    assertEquals((await ranking.getAverageScore(itemA)).totalRankings, 2);

    // Step 5: User2 removes rank for itemA
    await ranking.removeRank(user2, itemA);
    assertEquals((await ranking.getUserRank(user2, itemA)).score, null);
    assertEquals((await ranking.getAverageScore(itemA)).averageScore, 1); // Only user1's rank (1)
    assertEquals((await ranking.getAverageScore(itemA)).totalRankings, 1);

    // Final checks
    assertEquals((await ranking.getUserRank(user1, itemA)).score, 1);
    assertEquals((await ranking.getUserRank(user1, itemB)).score, 4);
    assertEquals((await ranking.getUserRank(user2, itemA)).score, null);
    assertEquals((await ranking.getAverageScore(itemB)).averageScore, 4);
    assertEquals((await ranking.getAverageScore(itemB)).totalRankings, 1);

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Ranking concept: Robustness and concurrency tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const ranking = new Ranking(db);
    const coll: Collection = db.collection(rankingCollectionName);
    await coll.deleteMany({}); // reset DB

    // Scenario 1: Concurrent initial ranking attempts (should only one succeed)
    console.log("  - Concurrent initial ranking attempts:");
    const rankPromises = [
      ranking.rank(user1, itemD, 5),
      ranking.rank(user1, itemD, 4), // This one should reject as user1 already ranked itemD
      ranking.rank(user2, itemD, 3),
    ];

    const results = await Promise.allSettled(rankPromises);
    const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;
    const rejectedCount = results.filter((r) => r.status === "rejected").length;

    assertEquals(fulfilledCount, 2); // user1-itemD (first attempt) and user2-itemD
    assertEquals(rejectedCount, 1); // user1-itemD (second attempt)

    const count = await coll.countDocuments({ itemID: itemD });
    assertEquals(count, 2); // Two unique rankings should exist
    assertEquals((await ranking.getUserRank(user1, itemD)).score, 5); // Verify the first rank was kept

    // Validate the rejected reason for concurrency
    const rejectedResult = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    assertEquals(
      (rejectedResult.reason as Error).message,
      `User '${user1}' has already ranked item '${itemD}'. Use updateRank to change.`,
    );

    // Scenario 2: Concurrent updates to the same ranking
    console.log("  - Concurrent updates to the same ranking:");
    await coll.deleteMany({}); // reset db for next scenario
    await ranking.rank(user3, itemA, 3); // Initial rank

    const updatePromises = [
      ranking.updateRank(user3, itemA, 1),
      ranking.updateRank(user3, itemA, 5),
      ranking.updateRank(user3, itemA, 2),
    ];

    await Promise.allSettled(updatePromises);
    // The final score should be one of the attempted updates.
    // MongoDB's updateOne is atomic. The last one to *commit* will win.
    // We can't guarantee order without more sophisticated locking/transactions,
    // but we can ensure no data corruption (i.e., it's a valid score and only one entry).
    const finalRank = (await ranking.getUserRank(user3, itemA)).score;
    assertEquals([1, 5, 2].includes(finalRank!), true); // Final score is one of the valid attempts
    assertEquals(await coll.countDocuments({ userID: user3, itemID: itemA }), 1); // Still only one document

    // Scenario 3: Attempting to remove a non-existent ranking concurrently with a valid one
    console.log("  - Concurrent removal attempts:");
    await coll.deleteMany({});
    await ranking.rank(user4, itemB, 4); // Only one existing rank

    const removePromises = [
      ranking.removeRank(user4, itemB), // Valid removal
      ranking.removeRank(nonExistentUser, itemB), // Non-existent user
      ranking.removeRank(user4, nonExistentItem), // Non-existent item
    ];

    const removeResults = await Promise.allSettled(removePromises);

    assertEquals(removeResults.filter((r) => r.status === "fulfilled").length, 1);
    assertEquals(removeResults.filter((r) => r.status === "rejected").length, 2);

    assertEquals((await ranking.getUserRank(user4, itemB)).score, null); // The valid one should be removed
    assertEquals(await coll.countDocuments({ userID: user4, itemID: itemB }), 0);

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
    console.log("🎉 RANKING CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
    console.log("======================================================================\n");
  },
});

// ----------------------------------------------------------------------
// HYPOTHETICAL Ranking CLASS IMPLEMENTATION (for testing context)
// This would typically be in src/concepts/Ranking/Ranking.ts
// ----------------------------------------------------------------------

import { Db } from "mongodb"; // Assuming Db from mongodb

interface RankingDoc {
  _id: string; // Composite key: `${userID}-${itemID}`
  userID: ID;
  itemID: ID;
  score: number;
  timestamp: Date;
}

export class Ranking {
  private collection: Collection<RankingDoc>;

  constructor(db: Db) {
    this.collection = db.collection<RankingDoc>("rankings");
    // Ensure unique index on userID, itemID for idempotency/update logic
    // This index makes `rank` throw a duplicate key error if called twice for the same user/item
    this.collection.createIndex({ userID: 1, itemID: 1 }, { unique: true })
      .catch((err) => {
        // Ignore if index already exists
        if (!err.message.includes("Index with name 'userID_1_itemID_1' already exists")) {
          console.error("Error creating index for rankings:", err);
        }
      });
  }

  // Helper for internal ID to prevent issues if mongo's default _id is used for internal operations
  // For this concept, the unique index (userID, itemID) naturally handles the primary key logic.
  // The _id field in RankingDoc can just be a composite of userID-itemID for easy lookup
  // without needing to query by two separate fields for every operation.
  private getRankingId(userID: ID, itemID: ID): string {
    return `${userID}-${itemID}`;
  }

  /**
   * Allows a user to rank an item with a score.
   * Throws an error if the user has already ranked the item or if inputs are invalid.
   */
  async rank(userID: ID, itemID: ID, score: number): Promise<void> {
    if (!userID || !itemID) {
      throw new Error("User ID and Item ID cannot be empty.");
    }
    if (score < 1 || score > 5) { // Assuming a 1-5 scale
      throw new Error("Score must be between 1 and 5.");
    }

    const _id = this.getRankingId(userID, itemID);
    // Attempt to insert, relying on unique index to prevent duplicates
    try {
      await this.collection.insertOne({
        _id,
        userID,
        itemID,
        score,
        timestamp: new Date(),
      });
    } catch (error) {
      // Check for duplicate key error (MongoDB error code 11000)
      if (error.code === 11000) {
        throw new Error(`User '${userID}' has already ranked item '${itemID}'. Use updateRank to change.`);
      }
      throw error; // Re-throw other errors
    }
  }

  /**
   * Allows a user to update their existing rank for an item.
   * Throws an error if the ranking does not exist or if the new score is invalid.
   */
  async updateRank(userID: ID, itemID: ID, newScore: number): Promise<void> {
    if (!userID || !itemID) {
      throw new Error("User ID and Item ID cannot be empty.");
    }
    if (newScore < 1 || newScore > 5) {
      throw new Error("New score must be between 1 and 5.");
    }

    const _id = this.getRankingId(userID, itemID);
    const result = await this.collection.updateOne(
      { _id },
      { $set: { score: newScore, timestamp: new Date() } },
    );

    if (result.matchedCount === 0) {
      throw new Error(`Ranking by user '${userID}' for item '${itemID}' not found.`);
    }
  }

  /**
   * Allows a user to remove their rank for an item.
   * Throws an error if the ranking does not exist or if inputs are invalid.
   */
  async removeRank(userID: ID, itemID: ID): Promise<void> {
    if (!userID || !itemID) {
      throw new Error("User ID and Item ID cannot be empty.");
    }

    const _id = this.getRankingId(userID, itemID);
    const result = await this.collection.deleteOne({ _id });

    if (result.deletedCount === 0) {
      throw new Error(`Ranking by user '${userID}' for item '${itemID}' not found.`);
    }
  }

  /**
   * Gets the average score and total number of rankings for a given item.
   * Returns null for averageScore and 0 for totalRankings if the item has no rankings.
   */
  async getAverageScore(itemID: ID): Promise<{ itemID: ID, averageScore: number | null, totalRankings: number }> {
    if (!itemID) {
      throw new Error("Item ID cannot be empty.");
    }

    const aggregationResult = await this.collection.aggregate<{ _id: ID, averageScore: number, totalRankings: number }>([
      { $match: { itemID: itemID } },
      {
        $group: {
          _id: "$itemID",
          averageScore: { $avg: "$score" },
          totalRankings: { $sum: 1 },
        },
      },
    ]).toArray();

    if (aggregationResult.length > 0) {
      const { averageScore, totalRankings } = aggregationResult[0];
      // MongoDB's $avg returns a double, format to 2 decimal places for consistency
      return { itemID, averageScore: parseFloat(averageScore.toFixed(2)), totalRankings };
    } else {
      return { itemID, averageScore: null, totalRankings: 0 };
    }
  }

  /**
   * Gets a specific user's rank for an item.
   * Returns null for score if the user has not ranked the item.
   */
  async getUserRank(userID: ID, itemID: ID): Promise<{ userID: ID, itemID: ID, score: number | null }> {
    if (!userID || !itemID) {
      throw new Error("User ID and Item ID cannot be empty.");
    }

    const ranking = await this.collection.findOne({ userID, itemID });
    return { userID, itemID, score: ranking ? ranking.score : null };
  }
}
```
