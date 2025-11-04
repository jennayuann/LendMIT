// src/concepts/Following.ts

import { Collection, Db, MongoServerError } from "mongodb";
import { Empty, ID } from "@/utils/types.ts";
import { freshID } from "@/utils/database.ts";
import { db } from "@/db/connection.ts";

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

// Primary collection used in production deployments (historically camel-cased).
const COLLECTION_NAME = "FollowRelationships";
// Legacy collection name kept for backward compatibility with earlier builds/tests.
const LEGACY_COLLECTION_NAME: string | null = "followrelationships";

export const FOLLOW_RELATIONSHIPS_COLLECTION = COLLECTION_NAME;

export class Following {
  private followRelationships: Collection<FollowRelationship>;
  private legacyFollowRelationships?: Collection<FollowRelationship>;
  private readonly ready: Promise<void>;

  constructor(private readonly database: Db) {
    this.followRelationships = this.database.collection(COLLECTION_NAME);
    if (LEGACY_COLLECTION_NAME && LEGACY_COLLECTION_NAME !== COLLECTION_NAME) {
      this.legacyFollowRelationships = this.database.collection(
        LEGACY_COLLECTION_NAME
      );
    }

    this.ready = this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.ensureIndexes(this.followRelationships, COLLECTION_NAME);
    if (!this.legacyFollowRelationships) return;
    await this.migrateLegacyCollection();
  }

  /**
   * Ensures that the unique compound index for follower-followee relationships exists
   * on the provided collection.
   */
  private async ensureIndexes(
    collection: Collection<FollowRelationship>,
    label: string
  ): Promise<void> {
    try {
      await collection.createIndex(
        { follower: 1, followee: 1 },
        { unique: true, name: "follower_followee_unique" }
      );
      console.log(
        `✅ Index 'follower_followee_unique' ensured for collection '${label}'`
      );
    } catch (error) {
      console.error(
        `Failed to ensure index 'follower_followee_unique' for collection '${label}':`,
        error
      );
    }
  }

  private async migrateLegacyCollection(): Promise<void> {
    const legacy = this.legacyFollowRelationships;
    if (!legacy) return;

    try {
      let migratedAny = false;
      const cursor = legacy.find(
        {},
        {
          projection: { _id: 1, follower: 1, followee: 1 },
        }
      );

      for await (const doc of cursor) {
        if (!doc) continue;
        migratedAny = true;
        await this.followRelationships.updateOne(
          { follower: doc.follower, followee: doc.followee },
          {
            $setOnInsert: {
              _id: doc._id ?? freshID(),
              follower: doc.follower,
              followee: doc.followee,
            },
          },
          { upsert: true }
        );
      }

      if (migratedAny) {
        try {
          await legacy.drop();
          console.log(
            `✅ Migrated legacy '${LEGACY_COLLECTION_NAME}' collection to '${COLLECTION_NAME}'.`
          );
          this.legacyFollowRelationships = undefined;
        } catch (dropError) {
          console.warn(
            `Following: unable to drop legacy collection '${LEGACY_COLLECTION_NAME}':`,
            dropError
          );
        }
      }
    } catch (error) {
      console.warn(
        "Following: failed to migrate legacy follow relationships collection:",
        error
      );
    }
  }

