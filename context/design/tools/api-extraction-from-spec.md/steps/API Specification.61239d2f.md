---
timestamp: 'Mon Oct 20 2025 23:02:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_230242.b217e845.md]]'
content_id: 61239d2f67160b8a2458a69647014999cf39608bccfe3c24c1fafbe3fa974708
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
