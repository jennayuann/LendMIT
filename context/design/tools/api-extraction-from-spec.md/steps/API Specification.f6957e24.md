---
timestamp: 'Mon Oct 20 2025 22:27:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251020_222750.49409099.md]]'
content_id: f6957e2467658677e3b6672025363252c791af3fda4e7587f2ae7e1881adb891
---

# API Specification: Labeling Concept

**Purpose:** manage the association of labels with generic items

***

## API Endpoints

### POST /api/Labeling/createLabel

**Description:** Creates a new label with the given name.

**Requirements:**

* Not explicitly defined in the concept specification.

**Effects:**

* Not explicitly defined in the concept specification.

**Request Body:**

```json
{
  "name": "String"
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

### POST /api/Labeling/addLabel

**Description:** Associates a specified label with a given item.

**Requirements:**

* Not explicitly defined in the concept specification.

**Effects:**

* Not explicitly defined in the concept specification.

**Request Body:**

```json
{
  "item": "String",
  "label": "String"
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

### POST /api/Labeling/deleteLabel

**Description:** Removes the association of a specified label from a given item.

**Requirements:**

* Not explicitly defined in the concept specification.

**Effects:**

* Not explicitly defined in the concept specification.

**Request Body:**

```json
{
  "item": "String",
  "label": "String"
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
