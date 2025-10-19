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
[@UserProfile](../UserProfile.md)
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

## utils/database.ts:
```
// This import loads the `.env` file as environment variables

// deno-lint-ignore no-import-prefix

import "jsr:@std/dotenv/load";

// deno-lint-ignore no-import-prefix

import { Db, MongoClient } from "npm:mongodb";

import { ID } from "@utils/types.ts";

// deno-lint-ignore no-import-prefix

import { generate } from "jsr:@std/uuid/unstable-v7";

  

async function initMongoClient() {

const DB_CONN = Deno.env.get("MONGODB_URL");

if (DB_CONN === undefined) {

throw new Error("Could not find environment variable: MONGODB_URL");

}

const client = new MongoClient(DB_CONN);

try {

await client.connect();

} catch (e) {

throw new Error("MongoDB connection failed: " + e);

}

return client;

}

  

async function init() {

const client = await initMongoClient();

const DB_NAME = Deno.env.get("DB_NAME");

if (DB_NAME === undefined) {

throw new Error("Could not find environment variable: DB_NAME");

}

return [client, DB_NAME] as [MongoClient, string];

}

  

async function dropAllCollections(db: Db): Promise<void> {

try {

// Get all collection names

const collections = await db.listCollections().toArray();

  

// Drop each collection

for (const collection of collections) {

await db.collection(collection.name).drop();

}

} catch (error) {

console.error("Error dropping collections:", error);

throw error;

}

}

  

/**

* MongoDB database configured by .env

* @returns {[Db, MongoClient]} initialized database and client

*/

export async function getDb() {

const [client, DB_NAME] = await init();

return [client.db(DB_NAME), client];

}

  

/**

* Test database initialization

* @returns {[Db, MongoClient]} initialized test database and client

*/

export async function testDb() {

const [client, DB_NAME] = await init();

const test_DB_NAME = `test-${DB_NAME}`;

const test_Db = client.db(test_DB_NAME);

await dropAllCollections(test_Db);

return [test_Db, client] as [Db, MongoClient];

}

  

/**

* Creates a fresh ID.

* @returns {ID} UUID v7 generic ID.

*/

export function freshID() {

return generate() as ID;

}
```

## utils/types.ts:
```
declare const Brand: unique symbol;

  

/**

* Generic ID: effectively a string,

* but uses type branding.

*/

export type ID = string & { [Brand]: true };

  

/**

* Empty record type: enforces no entries.

*/

export type Empty = Record<PropertyKey, never>;
```
## Guide on how to implement concepts:
[@implementing-concepts](../../../background/implementing-concepts.md)
# response:

```typescript
// src/concepts/UserProfile.ts

// Deno does not require extension for @/ imports but the linter might complain if not configured.
// For npm:mongodb, ensure it's "npm:mongodb" as per Deno's npm specifier.
import { Collection } from "npm:mongodb";
import { db } from "@/db/connection.ts"; // Import the connected db instance
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
  firstName: string;
  lastName: string;
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
class UserProfile {
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
    const updateDoc: { $set: Partial<Profile> } = { $set: {} };

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
```