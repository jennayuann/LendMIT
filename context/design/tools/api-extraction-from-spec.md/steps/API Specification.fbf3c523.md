---
timestamp: 'Mon Oct 20 2025 23:05:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_230558.0b5ecab8.md]]'
content_id: fbf3c523799a42bc76befedf5c607feea796450c0b69f4eb0fc02ee5bcb19cea
---

# API Specification: UserProfile Concept

**Purpose:** Manage mutable, descriptive attributes associated with an entity.

***

## API Endpoints

### POST /api/UserProfile/createProfile

**Description:** Creates a new user profile with initial descriptive attributes.

**Requirements:**

* No `Profile` entry for `user` currently exists.

**Effects:**

* Creates a new `Profile` entry for the given `user` with the provided `firstName`, `lastName`, and optional `bio` and `thumbnail`.
* If `bio` or `thumbnail` are not provided, they are initialized as null.

**Request Body:**

```json
{
  "user": "string",
  "firstName": "string",
  "lastName": "string",
  "bio": "string | null",
  "thumbnail": "string | null"
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

### POST /api/UserProfile/updateProfile

**Description:** Updates existing descriptive attributes for a user profile.

**Requirements:**

* A `Profile` entry for `user` exists.

**Effects:**

* Updates the `firstName`, `lastName`, `bio`, and `thumbnail` for the given `user`.
* Only provided non-null arguments will overwrite existing values.
* An argument provided as `null` will explicitly clear that attribute.
* Arguments that are not provided at all will leave the corresponding attribute unchanged.

**Request Body:**

```json
{
  "user": "string",
  "firstName": "string | null",
  "lastName": "string | null",
  "bio": "string | null",
  "thumbnail": "string | null"
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

### POST /api/UserProfile/deleteProfile

**Description:** Deletes a user profile and all its associated attributes.

**Requirements:**

* A `Profile` entry for `user` exists.

**Effects:**

* Deletes the `Profile` entry associated with the `user`.

**Request Body:**

```json
{
  "user": "string"
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

### POST /api/UserProfile/getProfile

**Description:** Retrieves the complete profile information for a specific user.

**Requirements:**

* A `Profile` entry for `user` exists.

**Effects:**

* Returns the Profile containing the `firstName`, `lastName`, `bio`, and `thumbnail` associated with the `user`.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Action):**

```json
{
  "profile": {
    "user": "string",
    "firstName": "string",
    "lastName": "string",
    "bio": "string | null",
    "thumbnail": "string | null"
  }
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
