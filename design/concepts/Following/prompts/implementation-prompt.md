# Implement the following concept in TypeScript using the Deno platform, following the provided concept specifications.

The concept should be implemented as a class named after the concept (e.g., `UserProfile`, `ResourceStatus`), stored in `src/concepts/<conceptName>.ts`.

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
[@Following](../Following.md)
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
// src/concepts/Following.ts

import { Collection, Db, MongoServerError } from "npm:mongodb";
import { ID, Empty } from "@/utils/types.ts";
import { freshID } from "@/utils/database.ts"; // Assuming freshID is provided as per guide
import { db } from "@/db/connection.ts"; // Import the pre-established MongoDB connection

/**
 * @concept Following [Follower, Followee]
 * @purpose Establish and manage a unidirectional "following" relationship between any two generic entities.
 * @principle A follower can choose to initiate a following relationship with a followee, and later terminate it,
 *            with the relationship's existence accurately reflected in the system.
 */

// Generic types for this concept
type Follower = ID;
type Followee = ID;

/**
 * Represents a unidirectional following relationship in the database.
 * @state a set of FollowRelationships with
 *          follower Follower
 *          followee Followee
 */
interface FollowRelationship {
  _id: ID; // Unique ID for the relationship document itself
  follower: Follower;
  followee: Followee;
}

// MongoDB collection name, plural form of the concept's state name
const COLLECTION_NAME = "followrelationships";

export class Following {
  private followRelationships: Collection<FollowRelationship>;

  constructor(private readonly database: Db) {
    this.followRelationships = this.database.collection(COLLECTION_NAME);
    this._ensureIndexes(); // Ensure necessary indexes are created on initialization
  }

  /**
   * Ensures that the unique compound index for follower-followee relationships exists.
   * This helps enforce the 'requires' condition for the `follow` action at the database level.
   */
  private async _ensureIndexes(): Promise<void> {
    try {
      await this.followRelationships.createIndex(
        { follower: 1, followee: 1 },
        { unique: true, name: "follower_followee_unique" },
      );
      console.log(`✅ Index 'follower_followee_unique' ensured for collection '${COLLECTION_NAME}'`);
    } catch (error) {
      console.error(
        `Failed to ensure index 'follower_followee_unique' for collection '${COLLECTION_NAME}':`,
        error,
      );
      // Depending on the application's robustness needs, you might want to rethrow
      // or handle this more gracefully, but for now, logging is sufficient.
    }
  }

  /**
   * Initiates a following relationship between a follower and a followee.
   * @action follow (follower: Follower, followee: Followee): Empty
   * @requires No `FollowRelationship` already exists where `follower` follows `followee`.
   * @effects Creates a new `FollowRelationship` entry for `follower` and `followee`.
   */
  async follow(
    { follower, followee }: { follower: Follower; followee: Followee },
  ): Promise<Empty> {
    if (follower === followee) {
      throw new Error("Cannot follow yourself.");
    }

    try {
      const newRelationship: FollowRelationship = {
        _id: freshID(), // Generate a unique ID for this relationship document
        follower,
        followee,
      };

      await this.followRelationships.insertOne(newRelationship);
      return {};
    } catch (error) {
      if (
        error instanceof MongoServerError && error.code === 11000 // Duplicate key error
      ) {
        throw new Error(
          `Follower '${follower}' is already following followee '${followee}'.`,
        );
      }
      throw error; // Re-throw other unexpected errors
    }
  }

  /**
   * Terminates an existing following relationship.
   * @action unfollow (follower: Follower, followee: Followee): Empty
   * @requires A `FollowRelationship` exists where `follower` follows `followee`.
   * @effects Deletes the `FollowRelationship` entry for `follower` and `followee`.
   */
  async unfollow(
    { follower, followee }: { follower: Follower; followee: Followee },
  ): Promise<Empty> {
    const result = await this.followRelationships.deleteOne({
      follower,
      followee,
    });

    if (result.deletedCount === 0) {
      throw new Error(
        `No existing follow relationship found between follower '${follower}' and followee '${followee}'.`,
      );
    }

    return {};
  }

