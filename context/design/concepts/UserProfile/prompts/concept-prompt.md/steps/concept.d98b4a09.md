---
timestamp: 'Thu Oct 16 2025 17:51:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_175133.42188a35.md]]'
content_id: d98b4a0924b43da0cecf80aa0d33ac707bed4222f6322d0fccb5b2c415eb00fa
---

# concept: UserProfile

* **concept**: UserProfile \[User]
* **purpose**: Manage mutable, descriptive attributes associated with an entity.
* **principle**: If a profile is created for an entity identifier, its associated attributes (such as first name, last name, bio, and thumbnail image) can be independently updated, retrieved, or removed, providing flexible management of descriptive information.
* **state**:
  * a set of `Profiles` with
    * `user` User
    * `firstName` String
    * `lastName` String
    * `bio` String?
    * `thumbnail` String? (representing an image URL or identifier)
* **actions**:
  * `createProfile (user: User, firstName: String, lastName: String, bio: String? = null, thumbnail: String? = null): (firstName: String, lastName: String, bio: String?, thumbnail: String?)`
    * **requires**: No `Profile` entry for `user` currently exists.
    * **effects**: Creates a new `Profile` entry for the given `user` with the provided `firstName`, `lastName`, and optional `bio` and `thumbnail`. If `bio` or `thumbnail` are not provided, they are initialized as null. Returns the attributes of the newly created profile.
  * `updateProfile (user: User, firstName: String? = null, lastName: String? = null, bio: String? = null, thumbnail: String? = null): (firstName: String, lastName: String, bio: String?, thumbnail: String?)`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Updates the `firstName`, `lastName`, `bio`, and `thumbnail` for the given `user`. Only provided non-null arguments will overwrite existing values. An argument provided as `null` will explicitly clear that attribute. Arguments that are not provided at all will leave the corresponding attribute unchanged. Returns the updated attributes of the profile.
  * `deleteProfile (user: User): Empty`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Deletes the `Profile` entry associated with the `user`.
  * `getProfile (user: User): (firstName: String, lastName: String, bio: String?, thumbnail: String?)`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Returns the `firstName`, `lastName`, `bio`, and `thumbnail` associated with the `user`.

***

**Summary of Latest Changes:**

* **Returns Profile Attributes:** The `createProfile` and `updateProfile` actions now explicitly return the full set of profile attributes (`firstName`, `lastName`, `bio`, `thumbnail`) upon successful completion. This is consistent with the `getProfile` action's return type and provides valuable feedback to the caller regarding the exact state of the profile after the operation. This aligns with the concept design's allowance for multiple named results, which are treated as fields in a dictionary/JSON object.
