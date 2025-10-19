# concept: Following

*   **concept**: Following \[Follower, Followee]
*   **purpose**: Establish and manage a unidirectional "following" relationship between any two generic entities.
*   **principle**: A follower can choose to initiate a following relationship with a followee, and later terminate it, with the relationship's existence accurately reflected in the system.
*   **state**:
    *   a set of `FollowRelationships` with
        *   `follower` Follower
        *   `followee` Followee
*   **actions**:
    *   `follow (follower: Follower, followee: Followee): Empty`
        *   **requires**: No `FollowRelationship` already exists where `follower` follows `followee`.
        *   **effects**: Creates a new `FollowRelationship` entry for `follower` and `followee`.
    *   `unfollow (follower: Follower, followee: Followee): Empty`
        *   **requires**: A `FollowRelationship` exists where `follower` follows `followee`.
        *   **effects**: Deletes the `FollowRelationship` entry for `follower` and `followee`.
    *   `isFollowing (follower: Follower, followee: Followee): (isFollowing: Boolean)`
        *   **effects**: Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.
    *   `getFollowees (follower: Follower): (followeeIDs: Followee[])`
        *   **effects**: Returns a list of all `Followee` IDs that the `follower` is following.
    *   `getFollowers (followee: Followee): (followerIDs: Follower[])`
        *   **effects**: Returns a list of all `Follower` IDs that are following the `followee`.