---
timestamp: 'Sat Oct 18 2025 23:41:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_234112.871fe3bf.md]]'
content_id: d03068a214b40dad4b849793c359bbbf7959a4ad9496d12d2628cf1da88a8507
---

# response:

The following Deno test file, `src/concepts/ResourceStatus.test.ts`, provides comprehensive and concise tests for the `ResourceStatus` concept implementation, adhering to all specified requirements and guidelines.

```typescript
// src/concepts/ResourceStatus.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ResourceStatus } from "./ResourceStatus.ts"; // Assuming ResourceStatus.ts is in the same directory
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const resourceA = "resourceA" as ID;
const resourceB = "resourceB" as ID;
const nonExistentResource = "nonExistentResource" as ID;
const emptyResourceID = "" as ID; // Edge case for resource ID

const statusDraft = "Draft";
const statusPending = "Pending";
const statusApproved = "Approved";
const statusRejected = "Rejected";
const statusPublished = "Published";
const nonExistentStatus = "NonExistentStatus";
const emptyStatus = ""; // Edge case for status name

// Collection names derived from the implementation
const STATUS_DEFINITIONS_COLLECTION = "ResourceStatus.statusDefinitions";
const STATUS_ENTRIES_COLLECTION = "ResourceStatus.statusEntries";
const TRANSITION_RULES_COLLECTION = "ResourceStatus.transitionRules";

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCESTATUS CONCEPT");
console.log("===========================================\n");

// ----------------------------------------------------------------------
// DEFINE STATUS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'defineStatus' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DEFINE STATUS ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group

    await t.step("✅ Happy path: Define a new status", async () => {
      await resourceStatus.defineStatus({ statusName: statusDraft });

      const dbEntry = await statusDefsColl.findOne({ _id: statusDraft });
      assertEquals(dbEntry?._id, statusDraft);
    });

    await t.step("✅ Requires violation: Cannot define an existing status", async () => {
      await resourceStatus.defineStatus({ statusName: statusPending }); // Define once
      await assertRejects(
        () => resourceStatus.defineStatus({ statusName: statusPending }),
        Error,
        `StatusDefinition '${statusPending}' already exists.`,
      );

      const count = await statusDefsColl.countDocuments({ _id: statusPending });
      assertEquals(count, 1); // Should still only have one entry
    });

    await t.step("✅ Edge case: Define status with an empty string name", async () => {
      await resourceStatus.defineStatus({ statusName: emptyStatus });

      const dbEntry = await statusDefsColl.findOne({ _id: emptyStatus });
      assertEquals(dbEntry?._id, emptyStatus);
    });

    await t.step("✅ State verification: Multiple statuses defined correctly", async () => {
      await resourceStatus.defineStatus({ statusName: statusApproved });
      const count = await statusDefsColl.countDocuments({});
      assertEquals(count, 4); // Draft, Pending, emptyStatus, Approved
    });

    await client.close();
    console.log("✅ Finished DEFINE STATUS tests\n");
  },
});

// ----------------------------------------------------------------------
// DEFINE TRANSITION ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'defineTransition' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=============================================");
    console.log("🧪 TEST GROUP: DEFINE TRANSITION ACTIONS");
    console.log("=============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    // Pre-define statuses for transition tests
    await resourceStatus.defineStatus({ statusName: statusDraft });
    await resourceStatus.defineStatus({ statusName: statusPending });
    await resourceStatus.defineStatus({ statusName: statusApproved });
    await resourceStatus.defineStatus({ statusName: statusRejected });
    await resourceStatus.defineStatus({ statusName: emptyStatus }); // For edge cases

    await t.step("✅ Happy path: Define a valid transition", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });

      const dbEntry = await transitionRulesColl.findOne({ fromStatus: statusDraft, toStatus: statusPending });
      assertEquals(dbEntry?.fromStatus, statusDraft);
      assertEquals(dbEntry?.toStatus, statusPending);
    });

    await t.step("✅ Requires violation: 'fromStatus' definition does not exist", async () => {
      await assertRejects(
        () => resourceStatus.defineTransition({ fromStatus: nonExistentStatus, toStatus: statusPending }),
        Error,
        `'fromStatus' definition '${nonExistentStatus}' does not exist.`,
      );
    });

    await t.step("✅ Requires violation: 'toStatus' definition does not exist", async () => {
      await assertRejects(
        () => resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: nonExistentStatus }),
        Error,
        `'toStatus' definition '${nonExistentStatus}' does not exist.`,
      );
    });

    await t.step("✅ Requires violation (Idempotency check): Transition rule already exists", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved });
      await assertRejects(
        () => resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved }),
        Error,
        `Transition rule from '${statusPending}' to '${statusApproved}' already exists.`,
      );

      const count = await transitionRulesColl.countDocuments({ fromStatus: statusPending, toStatus: statusApproved });
      assertEquals(count, 1); // Should still only have one rule
    });

    await t.step("✅ Edge case: Define a self-transition (from A to A)", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusApproved });
      const dbEntry = await transitionRulesColl.findOne({ fromStatus: statusApproved, toStatus: statusApproved });
      assertEquals(dbEntry?.fromStatus, statusApproved);
      assertEquals(dbEntry?.toStatus, statusApproved);
    });

    await t.step("✅ Edge case: Define transition involving empty string status", async () => {
      await resourceStatus.defineTransition({ fromStatus: emptyStatus, toStatus: statusDraft });
      const dbEntry1 = await transitionRulesColl.findOne({ fromStatus: emptyStatus, toStatus: statusDraft });
      assertEquals(dbEntry1?.fromStatus, emptyStatus);
      assertEquals(dbEntry1?.toStatus, statusDraft);

      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: emptyStatus });
      const dbEntry2 = await transitionRulesColl.findOne({ fromStatus: statusDraft, toStatus: emptyStatus });
      assertEquals(dbEntry2?.fromStatus, statusDraft);
      assertEquals(dbEntry2?.toStatus, emptyStatus);
    });

    await t.step("✅ State verification: Multiple transitions defined correctly", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusRejected });
      const count = await transitionRulesColl.countDocuments({});
      assertEquals(count, 5); // Draft->Pending, Pending->Approved, Approved->Approved, empty->Draft, Draft->empty, Approved->Rejected
    });

    await client.close();
    console.log("✅ Finished DEFINE TRANSITION tests\n");
  },
});

// ----------------------------------------------------------------------
// CREATE ENTRY ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'createEntry' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: CREATE ENTRY ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group

    // Pre-define statuses for entry creation tests
    await resourceStatus.defineStatus({ statusName: statusDraft });
    await resourceStatus.defineStatus({ statusName: statusApproved });
    await resourceStatus.defineStatus({ statusName: emptyStatus });

    await t.step("✅ Happy path: Create a new status entry for a resource", async () => {
      await resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft });

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA });
      assertEquals(dbEntry?._id, resourceA);
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await t.step("✅ Requires violation (Idempotency check): StatusEntry for resource already exists", async () => {
      await resourceStatus.createEntry({ resource: resourceB, initialStatus: statusDraft }); // Create once
      await assertRejects(
        () => resourceStatus.createEntry({ resource: resourceB, initialStatus: statusDraft }),
        Error,
        `StatusEntry for resource '${resourceB}' already exists.`,
      );

      const count = await statusEntriesColl.countDocuments({ _id: resourceB });
      assertEquals(count, 1);
    });

    await t.step("✅ Requires violation: 'initialStatus' definition does not exist", async () => {
      await assertRejects(
        () => resourceStatus.createEntry({ resource: nonExistentResource, initialStatus: nonExistentStatus }),
        Error,
        `'initialStatus' definition '${nonExistentStatus}' does not exist.`,
      );
      // State verification: No entry should have been created
      assertEquals(await statusEntriesColl.countDocuments({ _id: nonExistentResource }), 0);
    });

    await t.step("✅ Edge case: Create entry with an empty string ResourceID", async () => {
      await resourceStatus.createEntry({ resource: emptyResourceID, initialStatus: statusApproved });

      const dbEntry = await statusEntriesColl.findOne({ _id: emptyResourceID });
      assertEquals(dbEntry?._id, emptyResourceID);
      assertEquals(dbEntry?.currentStatus, statusApproved);
    });

    await t.step("✅ Edge case: Create entry with an empty string initial status", async () => {
      await resourceStatus.createEntry({ resource: resourceA + "1" as ID, initialStatus: emptyStatus });

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA + "1" });
      assertEquals(dbEntry?._id, resourceA + "1");
      assertEquals(dbEntry?.currentStatus, emptyStatus);
    });

    await client.close();
    console.log("✅ Finished CREATE ENTRY tests\n");
  },
});

// ----------------------------------------------------------------------
// TRANSITION ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Unit tests for 'transition' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRANSITION ACTIONS");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    // Pre-define statuses and transitions for tests
    await resourceStatus.defineStatus({ statusName: statusDraft });
    await resourceStatus.defineStatus({ statusName: statusPending });
    await resourceStatus.defineStatus({ statusName: statusApproved });
    await resourceStatus.defineStatus({ statusName: statusRejected });
    await resourceStatus.defineStatus({ statusName: statusPublished });
    await resourceStatus.defineStatus({ statusName: emptyStatus });

    await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });
    await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved });
    await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusRejected });
    await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusPublished });
    await resourceStatus.defineTransition({ fromStatus: statusPublished, toStatus: statusPublished }); // Self-transition
    await resourceStatus.defineTransition({ fromStatus: emptyStatus, toStatus: statusDraft }); // For edge case

    await t.step("✅ Happy path: Transition a resource to a new valid status", async () => {
      await resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft });
      await resourceStatus.transition({ resource: resourceA, targetStatus: statusPending });

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA });
      assertEquals(dbEntry?.currentStatus, statusPending);
    });

    await t.step("✅ Requires violation: StatusEntry for resource does not exist", async () => {
      await assertRejects(
        () => resourceStatus.transition({ resource: nonExistentResource, targetStatus: statusPending }),
        Error,
        `StatusEntry for resource '${nonExistentResource}' does not exist.`,
      );
    });

    await t.step("✅ Requires violation: 'targetStatus' definition does not exist", async () => {
      await resourceStatus.createEntry({ resource: resourceB, initialStatus: statusDraft });
      await assertRejects(
        () => resourceStatus.transition({ resource: resourceB, targetStatus: nonExistentStatus }),
        Error,
        `'targetStatus' definition '${nonExistentStatus}' does not exist.`,
      );
      // State verification: Ensure status did not change
      const dbEntry = await statusEntriesColl.findOne({ _id: resourceB });
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await t.step("✅ Requires violation: No transition rule defined from current to target status", async () => {
      // Current is Draft, cannot transition directly to Approved
      await resourceStatus.createEntry({ resource: resourceA + "2" as ID, initialStatus: statusDraft });
      await assertRejects(
        () => resourceStatus.transition({ resource: resourceA + "2" as ID, targetStatus: statusApproved }),
        Error,
        `No transition rule defined from '${statusDraft}' to '${statusApproved}'.`,
      );
      // State verification: Ensure status did not change
      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA + "2" });
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await t.step("✅ Edge case: Transition to the current status (self-transition)", async () => {
      await resourceStatus.createEntry({ resource: resourceA + "3" as ID, initialStatus: statusPublished });
      await resourceStatus.transition({ resource: resourceA + "3" as ID, targetStatus: statusPublished }); // Rule from Published to Published exists

      const dbEntry = await statusEntriesColl.findOne({ _id: resourceA + "3" });
      assertEquals(dbEntry?.currentStatus, statusPublished);
    });

    await t.step("✅ Edge case: Transition with empty ResourceID", async () => {
      await resourceStatus.createEntry({ resource: emptyResourceID, initialStatus: emptyStatus });
      await resourceStatus.transition({ resource: emptyResourceID, targetStatus: statusDraft }); // Rule from '' to 'Draft' exists

      const dbEntry = await statusEntriesColl.findOne({ _id: emptyResourceID });
      assertEquals(dbEntry?.currentStatus, statusDraft);
    });

    await client.close();
    console.log("✅ Finished TRANSITION tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST (Principle verification)
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Trace scenario (end-to-end behavior - principle verification)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    const productA = "productA" as ID;
    const productB = "productB" as ID;

    // 1. Define statuses
    await t.step("1. Define necessary statuses", async () => {
      await resourceStatus.defineStatus({ statusName: statusDraft });
      await resourceStatus.defineStatus({ statusName: statusPending });
      await resourceStatus.defineStatus({ statusName: statusApproved });
      await resourceStatus.defineStatus({ statusName: statusRejected });
      await resourceStatus.defineStatus({ statusName: statusPublished });
      await resourceStatus.defineStatus({ statusName: "Archived" }); // Another status

      assertEquals(await statusDefsColl.countDocuments({}), 6, "Expected 6 status definitions.");
    });

    // 2. Define transition rules
    await t.step("2. Define a complete set of transition rules", async () => {
      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });
      await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusApproved });
      await resourceStatus.defineTransition({ fromStatus: statusPending, toStatus: statusRejected });
      await resourceStatus.defineTransition({ fromStatus: statusApproved, toStatus: statusPublished });
      await resourceStatus.defineTransition({ fromStatus: statusRejected, toStatus: statusDraft }); // Can re-draft rejected
      await resourceStatus.defineTransition({ fromStatus: statusPublished, toStatus: "Archived" }); // Archive published items
      await resourceStatus.defineTransition({ fromStatus: "Archived", toStatus: "Archived" }); // Can stay archived

      assertEquals(await transitionRulesColl.countDocuments({}), 7, "Expected 7 transition rules.");
    });

    // 3. Create resource entries with initial statuses
    await t.step("3. Create resource entries with initial statuses", async () => {
      await resourceStatus.createEntry({ resource: productA, initialStatus: statusDraft });
      await resourceStatus.createEntry({ resource: productB, initialStatus: statusDraft });

      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusDraft, "ProductA initial status should be Draft.");
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusDraft, "ProductB initial status should be Draft.");
    });

    // 4. Perform a sequence of valid transitions for productA
    await t.step("4. Perform a valid lifecycle sequence for productA", async () => {
      await resourceStatus.transition({ resource: productA, targetStatus: statusPending });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusPending, "ProductA status should be Pending.");

      await resourceStatus.transition({ resource: productA, targetStatus: statusApproved });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusApproved, "ProductA status should be Approved.");

      await resourceStatus.transition({ resource: productA, targetStatus: statusPublished });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, statusPublished, "ProductA status should be Published.");

      await resourceStatus.transition({ resource: productA, targetStatus: "Archived" });
      assertEquals((await statusEntriesColl.findOne({ _id: productA }))?.currentStatus, "Archived", "ProductA status should be Archived.");
    });

    // 5. Perform an alternative sequence for productB, including a rejection
    await t.step("5. Perform an alternative lifecycle sequence for productB (with rejection)", async () => {
      await resourceStatus.transition({ resource: productB, targetStatus: statusPending });
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusPending, "ProductB status should be Pending.");

      await resourceStatus.transition({ resource: productB, targetStatus: statusRejected });
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusRejected, "ProductB status should be Rejected.");

      await resourceStatus.transition({ resource: productB, targetStatus: statusDraft }); // Redraft
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusDraft, "ProductB status should be Draft after re-draft.");

      await resourceStatus.transition({ resource: productB, targetStatus: statusPending }); // Back to pending
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusPending, "ProductB status should be Pending again.");
    });

    // 6. Attempt an invalid transition
    await t.step("6. Attempt an invalid transition and verify rejection", async () => {
      // From Pending to Published directly should fail as no rule exists
      await assertRejects(
        () => resourceStatus.transition({ resource: productB, targetStatus: statusPublished }),
        Error,
        `No transition rule defined from '${statusPending}' to '${statusPublished}'.`,
        "Expected rejection for invalid transition.",
      );
      // Status should remain unchanged
      assertEquals((await statusEntriesColl.findOne({ _id: productB }))?.currentStatus, statusPending, "ProductB status should remain Pending after failed transition.");
    });

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "ResourceStatus concept: Robustness and concurrency-like tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const resourceStatus = new ResourceStatus(db);
    const statusDefsColl: Collection = db.collection(STATUS_DEFINITIONS_COLLECTION);
    const statusEntriesColl: Collection = db.collection(STATUS_ENTRIES_COLLECTION);
    const transitionRulesColl: Collection = db.collection(TRANSITION_RULES_COLLECTION);
    await statusDefsColl.deleteMany({}); // reset DB for this test group
    await statusEntriesColl.deleteMany({}); // reset DB for this test group
    await transitionRulesColl.deleteMany({}); // reset DB for this test group

    await t.step("✅ Concurrency: Multiple attempts to define the same status", async () => {
      const results = await Promise.allSettled([
        resourceStatus.defineStatus({ statusName: statusDraft }),
        resourceStatus.defineStatus({ statusName: statusDraft }), // Duplicate
        resourceStatus.defineStatus({ statusName: statusPending }),
      ]);

      const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
      const rejectedCount = results.filter(r => r.status === "rejected").length;

      // One for Draft, one for Pending, one rejection for duplicate Draft
      assertEquals(fulfilledCount, 2, "Expected two fulfilled operations (two unique statuses).");
      assertEquals(rejectedCount, 1, "Expected one rejected operation (duplicate status).");

      assertEquals(await statusDefsColl.countDocuments({}), 2, "Expected only 2 status definitions in DB.");
      assertEquals(await statusDefsColl.countDocuments({ _id: statusDraft }), 1, "Draft status defined once.");
      assertEquals(await statusDefsColl.countDocuments({ _id: statusPending }), 1, "Pending status defined once.");
    });

    await t.step("✅ Concurrency: Multiple attempts to define the same transition rule", async () => {
      await statusDefsColl.deleteMany({}); // Clear for this step
      await transitionRulesColl.deleteMany({}); // Clear for this step

      await resourceStatus.defineStatus({ statusName: statusDraft });
      await resourceStatus.defineStatus({ statusName: statusPending });

      const results = await Promise.allSettled([
        resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending }),
        resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending }), // Duplicate
      ]);

      const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
      const rejectedCount = results.filter(r => r.status === "rejected").length;

      assertEquals(fulfilledCount, 1, "Expected one fulfilled operation (one unique transition rule).");
      assertEquals(rejectedCount, 1, "Expected one rejected operation (duplicate transition rule).");
      assertEquals(await transitionRulesColl.countDocuments({ fromStatus: statusDraft, toStatus: statusPending }), 1, "Transition rule defined once.");
    });

    await t.step("✅ Concurrency: Multiple attempts to create the same resource entry", async () => {
      await statusDefsColl.deleteMany({});
      await statusEntriesColl.deleteMany({});

      await resourceStatus.defineStatus({ statusName: statusDraft });

      const results = await Promise.allSettled([
        resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft }),
        resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft }), // Duplicate
      ]);

      const fulfilledCount = results.filter(r => r.status === "fulfilled").length;
      const rejectedCount = results.filter(r => r.status === "rejected").length;

      assertEquals(fulfilledCount, 1, "Expected one fulfilled operation (one unique resource entry).");
      assertEquals(rejectedCount, 1, "Expected one rejected operation (duplicate resource entry).");
      assertEquals(await statusEntriesColl.countDocuments({ _id: resourceA }), 1, "Resource entry created once.");
    });

    await t.step("✅ Robustness: Attempt to transition with an invalid status name (not defined)", async () => {
      await statusDefsColl.deleteMany({});
      await statusEntriesColl.deleteMany({});
      await transitionRulesColl.deleteMany({});

      await resourceStatus.defineStatus({ statusName: statusDraft });
      await resourceStatus.defineStatus({ statusName: statusPending });
      await resourceStatus.defineTransition({ fromStatus: statusDraft, toStatus: statusPending });
      await resourceStatus.createEntry({ resource: resourceA, initialStatus: statusDraft });

      await assertRejects(
        () => resourceStatus.transition({ resource: resourceA, targetStatus: "CompletelyUndefined" }),
        Error,
        `'targetStatus' definition 'CompletelyUndefined' does not exist.`,
        "Expected rejection for undefined target status.",
      );
      // Verify state is unchanged
      const entry = await statusEntriesColl.findOne({ _id: resourceA });
      assertEquals(entry?.currentStatus, statusDraft, "Resource status should not change after invalid target status.");
    });

    await t.step("✅ Robustness: Invalid initial status during createEntry leaves no trace", async () => {
      await statusDefsColl.deleteMany({});
      await statusEntriesColl.deleteMany({});

      await assertRejects(
        () => resourceStatus.createEntry({ resource: resourceB, initialStatus: nonExistentStatus }),
        Error,
        `'initialStatus' definition '${nonExistentStatus}' does not exist.`,
        "Expected rejection for non-existent initial status.",
      );
      // No entry should have been created
      assertEquals(await statusEntriesColl.countDocuments({ _id: resourceB }), 0, "No resource entry should be created after invalid initial status.");
    });

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
    console.log("\n=======================================================================");
    console.log("🎉 RESOURCESTATUS CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
    console.log("=======================================================================\n");
  },
});
```
