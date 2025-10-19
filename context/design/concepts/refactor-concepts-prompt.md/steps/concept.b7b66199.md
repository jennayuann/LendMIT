---
timestamp: 'Thu Oct 16 2025 04:48:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_044815.dfdd94ea.md]]'
content_id: b7b66199a2a6a0d20c3f98474333aaa09b3acf23595e01456d7cad4e2dd528b9
---

# concept: UserAuthentication

* **concept**: UserAuthentication \[User]
* **purpose**: Manage user credentials (email, password) and core authentication status (registered, deactivated).
* **principle**: If a user provides a unique email and a password to register, they can subsequently log in with those credentials to be authenticated. If their account is deactivated, they cannot log in until it is reactivated.
* **state**:
  * a set of `Credentials` with
    * `user` User
    * `email` String
    * `passwordHashed` String
    * `status` of REGISTERED or DEACTIVATED
* **actions**:
  * `registerUser (email: String, password: String): (user: User)`
    * **requires**: `email` is unique and not currently associated with any existing Credentials entry.
    * **effects**: Creates a new `user` ID, associates it with `email`, a hashed version of `password`, and sets `status` to `REGISTERED`. Returns the newly created `user` ID.
  * `registerUser (email: String, password: String): (error: String)`
    * **requires**: `email` is already associated with an existing Credentials entry.
    * **effects**: Returns an `error` message indicating the email is already in use.
  * `login (email: String, password: String): (user: User)`
    * **requires**: An entry exists with `email`, `passwordHashed` matches `password`, and `status` is `REGISTERED`.
    * **effects**: Returns the `user` ID associated with the matching credentials.
  * `login (email: String, password: String): (error: String)`
    * **requires**: No entry exists with `email`, or `passwordHashed` does not match `password`, or `status` is `DEACTIVATED`.
    * **effects**: Returns an `error` message indicating authentication failure.
  * `changePassword (user: User, newPassword: String): Empty`
    * **requires**: A Credentials entry for `user` exists and `status` is `REGISTERED`.
    * **effects**: Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.
  * `activateUser (user: User): Empty`
    * **requires**: A Credentials entry for `user` exists and `status` is `DEACTIVATED`.
    * **effects**: Sets the `status` for `user` to `REGISTERED`.
  * `deactivateUser (user: User): Empty`
    * **requires**: A Credentials entry for `user` exists and `status` is `REGISTERED`.
    * **effects**: Sets the `status` for `user` to `DEACTIVATED`.

***
