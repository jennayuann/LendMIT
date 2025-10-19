---
timestamp: 'Thu Oct 16 2025 14:10:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_141036.bd27864b.md]]'
content_id: 7d52db37d033f2d8affbb6f5aa9411a17d609e21a5140ec361afe4a06e35ec92
---

# concept: UserAuthentication

* **concept**: UserAuthentication \[User]

* **purpose**: Manage user accounts, including creation, credential management, status, and the email verification process required for full account activation and login.

* **principle**: When a user registers with a unique email and password, their account is created but remains unverified. The system sends a verification code to their email. If they correctly provide this code before it expires, their account becomes verified. Only verified users can log in. A user may later change their password or deactivate their account. A deactivated or verified account cannot be used to authenticate.

* **state**:
  * a set of `UserAccounts` with
    * `user` User
    * `email` String
    * \`password String
    * `status` of VERIFIED or or UNVERIFIED or DEACTIVATED (default `UNVERIFIED`)
  * a set of `EmailVerificationCodes` with
    * `user` User
    * `email` String
    * `code` String
    * `expiry` DateTime

* **actions**:
  * `registerUser (email: String, password: String): (user: User)`
    * **requires**: `email` is unique and not currently associated with any existing `UserAccount` entry.
    * **effects**: Creates a new `user` ID, associates it with `email`, a hashed version of `password`, sets `status` to `REGISTERED`, and `isEmailVerified` to `false`. Returns the newly created `user` ID.
  * `registerUser (email: String, password: String): (error: String)`
    * **requires**: `email` is already associated with an existing `UserAccount` entry.
    * **effects**: Returns an `error` message indicating the email is already in use.
  * `sendVerificationCode (user: User, email: String): Empty`
    * **requires**: A `UserAccount` exists for `user` with the given `email`, `status` is `REGISTERED`, and `isEmailVerified` is `false`. No unexpired `EmailVerificationCode` exists for `user`.
    * **effects**: Deletes any existing `EmailVerificationCode` for `user`. Creates a new `EmailVerificationCode` for `user` with the given `email`, a newly generated `code`, and an `expiry` time (e.g., 15 minutes from `currentTime`).
  * `verifyCode (user: User, code: String): (verified: Boolean)`
    * **requires**: An unexpired `EmailVerificationCode` exists for `user` with a matching `code`. The `UserAccount` for `user` exists, `status` is `REGISTERED`, and `isEmailVerified` is `false`.
    * **effects**: If the `requires` condition is met, deletes the matching `EmailVerificationCode` entry, sets `isEmailVerified = true` for the `UserAccount` of `user`, and returns `true`. Otherwise, returns `false`.
  * `login (email: String, password: String): (user: User)`
    * **requires**: A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`, `status` is `REGISTERED`, AND `isEmailVerified` is `true`.
    * **effects**: Returns the `user` ID associated with the matching credentials.
  * `login (email: String, password: String): (error: String)`
    * **requires**: No `UserAccount` entry exists with `email`, or `passwordHashed` does not match `password`, or `status` is `DEACTIVATED`, or `isEmailVerified` is `false`.
    * **effects**: Returns an `error` message indicating authentication failure.
  * `changePassword (user: User, newPassword: String): Empty`
    * **requires**: A `UserAccount` entry for `user` exists and `status` is `REGISTERED`.
    * **effects**: Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.
  * `activateUser (user: User): Empty`
    * **requires**: A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.
    * **effects**: Sets the `status` for `user` to `REGISTERED`.
  * `deactivateUser (user: User): Empty`
    * **requires**: A `UserAccount` entry for `user` exists and `status` is `REGISTERED`.
    * **effects**: Sets the `status` for `user` to `DEACTIVATED`.
  * `revokeVerification (user: User): Empty`
    * **requires**: One or more `EmailVerificationCode` entries exist for `user`.
    * **effects**: Deletes all `EmailVerificationCode` entries associated with `user`.
  * `system cleanExpiredCodes (): Empty`
    * **requires**: There are `EmailVerificationCode` entries where `currentTime >= expiry`.
    * **effects**: Deletes all `EmailVerificationCode` entries that have expired.

***
