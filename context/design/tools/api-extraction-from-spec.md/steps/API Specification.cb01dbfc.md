---
timestamp: 'Mon Oct 20 2025 22:38:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_223859.741359e1.md]]'
content_id: cb01dbfc30f724b524f8cbb3f2dc7edaa2a2e4d0e3b8038fac5cefd2a67ee6af
---

# API Specification: Resource Concept

**Purpose:** Represent any generic entity that can be owned and described by a mandatory name and optional attributes.

***

## API Endpoints

### POST /api/Resource/createResource

**Description:** Creates a new generic resource with an owner, a mandatory name, and optional category and description.

**Requirements:**

* `name` is not an empty string.

**Effects:**

* Creates a new `Resource` entry with a unique `id`, the specified `owner`, `name`, `category`, and `description`.
* Returns the `id` of the newly created resource.

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

***

### POST /api/Resource/updateResource

**Description:** Updates the name, category, or description of an existing resource.

**Requirements:**

* A `Resource` entry with `id = resourceID` exists.
* If `name` is provided (i.e., not `null`), `name` is not an empty string.

**Effects:**

* If `name` is provided and is not an empty string, updates the `name` for the given `resourceID`.
* If `category` is provided, updates the `category` for the given `resourceID`. If `null` is provided, it clears the existing `category`.
* If `description` is provided, updates the `description` for the given `resourceID`. If `null` is provided, it clears the existing `description`.

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

***

### POST /api/Resource/deleteResource

**Description:** Deletes an existing resource by its ID.

**Requirements:**

* A `Resource` entry with `id = resourceID` exists.

**Effects:**

* Deletes the `Resource` entry corresponding to `resourceID`.

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

***

### POST /api/Resource/getResource

**Description:** Retrieves the complete details of a specific resource.

**Requirements:**

* A `Resource` entry with `id = resourceID` exists.

**Effects:**

* Returns the complete `Resource` object associated with this `resourceID`.

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

***
