// src/concepts/UserProfile.ts

import { Collection } from "mongodb";
import { db } from "@/db/connection.ts";
import { ID, Empty } from "@/utils/types.ts";

/**
 * @type User
 * The 'User' in the concept specification is the unique identifier for an entity,
 * which is mapped to the `ID` type from our utilities.
 */
type User = ID;

/**
 * @interface Profile
 * Represents a user's profile with descriptive attributes.
 * The `_id` field serves as the primary key for the profile, directly corresponding to the `user` identifier.
 * `bio` and `thumbnail` can be `null` if explicitly cleared or not set.
 */
interface Profile {
  _id: User; // The user ID serves as the primary key for the profile
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  thumbnail: string | null; // URL or identifier for an image
}

/**
 * @concept UserProfile
 * @purpose Manage mutable, descriptive attributes associated with an entity.
 * @principle If a profile is created for an entity identifier, its associated attributes
 *            (such as first name, last name, bio, and thumbnail image) can be independently
 *            updated, retrieved, or removed, providing flexible management of descriptive information.
 */
export class UserProfile {
  private userProfiles: Collection<Profile>;
  // The MongoDB collection name should be the plural form of the concept.
  private readonly collectionName = "userprofiles";

  constructor() {
    this.userProfiles = db.collection<Profile>(this.collectionName);
  }

  /**
   * @action createProfile
   * Creates a new `Profile` entry for the given `user` with the provided attributes.
   * If `bio` or `thumbnail` are not explicitly provided, they are initialized as `null`.
   *
   * @param {Object} args - The arguments for creating a profile.
   * @param {User} args.user - The unique identifier for the user.
   * @param {string} args.firstName - The user's first name.
   * @param {string} args.lastName - The user's last name.
   * @param {string | null} [args.bio=null] - An optional biography for the user. Defaults to `null`.
   * @param {string | null} [args.thumbnail=null] - An optional URL or identifier for the user's thumbnail image. Defaults to `null`.
   * @returns {Promise<Empty>} An empty object upon successful creation.
   *
   * @requires No `Profile` entry for `args.user` currently exists.
   * @effects Creates a new `Profile` entry for the given `user` with the provided attributes.
   * @throws {Error} If a profile for the user already exists.
   */
  async createProfile(args: {
    user: User;
    firstName: string;
    lastName: string;
    bio?: string | null;
    thumbnail?: string | null;
  }): Promise<Empty> {
    const { user, firstName, lastName, bio = null, thumbnail = null } = args;

    // Requires: No Profile entry for user currently exists.
    const existingProfile = await this.userProfiles.findOne({ _id: user });
    if (existingProfile) {
      throw new Error(`UserProfile for user ${user} already exists.`);
    }

    // Effects: Creates a new Profile entry for the given user.
    const newProfile: Profile = {
      _id: user,
      firstName,
      lastName,
      bio,
      thumbnail,
    };
    await this.userProfiles.insertOne(newProfile);
    return {};
  }

