---
timestamp: 'Fri Oct 17 2025 22:12:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_221240.0a89839e.md]]'
content_id: b3367392bf9852747f05bf424f8cd12c143f5f51cff0dd540298442c5af3996f
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
