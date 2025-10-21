---
timestamp: 'Mon Oct 20 2025 22:33:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_223322.7daefadd.md]]'
content_id: b6b6013585ef0b9fa646eeb0c172c2fc23a49506e305dbf2ebce7ebdd2b91fb9
---

# API Specification: Following Concept

**Purpose:** Establish and manage a unidirectional "following" relationship between any two generic entities.

***

## API Endpoints

### POST /api/Following/follow

**Description:** Initiates a following relationship where a specified follower starts following a specified followee.

**Requirements:**

* No `FollowRelationship` already exists where `follower` follows `followee`.

**Effects:**

* Creates a new `FollowRelationship` entry for `follower` and `followee`.

**Request Body:**

```json
{
  "follower": "{Follower}",
  "followee": "{Followee}"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Following/unfollow

**Description:** Terminates an existing following relationship where a specified follower stops following a specified followee.

**Requirements:**

* A `FollowRelationship` exists where `follower` follows `followee`.

**Effects:**

* Deletes the `FollowRelationship` entry for `follower` and `followee`.

**Request Body:**

```json
{
  "follower": "{Follower}",
  "followee": "{Followee}"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Following/isFollowing

**Description:** Checks whether a specific follower is currently following a specific followee.

**Requirements:**

* true (always allowed)

**Effects:**

* Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.

**Request Body:**

```json
{
  "follower": "{Follower}",
  "followee": "{Followee}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "isFollowing": "{Boolean}"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Following/getFollowees

**Description:** Retrieves a list of all entities that the specified follower is following.

**Requirements:**

* true (always allowed)

**Effects:**

* Returns a list of all `Followee` IDs that the `follower` is following.

**Request Body:**

```json
{
  "follower": "{Follower}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "followeeIDs": [
      "{Followee}",
      "{Followee}"
    ]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Following/getFollowers

**Description:** Retrieves a list of all entities that are following the specified followee.

**Requirements:**

* true (always allowed)

**Effects:**

* Returns a list of all `Follower` IDs that are following the `followee`.

**Request Body:**

```json
{
  "followee": "{Followee}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "followerIDs": [
      "{Follower}",
      "{Follower}"
    ]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```
