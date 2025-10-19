---
timestamp: 'Thu Oct 16 2025 13:57:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_135735.c866925d.md]]'
content_id: 0203dc3a5f37196df0f418376bc62d633131c5de1a5b5753011e86123a59f6a9
---

# concept: UserAuthentication

* **concept**: UserAuthentication \[User]
* **purpose**: Manage user accounts, including creation, credential management (email, password), status (active/deactivated), and the email verification process required for full account activation and login.
* **principle**: If a user provides a unique email and a password to register, their account is created but marked as unverified. They can then request an email verification code, which is sent to their registered email. If they provide the correct code before it expires, their account is marked as verified, allowing them to log in. If their account is deactivated, or if it remains unverified, they cannot log in until it is reactivated and/or verified.
* **state**:
  * a set of `UserAccounts` with
    * `user` User
    * `email` String
    * `passwordHashed` String
    * `status` of REGISTERED or DEACTIVATED (default `REGISTERED`)
    * `isEmailVerified` Boolean = false (default `false`)
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
