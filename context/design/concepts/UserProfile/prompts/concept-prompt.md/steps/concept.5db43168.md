---
timestamp: 'Thu Oct 16 2025 17:51:17 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_175117.e01676bd.md]]'
content_id: 5db43168db6485359b179ea80df806e5baef8a5159491add1837853e6d0d1f17
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
  * `getProfile (user: User): (firstName: String, lastName: String, bio: String?, thumbnail: String?)`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Returns the `firstName`, `lastName`, `bio`, and `thumbnail` associated with the `user`.

***

**Summary of Latest Changes:**

1. **Generality in Purpose and Principle:**
   * Removed "public persona" from both `purpose` and `principle` to make the concept more generally applicable to any entity, not just human users with public profiles. The focus is now purely on managing descriptive attributes.
2. **Query as Action:**
   * The `_getProfile` query has been moved into the `actions` section and renamed to `getProfile`. This treats retrieval as a standard action, aligning with the idea that all interactions, even reads, form part of the behavioral protocol of the concept.

***
