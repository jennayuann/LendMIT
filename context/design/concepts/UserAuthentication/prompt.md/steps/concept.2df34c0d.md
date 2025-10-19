---
timestamp: 'Thu Oct 16 2025 13:57:04 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_135704.0b0f0cc3.md]]'
content_id: 2df34c0db27e9ab6ee1e9fdd49b5bc4c2493b7ea09b680a038f49e1d311dade7
---

# concept: EmailVerification

* **concept**: EmailVerification \[User]
* **purpose**: Manage the generation, delivery, and validation of email verification codes for users.
* **principle**: If a user requests an email verification code, a new code is generated and stored with an expiration time; if the user provides the correct code before it expires, their request is marked as verified.
* **state**:
  * a set of `VerificationRequests` with
    * `user` User
    * `email` String
    * `code` String
    * `expiry` DateTime
    * `verified` Flag = false
* **actions**:
  * `sendVerificationCode (user: User, email: String): Empty`
    * **requires**: No active (unexpired and unverified) VerificationRequest exists for `user`.
    * **effects**: Creates a new `VerificationRequest` for `user` with the given `email`, a newly generated `code`, and an `expiry` time (e.g., 15 minutes from `currentTime`).
  * `verifyCode (user: User, code: String): (verified: Boolean)`
    * **requires**: An active (unexpired and unverified) VerificationRequest exists for `user` with a matching `code`.
    * **effects**: If the `requires` condition is met, sets `verified = true` for the matching `VerificationRequest` and returns `true`. Otherwise, returns `false`.
  * `revokeVerification (user: User): Empty`
    * **requires**: One or more VerificationRequest entries exist for `user`.
    * **effects**: Deletes all VerificationRequest entries associated with `user`.
  * `system cleanExpiredVerifications (): Empty`
    * **requires**: There are VerificationRequest entries where `currentTime >= expiry` and `verified` is `false`.
    * **effects**: Deletes all VerificationRequest entries that have expired and are not yet verified.
