---
timestamp: 'Thu Oct 16 2025 04:48:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_044815.dfdd94ea.md]]'
content_id: d474b4f90b42158a1c7cafec1a87815bf2eb922af324cda915e3801f3f93ed3f
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
  * `_isFollowing (follower: Follower, followee: Followee): (isFollowing: Boolean)`
    * **requires**: `true`.
    * **effects**: Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.
  * `_getFollowees (follower: Follower): (followeeIDs: Followee[])`
    * **requires**: `true`.
    * **effects**: Returns a list of all `Followee` IDs that the `follower` is following.
  * `_getFollowers (followee: Followee): (followerIDs: Follower[])`
    * **requires**: `true`.
    * **effects**: Returns a list of all `Follower` IDs that are following the `followee`.

***
