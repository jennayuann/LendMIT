---
timestamp: 'Mon Oct 20 2025 23:01:44 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_230144.f34c3f26.md]]'
content_id: 2d2527990169d0ce04e9edf93e060bba759c5420dce9866bc25ce2b3b00c06b8
---

# API Specification: ResourceStatus Concept

**Purpose:** Provide a generic and configurable mechanism to manage and track the lifecycle status of any resource type, enforcing application-defined transition rules between states.

***

## API Endpoints

### POST /api/ResourceStatus/defineStatus

**Description:** Define a new status label that can be used for resources.

**Requirements:**

* A `StatusDefinition` for `statusName` does not exist.

**Effects:**

* Adds `statusName` to the set of `StatusDefinitions`.

**Request Body:**

```json
{
  "statusName": "String"
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

### POST /api/ResourceStatus/defineTransition

**Description:** Define a valid transition rule between two existing status labels.

**Requirements:**

* A `StatusDefinition` for `fromStatus` exists.
* A `StatusDefinition` for `toStatus` exists.
* A `TransitionRule` from `fromStatus` to `toStatus` does not already exist.

**Effects:**

* Adds a `TransitionRule` (from `fromStatus`, to `toStatus`) to the set of `TransitionRules`.

**Request Body:**

```json
{
  "fromStatus": "String",
  "toStatus": "String"
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

### POST /api/ResourceStatus/createEntry

**Description:** Create a new status entry for a specific resource with an initial status.

**Requirements:**

* A `StatusEntry` for `resource` does not exist.
* A `StatusDefinition` for `initialStatus` exists.

**Effects:**

* Creates a new `StatusEntry` for `resource` and sets its `currentStatus` to `initialStatus`.

**Request Body:**

```json
{
  "resource": "ResourceID",
  "initialStatus": "String"
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

### POST /api/ResourceStatus/transition

**Description:** Transition a resource's current status to a new target status, if a valid transition rule exists.

**Requirements:**

* A `StatusEntry` for `resource` exists.
* A `StatusDefinition` for `targetStatus` exists.
* A `TransitionRule` from `currentStatus` to `targetStatus` exists.

**Effects:**

* Updates the `currentStatus` of `resource` to `targetStatus`.

**Request Body:**

```json
{
  "resource": "ResourceID",
  "targetStatus": "String"
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