  /**
   * Initiates a following relationship between a follower and a followee.
   * @action follow (follower: Follower, followee: Followee): Empty
   * @requires No `FollowRelationship` already exists where `follower` follows `followee`.
   * @effects Creates a new `FollowRelationship` entry for `follower` and `followee`.
   */
  async follow(
    followerOrArgs: Follower | { follower: Follower; followee: Followee },
    followeeMaybe?: Followee
  ): Promise<Empty> {
    await this.ready;
    const followerSource =
      typeof followerOrArgs === "object" &&
      followerOrArgs !== null &&
      "follower" in followerOrArgs
        ? followerOrArgs.follower
        : followerOrArgs;
    const followeeSource =
      typeof followerOrArgs === "object" &&
      followerOrArgs !== null &&
      "followee" in followerOrArgs
        ? followerOrArgs.followee
        : followeeMaybe;
    const follower = followerSource as Follower | undefined;
    const followee = followeeSource as Followee | undefined;

    console.log(`[Following] follow requested: ${follower} -> ${followee}`);
    if (follower === undefined || follower === null) {
      throw new Error("Follower is required.");
    }
    if (followee === undefined || followee === null) {
      throw new Error("Followee is required.");
    }
    if (follower === followee) {
      throw new Error("Cannot follow yourself.");
    }

    try {
      const newRelationship: FollowRelationship = {
        _id: freshID(), // Generate a unique ID for this relationship document
        follower,
        followee,
      };

      const result = await this.followRelationships.insertOne(newRelationship);
      if (!result.acknowledged) {
        throw new Error("Failed to persist follow relationship.");
      }
      console.log(
        `[Following] follow persisted: insertedId=${String(result.insertedId)}`
      );
      if (this.legacyFollowRelationships) {
        await this.legacyFollowRelationships.deleteMany({ follower, followee });
      }
      return {};
    } catch (error) {
      if (
        error instanceof MongoServerError &&
        error.code === 11000 // Duplicate key error
      ) {
        throw new Error(
          `Follower '${follower}' is already following followee '${followee}'.`
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
    followerOrArgs: Follower | { follower: Follower; followee: Followee },
    followeeMaybe?: Followee
  ): Promise<Empty> {
    await this.ready;
    const followerSource =
      typeof followerOrArgs === "object" &&
      followerOrArgs !== null &&
      "follower" in followerOrArgs
        ? followerOrArgs.follower
        : followerOrArgs;
    const followeeSource =
      typeof followerOrArgs === "object" &&
      followerOrArgs !== null &&
      "followee" in followerOrArgs
        ? followerOrArgs.followee
        : followeeMaybe;
    const follower = followerSource as Follower | undefined;
    const followee = followeeSource as Followee | undefined;
    if (follower === undefined || follower === null) {
      throw new Error("Follower is required.");
    }
    if (followee === undefined || followee === null) {
      throw new Error("Followee is required.");
    }
    let result = await this.followRelationships.deleteOne({
      follower,
      followee,
    });

    if (result.deletedCount === 0 && this.legacyFollowRelationships) {
      result = await this.legacyFollowRelationships.deleteOne({
        follower,
        followee,
      });
    }

    if (result.deletedCount === 0) {
      throw new Error(
        `No existing follow relationship found between follower '${follower}' and followee '${followee}'.`
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
    followerOrArgs: Follower | { follower: Follower; followee: Followee },
    followeeMaybe?: Followee
  ): Promise<{ isFollowing: boolean }> {
    await this.ready;
    const followerSource =
      typeof followerOrArgs === "object" &&
      followerOrArgs !== null &&
      "follower" in followerOrArgs
        ? followerOrArgs.follower
        : followerOrArgs;
    const followeeSource =
      typeof followerOrArgs === "object" &&
      followerOrArgs !== null &&
      "followee" in followerOrArgs
        ? followerOrArgs.followee
        : followeeMaybe;
    const follower = followerSource as Follower | undefined;
    const followee = followeeSource as Followee | undefined;
    if (follower === undefined || follower === null) {
      throw new Error("Follower is required.");
    }
    if (followee === undefined || followee === null) {
      throw new Error("Followee is required.");
    }
    const relationship = await this.followRelationships.findOne(
      { follower, followee },
      { projection: { _id: 1 } } // Only project _id for efficiency
    );
    if (relationship) return { isFollowing: true };

    if (this.legacyFollowRelationships) {
      const legacy = await this.legacyFollowRelationships.findOne(
        { follower, followee },
        { projection: { _id: 1 } }
      );
      if (legacy) return { isFollowing: true };
    }

    return { isFollowing: false };
  }

  // /**
  //  * Retrieves a list of all Followee IDs that the given follower is following.
  //  * @action getFollowees (follower: Follower): (followeeIDs: Followee[])
  //  * @effects Returns a list of all `Followee` IDs that the `follower` is following.
  //  */
  // async getFollowees(follower: Follower): Promise<{ followeeIDs: Followee[] }> {
  //   const followees = await this.followRelationships.find(
  //     { follower },
  //     { projection: { followee: 1, _id: 0 } }, // Project only the followee ID
  //   ).map((doc) => doc.followee)
  //     .toArray();

  //   return { followeeIDs: followees };
  // }

  // /**
  //  * Retrieves a list of all Follower IDs that are following the given followee.
  //  * @action getFollowers (followee: Followee): (followerIDs: Follower[])
  //  * @effects Returns a list of all `Follower` IDs that are following the `followee`.
  //  */
  // async getFollowers(followee: Followee): Promise<{ followerIDs: Follower[] }> {
  //   const followers = await this.followRelationships.find(
  //     { followee },
  //     { projection: { follower: 1, _id: 0 } }, // Project only the follower ID
  //   ).map((doc) => doc.follower)
  //     .toArray();

  //   return { followerIDs: followers };
  // }

  /**
   * Retrieves a list of all Followee IDs that the given follower is following.
   * Accepts either a raw follower ID or a DTO { follower }.
   * @action getFollowees (follower: Follower): (followeeIDs: Followee[])
   */
  async getFollowees(follower: Follower): Promise<{ followeeIDs: Followee[] }>;
  async getFollowees(args: {
    follower: Follower;
  }): Promise<{ followeeIDs: Followee[] }>;
  async getFollowees(
    input: Follower | { follower: Follower }
  ): Promise<{ followeeIDs: Followee[] }> {
    await this.ready;
    const followerId = typeof input === "string" ? input : input?.follower;
    if (!followerId) throw new Error("Missing follower");

    const followees = await this.followRelationships
      .find({ follower: followerId }, { projection: { followee: 1, _id: 0 } })
      .map((doc) => doc.followee)
      .toArray();
    const followeeSet = new Set(followees);

    if (this.legacyFollowRelationships) {
      const legacyFollowees = await this.legacyFollowRelationships
        .find(
          { follower: followerId },
          {
            projection: { followee: 1, _id: 0 },
          }
        )
        .map((doc) => doc.followee)
        .toArray();
      for (const legacyFollowee of legacyFollowees) {
        followeeSet.add(legacyFollowee);
      }
    }

    const followeeIDs = Array.from(followeeSet);
    console.log(
      `[Following] getFollowees result for ${followerId}: [${followeeIDs.join(
        ", "
      )}].`
    );
    return { followeeIDs };
  }

  /**
   * Retrieves a list of all Follower IDs that are following the given followee.
   * Accepts either a raw followee ID or a DTO { followee }.
   * @action getFollowers (followee: Followee): (followerIDs: Follower[])
   */
  async getFollowers(followee: Followee): Promise<{ followerIDs: Follower[] }>;
  async getFollowers(args: {
    followee: Followee;
  }): Promise<{ followerIDs: Follower[] }>;
  async getFollowers(
    input: Followee | { followee: Followee }
  ): Promise<{ followerIDs: Follower[] }> {
    await this.ready;
    const followeeId = typeof input === "string" ? input : input?.followee;
    if (!followeeId) throw new Error("Missing followee");

    const followers = await this.followRelationships
      .find({ followee: followeeId }, { projection: { follower: 1, _id: 0 } })
      .map((doc) => doc.follower)
      .toArray();
    const followerSet = new Set(followers);

    if (this.legacyFollowRelationships) {
      const legacyFollowers = await this.legacyFollowRelationships
        .find(
          { followee: followeeId },
          {
            projection: { follower: 1, _id: 0 },
          }
        )
        .map((doc) => doc.follower)
        .toArray();
      for (const legacyFollower of legacyFollowers) {
        followerSet.add(legacyFollower);
      }
    }

    const followerIDs = Array.from(followerSet);
    console.log(
      `[Following] getFollowers result for ${followeeId}: [${followerIDs.join(
        ", "
      )}].`
    );
    return { followerIDs };
  }
}

// Export the instantiated class
export const following = new Following(db);
