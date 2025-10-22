---
timestamp: 'Tue Oct 21 2025 14:19:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_141920.9a9b022c.md]]'
content_id: fb2855e7d02e93c6a0e1cafa4671e071a2422c18ac46fa167c3aaffba1aabd7e
---

# response:

```typescript
// src/concepts/ResourceIntent.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import ResourceIntent from "./ResourceIntent.ts";
import { Collection, Db } from "mongodb"; // Import Db type
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const INTENT_A = "intentA";
const INTENT_B = "intentB";
const INTENT_C = "intentC";
const INTENT_D = "intentD"; // Added for more distinct test cases
const NON_EXISTENT_INTENT = "nonExistentIntent";
const EMPTY_INTENT = "";

const RESOURCE_1 = "resource1" as ID;
const RESOURCE_2 = "resource2" as ID;
const RESOURCE_3 = "resource3" as ID;
const RESOURCE_4 = "resource4" as ID;
const NON_EXISTENT_RESOURCE = "nonExistentResource" as ID;
const EMPTY_RESOURCE = "" as ID;

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCEINTENT CONCEPT");
console.log("===========================================\n");

// Helper function to clear collections for test step isolation
async function clearCollections(db: Db) {
    const intentDefinitions: Collection = db.collection("ResourceIntent.intentDefinitions");
    const intentEntries: Collection = db.collection("ResourceIntent.intentEntries");
    await intentDefinitions.deleteMany({});
    await intentEntries.deleteMany({});
}

// ----------------------------------------------------------------------
// DEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'defineIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");

        await t.step("Happy path: Define new intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            assertEquals(await intentDefinitionsColl.findOne({ _id: INTENT_A }), { _id: INTENT_A });
            assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), true);
        });

        await t.step("Requires violation: Cannot define existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await assertRejects(
                () => resourceIntent.defineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: defineIntent failed. Intent definition '${INTENT_B}' already exists.`,
            );
            assertEquals(await intentDefinitionsColl.countDocuments({ _id: INTENT_B }), 1);
        });

        await t.step("Edge case: Define empty string intent name", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });
            assertEquals(await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT }), { _id: EMPTY_INTENT });
            assertEquals((await resourceIntent.listIntents()).includes(EMPTY_INTENT), true);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// UNDEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'undefineIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("Happy path: Undefine an unused intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.undefineIntent({ intentName: INTENT_A });
            assertEquals(await intentDefinitionsColl.findOne({ _id: INTENT_A }), null);
            assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), false);
        });

        await t.step("Requires violation: Cannot undefine non-existent intent", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            );
        });

        await t.step("Requires violation: Cannot undefine intent in use", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B });
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_1}' and cannot be undefined.`,
            );
            assertEquals(await intentDefinitionsColl.findOne({ _id: INTENT_B }), { _id: INTENT_B });
        });

        await t.step("Edge case: Undefine empty string intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });
            await resourceIntent.undefineIntent({ intentName: EMPTY_INTENT });
            assertEquals(await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT }), null);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// SETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'setIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("Happy path: Set intent (create)", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_1 }), { _id: RESOURCE_1, intent: INTENT_A });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), { resource: RESOURCE_1, intent: INTENT_A });
        });

        await t.step("Happy path: Set intent (update)", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_2 }), { _id: RESOURCE_2, intent: INTENT_B });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_2 }), { resource: RESOURCE_2, intent: INTENT_B });
        });

        await t.step("Requires violation: Cannot set undefined intent", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.setIntent({ resource: RESOURCE_3, intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: setIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );
            assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_3 }), 0);
        });

        await t.step("Edge case: Set intent with empty resource ID", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: EMPTY_RESOURCE, intent: INTENT_A });
            assertEquals(await intentEntriesColl.findOne({ _id: EMPTY_RESOURCE }), { _id: EMPTY_RESOURCE, intent: INTENT_A });
        });

        await t.step("Idempotency: Setting same intent multiple times", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });
            assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_4 }), 1);
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_4 }), { _id: RESOURCE_4, intent: INTENT_C });
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// CLEARINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'clearIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("Happy path: Clear existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.clearIntent({ resource: RESOURCE_1 });
            assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_1 }), null);
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), null);
        });

        await t.step("Requires violation: Cannot clear non-existent intent entry", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: RESOURCE_2 }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${RESOURCE_2}'.`,
            );
            assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_2 }), 0);
        });

        await t.step("Idempotency/Edge case: Clearing non-existent resource ID", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            );
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// GETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'getIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("Happy path: Get existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), { resource: RESOURCE_1, intent: INTENT_A });
        });

        await t.step("Negative path: Get intent for resource with no intent", async () => {
            await clearCollections(db);
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_2 }), null);
        });

        await t.step("Edge case: Get intent for non-existent resource ID", async () => {
            await clearCollections(db);
            assertEquals(await resourceIntent.getIntent({ resource: NON_EXISTENT_RESOURCE }), null);
        });

        await t.step("State verification: Get intent after clear", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
            await resourceIntent.clearIntent({ resource: RESOURCE_3 });
            assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_3 }), null);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// LISTINTENTS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'listIntents'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("Happy path: List multiple defined intents", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B].sort());
        });

        await t.step("Edge case: List when no intents are defined", async () => {
            await clearCollections(db);
            assertEquals(await resourceIntent.listIntents(), []);
        });

        await t.step("State verification: List after undefining intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.undefineIntent({ intentName: INTENT_A });
            assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_B].sort());
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// LISTRESOURCESBYINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Unit tests for 'listResourcesByIntent'",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("Happy path: List resources for specific intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_A });
            assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1, RESOURCE_3].sort());
            assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_2].sort());
        });

        await t.step("Requires violation: List by undefined intent", async () => {
            await clearCollections(db);
            await assertRejects(
                () => resourceIntent.listResourcesByIntent({ intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: listResourcesByIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );
        });

        await t.step("Edge case: List for intent with no associated resources", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_C }), []);
        });

        await t.step("State verification: List after intent cleared/updated", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            await resourceIntent.clearIntent({ resource: RESOURCE_1 });
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), [RESOURCE_2]);
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), []);
            assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_B }), [RESOURCE_2]);
        });

        await client.close();
    },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Trace scenario (principle verification)",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        console.log("\n===============================================");
        console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
        console.log("===============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        await clearCollections(db); // Ensure clean slate for trace

        console.log("Scenario: A workflow for managing resource intents, demonstrating principle fulfillment.");

        console.log("\nSTEP 1: Define multiple intents (INTENT_A, INTENT_B, INTENT_C).");
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        await resourceIntent.defineIntent({ intentName: INTENT_C });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort(), "All intents should be defined.");

        console.log("STEP 2: Assign intents to resources (RESOURCE_1->A, RESOURCE_2->A, RESOURCE_3->B).");
        await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_1 }))?.intent, INTENT_A, `${RESOURCE_1} has ${INTENT_A}`);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_A, `${RESOURCE_2} has ${INTENT_A}`);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_3 }))?.intent, INTENT_B, `${RESOURCE_3} has ${INTENT_B}`);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1, RESOURCE_2].sort(), `Resources for ${INTENT_A} are ${RESOURCE_1}, ${RESOURCE_2}`);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_3].sort(), `Resources for ${INTENT_B} is ${RESOURCE_3}`);
        console.log("Principle verification: Resources successfully associated with defined intents.");

        console.log("STEP 3: Update an intent for a resource (RESOURCE_2: A -> B).");
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_B, `${RESOURCE_2} updated to ${INTENT_B}`);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), [RESOURCE_1], `${RESOURCE_1} is only resource for ${INTENT_A}`);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_2, RESOURCE_3].sort(), `${RESOURCE_2}, ${RESOURCE_3} now for ${INTENT_B}`);
        console.log("Principle verification: A resource can have at most one intent label at any time (uniqueness invariant).");

        console.log("STEP 4: Clear an intent for a resource (RESOURCE_1).");
        await resourceIntent.clearIntent({ resource: RESOURCE_1 });
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), null, `${RESOURCE_1} intent cleared.`);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), [], `No resources for ${INTENT_A} now.`);
        console.log("Principle verification: Intent cleared, resource no longer associated.");

        console.log("STEP 5: Attempt to undefine INTENT_B (still in use). Should reject.");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_2}' and cannot be undefined.`,
        );
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort(), `${INTENT_B} still defined.`);
        console.log("Principle verification: Referential integrity invariant upheld. Cannot undefine an intent that is in use.");

        console.log("STEP 6: Undefine INTENT_A (no longer in use).");
        await resourceIntent.undefineIntent({ intentName: INTENT_A });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_B, INTENT_C].sort(), `${INTENT_A} successfully undefined.`);

        console.log("STEP 7: Clean up all remaining resources and intents.");
        await resourceIntent.clearIntent({ resource: RESOURCE_2 });
        await resourceIntent.clearIntent({ resource: RESOURCE_3 });
        await resourceIntent.undefineIntent({ intentName: INTENT_B });
        await resourceIntent.undefineIntent({ intentName: INTENT_C });
        assertEquals(await resourceIntent.listIntents(), [], "All intents undefined.");
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_2 }), null);
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_3 }), null);
        console.log("Final state: All intents and resource associations removed.");

        await client.close();
        console.log("✅ Finished TRACE demonstration\n");
    },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent: Robustness & concurrency tests",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        console.log("\n=================================================");
        console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
        console.log("=================================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");
        await clearCollections(db); // Ensure clean slate for robustness tests

        console.log("Concurrency: Concurrent 'defineIntent' for the same intent.");
        const defineResults = await Promise.allSettled([
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
        ]);
        assertEquals(defineResults.filter(r => r.status === "fulfilled").length, 1, "Only one defineIntent should succeed.");
        assertEquals(defineResults.filter(r => r.status === "rejected").length, 2, "Concurrent attempts should be rejected.");
        assertEquals(await intentDefinitionsColl.countDocuments({ _id: INTENT_A }), 1, "Only one intent should exist.");

        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        await resourceIntent.defineIntent({ intentName: INTENT_C });
        console.log("\nConcurrency: Concurrent 'setIntent' for the same resource with different intents.");
        const setResults = await Promise.allSettled([
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B }),
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_C }),
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B }), // Add another for B
        ]);
        const finalEntry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
        assertEquals(finalEntry?._id, RESOURCE_1);
        assertEquals([INTENT_B, INTENT_C].includes(finalEntry?.intent as string), true, "Resource should have one of the last-written intents (B or C).");
        assertEquals(await intentEntriesColl.countDocuments({ _id: RESOURCE_1 }), 1, "Only one intent entry should exist due to upsert behavior.");
        console.log(`- Final intent for ${RESOURCE_1} is '${finalEntry?.intent}'. MongoDB handles last write wins.`);

        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_D });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_D });
        console.log("\nConcurrency: Concurrent 'clearIntent' for the same resource.");
        const clearResults = await Promise.allSettled([
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
        ]);
        assertEquals(clearResults.filter(r => r.status === "fulfilled").length, 1, "Only one clearIntent should succeed.");
        assertEquals(clearResults.filter(r => r.status === "rejected").length, 1, "Subsequent clearIntent for non-existent entry should reject.");
        assertEquals(await intentEntriesColl.findOne({ _id: RESOURCE_2 }), null, "Intent should be cleared from DB.");

        console.log("\nRobustness: Invalid operations on non-existent data.");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
            Error, `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            "Should reject undefining a non-existent intent.",
        );
        await assertRejects(
            () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
            Error, `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            "Should reject clearing intent for a non-existent resource.",
        );

        console.log("\nRobustness: State consistency after failed operations.");
        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_A });
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_A }),
            Error, `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_A}' is currently in use by resource '${RESOURCE_3}' and cannot be undefined.`,
            "Attempt to undefine in-use intent should fail.",
        );
        assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), true, "INTENT_A should still be defined.");
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_3 }))?.intent, INTENT_A, "RESOURCE_3 should still have INTENT_A.");
        console.log(`- Verified state consistency after failed 'undefineIntent' operation.`);

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
        console.log("🎉 RESOURCEINTENT CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
        console.log("======================================================================\n");
    },
});
```