  /**
   * Checks if a specific follower is following a specific followee.
   * @action isFollowing (follower: Follower, followee: Followee): (isFollowing: Boolean)
   * @effects Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.
   */
  async isFollowing(
    { follower, followee }: { follower: Follower; followee: Followee },
  ): Promise<{ isFollowing: boolean }> {
    const relationship = await this.followRelationships.findOne(
      { follower, followee },
      { projection: { _id: 1 } }, // Only project _id for efficiency
    );
    return { isFollowing: !!relationship };
  }

  /**
   * Retrieves a list of all Followee IDs that the given follower is following.
   * @action getFollowees (follower: Follower): (followeeIDs: Followee[])
   * @effects Returns a list of all `Followee` IDs that the `follower` is following.
   */
  async getFollowees(
    { follower }: { follower: Follower },
  ): Promise<{ followeeIDs: Followee[] }> {
    const followees = await this.followRelationships.find(
      { follower },
      { projection: { followee: 1, _id: 0 } }, // Project only the followee ID
    ).map((doc) => doc.followee)
      .toArray();

    return { followeeIDs: followees };
  }

  /**
   * Retrieves a list of all Follower IDs that are following the given followee.
   * @action getFollowers (followee: Followee): (followerIDs: Follower[])
   * @effects Returns a list of all `Follower` IDs that are following the `followee`.
   */
  async getFollowers(
    { followee }: { followee: Followee },
  ): Promise<{ followerIDs: Follower[] }> {
    const followers = await this.followRelationships.find(
      { followee },
      { projection: { follower: 1, _id: 0 } }, // Project only the follower ID
    ).map((doc) => doc.follower)
      .toArray();

    return { followerIDs: followers };
  }
}

// Export the instantiated class
export const following = new Following(db);
```

# Iterate upon the above response:
- Try to align the code to the concept spec as closely as possible while keeping functionality correct, such as defining actions as positional arguments 
# response:

To align the implementation more closely with the concept specification's action signatures, particularly regarding positional arguments, I will refactor the method signatures for `follow`, `unfollow`, `isFollowing`, `getFollowees`, and `getFollowers`.

Here's the updated implementation:

```typescript
// src/concepts/Following.ts

import { Collection, Db, MongoServerError } from "npm:mongodb";
import { ID, Empty } from "@/utils/types.ts";
import { freshID } from "@/utils/database.ts"; // Assuming freshID is provided as per guide
import { db } from "@/db/connection.ts"; // Import the pre-established MongoDB connection

/**
 * @concept Following [Follower, Followee]
 * @purpose Establish and manage a unidirectional "following" relationship between any two generic entities.
 * @principle A follower can choose to initiate a following relationship with a followee, and later terminate it,
 *            with the relationship's existence accurately reflected in the system.
 */

// Generic types for this concept
type Follower = ID;
type Followee = ID;

/**
 * Represents a unidirectional following relationship in the database.
 * @state a set of FollowRelationships with
 *          follower Follower
 *          followee Followee
 */
interface FollowRelationship {
  _id: ID; // Unique ID for the relationship document itself
  follower: Follower;
  followee: Followee;
}

// MongoDB collection name, plural form of the concept's state name
const COLLECTION_NAME = "followrelationships";

export class Following {
  private followRelationships: Collection<FollowRelationship>;

  constructor(private readonly database: Db) {
    this.followRelationships = this.database.collection(COLLECTION_NAME);
    this._ensureIndexes(); // Ensure necessary indexes are created on initialization
  }

