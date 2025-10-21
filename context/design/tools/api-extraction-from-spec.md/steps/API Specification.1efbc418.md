---
timestamp: 'Mon Oct 20 2025 22:37:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_223733.c21f6588.md]]'
content_id: 1efbc41819999eab2380949136415eda9ef1198489e3f00319e849a2bc83fbfa
---

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
