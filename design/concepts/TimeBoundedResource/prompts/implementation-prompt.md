# Implement the following concept in TypeScript using the Deno platform, following the provided concept specifications.

The concept should be implemented as a class named after the concept, stored in `src/concepts/<conceptName>.ts`.

Each method in the class should correspond to one action in the specification.  

### Each method must:
- Enforce all "requires" conditions and throw a descriptive `Error` when violated.
- Perform the described "effects" accurately using MongoDB operations.
- Return values exactly as specified (e.g., IDs, objects, lists).
- Use async/await for all database interactions.

### Implementation requirements:
1. Use the existing MongoDB connection in `db/connection.ts`, which exports `db` (connection.ts given below).
2. The MongoDB collection name should be the plural form of the concept (e.g., `resources`, `profiles`, `notifications`).
3. Use idiomatic TypeScript types and interfaces to represent the concept’s state (e.g., interfaces for each entity).
4. Throw clear, specific errors when "requires" conditions are not met.
5. Avoid any hard-coded database connection logic; import `db` from `@/db/connection.ts`.
6. At the bottom of the file, export the instantiated class (e.g., `export const userProfile = new UserProfile();`).

### You have access to (all given below):
- The concept specification for this concept.
- The MongoDB connection file located at `src/db/connection.ts` and given below, which exports `db`.
- A guide on how to implement concepts.

Generate the implementation file content for this concept.

## Concept to implement:
[@TimeBoundedResource](../TimeBoundedResource.md)
## db/connection.ts:
```
// src/db/connection.ts

// deno-lint-ignore no-import-prefix

import { MongoClient } from "npm:mongodb";

// deno-lint-ignore no-import-prefix

import "jsr:@std/dotenv/load";

  

const MONGODB_URL = Deno.env.get("MONGODB_URL");

const DB_NAME = Deno.env.get("DB_NAME");

  

if (!MONGODB_URL || !DB_NAME) {

throw new Error("Missing MONGODB_URL or DB_NAME in environment variables");

}

  

const client = new MongoClient(MONGODB_URL);

  

// Connect once and export the database

await client.connect(); // ✅ Establish connection once

console.log(`✅ Connected to MongoDB database: ${DB_NAME}`);

  

export const db = client.db(DB_NAME);
```

## Guide on how to implement concepts:
[@implementing-concepts](../../../background/implementing-concepts.md)
# response:

