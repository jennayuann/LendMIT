---
timestamp: 'Tue Oct 21 2025 18:59:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_185957.70c5d2f8.md]]'
content_id: e73bd34df71db6aa16a1ec883ea2791c452eb84c8fb9e22b6a2b09debbb48483
---

# API Specification: Resource Concept

**Purpose:** Represent any generic entity that can be owned and described by a mandatory name and optional attributes.

***

## API Endpoints

### POST /api/Resource/createResource

**Description:** Creates a new resource with an owner, name, and optional category and description.

**Requirements:**

* `name is not an empty string`.

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

**Description:** Modifies the name, category, or description of an existing resource.

**Requirements:**

* A `Resource` entry with `id = resourceID` exists.
* If `name` is provided (i.e., not `null`), `name is not an empty string`.

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

**Description:** Deletes an existing resource.

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

**Description:** Retrieves the details of a specific resource.

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

### POST /api/Resource/listResources

**Description:** Retrieves a list of all resources currently available.

**Requirements:**

* true

**Effects:**

* Returns a list of all `Resource` entries currently in the `state`.
* If no resources exist, an empty list is returned.

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

***

### POST /api/Resource/listResourcesByOwner

**Description:** Retrieves a list of resources owned by a specific owner.

**Requirements:**

* true

**Effects:**

* Returns a list of all `Resource` entries where the `owner` matches the provided `owner` parameter.
* If the specified owner has no resources, an empty list is returned.

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
```

***
