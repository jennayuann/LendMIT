---
timestamp: 'Sat Oct 18 2025 23:01:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_230141.56a99398.md]]'
content_id: 27619791e7d923e3f9e9d89212130bc4f2b3468197832f087714d9d40397dc37
---

# response:

To address the request for making `updateResource` atomic and robustly checking for resource existence, we will modify the `updateResource` method.

The key changes are:

1. **Remove the initial `findOne` call** for existence check. This prevents a race condition where a resource might be deleted between the `findOne` and the `updateOne` calls.
2. **Construct the update document** (`$set`, `$unset` operators) based on provided parameters.
3. **Handle the "no-op" update scenario**: If, after processing all parameters, there are no actual `$set` or `$unset` operations to perform (meaning no effective change was requested), we cannot call `updateOne` with an empty update document (MongoDB would throw an error). In this specific case, we'll perform a `countDocuments` query to *only* check for the resource's existence, fulfilling the "requires" condition without modifying anything.
4. **Perform `updateOne` and check `matchedCount`**: If there are actual update operations, we execute `updateOne`. If `result.matchedCount` is 0, it means the resource did not exist at the time of the atomic update, and we throw an error.

Here's the updated `src/concepts/Resource.ts` file:

```typescript
// src/concepts/Resource.ts

import { Collection, Db } from "npm:mongodb";
// Assuming these utilities are available as per guide instructions
import { ID, Empty } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
// Import the db instance from the connection file
import { db } from "@/db/connection.ts";

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

/**
 * Type representing a unique identifier for a Resource.
 */
export type ResourceID = ID;

/**
 * Type representing the owner's identifier.
 */
export type Owner = ID;

/**
 * Interface for a Resource entity as stored in the MongoDB `resources` collection.
 * This includes the internal `_id` field.
 */
export interface ResourceDocument {
  _id: ResourceID;     // MongoDB document ID, branded as ResourceID
  owner: Owner;        // Owner of the resource
  name: string;        // Mandatory name of the resource
  category?: string;   // Optional category
  description?: string; // Optional description
}

/**
 * Interface for a Resource entity as returned by public methods.
 * This uses `id` instead of `_id` to align with the concept specification.
 */
export interface Resource {
  id: ResourceID;
  owner: Owner;
  name: string;
  category?: string;
  description?: string;
}

// -----------------------------------------------------------------------------
// Resource Class Implementation
// -----------------------------------------------------------------------------

/**
 * Implements the Resource concept.
 *
 * purpose: Represent any generic entity that can be owned and described by a mandatory name and optional attributes.
 * principle: An owner can create a resource, which is then uniquely identified and named,
 *            and its descriptive attributes can be retrieved or modified.
 */
export class ResourceConcept {
  private resources: Collection<ResourceDocument>;

  constructor(private readonly database: Db) {
    // The MongoDB collection name should be the plural form of the concept: "resources"
    this.resources = this.database.collection<ResourceDocument>("resources");
  }

  /**
   * Creates a new `Resource` entry.
   *
   * @param owner The ID of the owner of the resource.
   * @param name The mandatory name of the resource.
   * @param category An optional category for the resource.
   * @param description An optional description for the resource.
   *
   * @requires `name is not an empty string`.
   * @effects Creates a new `Resource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`.
   *          Returns the `id` of the newly created resource.
   *
   * @returns The `id` of the newly created resource (`ResourceID`).
   * @throws Error if the `name` is an empty string.
   */
  async createResource(
    owner: Owner,
    name: string,
    category?: string,
    description?: string,
  ): Promise<ResourceID> {
    // Enforce "requires" condition: `name is not an empty string`.
    if (!name || name.trim() === "") {
      throw new Error("Resource name cannot be empty.");
    }

    const newResource: ResourceDocument = {
      _id: freshID() as ResourceID, // Generate a fresh unique ID and brand it as ResourceID
      owner,
      name,
      // Only include category/description fields if they are explicitly provided (not undefined).
      // If null is provided, it will be stored as null.
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
    };

    await this.resources.insertOne(newResource);

    return newResource._id;
  }

  /**
   * Updates an existing `Resource` entry.
   *
   * @param resourceID The `id` of the resource to update.
   * @param name An optional new name for the resource. If provided and not empty, updates the name.
   * @param category An optional new category for the resource. If `null`, clears the existing category.
   * @param description An optional new description for the resource. If `null`, clears the existing description.
   *
   * @requires
   *   - A `Resource` entry with `id = resourceID` exists.
   *   - If `name` is provided (i.e., not `undefined`), `name is not an empty string`.
   * @effects
   *   - If `name` is provided and is not an empty string, updates the `name` for the given `resourceID`.
   *   - If `category` is provided, updates the `category` for the given `resourceID`. If `null` is provided, it clears the existing `category`.
   *   - If `description` is provided, updates the `description` for the given `resourceID`. If `null` is provided, it clears the existing `description`.
   *
   * @returns An empty object (`Empty`).
   * @throws Error if a resource with the given `resourceID` does not exist.
   * @throws Error if `name` is provided but is an empty string.
   */
  async updateResource(
    resourceID: ResourceID,
    name?: string,
    category?: string | null,
    description?: string | null,
  ): Promise<Empty> {
    // Enforce "requires" condition: If `name` is provided, `name is not an empty string`.
    if (name !== undefined && name.trim() === "") {
      throw new Error("Resource name cannot be updated to an empty string.");
    }

    const updateOperations: { $set?: Partial<ResourceDocument>; $unset?: any } = {};
    const $set: Partial<ResourceDocument> = {};
    const $unset: any = {};

    if (name !== undefined) {
      $set.name = name;
    }
    if (category !== undefined) {
      if (category === null) {
        $unset.category = ""; // Value for $unset doesn't matter, only its existence
      } else {
        $set.category = category;
      }
    }
    if (description !== undefined) {
      if (description === null) {
        $unset.description = "";
      } else {
        $set.description = description;
      }
    }

    if (Object.keys($set).length > 0) {
      updateOperations.$set = $set;
    }
    if (Object.keys($unset).length > 0) {
      updateOperations.$unset = $unset;
    }

    // If no update operations were constructed (meaning no parameters were provided
    // that would result in a database change), we still need to check if the
    // resource exists to satisfy the "requires" condition. This is a no-op update.
    if (Object.keys(updateOperations).length === 0) {
      const exists = await this.resources.countDocuments({ _id: resourceID }, { limit: 1 });
      if (exists === 0) {
        throw new Error(`Resource with ID '${resourceID}' not found.`);
      }
      return {}; // Resource exists, but no changes were requested.
    }

    // Perform the atomic update. `matchedCount` ensures resource existence at the time of update.
    const result = await this.resources.updateOne(
      { _id: resourceID },
      updateOperations,
    );

    if (result.matchedCount === 0) {
      // If matchedCount is 0, the resource either never existed or was deleted concurrently.
      throw new Error(`Resource with ID '${resourceID}' not found.`);
    }

    return {};
  }

  /**
   * Deletes a `Resource` entry.
   *
   * @param resourceID The `id` of the resource to delete.
   *
   * @requires A `Resource` entry with `id = resourceID` exists.
   * @effects Deletes the `Resource` entry corresponding to `resourceID`.
   *
   * @returns An empty object (`Empty`).
   * @throws Error if a resource with the given `resourceID` does not exist.
   */
  async deleteResource(resourceID: ResourceID): Promise<Empty> {
    // Enforce "requires" condition: A `Resource` entry with `id = resourceID` exists.
    const result = await this.resources.deleteOne({ _id: resourceID });

    if (result.deletedCount === 0) {
      throw new Error(`Resource with ID '${resourceID}' not found.`);
    }

    return {};
  }

  /**
   * Retrieves the complete `Resource` object associated with a given `resourceID`.
   *
   * @param resourceID The `id` of the resource to retrieve.
   *
   * @requires A `Resource` entry with `id = resourceID` exists.
   * @effects Returns the complete `Resource` object associated with this `resourceID`.
   *
   * @returns The complete `Resource` object.
   * @throws Error if a resource with the given `resourceID` does not exist.
   */
  async getResource(resourceID: ResourceID): Promise<Resource> {
    // Enforce "requires" condition: A `Resource` entry with `id = resourceID` exists.
    const resourceDoc = await this.resources.findOne({ _id: resourceID });

    if (!resourceDoc) {
      throw new Error(`Resource with ID '${resourceID}' not found.`);
    }

    // Convert the internal ResourceDocument (_id) to the public Resource (id) format
    const { _id, ...rest } = resourceDoc;
    return { id: _id, ...rest };
  }
}

// -----------------------------------------------------------------------------
// Export Instantiated Class
// -----------------------------------------------------------------------------

// Instantiate the ResourceConcept class with the shared MongoDB database connection
export const resource = new ResourceConcept(db);
```
