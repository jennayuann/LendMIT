---
timestamp: 'Thu Oct 16 2025 18:04:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_180441.a45fea2d.md]]'
content_id: 88dd6b0468e153d0cd53621662eb3f3577dccb015d2a58a4ab42b0b6fc7c5efb
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
  * `createProfile (user: User, firstName: String, lastName: String, bio: String? = null, thumbnail: String? = null): Empty`
    * **requires**: No `Profile` entry for `user` currently exists.
    * **effects**: Creates a new `Profile` entry for the given `user` with the provided `firstName`, `lastName`, and optional `bio` and `thumbnail`. If `bio` or `thumbnail` are not provided, they are initialized as null.
  * `updateProfile (user: User, firstName: String? = null, lastName: String? = null, bio: String? = null, thumbnail: String? = null): Empty`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Updates the `firstName`, `lastName`, `bio`, and `thumbnail` for the given `user`. Only provided non-null arguments will overwrite existing values. An argument provided as `null` will explicitly clear that attribute. Arguments that are not provided at all will leave the corresponding attribute unchanged.
  * `deleteProfile (user: User): Empty`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Deletes the `Profile` entry associated with the `user`.
  * `getProfile (user: User): (profile: Profile)`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Returns the Profile containing the `firstName`, `lastName`, `bio`, and `thumbnail` associated with the `user`.
