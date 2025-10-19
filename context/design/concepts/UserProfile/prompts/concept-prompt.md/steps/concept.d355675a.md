---
timestamp: 'Thu Oct 16 2025 17:56:02 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_175602.9dbfbbab.md]]'
content_id: d355675a90e404343c4e1d2d2ab2760dff4cfeacc45c81efe255f248b311e673
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
  * `createProfile (user: User, firstName: String, lastName: String, bio: String? = null, thumbnail: String? = null): (profile: User)`
    * **requires**: No `Profile` entry for `user` currently exists.
    * **effects**: Creates a new `Profile` entry for the given `user` with the provided `firstName`, `lastName`, and optional `bio` and `thumbnail`. If `bio` or `thumbnail` are not provided, they are initialized as null. Returns the `User` identifier of the newly created profile entry.
  * `updateProfile (user: User, firstName: String? = null, lastName: String? = null, bio: String? = null, thumbnail: String? = null): Empty`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Updates the `firstName`, `lastName`, `bio`, and `thumbnail` for the given `user`. Only provided non-null arguments will overwrite existing values. An argument provided as `null` will explicitly clear that attribute. Arguments that are not provided at all will leave the corresponding attribute unchanged.
  * `deleteProfile (user: User): Empty`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Deletes the `Profile` entry associated with the `user`.
  * `getProfile (user: User): (firstName: String, lastName: String, bio: String?, thumbnail: String?)`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Returns the `firstName`, `lastName`, `bio`, and `thumbnail` associated with the `user`.

***
