---
timestamp: 'Tue Oct 21 2025 14:30:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_143058.245fc338.md]]'
content_id: c9efb4e3726401324513ea97b1b8185f717ac39fa6f1b7ed8fe04222df20fcf3
---

# API Specification: ResourceIntent Concept

**Purpose:** Associate any resource with an intent.

***

## API Endpoints

### POST /api/ResourceIntent/defineIntent

**Description:** Defines a new intent label, making it available for use.

**Requirements:**

* No `IntentDefinition` with `intentName` exists.

**Effects:**

* Adds `intentName` to `IntentDefinitions`.

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

***

### POST /api/ResourceIntent/undefineIntent

**Description:** Removes an existing intent label, provided it's not currently in use by any resource.

**Requirements:**

* An `IntentDefinition` for `intentName` exists.
* No `IntentEntry` uses `intentName`.

**Effects:**

* Removes `intentName` from `IntentDefinitions`.

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

***

### POST /api/ResourceIntent/setIntent

**Description:** Associates a specific intent label with a given resource, creating or updating the association.

**Requirements:**

* `intent` must be a defined `IntentDefinition`.

**Effects:**

* Creates or updates the `IntentEntry` for `resource` with `intent`.

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

***

### POST /api/ResourceIntent/clearIntent

**Description:** Removes any intent label associated with a specified resource.

**Requirements:**

* An `IntentEntry` for `resource` exists.

**Effects:**

* Removes the `IntentEntry` for `resource`.

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

***

### POST /api/ResourceIntent/getIntent

**Description:** Retrieves the intent label currently associated with a specified resource.

**Requirements:**

* (None)

**Effects:**

* Returns the `IntentEntry` for `resource`, or `Null` if none exists.

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

***

### POST /api/ResourceIntent/listIntents

**Description:** Retrieves a list of all currently defined intent labels.

**Requirements:**

* (None)

**Effects:**

* Returns all defined `intentName`s.

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

***

### POST /api/ResourceIntent/listResourcesByIntent

**Description:** Retrieves a list of resources associated with a particular intent label.

**Requirements:**

* `intent` must be a defined `IntentDefinition`.

**Effects:**

* Returns `ResourceID`s with the given `intent`.

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

***
