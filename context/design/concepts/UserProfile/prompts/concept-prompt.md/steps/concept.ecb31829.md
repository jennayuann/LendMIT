---
timestamp: 'Thu Oct 16 2025 17:45:43 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_174543.7a27b26b.md]]'
content_id: ecb318291bf271a8d6f92bfcce0bd9837a32c8d4b67f58698b673111bfa39161
---

# concept: UserProfile

* **concept**: UserProfile \[User]
* **purpose**: Store mutable, descriptive attributes of a user's profile.
* **principle**: After a user has been identified (e.g., registered), their personal details such as first name, last name, and an optional bio and image can be updated and retrieved, allowing others to see their public persona.
* **state**:
  * a set of `Profiles` with
    * `user` User
    * `firstName` String
    * `lastName` String
    * `bio` String?
    * `thumbnail` Image?
* **actions**:
  * `updateProfile (user: User, firstName: String, lastName: String, bio: String?, thumbnail: Image?): Empty`
    * **requires**: a Profile entry for `user` exists.
    * **effects**: Updates the `firstName`, `lastName`, `bio`, and `thumbnail` for the given `user`. If a Profile entry does not exist, a new one is created.
  * `_getProfile (user: User): (firstName: String, lastName: String, bio: String?, thumbnail: Image?)`
    * **requires**: a Profile entry for `user` exists.
    * **effects**: Returns the `firstName`, `lastName`, `bio`, and `thumbnail` associated with the `user`.
