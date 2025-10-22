---
timestamp: 'Tue Oct 21 2025 14:16:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_141632.b71f91c3.md]]'
content_id: 7396404edeeb26e1f3cf34713e7dc9aa2755099f86bf7f9c4b4ed39a742c87f8
---

# response:

```typescript
// src/concepts/ResourceIntent.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import ResourceIntent from "./ResourceIntent.ts"; // Note: default import
import { Collection } from "mongodb";
import { ID } from "@utils/types.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const INTENT_A = "intentA";
const INTENT_B = "intentB";
const INTENT_C = "intentC";
const NON_EXISTENT_INTENT = "nonExistentIntent";
const EMPTY_INTENT = ""

const RESOURCE_1 = "resource1" as ID;
const RESOURCE_2 = "resource2" as ID;
const RESOURCE_3 = "resource3" as ID;
const RESOURCE_4 = "resource4" as ID;
const NON_EXISTENT_RESOURCE = "nonExistentResource" as ID;
const EMPTY_RESOURCE = "" as ID;

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCEINTENT CONCEPT");
console.log("===========================================\n");

// Helper function to clear collections
async function clearCollections(db: Deno.Kv) { // Changed from Db to Deno.Kv as per testDb return type. The provided code assumes Db.
                                              // Given the provided implementation uses `mongodb` collections, let's assume `db` is `Db` from `mongodb`.
                                              // The example `Following.test.ts` also uses `Db` from `mongodb`
    const intentDefinitions: Collection = db.collection("ResourceIntent.intentDefinitions");
    const intentEntries: Collection = db.collection("ResourceIntent.intentEntries");
    await intentDefinitions.deleteMany({});
    await intentEntries.deleteMany({});
}

// ----------------------------------------------------------------------
// DEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'defineIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: DEFINEINTENT ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");

        await t.step("✅ Happy path: Define a new intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to define intent: '${INTENT_A}'`);
            await resourceIntent.defineIntent({ intentName: INTENT_A });

            console.log(`- Verifying intent '${INTENT_A}' exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: INTENT_A });
            assertEquals(exists?._id, INTENT_A);

            const definedIntents = await resourceIntent.listIntents();
            assertEquals(definedIntents.includes(INTENT_A), true);
            console.log(`- Confirmed '${INTENT_A}' is listed.`);
        });

        await t.step("❌ Requires violation: Cannot define an already existing intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            console.log(`- Attempting to define intent '${INTENT_B}' again.`);
            await assertRejects(
                () => resourceIntent.defineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: defineIntent failed. Intent definition '${INTENT_B}' already exists.`,
            );

            console.log(`- Verifying intent '${INTENT_B}' count is still 1.`);
            const count = await intentDefinitionsColl.countDocuments({ _id: INTENT_B });
            assertEquals(count, 1);
        });

        await t.step("✅ Edge case: Defining intent with an empty string name", async () => {
            await clearCollections(db);
            console.log(`- Attempting to define an empty intent name.`);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });

            console.log(`- Verifying empty intent exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT });
            assertEquals(exists?._id, EMPTY_INTENT);

            const definedIntents = await resourceIntent.listIntents();
            assertEquals(definedIntents.includes(EMPTY_INTENT), true);
            console.log(`- Confirmed empty intent is listed.`);
        });

        await client.close();
        console.log("✅ Finished DEFINEINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// UNDEFINEINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'undefineIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n=============================================");
        console.log("🧪 TEST GROUP: UNDEFINEINTENT ACTIONS");
        console.log("=============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentDefinitionsColl: Collection = db.collection("ResourceIntent.intentDefinitions");
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("✅ Happy path: Undefine an existing and unused intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            console.log(`- Successfully defined intent: '${INTENT_A}'`);

            console.log(`- Attempting to undefine intent: '${INTENT_A}'`);
            await resourceIntent.undefineIntent({ intentName: INTENT_A });

            console.log(`- Verifying intent '${INTENT_A}' no longer exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: INTENT_A });
            assertEquals(exists, null);

            const definedIntents = await resourceIntent.listIntents();
            assertEquals(definedIntents.includes(INTENT_A), false);
            console.log(`- Confirmed '${INTENT_A}' is not listed.`);
        });

        await t.step("❌ Requires violation: Cannot undefine a non-existent intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to undefine non-existent intent: '${NON_EXISTENT_INTENT}'`);
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            );
        });

        await t.step("❌ Requires violation: Cannot undefine an intent that is in use", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B });
            console.log(`- Defined intent '${INTENT_B}' and assigned it to '${RESOURCE_1}'.`);

            console.log(`- Attempting to undefine intent '${INTENT_B}' which is in use.`);
            await assertRejects(
                () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
                Error,
                `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_1}' and cannot be undefined.`,
            );

            console.log(`- Verifying intent '${INTENT_B}' still exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: INTENT_B });
            assertEquals(exists?._id, INTENT_B);
        });

        await t.step("✅ Edge case: Undefining with empty string name after defining it", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: EMPTY_INTENT });
            console.log(`- Defined empty intent name.`);

            console.log(`- Attempting to undefine empty intent name.`);
            await resourceIntent.undefineIntent({ intentName: EMPTY_INTENT });

            console.log(`- Verifying empty intent no longer exists.`);
            const exists = await intentDefinitionsColl.findOne({ _id: EMPTY_INTENT });
            assertEquals(exists, null);
        });

        await client.close();
        console.log("✅ Finished UNDEFINEINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// SETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'setIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: SETINTENT ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("✅ Happy path: Set intent for a resource (creation)", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            console.log(`- Defined intent: '${INTENT_A}'`);

            console.log(`- Setting intent '${INTENT_A}' for resource '${RESOURCE_1}'.`);
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });

            console.log(`- Verifying intent entry for '${RESOURCE_1}' exists.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
            assertEquals(entry?._id, RESOURCE_1);
            assertEquals(entry?.intent, INTENT_A);

            const getIntentResult = await resourceIntent.getIntent({ resource: RESOURCE_1 });
            assertEquals(getIntentResult?.resource, RESOURCE_1);
            assertEquals(getIntentResult?.intent, INTENT_A);
            console.log(`- Confirmed getIntent() returns correct intent.`);
        });

        await t.step("✅ Happy path: Update intent for an existing resource", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            console.log(`- Set initial intent '${INTENT_A}' for resource '${RESOURCE_2}'.`);

            console.log(`- Updating intent for '${RESOURCE_2}' to '${INTENT_B}'.`);
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });

            console.log(`- Verifying intent entry for '${RESOURCE_2}' is updated.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_2 });
            assertEquals(entry?._id, RESOURCE_2);
            assertEquals(entry?.intent, INTENT_B);

            const getIntentResult = await resourceIntent.getIntent({ resource: RESOURCE_2 });
            assertEquals(getIntentResult?.resource, RESOURCE_2);
            assertEquals(getIntentResult?.intent, INTENT_B);
            console.log(`- Confirmed intent updated for '${RESOURCE_2}'.`);
        });

        await t.step("❌ Requires violation: Cannot set an undefined intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to set non-existent intent '${NON_EXISTENT_INTENT}' for resource '${RESOURCE_3}'.`);
            await assertRejects(
                () => resourceIntent.setIntent({ resource: RESOURCE_3, intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: setIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );

            console.log(`- Verifying no intent entry for '${RESOURCE_3}' was created.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_3 });
            assertEquals(entry, null);
        });

        await t.step("✅ Edge case: Setting intent with empty string resource ID", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            console.log(`- Defined intent: '${INTENT_A}'`);

            console.log(`- Setting intent '${INTENT_A}' for empty resource ID.`);
            await resourceIntent.setIntent({ resource: EMPTY_RESOURCE, intent: INTENT_A });

            console.log(`- Verifying intent entry for empty resource ID exists.`);
            const entry = await intentEntriesColl.findOne({ _id: EMPTY_RESOURCE });
            assertEquals(entry?._id, EMPTY_RESOURCE);
            assertEquals(entry?.intent, INTENT_A);
        });

        await t.step("✅ Idempotency: Setting the same intent multiple times has no additional effect", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            console.log(`- Defined intent: '${INTENT_C}'`);

            console.log(`- Setting intent '${INTENT_C}' for resource '${RESOURCE_4}' (first time).`);
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });
            console.log(`- Setting intent '${INTENT_C}' for resource '${RESOURCE_4}' (second time).`);
            await resourceIntent.setIntent({ resource: RESOURCE_4, intent: INTENT_C });

            console.log(`- Verifying only one intent entry exists for '${RESOURCE_4}'.`);
            const count = await intentEntriesColl.countDocuments({ _id: RESOURCE_4 });
            assertEquals(count, 1);

            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_4 });
            assertEquals(entry?.intent, INTENT_C);
        });

        await client.close();
        console.log("✅ Finished SETINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// CLEARINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'clearIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n=============================================");
        console.log("🧪 TEST GROUP: CLEARINTENT ACTIONS");
        console.log("=============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        const intentEntriesColl: Collection = db.collection("ResourceIntent.intentEntries");

        await t.step("✅ Happy path: Clear intent for a resource", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            console.log(`- Set intent '${INTENT_A}' for resource '${RESOURCE_1}'.`);

            console.log(`- Clearing intent for resource '${RESOURCE_1}'.`);
            await resourceIntent.clearIntent({ resource: RESOURCE_1 });

            console.log(`- Verifying no intent entry for '${RESOURCE_1}' exists.`);
            const entry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
            assertEquals(entry, null);

            const getIntentResult = await resourceIntent.getIntent({ resource: RESOURCE_1 });
            assertEquals(getIntentResult, null);
            console.log(`- Confirmed getIntent() returns null.`);
        });

        await t.step("❌ Requires violation: Cannot clear intent for a resource with no intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to clear intent for resource '${RESOURCE_2}' which has no intent set.`);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: RESOURCE_2 }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${RESOURCE_2}'.`,
            );

            console.log(`- Verifying no intent entry for '${RESOURCE_2}' was created.`);
            const count = await intentEntriesColl.countDocuments({ _id: RESOURCE_2 });
            assertEquals(count, 0);
        });

        await t.step("✅ Edge case: Clearing intent for non-existent resource ID (idempotency, should reject as per requires)", async () => {
            await clearCollections(db);
            console.log(`- Attempting to clear intent for non-existent resource '${NON_EXISTENT_RESOURCE}'.`);
            await assertRejects(
                () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
                Error,
                `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            );
        });

        await client.close();
        console.log("✅ Finished CLEARINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// GETINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'getIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: GETINTENT ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("✅ Happy path: Get existing intent for a resource", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            console.log(`- Set intent '${INTENT_A}' for resource '${RESOURCE_1}'.`);

            console.log(`- Getting intent for resource '${RESOURCE_1}'.`);
            const result = await resourceIntent.getIntent({ resource: RESOURCE_1 });
            assertEquals(result, { resource: RESOURCE_1, intent: INTENT_A });
            console.log(`- Confirmed intent is '${result?.intent}'.`);
        });

        await t.step("✅ Negative path: Get intent for a resource with no intent set", async () => {
            await clearCollections(db);
            console.log(`- Getting intent for resource '${RESOURCE_2}' (no intent set).`);
            const result = await resourceIntent.getIntent({ resource: RESOURCE_2 });
            assertEquals(result, null);
            console.log(`- Confirmed result is null.`);
        });

        await t.step("✅ Edge case: Get intent for a non-existent resource ID", async () => {
            await clearCollections(db);
            console.log(`- Getting intent for non-existent resource '${NON_EXISTENT_RESOURCE}'.`);
            const result = await resourceIntent.getIntent({ resource: NON_EXISTENT_RESOURCE });
            assertEquals(result, null);
            console.log(`- Confirmed result is null.`);
        });

        await t.step("✅ Edge case: Get intent after it has been cleared", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
            await resourceIntent.clearIntent({ resource: RESOURCE_3 });
            console.log(`- Set and then cleared intent for resource '${RESOURCE_3}'.`);

            console.log(`- Getting intent for resource '${RESOURCE_3}'.`);
            const result = await resourceIntent.getIntent({ resource: RESOURCE_3 });
            assertEquals(result, null);
            console.log(`- Confirmed result is null.`);
        });

        await client.close();
        console.log("✅ Finished GETINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// LISTINTENTS ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'listIntents' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===========================================");
        console.log("🧪 TEST GROUP: LISTINTENTS ACTIONS");
        console.log("===========================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("✅ Happy path: List multiple defined intents", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            console.log(`- Defined intents: '${INTENT_A}', '${INTENT_B}', '${INTENT_C}'.`);

            console.log(`- Listing all defined intents.`);
            const intents = await resourceIntent.listIntents();
            assertEquals(intents.sort(), [INTENT_A, INTENT_B, INTENT_C].sort());
            console.log(`- Confirmed all defined intents are listed.`);
        });

        await t.step("✅ Edge case: List when no intents are defined", async () => {
            await clearCollections(db);
            console.log(`- Listing intents when none are defined.`);
            const intents = await resourceIntent.listIntents();
            assertEquals(intents, []);
            console.log(`- Confirmed an empty array is returned.`);
        });

        await t.step("✅ State update: List after undefining an intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.undefineIntent({ intentName: INTENT_A });
            console.log(`- Defined '${INTENT_A}', '${INTENT_B}', then undefined '${INTENT_A}'.`);

            console.log(`- Listing all defined intents.`);
            const intents = await resourceIntent.listIntents();
            assertEquals(intents.sort(), [INTENT_B].sort());
            console.log(`- Confirmed '${INTENT_A}' is no longer listed.`);
        });

        await client.close();
        console.log("✅ Finished LISTINTENTS tests\n");
    },
});

// ----------------------------------------------------------------------
// LISTRESOURCESBYINTENT ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Unit tests for 'listResourcesByIntent' action",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn(t) {
        console.log("\n===================================================");
        console.log("🧪 TEST GROUP: LISTRESOURCESBYINTENT ACTIONS");
        console.log("===================================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);

        await t.step("✅ Happy path: List resources for a specific intent", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_A });
            console.log(`- Set intents: '${RESOURCE_1}'->'${INTENT_A}', '${RESOURCE_2}'->'${INTENT_B}', '${RESOURCE_3}'->'${INTENT_A}'.`);

            console.log(`- Listing resources by intent '${INTENT_A}'.`);
            const resources = await resourceIntent.listResourcesByIntent({ intent: INTENT_A });
            assertEquals(resources.sort(), [RESOURCE_1, RESOURCE_3].sort());
            console.log(`- Confirmed resources for '${INTENT_A}' are listed correctly.`);

            console.log(`- Listing resources by intent '${INTENT_B}'.`);
            const resourcesB = await resourceIntent.listResourcesByIntent({ intent: INTENT_B });
            assertEquals(resourcesB.sort(), [RESOURCE_2].sort());
            console.log(`- Confirmed resources for '${INTENT_B}' are listed correctly.`);
        });

        await t.step("❌ Requires violation: Cannot list resources by an undefined intent", async () => {
            await clearCollections(db);
            console.log(`- Attempting to list resources by non-existent intent: '${NON_EXISTENT_INTENT}'.`);
            await assertRejects(
                () => resourceIntent.listResourcesByIntent({ intent: NON_EXISTENT_INTENT }),
                Error,
                `ResourceIntent: listResourcesByIntent failed. Intent definition '${NON_EXISTENT_INTENT}' is not defined.`,
            );
        });

        await t.step("✅ Edge case: List resources for an intent with no associated resources", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_C });
            console.log(`- Defined intent: '${INTENT_C}' (no resources assigned).`);

            console.log(`- Listing resources by intent '${INTENT_C}'.`);
            const resources = await resourceIntent.listResourcesByIntent({ intent: INTENT_C });
            assertEquals(resources, []);
            console.log(`- Confirmed an empty array is returned.`);
        });

        await t.step("✅ State update: List after a resource's intent is cleared or updated", async () => {
            await clearCollections(db);
            await resourceIntent.defineIntent({ intentName: INTENT_A });
            await resourceIntent.defineIntent({ intentName: INTENT_B });
            await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
            await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
            console.log(`- Initial state: '${RESOURCE_1}'->'${INTENT_A}', '${RESOURCE_2}'->'${INTENT_A}', '${RESOURCE_3}'->'${INTENT_B}'.`);

            await resourceIntent.clearIntent({ resource: RESOURCE_1 });
            console.log(`- Cleared intent for '${RESOURCE_1}'.`);
            const resourcesAfterClear = await resourceIntent.listResourcesByIntent({ intent: INTENT_A });
            assertEquals(resourcesAfterClear, [RESOURCE_2]);

            await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
            console.log(`- Updated intent for '${RESOURCE_2}' to '${INTENT_B}'.`);
            const resourcesAfterUpdateA = await resourceIntent.listResourcesByIntent({ intent: INTENT_A });
            assertEquals(resourcesAfterUpdateA, []);
            const resourcesAfterUpdateB = await resourceIntent.listResourcesByIntent({ intent: INTENT_B });
            assertEquals(resourcesAfterUpdateB.sort(), [RESOURCE_2, RESOURCE_3].sort());
            console.log(`- Confirmed lists reflect state changes.`);
        });

        await client.close();
        console.log("✅ Finished LISTRESOURCESBYINTENT tests\n");
    },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Trace scenario (end-to-end behavior)",
    sanitizeOps: false,
    sanitizeResources: false,
    async fn() {
        console.log("\n===============================================");
        console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
        console.log("===============================================\n");

        const [db, client] = await testDb();
        const resourceIntent = new ResourceIntent(db);
        await clearCollections(db);

        console.log("Scenario: A workflow for managing resource intents.");

        console.log("\nSTEP 1: Define initial intents.");
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        await resourceIntent.defineIntent({ intentName: INTENT_C });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort());
        console.log(`- Defined intents: ${[INTENT_A, INTENT_B, INTENT_C].join(", ")}`);

        console.log("\nSTEP 2: Assign intents to resources.");
        await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_3, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_1 }))?.intent, INTENT_A);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_A);
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_3 }))?.intent, INTENT_B);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1, RESOURCE_2].sort());
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_3].sort());
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_C }), []);
        console.log(`- ${RESOURCE_1} & ${RESOURCE_2} -> ${INTENT_A}`);
        console.log(`- ${RESOURCE_3} -> ${INTENT_B}`);

        console.log("\nSTEP 3: Update an intent for a resource.");
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_B });
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_2 }))?.intent, INTENT_B);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), [RESOURCE_1].sort());
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_B })).sort(), [RESOURCE_2, RESOURCE_3].sort());
        console.log(`- Updated ${RESOURCE_2} -> ${INTENT_B}.`);
        console.log(`- Principle Check: ${RESOURCE_2} now only has one intent, and it's defined.`);

        console.log("\nSTEP 4: Clear an intent for a resource.");
        await resourceIntent.clearIntent({ resource: RESOURCE_1 });
        assertEquals(await resourceIntent.getIntent({ resource: RESOURCE_1 }), null);
        assertEquals((await resourceIntent.listResourcesByIntent({ intent: INTENT_A })).sort(), []);
        console.log(`- Cleared intent for ${RESOURCE_1}.`);
        console.log(`- Principle Check: ${RESOURCE_1} no longer has an intent.`);

        console.log("\nSTEP 5: Attempt to undefine an intent that is in use (should fail).");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_B }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_B}' is currently in use by resource '${RESOURCE_2}' and cannot be undefined.`,
        );
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_A, INTENT_B, INTENT_C].sort());
        console.log(`- Confirmed cannot undefine '${INTENT_B}' while ${RESOURCE_2} uses it.`);
        console.log(`- Principle Check: Referential integrity maintained for 'IntentEntries'.`);

        console.log("\nSTEP 6: Undefine an unused intent.");
        await resourceIntent.undefineIntent({ intentName: INTENT_A });
        assertEquals((await resourceIntent.listIntents()).sort(), [INTENT_B, INTENT_C].sort());
        console.log(`- Undefined '${INTENT_A}' successfully.`);

        console.log("\nSTEP 7: Undefine all other intents after clearing usage.");
        await resourceIntent.clearIntent({ resource: RESOURCE_2 });
        await resourceIntent.clearIntent({ resource: RESOURCE_3 });
        await resourceIntent.undefineIntent({ intentName: INTENT_B });
        await resourceIntent.undefineIntent({ intentName: INTENT_C });
        assertEquals(await resourceIntent.listIntents(), []);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_A }), []); // INTENT_A is already undefined
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_B }), []);
        assertEquals(await resourceIntent.listResourcesByIntent({ intent: INTENT_C }), []);
        console.log(`- All intents and resource associations cleared.`);
        console.log(`- Final state reflects principle: no intents defined, no resources associated.`);

        await client.close();
        console.log("✅ Finished TRACE demonstration\n");
    },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
    name: "ResourceIntent concept: Robustness and concurrency tests",
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
        await clearCollections(db);

        console.log("\nConcurrency: Attempting to define the same intent concurrently.");
        const defineResults = await Promise.allSettled([
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
            resourceIntent.defineIntent({ intentName: INTENT_A }),
        ]);

        const fulfilledDefines = defineResults.filter(r => r.status === "fulfilled").length;
        const rejectedDefines = defineResults.filter(r => r.status === "rejected").length;

        assertEquals(fulfilledDefines, 1, "Only one concurrent defineIntent should succeed.");
        assertEquals(rejectedDefines, 2, "Concurrent defineIntent attempts should be rejected.");
        const intentCount = await intentDefinitionsColl.countDocuments({ _id: INTENT_A });
        assertEquals(intentCount, 1, "Only one intent should exist in the database.");
        console.log(`- Define intent '${INTENT_A}' concurrently: 1 success, 2 rejects.`);

        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.defineIntent({ intentName: INTENT_B });
        console.log("\nConcurrency: Attempting to set different intents for the same resource concurrently.");
        const setResults = await Promise.allSettled([
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A }),
            resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_B }),
        ]);

        // MongoDB's updateOne with upsert handles this by performing the update/insert atomically.
        // The last write "wins" or they result in the same state eventually.
        // We expect one successful outcome and the final state to be one of them.
        const entry = await intentEntriesColl.findOne({ _id: RESOURCE_1 });
        assertEquals(entry?._id, RESOURCE_1);
        assertEquals([INTENT_A, INTENT_B].includes(entry?.intent as string), true, "Resource should have one of the intents.");
        const entryCount = await intentEntriesColl.countDocuments({ _id: RESOURCE_1 });
        assertEquals(entryCount, 1, "Only one intent entry for the resource.");
        console.log(`- Set intents for '${RESOURCE_1}' concurrently: Final intent is '${entry?.intent}'. (MongoDB handles last write wins for upsert).`);


        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_2, intent: INTENT_A });
        console.log("\nConcurrency: Attempting to clear the same intent concurrently.");
        const clearResults = await Promise.allSettled([
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
            resourceIntent.clearIntent({ resource: RESOURCE_2 }),
        ]);
        const fulfilledClears = clearResults.filter(r => r.status === "fulfilled").length;
        const rejectedClears = clearResults.filter(r => r.status === "rejected").length;
        assertEquals(fulfilledClears, 1, "Only one concurrent clearIntent should succeed.");
        assertEquals(rejectedClears, 1, "Subsequent clearIntent for non-existent entry should reject.");
        const finalEntry = await intentEntriesColl.findOne({ _id: RESOURCE_2 });
        assertEquals(finalEntry, null, "Intent should be cleared from the database.");
        console.log(`- Clear intent for '${RESOURCE_2}' concurrently: 1 success, 1 reject.`);

        console.log("\nRobustness: Invalid operations on non-existent data.");
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: NON_EXISTENT_INTENT }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${NON_EXISTENT_INTENT}' does not exist.`,
            "Should reject undefining a non-existent intent.",
        );
        await assertRejects(
            () => resourceIntent.clearIntent({ resource: NON_EXISTENT_RESOURCE }),
            Error,
            `ResourceIntent: clearIntent failed. No intent entry found for resource '${NON_EXISTENT_RESOURCE}'.`,
            "Should reject clearing intent for a non-existent resource.",
        );
        console.log(`- Confirmed rejections for invalid operations on non-existent data.`);


        console.log("\nRobustness: Cleanup and data consistency after failed operations.");
        await clearCollections(db);
        await resourceIntent.defineIntent({ intentName: INTENT_A });
        await resourceIntent.setIntent({ resource: RESOURCE_1, intent: INTENT_A });
        // Attempt an invalid operation: undefine INTENT_A while RESOURCE_1 uses it
        await assertRejects(
            () => resourceIntent.undefineIntent({ intentName: INTENT_A }),
            Error,
            `ResourceIntent: undefineIntent failed. Intent definition '${INTENT_A}' is currently in use by resource '${RESOURCE_1}' and cannot be undefined.`,
            "Attempt to undefine in-use intent should fail.",
        );
        // Verify state is unchanged
        assertEquals((await resourceIntent.listIntents()).includes(INTENT_A), true, "INTENT_A should still be defined.");
        assertEquals((await resourceIntent.getIntent({ resource: RESOURCE_1 }))?.intent, INTENT_A, "RESOURCE_1 should still have INTENT_A.");
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
