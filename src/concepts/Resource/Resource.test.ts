// src/concepts/Resource.test.ts

// deno-lint-ignore no-import-prefix
import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ResourceConcept, ResourceID, Owner, ResourceDocument } from "./Resource.ts";
import { Collection } from "mongodb";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------
const ownerA = "user123" as Owner;
const ownerB = "orgABC" as Owner;
const ownerC = "user789" as Owner;
const nonExistentOwner = "nonExistent" as Owner;

const resourceName1 = "My First Widget";
const resourceName2 = "Advanced Gizmo";
const resourceName3 = "Legacy Device";
const category1 = "Gadgets";
const category2 = "Electronics";
const description1 = "A revolutionary new product.";
const description2 = "Designed for high-performance applications.";
const emptyString = "";
const whitespaceString = "   ";

// A dummy ID for testing non-existent resources.
// freshID() generates a unique 36-char UUID string, so this should not clash.
const nonExistentResourceID = "11111111-2222-3333-4444-555555555555" as ResourceID;

console.log("\n===========================================");
console.log(" ⏰ STARTING TESTS FOR RESOURCE CONCEPT");
console.log("===========================================\n");

// ----------------------------------------------------------------------
// CREATE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'createResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: CREATE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state for this test block

    await t.step("✅ Happy path: Create resource with all optional fields", async () => {
      const resourceID = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );

      // Verify return value
      assertEquals(typeof resourceID, "string");
      assertEquals(resourceID.length, 36); // freshID() uses randomUUID()


      // Verify state in DB
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?._id, resourceID);
      assertEquals(dbEntry?.owner, ownerA);
      assertEquals(dbEntry?.name, resourceName1);
      assertEquals(dbEntry?.category, category1);
      assertEquals(dbEntry?.description, description1);
    });

    await t.step("✅ Happy path: Create resource with only mandatory fields", async () => {
      const resourceID = await resourceConcept.createResource(ownerB, resourceName2);

      // Verify return value
      assertEquals(typeof resourceID, "string");

      // Verify state in DB
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?._id, resourceID);
      assertEquals(dbEntry?.owner, ownerB);
      assertEquals(dbEntry?.name, resourceName2);
      assertEquals(dbEntry?.category, undefined); // Should not exist
      assertEquals(dbEntry?.description, undefined); // Should not exist
    });

    await t.step("✅ Requires violation: Cannot create resource with empty name", async () => {
      await assertRejects(
        () => resourceConcept.createResource(ownerA, emptyString),
        Error,
        "Resource name cannot be empty.",
      );
      // Verify no resource was created
      assertEquals(await coll.countDocuments({ owner: ownerA }), 1); // Only the first one created
    });

    await t.step("✅ Requires violation: Cannot create resource with whitespace name", async () => {
      await assertRejects(
        () => resourceConcept.createResource(ownerA, whitespaceString, category1, description1),
        Error,
        "Resource name cannot be empty.",
      );
      // Verify no resource was created
      assertEquals(await coll.countDocuments({ owner: ownerA }), 1);
    });

    await t.step("✅ Edge case: Owner ID as an empty string", async () => {
      const emptyOwner = "" as Owner;
      const resourceID = await resourceConcept.createResource(emptyOwner, resourceName3);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.owner, emptyOwner);
      assertEquals(dbEntry?.name, resourceName3);
    });

    await t.step("✅ Edge case: Duplicate names are allowed", async () => {
      const name = "Common Name";
      const id1 = await resourceConcept.createResource(ownerA, name);
      const id2 = await resourceConcept.createResource(ownerB, name);

      assertEquals(typeof id1, "string");
      assertEquals(typeof id2, "string");
      assertEquals(id1 !== id2, true); // IDs must be unique

      const entry1 = await coll.findOne({ _id: id1 });
      const entry2 = await coll.findOne({ _id: id2 });

      assertEquals(entry1?.name, name);
      assertEquals(entry2?.name, name);
      assertEquals(entry1?.owner, ownerA);
      assertEquals(entry2?.owner, ownerB);
    });

    await client.close();
    console.log("✅ Finished CREATE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// UPDATE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'updateResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: UPDATE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    let resourceID: ResourceID;

    await t.step("Setup: Create a resource for updates", async () => {
      resourceID = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName1);
      assertEquals(dbEntry?.category, category1);
      assertEquals(dbEntry?.description, description1);
    });

    await t.step("✅ Happy path: Update only the name", async () => {
      await resourceConcept.updateResource(resourceID, resourceName2);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName2);
      assertEquals(dbEntry?.category, category1); // Should remain unchanged
      assertEquals(dbEntry?.description, description1); // Should remain unchanged
    });

    await t.step("✅ Happy path: Update only the category", async () => {
      await resourceConcept.updateResource(resourceID, undefined, category2);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName2); // Should remain unchanged
      assertEquals(dbEntry?.category, category2);
      assertEquals(dbEntry?.description, description1); // Should remain unchanged
    });

    await t.step("✅ Happy path: Update only the description", async () => {
      await resourceConcept.updateResource(resourceID, undefined, undefined, description2);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName2); // Should remain unchanged
      assertEquals(dbEntry?.category, category2); // Should remain unchanged
      assertEquals(dbEntry?.description, description2);
    });

    await t.step("✅ Happy path: Update all fields", async () => {
      await resourceConcept.updateResource(
        resourceID,
        resourceName3,
        category1,
        description1,
      );
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3);
      assertEquals(dbEntry?.category, category1);
      assertEquals(dbEntry?.description, description1);
    });

    await t.step("✅ Happy path: Clear category by setting to null", async () => {
      await resourceConcept.updateResource(resourceID, undefined, null);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.category, undefined); // Should be unset
      assertEquals(dbEntry?.description, description1); // Should remain
    });

    await t.step("✅ Happy path: Clear description by setting to null", async () => {
      await resourceConcept.updateResource(resourceID, undefined, undefined, null);
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.category, undefined); // Should remain unset
      assertEquals(dbEntry?.description, undefined); // Should be unset
    });

    await t.step("✅ Requires violation: Cannot update non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(nonExistentResourceID, resourceName2),
        Error,
        `Resource with ID '${nonExistentResourceID}' not found.`,
      );
      // Verify the existing resource is unchanged
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3); // Still the last updated name
    });

    await t.step("✅ Requires violation: Cannot update name to empty string", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(resourceID, emptyString),
        Error,
        "Resource name cannot be updated to an empty string.",
      );
      // Verify name is unchanged
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3);
    });

    await t.step("✅ Requires violation: Cannot update name to whitespace string", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(resourceID, whitespaceString),
        Error,
        "Resource name cannot be updated to an empty string.",
      );
      // Verify name is unchanged
      const dbEntry = await coll.findOne({ _id: resourceID });
      assertEquals(dbEntry?.name, resourceName3);
    });

    await t.step("✅ Edge case: Update with unchanged values (idempotency)", async () => {
      const initialEntry = await coll.findOne({ _id: resourceID });
      await resourceConcept.updateResource(
        resourceID,
        initialEntry?.name,
        initialEntry?.category,
        initialEntry?.description,
      );
      const finalEntry = await coll.findOne({ _id: resourceID });
      assertEquals(finalEntry, initialEntry); // State should be identical
    });

    await t.step("✅ Edge case: Update with no parameters (should still validate resource existence)", async () => {
      const initialEntry = await coll.findOne({ _id: resourceID });
      await resourceConcept.updateResource(resourceID); // No parameters
      const finalEntry = await coll.findOne({ _id: resourceID });
      assertEquals(finalEntry, initialEntry); // State should be identical
    });

    await client.close();
    console.log("✅ Finished UPDATE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// DELETE RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'deleteResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: DELETE RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    let resourceID: ResourceID;

    await t.step("Setup: Create a resource for deletion", async () => {
      resourceID = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );
      assertEquals(await coll.countDocuments({ _id: resourceID }), 1);
    });

    await t.step("✅ Happy path: Delete an existing resource", async () => {
      await resourceConcept.deleteResource(resourceID);

      // Verify resource is gone from DB
      assertEquals(await coll.countDocuments({ _id: resourceID }), 0);

      // Verify getResource now fails
      await assertRejects(
        () => resourceConcept.getResource(resourceID),
        Error,
        `Resource with ID '${resourceID}' not found.`,
      );
    });

    await t.step("✅ Requires violation: Cannot delete non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.deleteResource(nonExistentResourceID),
        Error,
        `Resource with ID '${nonExistentResourceID}' not found.`,
      );
      // Verify no other resources were affected
      assertEquals(await coll.countDocuments({}), 0); // Should still be 0 after setup and deletion
    });

    await t.step("✅ Idempotency: Attempt to delete an already deleted resource", async () => {
      // Create and delete a resource once
      const tempID = await resourceConcept.createResource(ownerB, "Temp Resource");
      await resourceConcept.deleteResource(tempID);
      assertEquals(await coll.countDocuments({ _id: tempID }), 0);

      // Attempt to delete again
      await assertRejects(
        () => resourceConcept.deleteResource(tempID),
        Error,
        `Resource with ID '${tempID}' not found.`,
      );
    });

    await client.close();
    console.log("✅ Finished DELETE RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// GET RESOURCE ACTION TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Unit tests for 'getResource' action",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===========================================");
    console.log("🧪 TEST GROUP: GET RESOURCE ACTIONS");
    console.log("===========================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    let resourceIDWithAllFields: ResourceID;
    let resourceIDMandatoryOnly: ResourceID;
    let resourceIDClearedFields: ResourceID;

    await t.step("Setup: Create resources for retrieval", async () => {
      resourceIDWithAllFields = await resourceConcept.createResource(
        ownerA,
        resourceName1,
        category1,
        description1,
      );
      resourceIDMandatoryOnly = await resourceConcept.createResource(ownerB, resourceName2);
      resourceIDClearedFields = await resourceConcept.createResource(
        ownerC,
        resourceName3,
        category2,
        description2,
      );
      await resourceConcept.updateResource(resourceIDClearedFields, undefined, null, null); // Clear optional fields
    });

    await t.step("✅ Happy path: Retrieve resource with all fields", async () => {
      const resource = await resourceConcept.getResource(resourceIDWithAllFields);
      assertEquals(resource.id, resourceIDWithAllFields);
      assertEquals(resource.owner, ownerA);
      assertEquals(resource.name, resourceName1);
      assertEquals(resource.category, category1);
      assertEquals(resource.description, description1);
    });

    await t.step("✅ Happy path: Retrieve resource with only mandatory fields", async () => {
      const resource = await resourceConcept.getResource(resourceIDMandatoryOnly);
      assertEquals(resource.id, resourceIDMandatoryOnly);
      assertEquals(resource.owner, ownerB);
      assertEquals(resource.name, resourceName2);
      assertEquals(resource.category, undefined);
      assertEquals(resource.description, undefined);
    });

    await t.step("✅ Happy path: Retrieve resource with cleared optional fields", async () => {
      const resource = await resourceConcept.getResource(resourceIDClearedFields);
      assertEquals(resource.id, resourceIDClearedFields);
      assertEquals(resource.owner, ownerC);
      assertEquals(resource.name, resourceName3);
      assertEquals(resource.category, undefined);
      assertEquals(resource.description, undefined);
    });

    await t.step("✅ Requires violation: Retrieve non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.getResource(nonExistentResourceID),
        Error,
        `Resource with ID '${nonExistentResourceID}' not found.`,
      );
    });

    await t.step("✅ Edge case: Retrieve after deletion", async () => {
      const tempID = await resourceConcept.createResource(ownerA, "To Be Deleted");
      await resourceConcept.deleteResource(tempID);
      await assertRejects(
        () => resourceConcept.getResource(tempID),
        Error,
        `Resource with ID '${tempID}' not found.`,
      );
    });

    await t.step("✅ Idempotency: Repeatedly retrieving the same resource", async () => {
      const resource1 = await resourceConcept.getResource(resourceIDWithAllFields);
      const resource2 = await resourceConcept.getResource(resourceIDWithAllFields);
      assertEquals(resource1, resource2);
    });

    await client.close();
    console.log("✅ Finished GET RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST (Principle Verification)
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    const newOwner = "traceUser" as Owner;
    const initialName = "My Trace Resource";
    const initialCategory = "Trace Category";
    const initialDescription = "Description for trace test.";

    console.log("Trace Step 1: Create a new resource.");
    const resourceID = await resourceConcept.createResource(
      newOwner,
      initialName,
      initialCategory,
      initialDescription,
    );
    const createdResource = await resourceConcept.getResource(resourceID);
    assertEquals(createdResource.id, resourceID);
    assertEquals(createdResource.owner, newOwner);
    assertEquals(createdResource.name, initialName);
    assertEquals(createdResource.category, initialCategory);
    assertEquals(createdResource.description, initialDescription);
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 2: Update its name and clear its description.");
    const updatedName = "Updated Trace Resource Name";
    await resourceConcept.updateResource(resourceID, updatedName, undefined, null);
    const updatedResource1 = await resourceConcept.getResource(resourceID);
    assertEquals(updatedResource1.name, updatedName);
    assertEquals(updatedResource1.category, initialCategory); // Category should be unchanged
    assertEquals(updatedResource1.description, undefined); // Description should be cleared
    assertEquals(updatedResource1.owner, newOwner); // Owner cannot be changed by updateResource
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 3: Update its category and verify the state.");
    const newCategory = "New Category";
    await resourceConcept.updateResource(resourceID, undefined, newCategory);
    const updatedResource2 = await resourceConcept.getResource(resourceID);
    assertEquals(updatedResource2.name, updatedName);
    assertEquals(updatedResource2.category, newCategory);
    assertEquals(updatedResource2.description, undefined);
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 4: Attempt to update with an empty name (should fail).");
    const nameBeforeFailedUpdate = (await coll.findOne({ _id: resourceID }))?.name;
    await assertRejects(
      () => resourceConcept.updateResource(resourceID, emptyString),
      Error,
      "Resource name cannot be updated to an empty string.",
    );
    const resourceAfterFailedUpdate = await resourceConcept.getResource(resourceID);
    assertEquals(resourceAfterFailedUpdate.name, nameBeforeFailedUpdate); // Name should be unchanged
    assertEquals(await coll.countDocuments({}), 1);

    console.log("Trace Step 5: Delete the resource.");
    await resourceConcept.deleteResource(resourceID);
    assertEquals(await coll.countDocuments({}), 0);

    console.log("Trace Step 6: Verify resource is no longer retrievable.");
    await assertRejects(
      () => resourceConcept.getResource(resourceID),
      Error,
      `Resource with ID '${resourceID}' not found.`,
    );

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Robustness tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");
    await coll.deleteMany({}); // Ensure clean state

    // Scenario 1: Concurrent creation with same data (should yield unique resources)
    console.log("Robustness: Concurrent creations with identical input (different IDs expected)");
    const promise1 = resourceConcept.createResource(ownerA, resourceName1, category1);
    const promise2 = resourceConcept.createResource(ownerA, resourceName1, category1);
    const [id1, id2] = await Promise.all([promise1, promise2]);

    assertEquals(id1 !== id2, true); // IDs must be unique
    assertEquals(await coll.countDocuments({ name: resourceName1 }), 2);

    const res1 = await resourceConcept.getResource(id1);
    const res2 = await resourceConcept.getResource(id2);
    assertEquals(res1.name, resourceName1);
    assertEquals(res2.name, resourceName1);
    assertEquals(res1.owner, ownerA);
    assertEquals(res2.owner, ownerA);
    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 2: Concurrent updates to the same resource (race condition)
    console.log("Robustness: Concurrent updates to the same resource");
    const concurrentResourceID = await resourceConcept.createResource(ownerA, "Initial Name");
    await coll.deleteMany({}); // Clean for next scenario

    const resID = await resourceConcept.createResource(ownerA, "Initial Name");

    const updatePromise1 = resourceConcept.updateResource(resID, "Updated by A");
    const updatePromise2 = resourceConcept.updateResource(resID, "Updated by B");

    await Promise.allSettled([updatePromise1, updatePromise2]);

    const finalResource = await resourceConcept.getResource(resID);
    // Due to MongoDB's atomic `updateOne` and single operation per call,
    // one of the updates will "win" and the other will succeed with its value,
    // or if the updates were identical, both would effectively succeed.
    // The exact final state (A or B) depends on execution order, but the operation itself is robust.
    assertEquals([resourceName1, "Updated by A", "Updated by B"].includes(finalResource.name), true);
    assertEquals(await coll.countDocuments({}), 1);
    await coll.deleteMany({}); // Clean for next scenario

    // Scenario 3: Attempting to delete a resource that is concurrently being deleted (one succeeds, others fail)
    console.log("Robustness: Concurrent deletion attempts");
    const resourceToDeleteID = await resourceConcept.createResource(ownerA, "Resource to Delete");

    const deletePromise1 = resourceConcept.deleteResource(resourceToDeleteID);
    const deletePromise2 = resourceConcept.deleteResource(resourceToDeleteID);
    const deletePromise3 = resourceConcept.deleteResource(resourceToDeleteID);

    const deleteResults = await Promise.allSettled([deletePromise1, deletePromise2, deletePromise3]);

    const fulfilledDeletes = deleteResults.filter(r => r.status === "fulfilled").length;
    const rejectedDeletes = deleteResults.filter(r => r.status === "rejected").length;

    assertEquals(fulfilledDeletes, 1);
    assertEquals(rejectedDeletes, 2);
    assertEquals(await coll.countDocuments({ _id: resourceToDeleteID }), 0); // Must be deleted

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
    console.log("\n======================================================================");
    console.log("🎉 RESOURCE CONCEPT: TEST RUN COMPLETE (see above for pass/fail) 🎉");
    console.log("========================================================================\n");
  },
});
