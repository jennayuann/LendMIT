---
timestamp: 'Mon Oct 20 2025 23:04:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_230425.feb2d63a.md]]'
content_id: 2b223d95f8a817f68bd6f32bdc38b69da5fc97d375a07685839e243f143ba5ae
---

# API Specification: UserAuthentication Concept

**Purpose:** Manage user accounts, including creation, credential management, status, and the email verification process required for full account activation and login.

***

## API Endpoints

### POST /api/UserAuthentication/registerUser

**Description:** Creates a new user account with the provided email and password, returning the new user ID upon success, or an error if the email is already in use.

**Requirements:**

* `email` is unique and not currently associated with any existing `UserAccount` entry (for success).
* `email` is already associated with an existing `UserAccount` entry (for error).

**Effects:**

* Creates a new `user` ID, associates it with `email`, a hashed version of `password`, and sets `status` to `UNVERIFIED`. Returns the newly created `user` ID (for success).
* Returns an `error` message indicating the email is already in use (for error).

**Request Body:**

```json
{
  "email": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "user": "User"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/sendVerificationCode

**Description:** Generates and sends a new verification code to the user's email, replacing any existing codes.

**Requirements:**

* A `UserAccount` exists for `user` with the given `email`, and `status` is `UNVERIFIED`.
* No unexpired `VerificationCodes` exists for `user`.

**Effects:**

* Deletes any existing `VerificationCodes` for `user`.
* Creates a new `VerificationCodes` entry for `user` with a newly generated `code`, and an `expiry` time (e.g., 15 minutes from `currentTime`).

**Request Body:**

```json
{
  "user": "User",
  "email": "String"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/verifyCode

**Description:** Verifies the provided code for the user and activates their account if the code is valid.

**Requirements:**

* An unexpired `VerificationCodes` exists for `user` with a matching `code`.
* The `UserAccount` for `user` exists and `status` is `UNVERIFIED`.

**Effects:**

* If the `requires` condition is met, deletes the matching `VerificationCodes` entry, sets the `status` for the `UserAccount` of `user` to `VERIFIED`, and returns `true`.
* Otherwise, returns `false`.

**Request Body:**

```json
{
  "user": "User",
  "code": "String"
}
```

**Success Response Body (Action):**

```json
{
  "verified": "Boolean"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/login

**Description:** Authenticates a user with the provided email and password, returning the user ID upon success or an error if authentication fails.

**Requirements:**

* A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`, and `status` is `VERIFIED` (for success).
* No `UserAccount` entry exists with `email`, or `passwordHashed` does not match `password`, or `status` is `DEACTIVATED` or `UNVERIFIED` (for error).

**Effects:**

* Returns the `user` ID associated with the matching credentials (for success).
* Returns an `error` message indicating authentication failure (for error).

**Request Body:**

```json
{
  "email": "String",
  "password": "String"
}
```

**Success Response Body (Action):**

```json
{
  "user": "User"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/changePassword

**Description:** Updates the password for a verified user account.

**Requirements:**

* A `UserAccount` entry for `user` exists and `status` is `VERIFIED`.

**Effects:**

* Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.

**Request Body:**

```json
{
  "user": "User",
  "newPassword": "String"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/activateUser

**Description:** Changes a deactivated user's status back to unverified, allowing them to restart the verification process.

**Requirements:**

* A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.

**Effects:**

* Sets the `status` for `user` to `UNVERIFIED`.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/deactivateUser

**Description:** Deactivates an active or unverified user account.

**Requirements:**

* A `UserAccount` entry for `user` exists and `status` is `VERIFIED` or `UNVERIFIED`.

**Effects:**

* Sets the `status` for `user` to `DEACTIVATED`.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/revokeVerification

**Description:** Deletes all verification codes associated with a user, effectively invalidating any pending verification.

**Requirements:**

* One or more `VerificationCodes` entries exist for `user`.

**Effects:**

* Deletes all `VerificationCodes` entries associated with `user`.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/cleanExpiredCodes

**Description:** Automatically deletes all expired verification codes from the system. This is a system-triggered maintenance action.

**Requirements:**

* There are `VerificationCodes` entries where `currentTime >= expiry`.

**Effects:**

* Deletes all `VerificationCodes` entries that have expired.

**Request Body:**

```json
{}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```