```typescript
// src/concepts/TimeBoundedResource.ts

import { Collection, Db } from "npm:mongodb";
import { db } from "@/db/connection.ts";
import { ID, Empty } from "@utils/types.ts"; // Assuming @utils/types.ts provides ID and Empty

// MongoDB collection name for this concept
const COLLECTION_NAME = "timeBoundedResources";

// Type alias for ResourceID, based on the generic ID type
type ResourceID = ID;

/**
 * @concept TimeBoundedResource
 * @purpose Manage time-based availability and expiration windows for any generic resource.
 * @principle This concept defines and tracks availability windows for resources with
 *            optional start and end times, corresponding to starting now and available
 *            indefinitely respectively. It can report a resource's current window and
 *            signals when a resource's availability has ended.
 *
 * @state
 * A set of `TimeWindow` entries, each consisting of:
 *   `resource`: ResourceID
 *   `availableFrom`: DateTime? (null implies available starting now)
 *   `availableUntil`: DateTime? (null implies indefinitely available into the future)
 */
interface TimeWindow {
  _id: ResourceID; // The resource ID serves as the primary key for the time window document
  resource: ResourceID; // Explicitly store resource ID as per state description
  availableFrom: Date | null;
  availableUntil: Date | null;
}

export class TimeBoundedResource {
  private collection: Collection<TimeWindow>;

  constructor(private readonly db: Db) {
    this.collection = this.db.collection<TimeWindow>(COLLECTION_NAME);
  }

  /**
   * Defines or updates a time window for a given resource.
   *
   * @action defineTimeWindow
   * @param {object} params - The parameters for defining the time window.
   * @param {ResourceID} params.resource - The ID of the resource.
   * @param {Date | null} params.availableFrom - The start date/time for availability.
   *                                             If null, the resource is available starting now.
   * @param {Date | null} params.availableUntil - The end date/time for availability.
   *                                               If null, the resource is available indefinitely.
   * @returns {Promise<Empty>} An empty object indicating success.
   *
   * @requires If both `availableFrom` and `availableUntil` are provided (non-null),
   *           then `availableFrom` must be strictly earlier than `availableUntil`.
   *
   * @effects Creates a new `TimeWindow` entry for the given `resource` or updates an existing one
   *          with the specified availability bounds. If `availableFrom` is not provided (null),
   *          then it's set to the current time. If `availableUntil` is not provided (null),
   *          then it's stored as null to indicate indefinite availability.
   */
  async defineTimeWindow(
    { resource, availableFrom, availableUntil }: {
      resource: ResourceID;
      availableFrom: Date | null;
      availableUntil: Date | null;
    },
  ): Promise<Empty> {
    // Requires: If both availableFrom and availableUntil are provided (non-null),
    // then availableFrom must be strictly earlier than availableUntil.
    if (availableFrom instanceof Date && availableUntil instanceof Date) {
      if (availableFrom.getTime() >= availableUntil.getTime()) {
        throw new Error(
          "Validation Error: 'availableFrom' must be strictly earlier than 'availableUntil'.",
        );
      }
    }

    const now = new Date();
    // If availableFrom is null in the input, it means "starting now". Store the actual current time.
    const finalAvailableFrom = availableFrom === null ? now : availableFrom;
    // If availableUntil is null in the input, it means "indefinitely". Store null.
    const finalAvailableUntil = availableUntil;

    const filter = { _id: resource };
    const update = {
      $set: {
        resource: resource,
        availableFrom: finalAvailableFrom,
        availableUntil: finalAvailableUntil,
      },
    };
    const options = { upsert: true }; // Create a new document if one does not exist

    await this.collection.updateOne(filter, update, options);

    return {};
  }

  /**
   * Retrieves the time window for a specified resource.
   *
   * @action getTimeWindow
   * @param {object} params - The parameters for getting the time window.
   * @param {ResourceID} params.resource - The ID of the resource.
   * @returns {Promise<TimeWindow | null>} The `TimeWindow` entry for the resource,
   *                                       or `null` if no time window is defined for it.
   *
   * @effects Returns the `TimeWindow` entry for the specified `resource`, containing its
   *          `resource` ID, `availableFrom`, and `availableUntil` times.
   *          Returns `null` if no time window is defined for the resource.
   */
  async getTimeWindow(
    { resource }: { resource: ResourceID },
  ): Promise<TimeWindow | null> {
    // MongoDB returns Date objects directly from the BSON Date type, which fits the `Date | null` interface.
    // The `_id` will also be present in the returned document, conforming to the `TimeWindow` interface.
    const timeWindow = await this.collection.findOne({ _id: resource });
    return timeWindow;
  }

  /**
   * Signals that a resource's time-bound availability has ended. This action serves
   * as an event notification and does not alter the state within this concept.
   *
   * @action expireResource
   * @param {object} params - The parameters for expiring the resource.
   * @param {ResourceID} params.resource - The ID of the resource.
   * @returns {Promise<Empty>} An empty object indicating the successful signaling of expiration.
   *
   * @requires A `TimeWindow` entry must exist for the specified `resource`.
   * @requires The `availableUntil` for that `resource` must be defined (non-null).
   * @requires The `currentTime` (the moment this action is triggered) must be greater than
   *           or equal to the `availableUntil` value for the `resource`.
   *
   * @effects This action explicitly changes no state within this concept. Its occurrence
   *          signals to other concepts (via synchronization) that the resource's time-bound
   *          availability (as defined by its `availableUntil` property) has ended.
   */
  async expireResource({ resource }: { resource: ResourceID }): Promise<Empty> {
    const timeWindow = await this.collection.findOne({ _id: resource });
    const currentTime = new Date();

    // Requires: A TimeWindow entry exists for resource.
    if (!timeWindow) {
      throw new Error(
        `Validation Error: No TimeWindow entry found for resource '${resource}'.`,
      );
    }

    // Requires: The availableUntil for that resource is defined (non-null).
    if (timeWindow.availableUntil === null) {
      throw new Error(
        `Validation Error: 'availableUntil' is not defined (null) for resource '${resource}'. ` +
          "Cannot expire an indefinitely available resource through this action.",
      );
    }

    // Requires: The currentTime is greater than or equal to the availableUntil value.
    if (currentTime.getTime() < timeWindow.availableUntil.getTime()) {
      throw new Error(
        `Validation Error: Current time (${currentTime.toISOString()}) is earlier than ` +
          `'availableUntil' (${timeWindow.availableUntil.toISOString()}) for resource '${resource}'. ` +
          "Resource is not yet expired.",
      );
    }

    // Effects: This action explicitly changes no state within this concept.
    // Its sole purpose is to serve as an event notification.

    return {};
  }
}

// Export an instantiated class to be used by other parts of the application.
export const timeBoundedResource = new TimeBoundedResource(db);
```