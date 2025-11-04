// src/concepts/Resource.ts

import { Collection, Db } from "mongodb";
// Assuming these utilities are available as per guide instructions
import { Empty, ID } from "@utils/types.ts";
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
  _id: ResourceID; // MongoDB document ID, branded as ResourceID
  owner: Owner; // Owner of the resource
  name: string; // Mandatory name of the resource
  category?: string; // Optional category
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
  // Overloads to support both positional and DTO-style invocation
  async createResource(
    owner: Owner,
    name: string,
    category?: string | null,
    description?: string | null
  ): Promise<ResourceID>;
  async createResource(args: {
    owner: Owner;
    name: string;
    category?: string | null;
    description?: string | null;
  }): Promise<ResourceID>;
  async createResource(
    ownerOrArgs:
      | Owner
      | {
          owner: Owner;
          name: string;
          category?: string | null;
          description?: string | null;
        },
    nameMaybe?: string,
    categoryMaybe?: string | null,
    descriptionMaybe?: string | null
  ): Promise<ResourceID> {
    try {
      // Debug log of received arguments (non-throwing)
      // deno-lint-ignore no-explicit-any
      const dbg: any = {
        ownerOrArgsType: typeof ownerOrArgs,
        hasName:
          typeof ownerOrArgs === "object" &&
          ownerOrArgs !== null &&
          "name" in ownerOrArgs,
        hasOwner:
          typeof ownerOrArgs === "object" &&
          ownerOrArgs !== null &&
          "owner" in ownerOrArgs,
        nameMaybe,
      };
      // eslint-disable-next-line no-console
      console.log(`[ResourceConcept.createResource] args dbg:`, dbg);
    } catch {
      // ignore logging failures
    }
    const owner =
      typeof ownerOrArgs === "object" &&
      ownerOrArgs !== null &&
      "owner" in ownerOrArgs
        ? (ownerOrArgs.owner as Owner)
        : (ownerOrArgs as Owner);
    const name =
      typeof ownerOrArgs === "object" &&
      ownerOrArgs !== null &&
      "name" in ownerOrArgs
        ? (ownerOrArgs.name as string)
        : (nameMaybe as string);
    const category =
      typeof ownerOrArgs === "object" &&
      ownerOrArgs !== null &&
      "category" in ownerOrArgs
        ? (ownerOrArgs.category as string | null | undefined)
        : categoryMaybe;
    const description =
      typeof ownerOrArgs === "object" &&
      ownerOrArgs !== null &&
      "description" in ownerOrArgs
        ? (ownerOrArgs.description as string | null | undefined)
        : descriptionMaybe;
    // Enforce "requires" condition: `name is not an empty string`.
    if (!name || name.trim() === "") {
      throw new Error("Resource name cannot be empty.");
    }

    const newResource: ResourceDocument = {
      _id: freshID() as ResourceID, // Generate a fresh unique ID and brand it as ResourceID
      owner,
      name,
      // Only include category/description fields if they are explicitly provided (not undefined or null).
      ...(category !== undefined && category !== null && { category }),
      ...(description !== undefined && description !== null && { description }),
    } as ResourceDocument;

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
  // Overloads to support both positional and DTO-style invocation
  async updateResource(
    resourceID: ResourceID,
    name?: string,
    category?: string | null,
    description?: string | null
  ): Promise<Empty>;
  async updateResource(args: {
    resourceID: ResourceID;
    name?: string;
    category?: string | null;
    description?: string | null;
  }): Promise<Empty>;
  async updateResource(
    resourceOrArgs:
      | ResourceID
      | {
          resourceID: ResourceID;
          name?: string;
          category?: string | null;
          description?: string | null;
        },
    nameMaybe?: string,
    categoryMaybe?: string | null,
    descriptionMaybe?: string | null
  ): Promise<Empty> {
    const resourceID =
      typeof resourceOrArgs === "object" &&
      resourceOrArgs !== null &&
      "resourceID" in resourceOrArgs
        ? (resourceOrArgs.resourceID as ResourceID)
        : (resourceOrArgs as ResourceID);
    const name =
      typeof resourceOrArgs === "object" &&
      resourceOrArgs !== null &&
      "name" in resourceOrArgs
        ? (resourceOrArgs.name as string | undefined)
        : nameMaybe;
    const category =
      typeof resourceOrArgs === "object" &&
      resourceOrArgs !== null &&
      "category" in resourceOrArgs
        ? (resourceOrArgs.category as string | null | undefined)
        : categoryMaybe;
    const description =
      typeof resourceOrArgs === "object" &&
      resourceOrArgs !== null &&
      "description" in resourceOrArgs
        ? (resourceOrArgs.description as string | null | undefined)
        : descriptionMaybe;
    // Enforce "requires" condition: If `name` is provided, `name is not an empty string`.
    if (name !== undefined && name.trim() === "") {
      throw new Error("Resource name cannot be updated to an empty string.");
    }

    const updateOperations: {
      $set?: Partial<ResourceDocument>;
      $unset?: Record<string, "" | 1 | true>;
    } = {};
    const $set: Partial<ResourceDocument> = {};
    const $unset: Record<string, "" | 1 | true> = {};

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
      const exists = await this.resources.countDocuments(
        { _id: resourceID },
        {
          limit: 1,
        }
      );
      if (exists === 0) {
        throw new Error(`Resource with ID '${resourceID}' not found.`);
      }
      return {}; // Resource exists, but no changes were requested.
    }

    // Perform the atomic update. `matchedCount` ensures resource existence at the time of update.
    const result = await this.resources.updateOne(
      { _id: resourceID },
      updateOperations
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
  async deleteResource(
    resource: ResourceID | { resourceID: string | ResourceID }
  ): Promise<Empty> {
    const resourceID =
      typeof resource === "string" ? resource : resource.resourceID;
    const id = resourceID as ResourceID;
    const result = await this.resources.deleteOne({ _id: id });

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
  async getResource(
    resource: ResourceID | { resourceID: string | ResourceID }
  ): Promise<Resource> {
    const resourceID =
      typeof resource === "string" ? resource : resource.resourceID;
    const id = resourceID as ResourceID;
    const resourceDoc = await this.resources.findOne({ _id: id });

    if (!resourceDoc) {
      throw new Error(`Resource with ID '${resourceID}' not found.`);
    }

    const { _id, ...rest } = resourceDoc;
    return { id: _id, ...rest };
  }

  /**
   * Lists all Resource entries currently stored.
   *
   * @action listResources (): (resources: List<Resource>)
   * @effects Returns a list of all Resource entries currently in the state. If none exist, returns an empty list.
   */
  async listResources(): Promise<{ resources: Resource[] }> {
    const docs = await this.resources.find({}).toArray();
    const resources: Resource[] = docs.map(({ _id, ...rest }) => ({
      id: _id,
      ...rest,
    }));
    return { resources };
  }

  /**
   * Lists all Resource entries owned by the specified owner.
   *
   * @action listResourcesByOwner (owner: Owner): (resources: List<Resource>)
   * @effects Returns a list of all Resource entries where owner matches the provided owner. If none, returns an empty list.
   */
  // Overloads to support both positional and DTO-style invocation
  async listResourcesByOwner(owner: Owner): Promise<{ resources: Resource[] }>;
  async listResourcesByOwner(args: {
    owner: Owner;
  }): Promise<{ resources: Resource[] }>;
  async listResourcesByOwner(
    ownerOrArgs: Owner | { owner: Owner }
  ): Promise<{ resources: Resource[] }> {
    const owner =
      typeof ownerOrArgs === "object" &&
      ownerOrArgs !== null &&
      "owner" in ownerOrArgs
        ? (ownerOrArgs.owner as Owner)
        : (ownerOrArgs as Owner);
    const docs = await this.resources.find({ owner }).toArray();
    const resources: Resource[] = docs.map(({ _id, ...rest }) => ({
      id: _id,
      ...rest,
    }));
    return { resources };
  }
}

export const resource = new ResourceConcept(db);
