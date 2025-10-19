# Important Background:
[@concept-design-overview](../../../background/concept-design-overview.md)
[@concept-specifications](../../../background/concept-specifications.md)
[@concept-rubric](../../../background/detailed/concept-rubric.md)
[@concept-state](../../../background/detailed/concept-state.md)

# Initial Following Concept:
[@Following](../Following.md)

# Task: Iterate on the Following concept.
- Reference the background I provided above, ensuring the concept matches the rubric. 
- Take out the underscore from the action names.
- Take out the requires clauses for the ones that just say true. Then the requirement is nothing.
# response:

Here is the revised `Following` concept, incorporating your feedback and ensuring alignment with the provided concept design principles:

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