  /**
   * Ensures that the unique compound index for follower-followee relationships exists.
   * This helps enforce the 'requires' condition for the `follow` action at the database level.
   */
  private async _ensureIndexes(): Promise<void> {
    try {
      await this.followRelationships.createIndex(
        { follower: 1, followee: 1 },
        { unique: true, name: "follower_followee_unique" },
      );
      console.log(`✅ Index 'follower_followee_unique' ensured for collection '${COLLECTION_NAME}'`);
    } catch (error) {
      console.error(
        `Failed to ensure index 'follower_followee_unique' for collection '${COLLECTION_NAME}':`,
        error,
      );
      // Depending on the application's robustness needs, you might want to rethrow
      // or handle this more gracefully, but for now, logging is sufficient.
    }
  }

  /**
   * Initiates a following relationship between a follower and a followee.
   * @action follow (follower: Follower, followee: Followee): Empty
   * @requires No `FollowRelationship` already exists where `follower` follows `followee`.
   * @effects Creates a new `FollowRelationship` entry for `follower` and `followee`.
   */
  async follow(follower: Follower, followee: Followee): Promise<Empty> {
    if (follower === followee) {
      throw new Error("Cannot follow yourself.");
    }

    try {
      const newRelationship: FollowRelationship = {
        _id: freshID(), // Generate a unique ID for this relationship document
        follower,
        followee,
      };

      await this.followRelationships.insertOne(newRelationship);
      return {};
    } catch (error) {
      if (
        error instanceof MongoServerError && error.code === 11000 // Duplicate key error
      ) {
        throw new Error(
          `Follower '${follower}' is already following followee '${followee}'.`,
        );
      }
      throw error; // Re-throw other unexpected errors
    }
  }

  /**
   * Terminates an existing following relationship.
   * @action unfollow (follower: Follower, followee: Followee): Empty
   * @requires A `FollowRelationship` exists where `follower` follows `followee`.
   * @effects Deletes the `FollowRelationship` entry for `follower` and `followee`.
   */
  async unfollow(follower: Follower, followee: Followee): Promise<Empty> {
    const result = await this.followRelationships.deleteOne({
      follower,
      followee,
    });

    if (result.deletedCount === 0) {
      throw new Error(
        `No existing follow relationship found between follower '${follower}' and followee '${followee}'.`,
      );
    }

    return {};
  }

  /**
   * Checks if a specific follower is following a specific followee.
   * @action isFollowing (follower: Follower, followee: Followee): (isFollowing: Boolean)
   * @effects Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.
   */
  async isFollowing(
    follower: Follower,
    followee: Followee,
  ): Promise<{ isFollowing: boolean }> {
    const relationship = await this.followRelationships.findOne(
      { follower, followee },
      { projection: { _id: 1 } }, // Only project _id for efficiency
    );
    return { isFollowing: !!relationship };
  }

  /**
   * Retrieves a list of all Followee IDs that the given follower is following.
   * @action getFollowees (follower: Follower): (followeeIDs: Followee[])
   * @effects Returns a list of all `Followee` IDs that the `follower` is following.
   */
  async getFollowees(follower: Follower): Promise<{ followeeIDs: Followee[] }> {
    const followees = await this.followRelationships.find(
      { follower },
      { projection: { followee: 1, _id: 0 } }, // Project only the followee ID
    ).map((doc) => doc.followee)
      .toArray();

    return { followeeIDs: followees };
  }

  /**
   * Retrieves a list of all Follower IDs that are following the given followee.
   * @action getFollowers (followee: Followee): (followerIDs: Follower[])
   * @effects Returns a list of all `Follower` IDs that are following the `followee`.
   */
  async getFollowers(followee: Followee): Promise<{ followerIDs: Follower[] }> {
    const followers = await this.followRelationships.find(
      { followee },
      { projection: { follower: 1, _id: 0 } }, // Project only the follower ID
    ).map((doc) => doc.follower)
      .toArray();

    return { followerIDs: followers };
  }
}

// Export the instantiated class
export const following = new Following(db);
```