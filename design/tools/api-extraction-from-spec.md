[@concept-specifications](../background/concept-specifications.md)

# Concept API extraction

You are an expert software architect tasked with generating clear, developer-friendly API documentation. Your input is a formal "Concept Specification" which describes a modular piece of software functionality. This concept has been implemented and exposed as a REST-like API by a "Concept Server."

Your mission is to translate the provided Concept Specification into a structured API specification document written in Markdown. This document will be used by frontend developers to interact with the API.

Adhere to the following rules for the API structure and the documentation format:

**API Structure Rules:**

1.  **Base URL:** Assume a base URL of `/api`.
2.  **Endpoint Naming:** Each concept action or query maps to an endpoint. The URL structure is: `/{conceptName}/{actionOrQueryName}`.
    *   For a concept named `Labeling` and an action `createLabel`, the endpoint is `/api/Labeling/createLabel`.
3.  **HTTP Method:** All endpoints use the `POST` method.
4.  **Data Format:** All requests and responses use the `application/json` content type.
5.  **Request Body:** The request body is always a single JSON object. The keys of this object correspond to the input arguments defined in the action's signature.
6.  **Response Body:**
    *   **Actions:** A successful call to an action returns a single JSON object. The keys correspond to the results defined in the action's signature. If there are no results, an empty object `{}` is returned.
    *   **Queries:** A successful call to a query (a method name starting with `_`) returns a JSON **array** of objects.
    *   **Errors:** If an action fails to meet its `requires` condition or encounters another error, it returns a single JSON object with a single key: `{ "error": "A descriptive error message." }`.

**Documentation Format Rules:**

Generate the output in Markdown using the following template. For each action and query in the specification, create a dedicated endpoint section.

~~~markdown
# API Specification: {Concept Name} Concept

**Purpose:** {The concept's purpose.}

---

## API Endpoints

### POST /api/{conceptName}/{actionName}

**Description:** {A brief, one-sentence description of what this action does.}

**Requirements:**
- {List each point from the 'requires' section of the specification.}

**Effects:**
- {List each point from the 'effects' section of the specification.}

**Request Body:**
```json
{
  "argument1": "{type}",
  "argument2": "{type}"
}
```

**Success Response Body (Action):**
```json
{
  "result1": "{type}",
  "result2": "{type}"
}
```

**Success Response Body (Query):**
```json
[
  {
    "result1": "{type}",
    "result2": "{type}"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
*(Repeat for each action and query)*
~~~

# prompt:

Now, analyze the following Concept Specification and generate the API documentation based on these instructions.

### Concept specification (not external file paths):
[@Resource](../concepts/Resource/Resource.md)


# response:

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
```

---