  /**
   * @action updateProfile
   * Updates existing attributes of a user's profile.
   * Only provided non-`undefined` arguments will overwrite existing values.
   * An argument provided as `null` will explicitly clear that attribute.
   * Arguments that are not provided at all (`undefined`) will leave the corresponding attribute unchanged.
   *
   * @param {Object} args - The arguments for updating a profile.
   * @param {User} args.user - The unique identifier for the user whose profile is to be updated.
   * @param {string | null | undefined} [args.firstName] - The new first name, or `null` to clear.
   * @param {string | null | undefined} [args.lastName] - The new last name, or `null` to clear.
   * @param {string | null | undefined} [args.bio] - The new biography, or `null` to clear.
   * @param {string | null | undefined} [args.thumbnail] - The new thumbnail URL/identifier, or `null` to clear.
   * @returns {Promise<Empty>} An empty object upon successful update.
   *
   * @requires A `Profile` entry for `args.user` exists.
   * @effects Updates the `firstName`, `lastName`, `bio`, and `thumbnail` for the given `user`.
   * @throws {Error} If no profile for the user exists.
   */
  async updateProfile(args: {
    user: User;
    firstName?: string | null;
    lastName?: string | null;
    bio?: string | null;
    thumbnail?: string | null;
  }): Promise<Empty> {
    const { user, firstName, lastName, bio, thumbnail } = args;

    // Requires: A Profile entry for user exists.
    const existingProfile = await this.userProfiles.findOne({ _id: user });
    if (!existingProfile) {
      throw new Error(`UserProfile for user ${user} does not exist.`);
    }

    // Effects: Updates the profile attributes.
    const updateDoc: { $set: Partial<Omit<Profile, "_id">> } = { $set: {} };

    // Conditionally add fields to $set based on whether they were explicitly provided (not undefined)
    if (firstName !== undefined) {
      updateDoc.$set.firstName = firstName;
    }
    if (lastName !== undefined) {
      updateDoc.$set.lastName = lastName;
    }
    if (bio !== undefined) {
      updateDoc.$set.bio = bio;
    }
    if (thumbnail !== undefined) {
      updateDoc.$set.thumbnail = thumbnail;
    }

    // If no fields are provided for update (all arguments were undefined), do nothing.
    if (Object.keys(updateDoc.$set).length === 0) {
      return {};
    }

    const result = await this.userProfiles.updateOne({ _id: user }, updateDoc);

    // This check provides additional robustness, although the 'requires' condition
    // should ideally prevent `matchedCount === 0`.
    if (result.matchedCount === 0) {
      throw new Error(
        `UserProfile for user ${user} not found during update, despite initial existence check.`,
      );
    }

    return {};
  }

  /**
   * @action deleteProfile
   * Deletes the `Profile` entry associated with the `user`.
   *
   * @param {Object} args - The arguments for deleting a profile.
   * @param {User} args.user - The unique identifier for the user whose profile is to be deleted.
   * @returns {Promise<Empty>} An empty object upon successful deletion.
   *
   * @requires A `Profile` entry for `args.user` exists.
   * @effects Deletes the `Profile` entry associated with the `user`.
   * @throws {Error} If no profile for the user exists.
   */
  async deleteProfile(args: { user: User }): Promise<Empty> {
    const { user } = args;

    // Requires: A Profile entry for user exists.
    const existingProfile = await this.userProfiles.findOne({ _id: user });
    if (!existingProfile) {
      throw new Error(`UserProfile for user ${user} does not exist.`);
    }

    // Effects: Deletes the Profile entry.
    const result = await this.userProfiles.deleteOne({ _id: user });
    if (result.deletedCount === 0) {
      // This should ideally not happen due to the initial findOne check.
      throw new Error(
        `Failed to delete UserProfile for user ${user}, despite initial existence check.`,
      );
    }
    return {};
  }

  /**
   * @action getProfile
   * Returns the `Profile` object containing the `firstName`, `lastName`, `bio`, and `thumbnail`
   * associated with the `user`.
   *
   * @param {Object} args - The arguments for getting a profile.
   * @param {User} args.user - The unique identifier for the user.
   * @returns {Promise<Profile>} The user's profile object.
   *
   * @requires A `Profile` entry for `args.user` exists.
   * @effects Returns the Profile.
   * @throws {Error} If no profile for the user exists.
   */
  async getProfile(args: { user: User }): Promise<Profile> {
    const { user } = args;

    // Requires: A Profile entry for user exists.
    const profile = await this.userProfiles.findOne({ _id: user });
    if (!profile) {
      throw new Error(`UserProfile for user ${user} does not exist.`);
    }

    // Effects: Returns the Profile.
    // The '_id' field of the MongoDB document directly maps to the 'User' type in our Profile interface,
    // satisfying the concept's requirement for returning the 'user' identifier within the profile.
    return profile;
  }
}

// Export the instantiated class following the implementation requirements.
export const userProfile = new UserProfile();
