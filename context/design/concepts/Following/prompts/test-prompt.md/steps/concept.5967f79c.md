---
timestamp: 'Fri Oct 17 2025 23:08:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_230853.3e51c35c.md]]'
content_id: 5967f79c7d97903b26642721c08a05177277345b93cd950c15c6ada51436a957
---

# concept: Following

* **concept**: Following \[Follower, Followee]
* **purpose**: Establish and manage a unidirectional "following" relationship between any two generic entities.
* **principle**: A follower can choose to initiate a following relationship with a followee, and later terminate it, with the relationship's existence accurately reflected in the system.
* **state**:
  * a set of `FollowRelationships` with
    * `follower` Follower
    * `followee` Followee
* **actions**:
  * `follow (follower: Follower, followee: Followee): Empty`
    * **requires**: No `FollowRelationship` already exists where `follower` follows `followee`.
    * **effects**: Creates a new `FollowRelationship` entry for `follower` and `followee`.
  * `unfollow (follower: Follower, followee: Followee): Empty`
    * **requires**: A `FollowRelationship` exists where `follower` follows `followee`.
    * **effects**: Deletes the `FollowRelationship` entry for `follower` and `followee`.
  * `isFollowing (follower: Follower, followee: Followee): (isFollowing: Boolean)`
    * **effects**: Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.
  * `getFollowees (follower: Follower): (followeeIDs: Followee[])`
    * **effects**: Returns a list of all `Followee` IDs that the `follower` is following.
  * `getFollowers (followee: Followee): (followerIDs: Follower[])`
    * **effects**: Returns a list of all `Follower` IDs that are following the `followee`.

## Implementation of concept to write tests for:

```
// src/concepts/Following.ts

  

// deno-lint-ignore no-import-prefix

import { Collection, Db, MongoServerError } from "npm:mongodb";

import { ID, Empty } from "@/utils/types.ts";

import { freshID } from "@/utils/database.ts"; // Assuming freshID is provided as per guide

import { db } from "@/db/connection.ts"; // Import the pre-established MongoDB connection

  

/**

* @concept Following [Follower, Followee]

* @purpose Establish and manage a unidirectional "following" relationship between any two generic entities.

* @principle A follower can choose to initiate a following relationship with a followee, and later terminate it,

* with the relationship's existence accurately reflected in the system.

*/

  

// Generic types for this concept

type Follower = ID;

type Followee = ID;

  

/**

* Represents a unidirectional following relationship in the database.

* @state a set of FollowRelationships with

* follower Follower

* followee Followee

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
