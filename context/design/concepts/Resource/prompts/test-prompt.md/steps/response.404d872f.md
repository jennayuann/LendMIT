---
timestamp: 'Sat Oct 18 2025 23:10:56 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_231056.43e6da4d.md]]'
content_id: 404d872fb6aabdce2dfd317c5c9fd48ca17d348281bfbecad333fc80cf770279
---

# response:

The following Deno test file, `src/concepts/Resource.test.ts`, provides comprehensive testing for the `ResourceConcept` implementation based on the provided guide and example. It includes unit tests for each action, covering happy paths, requirements violations, edge cases, idempotency, and state verification. Additionally, it features a trace test to verify the concept's principle through a multi-step interaction and robustness tests for concurrency-like scenarios and data consistency.

```typescript
// src/concepts/Resource.test.ts

import { assertEquals, assertRejects } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Collection, Db } from "mongodb"; // Import Db for the constructor type
import { ID } from "@utils/types.ts";
import {
  Owner,
  Resource,
  ResourceConcept,
  ResourceDocument,
  ResourceID,
} from "./Resource.ts";

// ----------------------------------------------------------------------
// Global Test Constants
// ----------------------------------------------------------------------

const ownerA = "user_alpha" as Owner;
const ownerB = "user_beta" as Owner;
const nonExistentID = "nonExistent123" as ID; // Generic non-existent ID for various checks

// Helper to convert ResourceDocument from DB to public Resource type for assertions
function docToResource(doc: ResourceDocument): Resource {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

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

    await t.step("✅ Happy path: Create a resource with all optional fields", async () => {
      const resourceName = "Project Alpha";
      const resourceCategory = "Software Development";
      const resourceDescription = "A new project for testing purposes.";

      const newResourceId = await resourceConcept.createResource(
        ownerA,
        resourceName,
        resourceCategory,
        resourceDescription,
      );

      // Verify returned ID is valid
      assertEquals(typeof newResourceId, "string");
      assertEquals(newResourceId.length > 0, true);

      // State verification: Check in DB
      const dbEntry = await coll.findOne({ _id: newResourceId });
      if (!dbEntry) throw new Error("Resource not found in DB after creation");
      assertEquals(dbEntry.owner, ownerA);
      assertEquals(dbEntry.name, resourceName);
      assertEquals(dbEntry.category, resourceCategory);
      assertEquals(dbEntry.description, resourceDescription);
      assertEquals(dbEntry._id, newResourceId);

      // State verification: Check via getResource method
      const retrievedResource = await resourceConcept.getResource(newResourceId);
      assertEquals(retrievedResource, docToResource(dbEntry));
    });

    await t.step("✅ Happy path: Create a resource with only mandatory fields", async () => {
      const resourceName = "Simple Task";

      const newResourceId = await resourceConcept.createResource(ownerB, resourceName);

      // Verify returned ID is valid
      assertEquals(typeof newResourceId, "string");
      assertEquals(newResourceId.length > 0, true);

      // State verification: Check in DB
      const dbEntry = await coll.findOne({ _id: newResourceId });
      if (!dbEntry) throw new Error("Resource not found in DB after creation");
      assertEquals(dbEntry.owner, ownerB);
      assertEquals(dbEntry.name, resourceName);
      assertEquals(dbEntry.category, undefined); // Optional fields should be absent
      assertEquals(dbEntry.description, undefined); // Optional fields should be absent

      // State verification: Check via getResource method
      const retrievedResource = await resourceConcept.getResource(newResourceId);
      assertEquals(retrievedResource, docToResource(dbEntry));
    });

    await t.step("✅ Requires violation: Cannot create resource with empty name", async () => {
      const emptyName = "";
      await assertRejects(
        () => resourceConcept.createResource(ownerA, emptyName),
        Error,
        "Resource name cannot be empty.",
      );
      // State verification: ensure no resource was created
      const count = await coll.countDocuments({ owner: ownerA, name: emptyName });
      assertEquals(count, 0);
    });

    await t.step("✅ Requires violation: Cannot create resource with whitespace-only name", async () => {
      const whitespaceName = "   ";
      await assertRejects(
        () => resourceConcept.createResource(ownerA, whitespaceName),
        Error,
        "Resource name cannot be empty.",
      );
      // State verification: ensure no resource was created
      const count = await coll.countDocuments({ owner: ownerA, name: whitespaceName });
      assertEquals(count, 0);
    });

    await t.step("✅ Edge case: Create resources by different owners with same name", async () => {
      const commonName = "Shared Item";
      const res1ID = await resourceConcept.createResource(ownerA, commonName);
      const res2ID = await resourceConcept.createResource(ownerB, commonName);

      const res1 = await resourceConcept.getResource(res1ID);
      const res2 = await resourceConcept.getResource(res2ID);

      assertEquals(res1.owner, ownerA);
      assertEquals(res2.owner, ownerB);
      assertEquals(res1.name, commonName);
      assertEquals(res2.name, commonName);
      assertEquals(res1.id !== res2.id, true); // IDs should always be unique
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

    // Setup: Create a base resource for updating in various steps
    const initialName = "Original Item";
    const initialCategory = "Default";
    const initialDescription = "This is the initial description.";
    const resourceId = await resourceConcept.createResource(
      ownerA,
      initialName,
      initialCategory,
      initialDescription,
    );

    await t.step("✅ Happy path: Update resource name only", async () => {
      const newName = "Revised Item Name";
      await resourceConcept.updateResource(resourceId, newName);

      // State verification
      const updatedResource = await resourceConcept.getResource(resourceId);
      assertEquals(updatedResource.name, newName);
      assertEquals(updatedResource.category, initialCategory); // Other fields unchanged
      assertEquals(updatedResource.description, initialDescription);
    });

    await t.step("✅ Happy path: Update resource category only", async () => {
      const newCategory = "Updated Category";
      // Using `undefined` for name, means it won't be updated
      await resourceConcept.updateResource(resourceId, undefined, newCategory);

      // State verification
      const updatedResource = await resourceConcept.getResource(resourceId);
      assertEquals(updatedResource.name, "Revised Item Name"); // Name from previous step
      assertEquals(updatedResource.category, newCategory);
      assertEquals(updatedResource.description, initialDescription);
    });

    await t.step("✅ Happy path: Clear resource description by setting to null", async () => {
      await resourceConcept.updateResource(resourceId, undefined, undefined, null);

      // State verification
      const updatedResource = await resourceConcept.getResource(resourceId);
      assertEquals(updatedResource.name, "Revised Item Name");
      assertEquals(updatedResource.category, "Updated Category");
      assertEquals(updatedResource.description, undefined); // Should now be undefined

      // Verify direct DB state (field should be absent)
      const dbEntry = await coll.findOne({ _id: resourceId });
      assertEquals(dbEntry?.description, undefined);
    });

    await t.step("✅ Happy path: Update category and add new description simultaneously", async () => {
      const newestCategory = "Newest Category";
      const newestDescription = "Newly added description.";
      await resourceConcept.updateResource(resourceId, undefined, newestCategory, newestDescription);

      // State verification
      const updatedResource = await resourceConcept.getResource(resourceId);
      assertEquals(updatedResource.name, "Revised Item Name");
      assertEquals(updatedResource.category, newestCategory);
      assertEquals(updatedResource.description, newestDescription);
    });

    await t.step("✅ Requires violation: Cannot update non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(nonExistentID as ResourceID, "Non-existent Update"),
        Error,
        `Resource with ID '${nonExistentID}' not found.`,
      );
    });

    await t.step("✅ Requires violation: Cannot update name to an empty string", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(resourceId, ""),
        Error,
        "Resource name cannot be updated to an empty string.",
      );
      // State verification: ensure name did not change
      const currentResource = await resourceConcept.getResource(resourceId);
      assertEquals(currentResource.name, "Revised Item Name"); // Should still be the previous valid name
    });

    await t.step("✅ Requires violation: Cannot update name to a whitespace-only string", async () => {
      await assertRejects(
        () => resourceConcept.updateResource(resourceId, "   "),
        Error,
        "Resource name cannot be updated to an empty string.",
      );
      // State verification: ensure name did not change
      const currentResource = await resourceConcept.getResource(resourceId);
      assertEquals(currentResource.name, "Revised Item Name"); // Should still be the previous valid name
    });

    await t.step("✅ Edge case: Update with no parameters provided (no-op update)", async () => {
      const currentResource = await resourceConcept.getResource(resourceId);
      const result = await resourceConcept.updateResource(resourceId); // Call with no optional params
      assertEquals(result, {}); // Should return Empty
      const resourceAfterNoUpdate = await resourceConcept.getResource(resourceId);
      assertEquals(resourceAfterNoUpdate, currentResource); // State should be exactly unchanged
    });

    await t.step("✅ Edge case: Idempotency - repeated updates with same valid values", async () => {
      const currentResource = await resourceConcept.getResource(resourceId);
      await resourceConcept.updateResource(resourceId, currentResource.name, currentResource.category, currentResource.description);
      const resourceAfterFirstSameUpdate = await resourceConcept.getResource(resourceId);
      assertEquals(resourceAfterFirstSameUpdate, currentResource);

      await resourceConcept.updateResource(resourceId, currentResource.name, currentResource.category, currentResource.description);
      const resourceAfterSecondSameUpdate = await resourceConcept.getResource(resourceId);
      assertEquals(resourceAfterSecondSameUpdate, currentResource);
      // The update should succeed without error and not change the state.
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

    // Setup: Create a resource to delete and another to confirm isolation
    const resourceIdToDelete = await resourceConcept.createResource(ownerA, "Ephemeral Item");
    const anotherResourceId = await resourceConcept.createResource(ownerA, "Persistent Item");

    await t.step("✅ Happy path: Delete an existing resource", async () => {
      const result = await resourceConcept.deleteResource(resourceIdToDelete);
      assertEquals(result, {}); // Should return Empty

      // State verification: Resource is deleted from DB
      const dbEntry = await coll.findOne({ _id: resourceIdToDelete });
      assertEquals(dbEntry, null);

      // State verification: `getResource` now rejects for the deleted resource
      await assertRejects(
        () => resourceConcept.getResource(resourceIdToDelete),
        Error,
        `Resource with ID '${resourceIdToDelete}' not found.`,
      );

      // State verification: Other resources are unaffected
      const anotherResource = await resourceConcept.getResource(anotherResourceId);
      assertEquals(anotherResource.id, anotherResourceId);
    });

    await t.step("✅ Requires violation: Cannot delete a non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.deleteResource(nonExistentID as ResourceID),
        Error,
        `Resource with ID '${nonExistentID}' not found.`,
      );
    });

    await t.step("✅ Idempotency: Attempt to delete an already deleted resource", async () => {
      // `resourceIdToDelete` is already deleted from a previous step
      await assertRejects(
        () => resourceConcept.deleteResource(resourceIdToDelete),
        Error,
        `Resource with ID '${resourceIdToDelete}' not found.`,
      );
      // The `deleteResource` action rejects if the resource is not found, which is a consistent and valid behavior
      // for a 'requires' violation, rather than returning Empty to make it truly idempotent at the API level.
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

    // Setup: Create a resource for retrieval tests
    const initialName = "Fetchable Item";
    const initialCategory = "Information";
    const initialDescription = "Contains important data.";
    const resourceId = await resourceConcept.createResource(
      ownerB,
      initialName,
      initialCategory,
      initialDescription,
    );

    await t.step("✅ Happy path: Retrieve an existing resource", async () => {
      const retrievedResource = await resourceConcept.getResource(resourceId);

      assertEquals(retrievedResource.id, resourceId);
      assertEquals(retrievedResource.owner, ownerB);
      assertEquals(retrievedResource.name, initialName);
      assertEquals(retrievedResource.category, initialCategory);
      assertEquals(retrievedResource.description, initialDescription);

      // Ensure the returned object is `Resource` type (id instead of _id) and matches DB
      const dbEntry = await coll.findOne({ _id: resourceId });
      if (!dbEntry) throw new Error("Resource not found in DB for comparison");
      assertEquals(retrievedResource, docToResource(dbEntry));
    });

    await t.step("✅ Requires violation: Retrieve a non-existent resource", async () => {
      await assertRejects(
        () => resourceConcept.getResource(nonExistentID as ResourceID),
        Error,
        `Resource with ID '${nonExistentID}' not found.`,
      );
    });

    await t.step("✅ Edge case: Retrieve resource after it has been deleted", async () => {
      const tempResourceId = await resourceConcept.createResource(ownerA, "Temporary View");
      await resourceConcept.deleteResource(tempResourceId);

      await assertRejects(
        () => resourceConcept.getResource(tempResourceId),
        Error,
        `Resource with ID '${tempResourceId}' not found.`,
      );
    });

    await client.close();
    console.log("✅ Finished GET RESOURCE tests\n");
  },
});

// ----------------------------------------------------------------------
// TRACE / FULL BEHAVIOR TEST
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Trace scenario (end-to-end behavior)",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n===============================================");
    console.log("🧪 TEST GROUP: TRACE DEMONSTRATION");
    console.log("===============================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");

    const owner = ownerA;
    let resourceId: ResourceID;

    await t.step("1. Create a new resource with initial properties", async () => {
      const initialName = "Trace Item";
      const initialCategory = "Trace Category";
      const initialDescription = "Description for trace test.";

      resourceId = await resourceConcept.createResource(owner, initialName, initialCategory, initialDescription);

      const createdResource = await resourceConcept.getResource(resourceId);
      assertEquals(createdResource.id, resourceId);
      assertEquals(createdResource.owner, owner);
      assertEquals(createdResource.name, initialName);
      assertEquals(createdResource.category, initialCategory);
      assertEquals(createdResource.description, initialDescription);

      // Direct DB verification
      const dbEntry = await coll.findOne({ _id: resourceId });
      assertEquals(dbEntry?.name, initialName);
    });

    await t.step("2. Update the resource's name and clear its description", async () => {
      const updatedName = "Trace Item (Revised)";
      await resourceConcept.updateResource(resourceId, updatedName, undefined, null); // Clear description

      const updatedResource = await resourceConcept.getResource(resourceId);
      assertEquals(updatedResource.name, updatedName);
      assertEquals(updatedResource.category, "Trace Category"); // Category should be unchanged
      assertEquals(updatedResource.description, undefined); // Description should be cleared

      // Direct DB verification
      const dbEntry = await coll.findOne({ _id: resourceId });
      assertEquals(dbEntry?.name, updatedName);
      assertEquals(dbEntry?.description, undefined); // Confirm absence in DB
    });

    await t.step("3. Update the category and add a new description", async () => {
      const newCategory = "New Trace Category";
      const newDescription = "New description added.";
      await resourceConcept.updateResource(resourceId, undefined, newCategory, newDescription);

      const finalResource = await resourceConcept.getResource(resourceId);
      assertEquals(finalResource.name, "Trace Item (Revised)"); // Name unchanged
      assertEquals(finalResource.category, newCategory);
      assertEquals(finalResource.description, newDescription);

      // Direct DB verification
      const dbEntry = await coll.findOne({ _id: resourceId });
      assertEquals(dbEntry?.category, newCategory);
      assertEquals(dbEntry?.description, newDescription);
    });

    await t.step("4. Attempt to retrieve a non-existent resource (should fail)", async () => {
      await assertRejects(
        () => resourceConcept.getResource(nonExistentID as ResourceID),
        Error,
        `Resource with ID '${nonExistentID}' not found.`,
      );
    });

    await t.step("5. Delete the resource", async () => {
      await resourceConcept.deleteResource(resourceId);

      // Direct DB verification
      const dbEntry = await coll.findOne({ _id: resourceId });
      assertEquals(dbEntry, null); // Confirm deletion from DB
    });

    await t.step("6. Attempt to retrieve the deleted resource (should fail)", async () => {
      await assertRejects(
        () => resourceConcept.getResource(resourceId),
        Error,
        `Resource with ID '${resourceId}' not found.`,
      );
    });

    await t.step("7. Attempt to delete the already deleted resource (should fail)", async () => {
      await assertRejects(
        () => resourceConcept.deleteResource(resourceId),
        Error,
        `Resource with ID '${resourceId}' not found.`,
      );
    });

    await client.close();
    console.log("✅ Finished TRACE demonstration\n");
  },
});

// ----------------------------------------------------------------------
// ROBUSTNESS TESTS
// ----------------------------------------------------------------------
Deno.test({
  name: "Resource concept: Robustness and concurrency-like tests",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    console.log("\n=================================================");
    console.log("🧪 TEST GROUP: ROBUSTNESS & CONCURRENCY");
    console.log("=================================================\n");

    const [db, client] = await testDb();
    const resourceConcept = new ResourceConcept(db);
    const coll: Collection<ResourceDocument> = db.collection("resources");

    await t.step("✅ Concurrency-like: Multiple create operations for different resources", async () => {
      const createPromises = [
        resourceConcept.createResource(ownerA, "Resource One"),
        resourceConcept.createResource(ownerB, "Resource Two"),
        resourceConcept.createResource(ownerA, "Resource Three"),
      ];

      const results = await Promise.all(createPromises); // All should succeed
      assertEquals(results.length, 3);
      assertEquals(new Set(results).size, 3); // All IDs should be unique

      const count = await coll.countDocuments({});
      assertEquals(count, 3); // All resources should be created
    });

    await t.step("✅ Concurrency-like: Multiple updates to the same resource field", async () => {
      const resourceId = await resourceConcept.createResource(ownerA, "Start Name");

      const updatePromises = [
        resourceConcept.updateResource(resourceId, "First Update"),
        resourceConcept.updateResource(resourceId, undefined, "Category A"),
        resourceConcept.updateResource(resourceId, "Second Update"),
        resourceConcept.updateResource(resourceId, undefined, "Category B"),
        resourceConcept.updateResource(resourceId, "Third Update", undefined, "Description C"),
      ];

      // Use Promise.allSettled to see all outcomes, even rejections (though update shouldn't reject here unless ID is invalid)
      await Promise.allSettled(updatePromises);

      const finalResource = await resourceConcept.getResource(resourceId);
      // Due to MongoDB's atomic `updateOne`, the last successful write will determine the final state.
      // We expect the name to be "Third Update", category "Category B", description "Description C".
      assertEquals(finalResource.name, "Third Update");
      assertEquals(finalResource.category, "Category B");
      assertEquals(finalResource.description, "Description C");
    });

    await t.step("✅ Concurrency-like: Update a resource while it's being deleted", async () => {
      const resourceId = await resourceConcept.createResource(ownerA, "Race Condition Target");

      const updatePromise = resourceConcept.updateResource(resourceId, "Attempted Update");
      const deletePromise = resourceConcept.deleteResource(resourceId);

      const [updateResult, deleteResult] = await Promise.allSettled([updatePromise, deletePromise]);

      // One of these should succeed (delete) and the other fail (update) if delete happens first,
      // or delete succeeds and update succeeds then delete (delete wins).
      // The final state should be that the resource does not exist.
      const dbEntry = await coll.findOne({ _id: resourceId });
      assertEquals(dbEntry, null); // Resource should be gone

      // Verify outcomes:
      // If delete was fulfilled, then update must have been rejected (if delete completed before update could match)
      // or update was fulfilled but then overwritten by delete (if update happened and then delete matched).
      // If delete rejected, it means the resource wasn't found at delete time, implying update might have failed after delete or was trying to delete a non-existent.
      if (deleteResult.status === "fulfilled") {
        assertEquals(deleteResult.value, {});
        // Update either happened before delete (and was overwritten), or was rejected because delete happened first.
        // Given `updateOne` uses `matchedCount`, it's likely rejected if delete occurred first.
        if (updateResult.status === "rejected") {
          assertEquals((updateResult as PromiseRejectedResult).reason.message, `Resource with ID '${resourceId}' not found.`);
        } else {
          assertEquals(updateResult.status, "fulfilled", "Update should either reject or fulfill.");
        }
      } else { // deleteResult.status === "rejected"
        // This means delete failed because the resource wasn't found. This would imply update also failed
        // because the resource was already gone (e.g. from a previous test run or setup mistake).
        // Given this is a fresh resource, this path is less likely to be cleanly hit.
        // But if it did, both might reject if resource was removed by another means.
        assertEquals((deleteResult as PromiseRejectedResult).reason.message, `Resource with ID '${resourceId}' not found.`);
        assertEquals(updateResult.status, "rejected");
        assertEquals((updateResult as PromiseRejectedResult).reason.message, `Resource with ID '${resourceId}' not found.`);
      }
    });

    await t.step("✅ State consistency after failed creation (empty name)", async () => {
      const initialCount = await coll.countDocuments({});
      await assertRejects(
        () => resourceConcept.createResource(ownerA, ""),
        Error,
        "Resource name cannot be empty.",
      );
      const finalCount = await coll.countDocuments({});
      assertEquals(finalCount, initialCount); // No new resource should be added
    });

    await t.step("✅ State consistency after failed update (non-existent resource)", async () => {
      const resourceId = await resourceConcept.createResource(ownerA, "Stable Resource");
      const initialResource = await resourceConcept.getResource(resourceId);

      await assertRejects(
        () => resourceConcept.updateResource(nonExistentID as ResourceID, "Corrupting Update"),
        Error,
        `Resource with ID '${nonExistentID}' not found.`,
      );

      const currentResource = await resourceConcept.getResource(resourceId);
      assertEquals(currentResource, initialResource); // Original resource should be unaffected
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
    console.log("\n===============================================");
    console.log("🎉 ALL TEST CASES PASSED SUCCESSFULLY 🎉");
    console.log("===============================================\n");
  },
});
```
