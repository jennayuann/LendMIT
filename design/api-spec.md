# API Specification: Following Concept

**Purpose:** Establish and manage a unidirectional "following" relationship between any two generic entities.

***

## API Endpoints

### POST /api/Following/follow

**Description:** Initiates a following relationship where a specified follower starts following a specified followee.

**Requirements:**

* No `FollowRelationship` already exists where `follower` follows `followee`.

**Effects:**

* Creates a new `FollowRelationship` entry for `follower` and `followee`.

**Request Body:**

```json
{
  "follower": "{Follower}",
  "followee": "{Followee}"
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

### POST /api/UserAuthentication/getEmail

**Description:** Retrieves the email address associated with a given user ID.

**Requirements:**
- A `UserAccount` entry for `user` exists.

**Effects:**
- Returns the `email` for the specified `user`.

**Request Body:**
```json
{
  "user": "User"
}
```

**Success Response Body (Action):**
```json
{
  "email": "String"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Following/unfollow

**Description:** Terminates an existing following relationship where a specified follower stops following a specified followee.

**Requirements:**

* A `FollowRelationship` exists where `follower` follows `followee`.

**Effects:**

* Deletes the `FollowRelationship` entry for `follower` and `followee`.

**Request Body:**

```json
{
  "follower": "{Follower}",
  "followee": "{Followee}"
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

### POST /api/Following/isFollowing

**Description:** Checks whether a specific follower is currently following a specific followee.

**Requirements:**

* true (always allowed)

**Effects:**

* Returns `true` if a `FollowRelationship` exists where `follower` follows `followee`, `false` otherwise.

**Request Body:**

```json
{
  "follower": "{Follower}",
  "followee": "{Followee}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "isFollowing": "{Boolean}"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Following/getFollowees

**Description:** Retrieves a list of all entities that the specified follower is following.

**Requirements:**

* true (always allowed)

**Effects:**

* Returns a list of all `Followee` IDs that the `follower` is following.

**Request Body:**

```json
{
  "follower": "{Follower}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "followeeIDs": [
      "{Followee}",
      "{Followee}"
    ]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Following/getFollowers

**Description:** Retrieves a list of all entities that are following the specified followee.

**Requirements:**

* true (always allowed)

**Effects:**

* Returns a list of all `Follower` IDs that are following the `followee`.

**Request Body:**

```json
{
  "followee": "{Followee}"
}
```

**Success Response Body (Query):**

```json
[
  {
    "followerIDs": [
      "{Follower}",
      "{Follower}"
    ]
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```


# API Specification: NotificationLog Concept

**Purpose:** Log, manage, and track the status of generic event-driven alerts or messages for recipients.

***

## API Endpoints

### POST /api/NotificationLog/logNotification

**Description:** Logs a new generic notification for a recipient, recording its content and timestamp.

**Requirements:**

* None explicitly stated (precondition is `true`). The action handles `content` validation internally.

**Effects:**

* If `content` is a well-formed JSON string: Creates a new `Notification` entry with a unique `id`, the `recipient`, the `content` string, `sentAt = currentTime`, and `deliveredFlag = false`. Returns the `id` of the new notification.
* If `content` is not a well-formed JSON string: Returns an `error` message indicating an invalid `content`.

**Request Body:**

```json
{
  "recipient": "Recipient",
  "content": "JSON"
}
```

**Success Response Body (Action):**

```json
{
  "notificationID": "NotificationID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/NotificationLog/markAsDelivered

**Description:** Marks an existing notification as delivered.

**Requirements:**

* A `Notification` entry with `id = notificationID` exists and `deliveredFlag` is `false`.

**Effects:**

* Sets `deliveredFlag = true` for the `notificationID`.

**Request Body:**

```json
{
  "notificationID": "NotificationID"
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

### POST /api/NotificationLog/dismissNotification

**Description:** Marks an existing notification as dismissed.

**Requirements:**

* A `Notification` entry with `id = notificationID` exists and `dismissedAt` is not set.

**Effects:**

* Sets `dismissedAt = currentTime` for the `notificationID`.

**Request Body:**

```json
{
  "notificationID": "NotificationID"
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

### POST /api/NotificationLog/clearDismissedNotifications

**Description:** Permanently clears all dismissed notifications for a given recipient.

**Requirements:**

* None explicitly stated (precondition is `true`).

**Effects:**

* Deletes all `Notification` entries for the given `recipient` where `dismissedAt` is set.

**Request Body:**

```json
{
  "recipient": "Recipient"
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

### POST /api/NotificationLog/getNotifications

**Description:** Retrieves a list of notification IDs for a recipient, optionally filtered by delivery and dismissal status.

**Requirements:**

* None explicitly stated (precondition is `true`).

**Effects:**

* Returns a list of `NotificationID`s for the given `recipient` that satisfy all provided filter conditions:
  * Notifications must match the `delivered` filter: if `delivered` is `true`, `deliveredFlag` must be `true`; if `delivered` is `false`, `deliveredFlag` must be `false`. No filter is applied if `delivered` is `null`.
  * Notifications must also match the `dismissed` filter: if `dismissed` is `true`, `dismissedAt` must not be `null`; if `dismissed` is `false`, `dismissedAt` must be `null`. No filter is applied if `dismissed` is `null`.

**Request Body:**

```json
{
  "recipient": "Recipient",
  "delivered": "Boolean | null",
  "dismissed": "Boolean | null"
}
```

**Success Response Body (Query):**

```json
[
  {
    "notificationIDs": "NotificationID[]"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

# API Specification: Resource Concept

**Purpose:** Represent any generic entity that can be owned and described by a mandatory name and optional attributes.

---

## API Endpoints

### POST /api/Resource/createResource

**Description:** Creates a new resource with an owner, name, and optional category and description.

**Requirements:**
- `name is not an empty string`.

**Effects:**
- Creates a new `Resource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`.
- Returns the `id` of the newly created resource.

**Request Body:**
```json
{
  "owner": "string",
  "name": "string",
  "category": "string | null",
  "description": "string | null"
}
```

**Success Response Body (Action):**
```json
{
  "resourceID": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Resource/updateResource

**Description:** Modifies the name, category, or description of an existing resource.

**Requirements:**
- A `Resource` entry with `id = resourceID` exists.
- If `name` is provided (i.e., not `null`), `name is not an empty string`.

**Effects:**
- If `name` is provided and is not an empty string, updates the `name` for the given `resourceID`.
- If `category` is provided, updates the `category` for the given `resourceID`. If `null` is provided, it clears the existing `category`.
- If `description` is provided, updates the `description` for the given `resourceID`. If `null` is provided, it clears the existing `description`.

**Request Body:**
```json
{
  "resourceID": "string",
  "name": "string | null",
  "category": "string | null",
  "description": "string | null"
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

---

### POST /api/Resource/deleteResource

**Description:** Deletes an existing resource.

**Requirements:**
- A `Resource` entry with `id = resourceID` exists.

**Effects:**
- Deletes the `Resource` entry corresponding to `resourceID`.

**Request Body:**
```json
{
  "resourceID": "string"
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

---

### POST /api/Resource/getResource

**Description:** Retrieves the details of a specific resource.

**Requirements:**
- A `Resource` entry with `id = resourceID` exists.

**Effects:**
- Returns the complete `Resource` object associated with this `resourceID`.

**Request Body:**
```json
{
  "resourceID": "string"
}
```

**Success Response Body (Action):**
```json
{
  "resource": {
    "id": "string",
    "owner": "string",
    "name": "string",
    "category": "string | null",
    "description": "string | null"
  }
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Resource/listResources

**Description:** Retrieves a list of all resources currently available.

**Requirements:**
- true

**Effects:**
- Returns a list of all `Resource` entries currently in the `state`.
- If no resources exist, an empty list is returned.

**Request Body:**
```json
{}
```

**Success Response Body (Action):**
```json
{
  "resources": [
    {
      "id": "string",
      "owner": "string",
      "name": "string",
      "category": "string | null",
      "description": "string | null"
    }
  ]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/Resource/listResourcesByOwner

**Description:** Retrieves a list of resources owned by a specific owner.

**Requirements:**
- true

**Effects:**
- Returns a list of all `Resource` entries where the `owner` matches the provided `owner` parameter.
- If the specified owner has no resources, an empty list is returned.

**Request Body:**
```json
{
  "owner": "string"
}
```

**Success Response Body (Action):**
```json
{
  "resources": [
    {
      "id": "string",
      "owner": "string",
      "name": "string",
      "category": "string | null",
      "description": "string | null"
    }
  ]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
``````

***

# API Specification: ResourceIntent Concept

**Purpose:** Associate any resource with an intent.

---

## API Endpoints

### POST /api/ResourceIntent/defineIntent

**Description:** Defines a new intent label, making it available for use.

**Requirements:**
- No `IntentDefinition` with `intentName` exists.

**Effects:**
- Adds `intentName` to `IntentDefinitions`.

**Request Body:**
```json
{
  "intentName": "string"
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

---

### POST /api/ResourceIntent/undefineIntent

**Description:** Removes an existing intent label, provided it's not currently in use by any resource.

**Requirements:**
- An `IntentDefinition` for `intentName` exists.
- No `IntentEntry` uses `intentName`.

**Effects:**
- Removes `intentName` from `IntentDefinitions`.

**Request Body:**
```json
{
  "intentName": "string"
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

---

### POST /api/ResourceIntent/setIntent

**Description:** Associates a specific intent label with a given resource, creating or updating the association.

**Requirements:**
- `intent` must be a defined `IntentDefinition`.

**Effects:**
- Creates or updates the `IntentEntry` for `resource` with `intent`.

**Request Body:**
```json
{
  "resource": "ResourceID",
  "intent": "string"
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

---

### POST /api/ResourceIntent/clearIntent

**Description:** Removes any intent label associated with a specified resource.

**Requirements:**
- An `IntentEntry` for `resource` exists.

**Effects:**
- Removes the `IntentEntry` for `resource`.

**Request Body:**
```json
{
  "resource": "ResourceID"
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

---

### POST /api/ResourceIntent/getIntent

**Description:** Retrieves the intent label currently associated with a specified resource.

**Requirements:**
- (None)

**Effects:**
- Returns the `IntentEntry` for `resource`, or `Null` if none exists.

**Request Body:**
```json
{
  "resource": "ResourceID"
}
```

**Success Response Body (Query):**
```json
[
  {
    "resource": "ResourceID",
    "intent": "string"
  }
]
```
*(Returns an empty array `[]` if no intent is associated with the resource)*

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ResourceIntent/listIntents

**Description:** Retrieves a list of all currently defined intent labels.

**Requirements:**
- (None)

**Effects:**
- Returns all defined `intentName`s.

**Request Body:**
```json
{}
```

**Success Response Body (Query):**
```json
[
  "string",
  "string"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/ResourceIntent/listResourcesByIntent

**Description:** Retrieves a list of resources associated with a particular intent label.

**Requirements:**
- `intent` must be a defined `IntentDefinition`.

**Effects:**
- Returns `ResourceID`s with the given `intent`.

**Request Body:**
```json
{
  "intent": "string"
}
```

**Success Response Body (Query):**
```json
[
  "ResourceID",
  "ResourceID"
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

# API Specification: TimeBoundedResource Concept

**Purpose:** Manage time-based availability and expiration windows for any generic resource.

***

## API Endpoints

### POST /api/TimeBoundedResource/defineTimeWindow

**Description:** Creates a new or updates an existing time window for a resource.

**Requirements:**

* If both `availableFrom` and `availableUntil` are provided (non-null), then `availableFrom` must be strictly earlier than `availableUntil`.

**Effects:**

* Creates a new `TimeWindow` entry for the given `resource` or updates an existing one with the specified availability bounds.
* If `availableFrom` is not provided, then it's available starting now.
* If `availableUntil` is not provided, then it's available indefinitely.

**Request Body:**

```json
{
  "resource": "string",
  "availableFrom": "string | null",
  "availableUntil": "string | null"
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

### POST /api/TimeBoundedResource/getTimeWindow

**Description:** Retrieves the time window entry for a specified resource.

**Requirements:**

* true

**Effects:**

* Returns the `TimeWindow` entry for the specified `resource`, containing its `resource` ID, `availableFrom`, and `availableUntil` times.
* Returns `null` if no time window is defined for the resource.

**Request Body:**

```json
{
  "resource": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "resource": "string",
    "availableFrom": "string | null",
    "availableUntil": "string | null"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/TimeBoundedResource/expireResource

**Description:** Signals that a resource's time-bound availability has ended, typically used for event notification.

**Requirements:**

* A `TimeWindow` entry exists for `resource`.
* The `availableUntil` for that `resource` is defined (non-null).
* The `currentTime` (the moment this action is triggered) is greater than or equal to the `availableUntil` value for the `resource`.

**Effects:**

* This action serves as an event notification.
* It explicitly changes no state within this concept.
* Its occurrence signals to other concepts (via synchronization) that the resource's time-bound availability (as defined by its `availableUntil` property) has ended.

**Request Body:**

```json
{
  "resource": "string"
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
### POST /api/TimeBoundedResource/deleteTimeWindow

**Description:** Deletes the time window associated with a specified resource.

**Requirements:**

* A `TimeWindow` entry exists for `resource`.

**Effects:**

* Deletes the `TimeWindow` entry for the specified `resource`.

**Request Body:**

```json
{
  "resource": "string"
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
# API Specification: UserAuthentication Concept

**Purpose:** Manage user accounts, including creation, credential management, status, and the email verification process required for full account activation and login.

---

## API Endpoints

### POST /api/UserAuthentication/registerUser

**Description:** Registers a new user account with a unique email and password, returning the new user ID.

**Requirements:**
- `email` is unique and not currently associated with any existing `UserAccount` entry.

**Effects:**
- Creates a new `user` ID, associates it with `email`, a hashed version of `password`, and sets `status` to `UNVERIFIED`.
- Returns the newly created `user` ID.

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

---

### POST /api/UserAuthentication/sendVerificationCode

**Description:** Sends a new verification code to the user's email for an unverified account.

**Requirements:**
- A `UserAccount` exists for `user` with the given `email`, and `status` is `UNVERIFIED`.
- No unexpired `VerificationCodes` exists for `user`.

**Effects:**
- Deletes any existing `VerificationCodes` for `user`.
- Creates a new `VerificationCodes` entry for `user` with a newly generated `code`, and an `expiry` time (e.g., 15 minutes from `currentTime`).

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

---

### POST /api/UserAuthentication/verifyCode

**Description:** Verifies a user's account using a provided verification code.

**Requirements:**
- An unexpired `VerificationCodes` exists for `user` with a matching `code`.
- The `UserAccount` for `user` exists and `status` is `UNVERIFIED`.

**Effects:**
- If the `requires` condition is met, deletes the matching `VerificationCodes` entry, sets the `status` for the `UserAccount` of `user` to `VERIFIED`, and returns `true`.
- Otherwise, returns `false`.

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

---

### POST /api/UserAuthentication/login

**Description:** Authenticates a user with their email and password to log them in.

**Requirements:**
- A `UserAccount` entry exists with `email`, `passwordHashed` matches `password`, and `status` is `VERIFIED`.

**Effects:**
- Returns the `user` ID associated with the matching credentials.

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

---

### POST /api/UserAuthentication/changePassword

**Description:** Allows a verified user to change their account password.

**Requirements:**
- A `UserAccount` entry for `user` exists and `status` is `VERIFIED`.

**Effects:**
- Updates the `passwordHashed` for the given `user` to a hashed version of `newPassword`.

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

---

### POST /api/UserAuthentication/activateUser

**Description:** Reactivates a deactivated user account, returning it to an unverified state.

**Requirements:**
- A `UserAccount` entry for `user` exists and `status` is `DEACTIVATED`.

**Effects:**
- Sets the `status` for `user` to `UNVERIFIED`.

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

---

### POST /api/UserAuthentication/deactivateUser

**Description:** Deactivates an active user account.

**Requirements:**
- A `UserAccount` entry for `user` exists and `status` is `VERIFIED` or `UNVERIFIED`.

**Effects:**
- Sets the `status` for `user` to `DEACTIVATED`.

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

---

### POST /api/UserAuthentication/revokeVerification

**Description:** Deletes all active verification codes for a specific user.

**Requirements:**
- One or more `VerificationCodes` entries exist for `user`.

**Effects:**
- Deletes all `VerificationCodes` entries associated with `user`.

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

---

### POST /api/UserAuthentication/cleanExpiredCodes

**Description:** System action to delete all expired verification codes.

**Requirements:**
- There are `VerificationCodes` entries where `currentTime >= expiry`.

**Effects:**
- Deletes all `VerificationCodes` entries that have expired.

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
