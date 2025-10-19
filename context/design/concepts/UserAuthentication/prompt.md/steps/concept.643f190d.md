---
timestamp: 'Thu Oct 16 2025 13:57:04 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_135704.0b0f0cc3.md]]'
content_id: 643f190dde71fb83226bf435904507caeb7df281f1487e1a884c1182aa45471a
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

## EmailVerification Concept
