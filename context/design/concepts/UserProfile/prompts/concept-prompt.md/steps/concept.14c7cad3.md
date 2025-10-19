---
timestamp: 'Thu Oct 16 2025 17:46:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_174616.0fc4aa3d.md]]'
content_id: 14c7cad31b755ec77c55ee96f6f6c6e619e772c9df30cebdc9c0e42999e4a8fb
---

# concept: UserProfile

* **concept**: UserProfile \[User]
* **purpose**: Manage mutable, descriptive attributes of an entity's public persona.
* **principle**: If a profile is created for a given user identifier, then its attributes (such as first name, last name, bio, and thumbnail image) can be independently updated and later retrieved, ensuring that the latest public persona is always available. A profile can also be explicitly removed when no longer needed.
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
* **queries**:
  * `_getProfile (user: User): (firstName: String, lastName: String, bio: String?, thumbnail: String?)`
    * **requires**: A `Profile` entry for `user` exists.
    * **effects**: Returns the `firstName`, `lastName`, `bio`, and `thumbnail` associated with the `user`.

***

**Rationale for Changes:**

1. **Purpose Refinement:**
   * Changed from "user's profile" to "an entity's public persona" and "Store mutable, descriptive attributes" to "Manage mutable, descriptive attributes". This makes it slightly more generic (a profile doesn't *have* to be for a human "user" if the `User` type parameter is instantiated with other kinds of entities) and emphasizes active management rather than just storage.

2. **Principle Refinement (Conceptual Independence):**
   * Removed the phrase "After a user has been identified (e.g., registered)". The `UserProfile` concept should not depend on how a `User` (the generic type parameter) comes into existence or is authenticated. It simply operates on `User` identifiers as polymorphic references.
   * The updated principle now focuses purely on the lifecycle of a profile: creation, update, retrieval, and deletion, demonstrating how the concept fulfills its purpose of managing public personas. It highlights the independent mutability and retrievability.

3. **Actions Refinement (Separation of Concerns and Completeness):**
   * **`createProfile`:** Introduced a dedicated `createProfile` action. This separates the concern of *initializing* a profile from *modifying* an existing one. It also makes the `requires` and `effects` unambiguous.
   * **`updateProfile`:**
     * The `requires` clause now strictly demands that a profile *must* exist for the update to occur, enforcing clear semantics.
     * The arguments `firstName`, `lastName`, `bio`, `thumbnail` are now all `String? = null`, and the effects are carefully worded to support partial updates (i.e., not all fields need to be provided to update; `null` can explicitly clear a field). This provides more granular control and modularity, as you don't need to re-send all profile data for a minor change.
   * **`deleteProfile`:** Added a `deleteProfile` action. This makes the concept complete with respect to the full lifecycle of a profile (create, read, update, delete).
   * **`_getProfile`:** No significant changes needed, as it was already focused. The `requires` clause ensures a profile must exist to be retrieved.

4. **State and Type Interpretation:**
   * Clarified `thumbnail` as `String?` (representing an image URL or identifier) to align with the concept design's guidance on primitives or entity IDs. This ensures the concept state holds data types that are either primitive or generic entity IDs, without implying complex nested objects.

These changes enhance the `UserProfile` concept's adherence to concept design principles, making it more modular, reusable, and independent.
