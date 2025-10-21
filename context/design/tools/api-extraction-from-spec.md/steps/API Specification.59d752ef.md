---
timestamp: 'Tue Oct 21 2025 01:29:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_012946.65e88ab1.md]]'
content_id: 59d752ef621383a5eab68b4451a8cac46f207e28cfffa8248f9e20b3708078ca
---

# API Specification: UserAuthentication Concept

**Purpose:** Manage user accounts, including creation, credential management, status, and the email verification process required for full account activation and login.

***

## API Endpoints

### POST /api/UserAuthentication/registerUser

**Description:** Registers a new user account with a unique email and password, returning the new user ID.

**Requirements:**

* `email` is unique and not currently associated with any existing `UserAccount` entry.

**Effects:**

* Creates a new `user` ID, associates it with `email`, a hashed version of `password`, and sets `status` to `UNVERIFIED`.
* Returns the newly created `user` ID.

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

**Description:** Sends a new verification code to the user's email for an unverified account.

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

**Description:** Verifies a user's account using a provided verification code.

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

**Description:** Authenticates a user with their email and password to log them in.

**Requirements:**

* A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`, and `status` is `VERIFIED`.

**Effects:**

* Returns the `user` ID associated with the matching credentials.

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

**Description:** Allows a verified user to change their account password.

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

**Description:** Reactivates a deactivated user account, returning it to an unverified state.

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

**Description:** Deactivates an active user account.

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

**Description:** Deletes all active verification codes for a specific user.

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

**Description:** System action to delete all expired verification codes.

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
