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

// MongoDB collection name, plural form of the concept's state name
const COLLECTION_NAME = "FollowRelationships";

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
      console.log(
        `✅ Index 'follower_followee_unique' ensured for collection '${COLLECTION_NAME}'`,
      );
    } catch (error) {
      console.error(
        `Failed to ensure index 'follower_followee_unique' for collection '${COLLECTION_NAME}':`,
        error,
      );
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
  async getFollowees(args: { follower: Follower }): Promise<{ followeeIDs: Followee[] }>;
  async getFollowees(input: Follower | { follower: Follower }): Promise<{ followeeIDs: Followee[] }> {
    const followerId = typeof input === "string" ? input : input?.follower;
    if (!followerId) throw new Error("Missing follower");

    const followees = await this.followRelationships
      .find({ follower: followerId }, { projection: { followee: 1, _id: 0 } })
      .map((doc) => doc.followee)
      .toArray();

    return { followeeIDs: followees };
  }

  /**
   * Retrieves a list of all Follower IDs that are following the given followee.
   * Accepts either a raw followee ID or a DTO { followee }.
   * @action getFollowers (followee: Followee): (followerIDs: Follower[])
   */
  async getFollowers(followee: Followee): Promise<{ followerIDs: Follower[] }>;
  async getFollowers(args: { followee: Followee }): Promise<{ followerIDs: Follower[] }>;
  async getFollowers(input: Followee | { followee: Followee }): Promise<{ followerIDs: Follower[] }> {
    const followeeId = typeof input === "string" ? input : input?.followee;
    if (!followeeId) throw new Error("Missing followee");

    const followers = await this.followRelationships
      .find({ followee: followeeId }, { projection: { follower: 1, _id: 0 } })
      .map((doc) => doc.follower)
      .toArray();

    return { followerIDs: followers };
  }
}

// Export the instantiated class
export const following = new Following(db);
